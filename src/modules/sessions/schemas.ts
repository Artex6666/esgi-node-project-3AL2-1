import { ez } from "express-zod-api";
import { z } from "zod";

export const SessionSchema = z.object({
  id: z.string(),
  movieId: z.string(),
  roomId: z.string(),
  startsAt: ez.dateOut(),
  endsAt: ez.dateOut(),
  priceCents: z.int().nonnegative(),
  createdAt: ez.dateOut(),
});

export const SessionWithDetailsSchema = SessionSchema.extend({
  movie: z.object({
    id: z.string(),
    title: z.string(),
    durationMin: z.int().positive(),
  }),
  room: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }),
});

export const ListSessionsInputSchema = z.object({
  from: ez.dateIn().optional(),
  to: ez.dateIn().optional(),
});
export const ListSessionsOutputSchema = z.object({ items: z.array(SessionWithDetailsSchema) });

export const SessionIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const GetSessionOutputSchema = SessionWithDetailsSchema;

export const CreateSessionInputSchema = z.object({
  movieId: z.string().min(1),
  roomId: z.string().min(1),
  startsAt: ez.dateIn(),
  endsAt: ez.dateIn(),
  priceCents: z.int().nonnegative().max(100_000),
});
export const CreateSessionOutputSchema = SessionWithDetailsSchema;

export const UpdateSessionInputSchema = SessionIdParamsSchema.extend({
  movieId: z.string().min(1).optional(),
  roomId: z.string().min(1).optional(),
  startsAt: ez.dateIn().optional(),
  endsAt: ez.dateIn().optional(),
  priceCents: z.int().nonnegative().max(100_000).optional(),
});
export const UpdateSessionOutputSchema = SessionWithDetailsSchema;

export const DeleteSessionOutputSchema = z.object({ id: z.string() });

export const AttendanceOutputSchema = z.object({
  sessionId: z.string(),
  attendeesCount: z.int().nonnegative(),
});
