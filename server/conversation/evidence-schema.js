const { z } = require("zod");

const travellerMentionSchema = z.object({
  relation: z.string(),
  category: z.enum(["adult", "child", "infant"]),
  age: z.number().nullable()
});

const dateEvidenceSourceSchema = z.enum([
  "CURRENT_TURN",
  "RECONSTRUCTED",
  "NONE"
]);

const conversationEvidenceSchema = z.object({
  origin: z.string().nullable(),
  destination: z.string().nullable(),
  destinationCountry: z.string().nullable(),
  departureDate: z.string().nullable(),
  returnDate: z.string().nullable(),
  dateProvenance: z.object({
    departureDate: dateEvidenceSourceSchema,
    returnDate: dateEvidenceSourceSchema
  }),
  tripLengthDays: z.number().nullable(),
  tripType: z.enum(["ROUND_TRIP", "ONE_WAY"]).nullable(),
  originExplicitlyEstablished: z.boolean(),
  travellerMentions: z.array(travellerMentionSchema)
});

module.exports = {
  travellerMentionSchema,
  dateEvidenceSourceSchema,
  conversationEvidenceSchema
};
