import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { toolRegistry } from './src/tools/registry.js';
import { executeTool } from './src/tools/toolExecutor.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// ----------------------------------------------------
// LOCAL PYTHON AGENT MANAGEMENT (127.0.0.1:8000)
// ----------------------------------------------------
let localAgentProcess: any = null;

function startLocalPythonAgent() {
  try {
    const pythonBin = 'python3';
    const mainScript = path.resolve(__dirname, 'backend', 'main.py');
    if (fs.existsSync(mainScript)) {
      console.log(`[SaruX Server] Launching local system agent: ${pythonBin} ${mainScript}`);
      localAgentProcess = spawn(pythonBin, [mainScript], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, LOCAL_AGENT_HOST: '127.0.0.1', LOCAL_AGENT_PORT: '8000' },
      });

      localAgentProcess.stdout?.on('data', (d: Buffer) => {
        const text = d.toString().trim();
        if (text) console.log(text);
      });

      localAgentProcess.stderr?.on('data', (d: Buffer) => {
        const text = d.toString().trim();
        if (text) console.warn(text);
      });

      localAgentProcess.on('error', (err: any) => {
        console.warn('[SaruX Server] Python agent spawn warning:', err.message);
      });

      localAgentProcess.on('exit', (code: number) => {
        console.log(`[SaruX Server] Python agent process exited with code ${code}`);
      });
    }
  } catch (err) {
    console.warn('[SaruX Server] Could not launch Python agent automatically:', err);
  }
}

// Clean up agent on process shutdown
process.on('exit', () => {
  if (localAgentProcess) {
    try {
      localAgentProcess.kill();
    } catch {}
  }
});
process.on('SIGINT', () => {
  if (localAgentProcess) {
    try {
      localAgentProcess.kill();
    } catch {}
  }
  process.exit();
});

// Launch local agent
startLocalPythonAgent();

// Helper to get GoogleGenAI client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Step 6 Persona & System Instruction
const SYSTEM_INSTRUCTION =
  "You are SaruX, a personal AI assistant with access to controlled local computer tools.\n\n" +
  "You may request an available tool when necessary.\n" +
  "Never invent tool results.\n" +
  "Never claim an action succeeded unless the tool returned success.\n" +
  "Never request arbitrary shell commands.\n" +
  "Never attempt to bypass the tool permission system.\n" +
  "Respect confirmation requirements.\n" +
  "If a requested capability is unavailable, clearly tell the user.\n" +
  "After a tool completes, explain the result naturally, concisely, and clearly.";

async function callWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 1200): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const errStr = err instanceof Error ? err.message : String(err);
    const isTransient =
      errStr.includes('503') ||
      errStr.includes('UNAVAILABLE') ||
      errStr.includes('high demand') ||
      errStr.includes('RESOURCE_EXHAUSTED') ||
      errStr.includes('429');

    if (retries > 0 && isTransient) {
      console.warn(`Transient error encountered: ${errStr}. Retrying in ${delayMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callWithRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}

function formatGeminiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('503') || raw.includes('UNAVAILABLE') || raw.includes('high demand')) {
    return 'Gemini is currently experiencing high global demand. Spikes are temporary—please try your message again in a few moments.';
  }
  if (raw.includes('429') || raw.includes('RESOURCE_EXHAUSTED') || raw.includes('Quota')) {
    return 'Rate limit reached on the Gemini API. Please wait a few seconds before trying again.';
  }
  if (raw.includes('API_KEY_INVALID') || raw.includes('403') || raw.includes('PERMISSION_DENIED')) {
    return 'The provided GEMINI_API_KEY is invalid or lacks necessary permissions.';
  }
  if (raw.includes('API_KEY_MISSING')) {
    return 'GEMINI_API_KEY is not configured in the server environment.';
  }
  return 'SaruX encountered an issue generating a response. Please try again.';
}

// System Status Endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  const ai = getGenAIClient();
  const isConfigured = Boolean(ai);
  res.json({
    status: isConfigured ? 'online' : 'unconfigured',
    model: 'gemini-3.8-flash',
    configured: isConfigured,
    name: 'SaruX AI',
    version: '1.0.0-step6',
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// LOCAL AGENT PROXY ENDPOINTS (Safe Localhost Only)
// ----------------------------------------------------
app.get('/api/local-agent/status', async (_req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const agentRes = await fetch('http://127.0.0.1:8000/api/status', { signal: controller.signal });
    clearTimeout(timeout);
    if (!agentRes.ok) {
      res.json({ connected: false, error: 'Agent returned error status' });
      return;
    }
    const data = await agentRes.json();
    res.json({ connected: true, ...data });
  } catch {
    res.json({
      connected: false,
      status: 'offline',
      error: 'Local Agent is offline. Run "python3 backend/main.py" to connect.',
    });
  }
});

app.get('/api/local-agent/system/info', async (_req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const agentRes = await fetch('http://127.0.0.1:8000/api/system/info', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await agentRes.json();
    res.json(data);
  } catch {
    res.status(503).json({
      success: false,
      error: 'Local agent is offline. Run "python3 backend/main.py" to connect.',
    });
  }
});

app.get('/api/local-agent/system/battery', async (_req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const agentRes = await fetch('http://127.0.0.1:8000/api/system/battery', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await agentRes.json();
    res.json(data);
  } catch {
    res.status(503).json({
      success: false,
      error: 'Local agent is offline. Run "python3 backend/main.py" to connect.',
    });
  }
});

app.get('/api/local-agent/system/volume', async (_req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const agentRes = await fetch('http://127.0.0.1:8000/api/system/volume', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await agentRes.json();
    res.json(data);
  } catch {
    res.status(503).json({
      success: false,
      error: 'Local agent is offline. Run "python3 backend/main.py" to connect.',
    });
  }
});

app.post('/api/local-agent/tools/execute', async (req: Request, res: Response) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const agentRes = await fetch('http://127.0.0.1:8000/api/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await agentRes.json();
    res.status(agentRes.status).json(data);
  } catch {
    res.status(503).json({
      success: false,
      error: 'Local Agent is offline or unreachable. Please run "python3 backend/main.py" to enable computer control.',
    });
  }
});

// Standard Chat Endpoint (Non-streaming with tool loop)
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please ensure the GEMINI_API_KEY environment variable is set in the AI Studio Secrets panel.',
        code: 'API_KEY_MISSING',
      });
      return;
    }

    const { messages, timezone } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required and must not be empty.' });
      return;
    }

    const contents: any[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }],
    }));

    const functionDeclarations = toolRegistry.getGeminiFunctionDeclarations();
    const primaryModel = 'gemini-3.8-flash';
    const fallbackModel = 'gemini-flash-latest';

    let response;
    try {
      response = await callWithRetry(() =>
        ai.models.generateContent({
          model: primaryModel,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: functionDeclarations as any }],
          },
        })
      );
    } catch (primaryErr: unknown) {
      console.warn(`Primary model error, falling back to ${fallbackModel}...`, primaryErr);
      response = await callWithRetry(() =>
        ai.models.generateContent({
          model: fallbackModel,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: functionDeclarations as any }],
          },
        })
      );
    }

    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0 && functionCalls[0] && typeof functionCalls[0].name === 'string') {
      const call = functionCalls[0];
      const callName = call.name!;
      const toolExec = await executeTool({
        name: callName,
        args: { ...(call.args || {}), timezone },
      });

      // Provide function response back to model for final text
      const modelTurn = response.candidates?.[0]?.content;
      const followUpContents = [
        ...contents,
        modelTurn,
        {
          role: 'tool',
          parts: [
            {
              functionResponse: {
                name: callName,
                response: toolExec.result || { success: toolExec.success, error: toolExec.error },
              },
            },
          ],
        },
      ];

      const secondResponse = await callWithRetry(() =>
        ai.models.generateContent({
          model: primaryModel,
          contents: followUpContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        })
      );

      res.json({
        role: 'model',
        content: secondResponse.text || '',
        toolCall: {
          name: callName,
          args: call.args,
          result: toolExec.result,
        },
        model: 'gemini-3.8-flash',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      role: 'model',
      content: response.text || '',
      model: 'gemini-3.8-flash',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('Error in /api/chat:', err);
    res.status(500).json({ error: formatGeminiError(err) });
  }
});

// Server-Sent Events (SSE) Streaming Chat Endpoint with Function Calling
app.post('/api/chat/stream', async (req: Request, res: Response): Promise<void> => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please ensure the GEMINI_API_KEY environment variable is set in the AI Studio Secrets panel.',
        code: 'API_KEY_MISSING',
      });
      return;
    }

    const { messages, timezone } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required and must not be empty.' });
      return;
    }

    const contents: any[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }],
    }));

    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const functionDeclarations = toolRegistry.getGeminiFunctionDeclarations();
    const primaryModel = 'gemini-3.8-flash';
    const fallbackModel = 'gemini-flash-latest';

    // Step 1: Query Gemini with Tool declarations
    let firstResponse;
    try {
      firstResponse = await callWithRetry(() =>
        ai.models.generateContent({
          model: primaryModel,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: functionDeclarations as any }],
          },
        })
      );
    } catch {
      console.warn(`Primary model busy, falling back to ${fallbackModel}...`);
      firstResponse = await callWithRetry(() =>
        ai.models.generateContent({
          model: fallbackModel,
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            tools: [{ functionDeclarations: functionDeclarations as any }],
          },
        })
      );
    }

    const functionCalls = firstResponse.functionCalls;

    // A. If Gemini decided to call a tool:
    if (functionCalls && functionCalls.length > 0 && functionCalls[0] && typeof functionCalls[0].name === 'string') {
      const call = functionCalls[0];
      const callName = call.name!;
      const toolDef = toolRegistry.get(callName);
      const callArgs = (call.args || {}) as Record<string, any>;

      // A1. Confirmation required tools (e.g. open_application, set_volume, mute_volume, open_website, open_url)
      if (toolDef && toolDef.permission === 'CONFIRMATION_REQUIRED') {
        res.write(
          `data: ${JSON.stringify({
            type: 'tool_confirmation_required',
            toolCallId: call.id || `call_${Date.now()}`,
            toolName: callName,
            displayName: toolDef.displayName,
            icon: toolDef.icon,
            args: callArgs,
            formattedCall: toolDef.formatCallHuman(callArgs),
            pendingContext: {
              modelContent: firstResponse.candidates?.[0]?.content,
              contents,
              timezone,
            },
          })}\n\n`
        );
        res.end();
        return;
      }

      // A2. Safe tool (e.g. calculator, get_current_time, get_current_date, get_system_information, get_battery_status, get_volume, web_search)
      res.write(
        `data: ${JSON.stringify({
          type: 'tool_start',
          toolName: callName,
          displayName: toolDef?.displayName || callName,
          icon: toolDef?.icon || 'Wrench',
          args: callArgs,
          formattedCall: toolDef?.formatCallHuman(callArgs) || `${callName}()`,
        })}\n\n`
      );

      // Execute safe tool
      const toolExec = await executeTool({
        name: callName,
        args: { ...callArgs, timezone },
      });

      res.write(
        `data: ${JSON.stringify({
          type: 'tool_complete',
          toolName: callName,
          success: toolExec.success,
          formattedResult: toolExec.formattedResult,
        })}\n\n`
      );

      // Feed tool result back to Gemini for the final response
      const modelTurn = firstResponse.candidates?.[0]?.content;
      const followUpContents = [
        ...contents,
        modelTurn,
        {
          role: 'tool',
          parts: [
            {
              functionResponse: {
                name: callName,
                response: toolExec.result || { success: toolExec.success, error: toolExec.error },
              },
            },
          ],
        },
      ];

      // Stream the final answer
      let streamResponse;
      try {
        streamResponse = await callWithRetry(() =>
          ai.models.generateContentStream({
            model: primaryModel,
            contents: followUpContents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
            },
          })
        );
      } catch {
        streamResponse = await callWithRetry(() =>
          ai.models.generateContentStream({
            model: fallbackModel,
            contents: followUpContents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
            },
          })
        );
      }

      for await (const chunk of streamResponse) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
      return;
    }

    // B. No tool call needed: stream normal text response
    const normalText = firstResponse.text || '';
    if (normalText) {
      res.write(`data: ${JSON.stringify({ chunk: normalText })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    console.error('Error in /api/chat/stream:', err);
    const userMessage = formatGeminiError(err);
    if (!res.headersSent) {
      res.status(500).json({ error: userMessage });
    } else {
      res.write(`data: ${JSON.stringify({ error: userMessage })}\n\n`);
      res.end();
    }
  }
});

// Endpoint to resume stream after user confirms or rejects a confirmation-required tool
app.post('/api/chat/tool-response', async (req: Request, res: Response): Promise<void> => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      res.status(503).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      return;
    }

    const { toolName, args, approved, pendingContext } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let toolExecResult;
    if (approved) {
      toolExecResult = await executeTool({
        name: toolName,
        args,
        confirmed: true,
      });
    } else {
      toolExecResult = {
        success: false,
        toolName,
        args,
        result: { success: false, cancelled: true, error: 'User declined to execute the tool.' },
        permission: 'CONFIRMATION_REQUIRED' as const,
        formattedCall: toolRegistry.get(toolName)?.formatCallHuman(args) || toolName,
        formattedResult: 'Cancelled by user',
        timestamp: new Date().toISOString(),
      };
    }

    res.write(
      `data: ${JSON.stringify({
        type: 'tool_complete',
        toolName,
        success: toolExecResult.success,
        formattedResult: toolExecResult.formattedResult,
      })}\n\n`
    );

    const modelTurn = pendingContext?.modelContent;
    const baseContents = pendingContext?.contents || [];

    const followUpContents = [
      ...baseContents,
      modelTurn,
      {
        role: 'tool',
        parts: [
          {
            functionResponse: {
              name: toolName,
              response: toolExecResult.result || { success: toolExecResult.success },
            },
          },
        ],
      },
    ];

    const primaryModel = 'gemini-3.8-flash';
    const fallbackModel = 'gemini-flash-latest';

    let streamResponse;
    try {
      streamResponse = await callWithRetry(() =>
        ai.models.generateContentStream({
          model: primaryModel,
          contents: followUpContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        })
      );
    } catch {
      streamResponse = await callWithRetry(() =>
        ai.models.generateContentStream({
          model: fallbackModel,
          contents: followUpContents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
          },
        })
      );
    }

    for await (const chunk of streamResponse) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ chunk: chunk.text })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err: unknown) {
    console.error('Error in /api/chat/tool-response:', err);
    res.write(`data: ${JSON.stringify({ error: formatGeminiError(err) })}\n\n`);
    res.end();
  }
});

// Mount Vite or static build depending on mode
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`SaruX AI server running at http://localhost:${port}`);
  });
}

startServer();
