const { z } = require('zod');

const syncSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().url().optional(),
});

module.exports = { syncSchema };
