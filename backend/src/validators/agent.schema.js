const { z } = require('zod');

const agentRegisterSchema = z.object({
  name: z.string().min(2, 'Name is required').max(100),
  registrationNo: z.string().min(1, 'Registration number is required').max(50),
  hostel: z.string().min(1, 'Hostel is required'),
});

module.exports = { agentRegisterSchema };
