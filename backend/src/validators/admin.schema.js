const { z } = require('zod');

const updateAgentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']),
});

const updateUserStatusSchema = z.object({
  suspended: z.boolean(),
});

module.exports = { updateAgentStatusSchema, updateUserStatusSchema };
