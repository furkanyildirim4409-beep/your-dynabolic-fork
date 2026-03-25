// Chronos Engine — Istanbul timezone utilities
// All date boundaries for DB queries, streaks, and check-ins MUST use these.

export const getIstanbulDateStr = (): string =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });

export const getIstanbulYesterdayStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
};

/** Return an ISO timestamp string for the start of "today" in Istanbul */
export const getIstanbulTodayStartISO = (): string =>
  `${getIstanbulDateStr()}T00:00:00+03:00`;

/** Return an ISO timestamp string for the end of "today" in Istanbul */
export const getIstanbulTodayEndISO = (): string =>
  `${getIstanbulDateStr()}T23:59:59.999+03:00`;

/** Return the Istanbul date string for N days ago */
export const getIstanbulDaysAgoStr = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
};
