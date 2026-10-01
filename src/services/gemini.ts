import { Message, ServerStatusResponse, MessageToolCall } from '../types/chat';

export interface StreamChatCallbacks {
  onChunk: (chunkText: string) => void;
  onToolStart?: (call: MessageToolCall) => void;
  onToolComplete?: (toolName: string, success: boolean, resultText?: string) => void;
  onToolConfirmationRequired?: (toolCallId: string, toolName: string, args: Record<string, any>, pendingContext: any) => Promise<boolean>;
  onDone: (fullResponseText: string) => void;
  onError: (errorMessage: string) => void;
}

export async function fetchServerStatus(): Promise<ServerStatusResponse> {
  const res = await fetch('/api/status');
  if (!res.ok) {
    throw new Error(`Status check failed: HTTP ${res.status}`);
  }
  return res.json();
}

export const checkServerStatus = fetchServerStatus;

export interface StreamChatResponseParams {
  messages: Array<{ role: string; content: string }>;
  signal?: AbortSignal;
  onChunk: (chunk: string) => void;
  onToolStart?: (call: MessageToolCall) => void;
  onToolComplete?: (toolName: string, success: boolean, resultText?: string) => void;
  onToolConfirmationRequired?: (toolCallId: string, toolName: string, args: Record<string, any>, pendingContext: any) => Promise<boolean>;
  onDone: (fullText: string) => void;
  onError: (error: string) => void;
}

export async function streamChatResponse(params: StreamChatResponseParams): Promise<void> {
  return streamChat(
    params.messages.map((m, idx) => ({
      id: `msg_${idx}`,
      role: m.role as any,
      content: m.content,
      timestamp: new Date().toISOString(),
    })),
    {
      onChunk: params.onChunk,
      onToolStart: params.onToolStart,
      onToolComplete: params.onToolComplete,
      onToolConfirmationRequired: params.onToolConfirmationRequired,
      onDone: params.onDone,
      onError: params.onError,
    },
    params.signal
  );
}

/**
 * Handles streaming chat with interactive tool execution and user confirmation loops.
 */
export async function streamChat(
  messages: Message[],
  callbacks: StreamChatCallbacks,
  signal?: AbortSignal
): Promise<void> {
  let fullAccumulatedText = '';

  try {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        timezone: userTimezone,
      }),
      signal,
    });

    if (!response.ok) {
      let errDetail = 'Failed to generate response.';
      try {
        const errJson = await response.json();
        if (errJson.error) errDetail = errJson.error;
      } catch {
        // use fallback
      }
      callbacks.onError(errDetail);
      return;
    }

    if (!response.body) {
      callbacks.onError('ReadableStream not supported by response');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);

        try {
          const data = JSON.parse(jsonStr);

          // 1. Tool Start Event
          if (data.type === 'tool_start') {
            callbacks.onToolStart?.({
              toolName: data.toolName,
              displayName: data.displayName || data.toolName,
              icon: data.icon || 'Wrench',
              args: data.args || {},
              formattedCall: data.formattedCall || `${data.toolName}()`,
              status: 'executing',
            });
            continue;
          }

          // 2. Tool Complete Event
          if (data.type === 'tool_complete') {
            callbacks.onToolComplete?.(data.toolName, data.success, data.formattedResult);
            continue;
          }

          // 3. Tool Confirmation Required Event (open_website)
          if (data.type === 'tool_confirmation_required') {
            if (callbacks.onToolConfirmationRequired) {
              const approved = await callbacks.onToolConfirmationRequired(
                data.toolCallId,
                data.toolName,
                data.args,
                data.pendingContext
              );

              // Submit confirmation decision back to backend tool continuation
              await resumeToolStream(
                {
                  toolCallId: data.toolCallId,
                  toolName: data.toolName,
                  args: data.args,
                  approved,
                  pendingContext: data.pendingContext,
                },
                callbacks,
                signal
              );
              return;
            }
            continue;
          }

          // 4. Text Chunk Event
          if (data.chunk) {
            fullAccumulatedText += data.chunk;
            callbacks.onChunk(data.chunk);
          }

          // 5. Completion Event
          if (data.done) {
            callbacks.onDone(fullAccumulatedText);
            return;
          }

          // 6. Error Event
          if (data.error) {
            callbacks.onError(data.error);
            return;
          }
        } catch (parseErr) {
          console.warn('Failed to parse SSE line:', parseErr, jsonStr);
        }
      }
    }

    callbacks.onDone(fullAccumulatedText);
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const msg = err instanceof Error ? err.message : String(err);
    callbacks.onError(msg);
  }
}

/**
 * Resumes stream after user confirms or rejects a confirmation-required tool.
 */
async function resumeToolStream(
  payload: {
    toolCallId: string;
    toolName: string;
    args: Record<string, any>;
    approved: boolean;
    pendingContext: any;
  },
  callbacks: StreamChatCallbacks,
  signal?: AbortSignal
): Promise<void> {
  let fullAccumulatedText = '';

  try {
    const res = await fetch('/api/chat/tool-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!res.ok) {
      callbacks.onError('Failed to resume tool response stream.');
      return;
    }

    if (!res.body) {
      callbacks.onError('ReadableStream unavailable on tool resume');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        const jsonStr = trimmed.slice(6);

        try {
          const data = JSON.parse(jsonStr);

          if (data.type === 'tool_complete') {
            callbacks.onToolComplete?.(data.toolName, data.success, data.formattedResult);
            continue;
          }

          if (data.chunk) {
            fullAccumulatedText += data.chunk;
            callbacks.onChunk(data.chunk);
          }

          if (data.done) {
            callbacks.onDone(fullAccumulatedText);
            return;
          }

          if (data.error) {
            callbacks.onError(data.error);
            return;
          }
        } catch {
          // ignore
        }
      }
    }

    callbacks.onDone(fullAccumulatedText);
  } catch (err: unknown) {
    if (signal?.aborted) return;
    const msg = err instanceof Error ? err.message : String(err);
    callbacks.onError(msg);
  }
}
