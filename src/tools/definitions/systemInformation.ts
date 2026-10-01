export interface SystemInformationResult {
  success: boolean;
  operatingSystem?: string;
  osNormalized?: string;
  osVersion?: string;
  hostname?: string;
  cpu?: {
    model: string;
    cores: number;
    architecture: string;
    usagePercent: number;
  };
  ram?: {
    totalGB: number;
    availableGB: number;
    usedPercent: number;
    formatted: string;
  };
  error?: string;
}

const LOCAL_AGENT_URL = 'http://127.0.0.1:8000';

export async function getSystemInformation(): Promise<SystemInformationResult> {
  try {
    const endpoint = typeof window !== 'undefined'
      ? '/api/local-agent/system/info'
      : `${LOCAL_AGENT_URL}/api/system/info`;

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
