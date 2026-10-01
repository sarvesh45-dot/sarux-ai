export interface VolumeResult {
  success: boolean;
  volume?: number;
  muted?: boolean;
  formatted?: string;
  message?: string;
  error?: string;
  cancelled?: boolean;
}

const LOCAL_AGENT_URL = 'http://127.0.0.1:8000';

export async function getVolume(): Promise<VolumeResult> {
  try {
    const endpoint = typeof window !== 'undefined'
      ? '/api/local-agent/system/volume'
      : `${LOCAL_AGENT_URL}/api/system/volume`;

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

export async function setVolume(params: { level: number }, confirmed = false): Promise<VolumeResult> {
  const levelNum = Number(params?.level);
  if (isNaN(levelNum) || levelNum < 0 || levelNum > 100) {
    return {
      success: false,
      error: `Volume level must be a number between 0 and 100 (received ${params?.level}).`,
    };
  }

  try {
    const endpoint = typeof window !== 'undefined'
      ? '/api/local-agent/tools/execute'
      : `${LOCAL_AGENT_URL}/api/tools/execute`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'set_volume',
        args: { level: levelNum },
        confirmed,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Agent returned HTTP ${res.status}`,
      };
    }
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      error: 'Local Agent is offline or unreachable. Please run "python3 backend/main.py" to enable computer control.',
    };
  }
}

export async function muteVolume(params: { muted: boolean }, confirmed = false): Promise<VolumeResult> {
  const isMuted = Boolean(params?.muted);

  try {
    const endpoint = typeof window !== 'undefined'
      ? '/api/local-agent/tools/execute'
      : `${LOCAL_AGENT_URL}/api/tools/execute`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'mute_volume',
        args: { muted: isMuted },
        confirmed,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || `Agent returned HTTP ${res.status}`,
      };
    }
    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      error: 'Local Agent is offline or unreachable. Please run "python3 backend/main.py" to enable computer control.',
    };
  }
}
