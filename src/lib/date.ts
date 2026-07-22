const LONG_DATE: Intl.DateTimeFormatOptions = {
	year: "numeric",
	month: "long",
	day: "numeric",
};

const MONTH_YEAR: Intl.DateTimeFormatOptions = {
	year: "numeric",
	month: "long",
};

const SHORT_DATE: Intl.DateTimeFormatOptions = {
	year: "numeric",
	month: "numeric",
	day: "numeric",
};

/**
 * Formats a date as "January 1, 2026". Always pinned to `en-US` — omitting
 * the locale makes `toLocaleDateString()` depend on the build machine's
 * configured locale, so the same content can render different date strings
 * in dev versus CI.
 */
export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", LONG_DATE);
}

/** Formats a date as "January 2026", for album/index summaries. */
export function formatMonthYear(date: Date): string {
	return date.toLocaleDateString("en-US", MONTH_YEAR);
}

/** Formats a date as "1/1/2026", for compact card metadata. */
export function formatShortDate(date: Date): string {
	return date.toLocaleDateString("en-US", SHORT_DATE);
}
