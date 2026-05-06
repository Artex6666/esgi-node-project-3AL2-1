import { ez } from "express-zod-api";
import { z } from "zod";

export const PeriodInputSchema = z.object({
  from: ez.dateIn().optional(),
  to: ez.dateIn().optional(),
});

const StatsBucketShape = {
  attendeesCount: z.int().nonnegative(),
  sessionsCount: z.int().nonnegative(),
  totalCapacity: z.int().nonnegative(),
  occupancyRate: z.number(),
};

export const AttendanceOutputSchema = z.object(StatsBucketShape);

export const DailyOutputSchema = z.object({
  days: z.array(
    z.object({
      date: z.string(),
      ...StatsBucketShape,
    }),
  ),
});

export const WeeklyOutputSchema = z.object({
  weeks: z.array(
    z.object({
      weekStart: z.string(),
      ...StatsBucketShape,
    }),
  ),
});

export const SessionStatsParamsSchema = z.object({ id: z.string().min(1) });

export const SessionStatsOutputSchema = z.object({
  sessionId: z.string(),
  attendeesCount: z.int().nonnegative(),
  capacity: z.int().nonnegative(),
  occupancyRate: z.number(),
});
