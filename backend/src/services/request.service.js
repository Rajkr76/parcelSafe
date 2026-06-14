const { PrismaClient } = require('@prisma/client');
const { generateOtp, hashOtp, verifyOtp, getOtpExpiry } = require('../utils/otp');
const { createNotification } = require('./notification.service');

const prisma = new PrismaClient();

/**
 * Create a new parcel request
 */
async function createRequest(studentId, data, io) {
  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  const request = await prisma.request.create({
    data: {
      studentId,
      parcelName: data.parcelName,
      courierCompany: data.courierCompany,
      trackingNumber: data.trackingNumber || null,
      hostel: data.hostel,
      rewardAmount: data.rewardAmount,
      status: 'REQUEST_CREATED',
      timeline: {
        create: {
          status: 'REQUEST_CREATED',
          note: 'Request created by student',
        },
      },
      otp: {
        create: {
          otpHash,
          expiresAt: getOtpExpiry(),
        },
      },
    },
    include: {
      student: { select: { id: true, name: true, hostel: true, profilePhoto: true } },
      timeline: true,
    },
  });

  // Broadcast to all agents that a new request is available
  if (io) {
    io.to('role:AGENT').emit('REQUEST_CREATED', {
      id: request.id,
      parcelName: request.parcelName,
      hostel: request.hostel,
      rewardAmount: request.rewardAmount,
      courierCompany: request.courierCompany,
      studentName: request.student.name,
      createdAt: request.createdAt,
    });
  }

  // Fetch all approved agents to send notifications
  const agents = await prisma.agent.findMany({
    where: { status: 'APPROVED' },
    select: { userId: true },
  });

  // Send notifications to all approved agents
  for (const agent of agents) {
    await createNotification({
      userId: agent.userId,
      title: 'New Parcel Request',
      message: `A new request for ${request.parcelName} at ${request.hostel} is available.`,
      type: 'REQUEST_CREATED',
      data: { requestId: request.id },
    }, io);
  }

  return { request, otp }; // Return plain OTP to show to student once
}

/**
 * Get requests for a student
 */
async function getStudentRequests(studentId, status = null) {
  const where = { studentId, deletedAt: null };
  if (status) where.status = status;

  return prisma.request.findMany({
    where,
    include: {
      assignment: {
        include: {
          agent: {
            include: {
              user: { select: { id: true, name: true, profilePhoto: true } },
            },
          },
        },
      },
      photos: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      rating: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get available requests for agents
 */
async function getAvailableRequests(hostelFilter = null) {
  const where = {
    status: 'REQUEST_CREATED',
    deletedAt: null,
  };
  if (hostelFilter) where.hostel = hostelFilter;

  return prisma.request.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, hostel: true, profilePhoto: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get agent's assigned requests
 */
async function getAgentRequests(agentId, status = null) {
  const where = {
    assignment: { agentId },
    deletedAt: null,
  };
  if (status) where.status = status;

  return prisma.request.findMany({
    where,
    include: {
      student: { select: { id: true, name: true, hostel: true, profilePhoto: true } },
      assignment: true,
      photos: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      rating: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Agent accepts a request
 */
async function acceptRequest(requestId, agentId, io) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { assignment: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.status !== 'REQUEST_CREATED') throw new Error('Request is no longer available');
  if (request.assignment) throw new Error('Request already assigned');

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    include: { user: { select: { name: true } } },
  });

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'AGENT_ACCEPTED',
      assignment: {
        create: { agentId },
      },
      timeline: {
        create: {
          status: 'AGENT_ACCEPTED',
          note: `Agent ${agent.user.name} accepted the request`,
        },
      },
    },
    include: {
      student: { select: { id: true, name: true } },
      assignment: {
        include: {
          agent: {
            include: {
              user: { select: { id: true, name: true, profilePhoto: true } },
            },
          },
        },
      },
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });

  // Notify student
  await createNotification({
    userId: updated.studentId,
    title: 'Agent Assigned',
    message: `${agent.user.name} has accepted your parcel request for "${updated.parcelName}"`,
    type: 'REQUEST_UPDATE',
    data: { requestId },
  }, io);

  // Emit to student
  if (io) {
    io.to(`user:${updated.studentId}`).emit('REQUEST_ACCEPTED', {
      requestId,
      agentName: agent.user.name,
    });
  }

  return updated;
}

/**
 * Upload parcel photo
 */
async function uploadParcelPhoto(requestId, agentId, photoUrl, fileId, io) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { assignment: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.assignment?.agentId !== agentId) throw new Error('Not assigned to this request');
  if (request.status !== 'AGENT_ACCEPTED') throw new Error('Invalid status for photo upload');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'PARCEL_PHOTO_UPLOADED',
      photos: {
        create: { url: photoUrl, fileId },
      },
      timeline: {
        create: {
          status: 'PARCEL_PHOTO_UPLOADED',
          note: 'Agent uploaded parcel photo for verification',
        },
      },
    },
    include: {
      photos: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });

  // Notify student
  await createNotification({
    userId: request.studentId,
    title: 'Parcel Photo Uploaded',
    message: 'Please verify the parcel photo to confirm pickup.',
    type: 'REQUEST_UPDATE',
    data: { requestId, photoUrl },
  }, io);

  if (io) {
    io.to(`user:${request.studentId}`).emit('PARCEL_PHOTO_UPLOADED', {
      requestId,
      photoUrl,
    });
  }

  return updated;
}

/**
 * Student confirms parcel photo
 */
async function confirmPhoto(requestId, studentId, io) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { assignment: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.studentId !== studentId) throw new Error('Not your request');
  if (request.status !== 'PARCEL_PHOTO_UPLOADED') throw new Error('No photo to confirm');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'USER_CONFIRMED',
      timeline: {
        create: {
          status: 'USER_CONFIRMED',
          note: 'Student confirmed the parcel photo',
        },
      },
    },
    include: {
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });

  // Notify agent
  const agentUser = await prisma.agent.findUnique({
    where: { id: request.assignment.agentId },
    select: { userId: true },
  });

  await createNotification({
    userId: agentUser.userId,
    title: 'Photo Confirmed',
    message: 'Student confirmed the parcel. You can proceed with delivery.',
    type: 'REQUEST_UPDATE',
    data: { requestId },
  }, io);

  if (io) {
    io.to(`user:${agentUser.userId}`).emit('USER_CONFIRMED', { requestId });
  }

  return updated;
}

/**
 * Mark request as out for delivery
 */
async function markOutForDelivery(requestId, agentId, io) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { assignment: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.assignment?.agentId !== agentId) throw new Error('Not assigned to this request');
  if (request.status !== 'USER_CONFIRMED') throw new Error('Student has not confirmed yet');

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'OUT_FOR_DELIVERY',
      timeline: {
        create: {
          status: 'OUT_FOR_DELIVERY',
          note: 'Agent is on the way to deliver the parcel',
        },
      },
    },
    include: {
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });

  await createNotification({
    userId: request.studentId,
    title: 'Out for Delivery',
    message: 'Your parcel is on the way! Keep your OTP ready.',
    type: 'REQUEST_UPDATE',
    data: { requestId },
  }, io);

  if (io) {
    io.to(`user:${request.studentId}`).emit('OUT_FOR_DELIVERY', { requestId });
  }

  return updated;
}

/**
 * Verify OTP and complete delivery
 */
async function verifyDeliveryOtp(requestId, agentId, plainOtp, io) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { assignment: true, otp: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.assignment?.agentId !== agentId) throw new Error('Not assigned to this request');
  if (request.status !== 'OUT_FOR_DELIVERY') throw new Error('Request is not out for delivery');
  if (!request.otp) throw new Error('OTP not found');

  // Check expiry
  if (new Date() > request.otp.expiresAt) {
    throw new Error('OTP has expired');
  }

  // Check max attempts
  if (request.otp.attempts >= 5) {
    throw new Error('Maximum OTP attempts exceeded');
  }

  // Increment attempts
  await prisma.otpVerification.update({
    where: { id: request.otp.id },
    data: { attempts: { increment: 1 } },
  });

  // Verify OTP
  const isValid = await verifyOtp(plainOtp, request.otp.otpHash);
  if (!isValid) {
    throw new Error('Invalid OTP');
  }

  // Mark as verified and delivered
  const updated = await prisma.$transaction([
    prisma.otpVerification.update({
      where: { id: request.otp.id },
      data: { verified: true },
    }),
    prisma.request.update({
      where: { id: requestId },
      data: {
        status: 'DELIVERED',
        timeline: {
          create: {
            status: 'DELIVERED',
            note: 'Parcel delivered successfully. OTP verified.',
          },
        },
      },
    }),
    prisma.agent.update({
      where: { id: agentId },
      data: { deliveryCount: { increment: 1 } },
    }),
  ]);

  await createNotification({
    userId: request.studentId,
    title: 'Parcel Delivered',
    message: `Your parcel "${request.parcelName}" has been delivered successfully!`,
    type: 'REQUEST_UPDATE',
    data: { requestId },
  }, io);

  if (io) {
    io.to(`user:${request.studentId}`).emit('DELIVERED', { requestId });
  }

  return updated[1];
}

/**
 * Cancel a request (student only, before agent accepts)
 */
async function cancelRequest(requestId, studentId, io) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) throw new Error('Request not found');
  if (request.studentId !== studentId) throw new Error('Not your request');
  if (!['REQUEST_CREATED', 'AGENT_ACCEPTED'].includes(request.status)) {
    throw new Error('Cannot cancel request at this stage');
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: {
      status: 'CANCELLED',
      timeline: {
        create: {
          status: 'CANCELLED',
          note: 'Request cancelled by student',
        },
      },
    },
    include: {
      assignment: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });

  // Notify agent if one was assigned
  if (updated.assignment) {
    const agentUser = await prisma.agent.findUnique({
      where: { id: updated.assignment.agentId },
      select: { userId: true },
    });
    if (agentUser) {
      await createNotification({
        userId: agentUser.userId,
        title: 'Request Cancelled',
        message: `The request for "${request.parcelName}" has been cancelled.`,
        type: 'REQUEST_UPDATE',
        data: { requestId },
      }, io);
    }
  }

  return updated;
}

/**
 * Rate an agent after delivery
 */
async function rateAgent(requestId, raterId, rating, review, io) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { assignment: true, rating: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.studentId !== raterId) throw new Error('Not your request');
  if (request.status !== 'DELIVERED') throw new Error('Can only rate after delivery');
  if (request.rating) throw new Error('Already rated');

  const [newRating, agent] = await prisma.$transaction([
    prisma.rating.create({
      data: {
        requestId,
        agentId: request.assignment.agentId,
        raterId,
        rating,
        review: review || null,
      },
    }),
    prisma.agent.update({
      where: { id: request.assignment.agentId },
      data: {
        totalRatings: { increment: 1 },
      },
    }),
  ]);

  // Recalculate average rating
  const avgResult = await prisma.rating.aggregate({
    where: { agentId: request.assignment.agentId },
    _avg: { rating: true },
  });

  await prisma.agent.update({
    where: { id: request.assignment.agentId },
    data: { avgRating: avgResult._avg.rating || 0 },
  });

  // Notify agent
  const agentUser = await prisma.agent.findUnique({
    where: { id: request.assignment.agentId },
    select: { userId: true },
  });

  if (agentUser) {
    await createNotification({
      userId: agentUser.userId,
      title: 'New Rating',
      message: `You received a ${rating}-star rating!`,
      type: 'AGENT_UPDATE',
      data: { requestId, rating },
    }, io);
  }

  return newRating;
}

/**
 * Regenerate OTP for a request (student only, when OTP has expired)
 */
async function regenerateOtp(requestId, studentId) {
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: { otp: true },
  });

  if (!request) throw new Error('Request not found');
  if (request.studentId !== studentId) throw new Error('Not your request');
  if (['DELIVERED', 'CANCELLED', 'FAILED'].includes(request.status)) {
    throw new Error('Cannot regenerate OTP for completed/cancelled requests');
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);

  if (request.otp) {
    await prisma.otpVerification.update({
      where: { id: request.otp.id },
      data: {
        otpHash,
        expiresAt: getOtpExpiry(),
        verified: false,
        attempts: 0,
      },
    });
  } else {
    await prisma.otpVerification.create({
      data: {
        requestId,
        otpHash,
        expiresAt: getOtpExpiry(),
      },
    });
  }

  return { otp, expiresAt: getOtpExpiry() };
}

/**
 * Get request by ID with full details
 */
async function getRequestById(requestId) {
  return prisma.request.findUnique({
    where: { id: requestId },
    include: {
      student: { select: { id: true, name: true, email: true, hostel: true, profilePhoto: true } },
      assignment: {
        include: {
          agent: {
            include: {
              user: { select: { id: true, name: true, profilePhoto: true } },
            },
          },
        },
      },
      photos: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      otp: { select: { verified: true, expiresAt: true, attempts: true } },
      rating: true,
    },
  });
}

module.exports = {
  createRequest,
  getStudentRequests,
  getAvailableRequests,
  getAgentRequests,
  acceptRequest,
  uploadParcelPhoto,
  confirmPhoto,
  markOutForDelivery,
  verifyDeliveryOtp,
  cancelRequest,
  rateAgent,
  regenerateOtp,
  getRequestById,
};
