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

export const ListMoviesOutputSchema = z.object({
  items: z.array(MovieSchema),
});
