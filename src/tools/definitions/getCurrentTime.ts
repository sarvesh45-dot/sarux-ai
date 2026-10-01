export interface GetCurrentTimeParams {
  timezone?: string;
}

export interface GetCurrentTimeResult {
  success: boolean;
  time: string;
  timezone: string;
  iso: string;
}

export function getCurrentTime(params: GetCurrentTimeParams = {}): GetCurrentTimeResult {
  try {
    const tz = params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const now = new Date();

    const formattedTime = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(now);

    return {
      success: true,
      time: formattedTime,
      timezone: tz,
      iso: now.toISOString(),
    };
  } catch (err: unknown) {
    const now = new Date();
    return {
      success: true,
      time: now.toLocaleTimeString(),
      timezone: 'Local',
      iso: now.toISOString(),
    };
  }
}
