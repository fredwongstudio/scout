const { z } = require("zod");

const travellerMentionSchema = z.object({
  relation: z.string(),
  category: z.enum(["adult", "child", "infant"]),
  age: z.number().nullable()
});

const conversationEvidenceSchema = z.object({
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  destinationCountry: z.string().nullable(),
  departureDate: z.string().nullable(),
  returnDate: z.string().nullable(),
  tripLengthDays: z.number().nullable(),
  tripType: z.enum(["ROUND_TRIP", "ONE_WAY"]).nullable(),
  originExplicitlyEstablished: z.boolean(),
  travellerMentions: z.array(travellerMentionSchema)
});

module.exports = {
  travellerMentionSchema,
  conversationEvidenceSchema
};
