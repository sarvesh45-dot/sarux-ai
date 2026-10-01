export interface OpenApplicationParams {
  application: string;
}

export interface OpenApplicationResult {
  success: boolean;
  application: string;
  executable?: string;
  message?: string;
  error?: string;
  cancelled?: boolean;
}

const LOCAL_AGENT_URL = 'http://127.0.0.1:8000';

/**
 * Dispatches application open request to the secure local system agent.
 */
export async function openApplication(
  params: OpenApplicationParams,
  confirmed = false
): Promise<OpenApplicationResult> {
  const appName = params?.application?.trim() || '';

  if (!appName) {
    return {
      success: false,
      application: '',
      error: 'Please provide an application name to open.',
    };
  }

  try {
    // Call via server proxy or direct local agent
    const endpoint = typeof window !== 'undefined'
      ? '/api/local-agent/tools/execute'
      : `${LOCAL_AGENT_URL}/api/tools/execute`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'open_application',
        args: { application: appName },
        confirmed,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        application: appName,
        error: errData.error || `Local agent returned HTTP ${res.status}`,
      };
    }

    return await res.json();
  } catch (err: unknown) {
    return {
      success: false,
      application: appName,
      error: 'Local Agent is offline or unreachable. Please run "python3 backend/main.py" to enable computer control.',
    };
  }
}
