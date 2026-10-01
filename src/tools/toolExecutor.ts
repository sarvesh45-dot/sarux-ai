import { toolRegistry, ToolDefinition, ToolPermissionLevel } from './registry';

export interface ToolExecutionRequest {
  name: string;
  args: Record<string, any>;
  confirmed?: boolean;
}

export interface ToolExecutionResult {
  success: boolean;
  toolName: string;
  args: Record<string, any>;
  result?: any;
  error?: string;
  permission: ToolPermissionLevel;
  requiresConfirmation?: boolean;
  formattedCall: string;
  formattedResult: string;
  timestamp: string;
}

/**
 * Central tool execution engine enforcing permission security, argument validation,
 * and preventing unauthorized code execution.
 */
export async function executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
  const timestamp = new Date().toISOString();
  const toolName = request.name;
  const rawArgs = request.args || {};

  // 1. Verify tool exists in the whitelist registry
  const tool = toolRegistry.get(toolName);
  if (!tool) {
    return {
      success: false,
      toolName,
      args: rawArgs,
      error: `Security Error: Unauthorized or unknown tool "${toolName}". Only approved tools may be executed.`,
      permission: 'DANGEROUS',
      formattedCall: `${toolName}()`,
      formattedResult: 'Execution rejected',
      timestamp,
    };
  }

  const formattedCall = tool.formatCallHuman(rawArgs);

  // 2. Reject explicitly dangerous tools
  if (tool.permission === 'DANGEROUS') {
    return {
      success: false,
      toolName,
      args: rawArgs,
      error: `Security Error: Execution of dangerous tool "${toolName}" is prohibited.`,
      permission: 'DANGEROUS',
      formattedCall,
      formattedResult: 'Security violation blocked',
      timestamp,
    };
  }

  // 3. Check for required arguments
  const required = tool.parameters.required || [];
  for (const field of required) {
    if (rawArgs[field] === undefined || rawArgs[field] === null || String(rawArgs[field]).trim() === '') {
      return {
        success: false,
        toolName,
        args: rawArgs,
        error: `Missing required argument: "${field}" for tool "${toolName}".`,
        permission: tool.permission,
        formattedCall,
        formattedResult: `Missing argument: ${field}`,
        timestamp,
      };
    }
  }

  // 4. Handle confirmation-required tools
  if (tool.permission === 'CONFIRMATION_REQUIRED' && !request.confirmed) {
    return {
      success: false,
      toolName,
      args: rawArgs,
      requiresConfirmation: true,
      permission: 'CONFIRMATION_REQUIRED',
      formattedCall,
      formattedResult: 'Waiting for user approval',
      timestamp,
    };
  }

  // 5. Execute safe or confirmed tool with error containment
  try {
    const rawResult = await tool.execute(rawArgs, request.confirmed);
    const isSuccess = rawResult && typeof rawResult === 'object' && 'success' in rawResult ? rawResult.success : true;

    return {
      success: isSuccess,
      toolName,
      args: rawArgs,
      result: rawResult,
      error: !isSuccess ? rawResult?.error || 'Tool execution unsuccessful' : undefined,
      permission: tool.permission,
      formattedCall,
      formattedResult: tool.formatResultHuman(rawResult),
      timestamp,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`Tool execution error in "${toolName}":`, errorMessage);

    return {
      success: false,
      toolName,
      args: rawArgs,
      error: errorMessage,
      permission: tool.permission,
      formattedCall,
      formattedResult: `Error: ${errorMessage}`,
      timestamp,
    };
  }
}
