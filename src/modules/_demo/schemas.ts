import { z } from "zod";

export const PingInputSchema = z.object({
  name: z.string().min(1).max(50).default("world"),
});

export const PingOutputSchema = z.object({
  pong: z.string(),
  at: z.iso.datetime(),
});
