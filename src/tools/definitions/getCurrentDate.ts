export interface GetCurrentDateParams {
  timezone?: string;
}

export interface GetCurrentDateResult {
  success: boolean;
  date: string;
  dayOfWeek: string;
  year: number;
  timezone: string;
}

export function getCurrentDate(params: GetCurrentDateParams = {}): GetCurrentDateResult {
  try {
    const tz = params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const now = new Date();

    const formattedDate = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(now);

    const dayOfWeek = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
    }).format(now);

    const year = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
      }).format(now),
      10
    ) || now.getFullYear();

    return {
      success: true,
      date: formattedDate,
      dayOfWeek,
      year,
      timezone: tz,
    };
  } catch (err: unknown) {
    const now = new Date();
    return {
      success: true,
      date: now.toLocaleDateString(),
      dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
      year: now.getFullYear(),
      timezone: 'Local',
    };
  }
}
