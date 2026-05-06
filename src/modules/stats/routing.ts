import type { Routing } from "express-zod-api";

import {
  getAttendanceStatsEndpoint,
  getDailyStatsEndpoint,
  getSessionStatsEndpoint,
  getWeeklyStatsEndpoint,
} from "./endpoints.js";

export const statsRouting: Routing = {
  attendance: getAttendanceStatsEndpoint,
  daily: getDailyStatsEndpoint,
  weekly: getWeeklyStatsEndpoint,
  sessions: {
    ":id": getSessionStatsEndpoint,
  },
};
