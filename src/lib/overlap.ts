export interface TimeRange {
  startsAt: Date;
  endsAt: Date;
}

// Half-open intervals: a 10:00–12:00 session does not overlap a 12:00–14:00 one.
export const overlaps = (a: TimeRange, b: TimeRange): boolean =>
  a.startsAt.getTime() < b.endsAt.getTime() && b.startsAt.getTime() < a.endsAt.getTime();
