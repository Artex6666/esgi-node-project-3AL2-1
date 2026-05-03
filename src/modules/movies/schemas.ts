import { ez } from "express-zod-api";
import { z } from "zod";

export const MovieSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  durationMin: z.int().positive(),
  genre: z.string(),
  releasedAt: ez.dateOut(),
  createdAt: ez.dateOut(),
});

export const ListMoviesInputSchema = z.object({});
export const ListMoviesOutputSchema = z.object({ items: z.array(MovieSchema) });

export const MovieIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const GetMovieOutputSchema = MovieSchema;

export const CreateMovieInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  durationMin: z.int().min(1).max(600),
  genre: z.string().min(1).max(50),
  releasedAt: ez.dateIn(),
});
export const CreateMovieOutputSchema = MovieSchema;

export const UpdateMovieInputSchema = MovieIdParamsSchema.extend({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(2000).optional(),
  durationMin: z.int().min(1).max(600).optional(),
  genre: z.string().min(1).max(50).optional(),
  releasedAt: ez.dateIn().optional(),
});
export const UpdateMovieOutputSchema = MovieSchema;

export const DeleteMovieOutputSchema = z.object({ id: z.string() });

export const MoviePlanningInputSchema = MovieIdParamsSchema.extend({
  from: ez.dateIn().optional(),
  to: ez.dateIn().optional(),
});

export const MoviePlanningSessionSchema = z.object({
  id: z.string(),
  startsAt: ez.dateOut(),
  endsAt: ez.dateOut(),
  priceCents: z.int().nonnegative(),
  room: z.object({
    id: z.string(),
    name: z.string(),
    type: z.string(),
  }),
});

export const MoviePlanningOutputSchema = z.object({
  movieId: z.string(),
  items: z.array(MoviePlanningSessionSchema),
});
