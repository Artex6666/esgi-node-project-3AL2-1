// Cinema is open Mon–Fri 09:00–20:00. Times are treated as UTC for
// determinism — production would parameterize the cinema's timezone.

export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 20;
export const ADS_AND_CLEANUP_MIN = 30;

export const isWeekday = (date: Date): boolean => {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
};

const sameUtcDay = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

const minutesOfUtcDay = (d: Date): number =>
  d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 + d.getUTCMilliseconds() / 60000;

export const isWithinBusinessHours = (start: Date, end: Date): boolean => {
  if (start.getTime() >= end.getTime()) return false;
  if (!isWeekday(start)) return false;
  if (!sameUtcDay(start, end)) return false;
  return minutesOfUtcDay(start) >= OPEN_HOUR * 60 && minutesOfUtcDay(end) <= CLOSE_HOUR * 60;
};

export const minSessionDurationMin = (movieDurationMin: number): number => movieDurationMin + ADS_AND_CLEANUP_MIN;

export const hasSufficientDuration = (start: Date, end: Date, movieDurationMin: number): boolean =>
  end.getTime() - start.getTime() >= minSessionDurationMin(movieDurationMin) * 60 * 1000;
