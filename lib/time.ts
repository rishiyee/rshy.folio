export type WeightedClock = {
  hour: number; // -25..125
  minute: number; // 00..99
  second: number; // 00..99
  label: string; // "37:85:56"
};

const WEIGHTED_MIN = -25;
const WEIGHTED_MAX = 125;
const WEIGHTED_RANGE = WEIGHTED_MAX - WEIGHTED_MIN; // 150

function pad2(n: number) {
  return Math.trunc(Math.abs(n)).toString().padStart(2, "0");
}

export function getWeightedClock(now: Date): WeightedClock {
  const msSinceMidnight =
    now.getHours() * 3600000 +
    now.getMinutes() * 60000 +
    now.getSeconds() * 1000 +
    now.getMilliseconds();
  const dayFraction = msSinceMidnight / 86400000; // 0..1

  const weighted = WEIGHTED_MIN + dayFraction * WEIGHTED_RANGE;
  const hour = Math.trunc(weighted);
  const hourFrac = Math.abs(weighted - hour) * 100;
  const minute = Math.trunc(hourFrac);
  const second = Math.trunc((hourFrac - minute) * 100);

  const sign = hour < 0 ? "-" : "";
  const label = `${sign}${pad2(hour)}:${pad2(minute)}:${pad2(second)}`;

  return { hour, minute, second, label };
}

export function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function getYearProgress(now: Date) {
  const year = now.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const msPerDay = 86400000;
  const dayOfYear =
    Math.floor((now.getTime() - startOfYear.getTime()) / msPerDay) + 1;
  const daysInYear = isLeapYear(year) ? 366 : 365;
  const percent = Math.round((dayOfYear / daysInYear) * 100);

  return { dayOfYear, daysInYear, percent };
}
