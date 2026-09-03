import { z } from "zod";

export const busEventLocationSchema = z
  .object({
    latitude: z.number().finite().min(-90).max(90),
    longitude: z.number().finite().min(-180).max(180),
    accuracy: z.number().finite().nonnegative().max(100_000),
  })
  .strict();

export type BusEventLocation = z.infer<typeof busEventLocationSchema>;
