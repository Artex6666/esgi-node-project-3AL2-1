import { adminFactory } from "../../factories/admin.js";
import {
  AttendanceOutputSchema,
  DailyOutputSchema,
  PeriodInputSchema,
  SessionStatsOutputSchema,
  SessionStatsParamsSchema,
  WeeklyOutputSchema,
} from "./schemas.js";
import { statsService } from "./service.js";

export const getAttendanceStatsEndpoint = adminFactory.build({
  method: "get",
  input: PeriodInputSchema,
  output: AttendanceOutputSchema,
  handler: ({ input }) => statsService.attendance({ from: input.from, to: input.to }),
});

export const getDailyStatsEndpoint = adminFactory.build({
  method: "get",
  input: PeriodInputSchema,
  output: DailyOutputSchema,
  handler: ({ input }) => statsService.daily({ from: input.from, to: input.to }),
});

export const getWeeklyStatsEndpoint = adminFactory.build({
  method: "get",
  input: PeriodInputSchema,
  output: WeeklyOutputSchema,
  handler: ({ input }) => statsService.weekly({ from: input.from, to: input.to }),
});

export const getSessionStatsEndpoint = adminFactory.build({
  method: "get",
  input: SessionStatsParamsSchema,
  output: SessionStatsOutputSchema,
  handler: ({ input }) => statsService.forSession(input.id),
});
