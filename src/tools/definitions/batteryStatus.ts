export interface BatteryStatusResult {
  success: boolean;
  available?: boolean;
  percentage?: number | null;
  charging?: boolean;
  status?: string;
  timeRemaining?: string;
  message?: string;
  error?: string;
}

const LOCAL_AGENT_URL = 'http://127.0.0.1:8000';

export async function getBatteryStatus(): Promise<BatteryStatusResult> {
  try {
    const endpoint = typeof window !== 'undefined'
      ? '/api/local-agent/system/battery'
      : `${LOCAL_AGENT_URL}/api/system/battery`;

    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`Agent returned HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      error: 'Local Agent is offline or unreachable. Please run "python3 backend/main.py" to enable computer control.',
    };
  }
}
