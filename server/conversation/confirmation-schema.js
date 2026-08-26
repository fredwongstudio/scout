const { z } = require("zod");
const {
  CONFIRMATION_INTENT
} = require("./confirmation");

const confirmationIntentSchema = z.object({
  intent: z.enum([
    CONFIRMATION_INTENT.CONFIRM,
    CONFIRMATION_INTENT.CORRECT,
    CONFIRMATION_INTENT.UNKNOWN
  ])
});

module.exports = {
  confirmationIntentSchema
};
