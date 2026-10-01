import { useState, useCallback } from 'react';
import { toolRegistry } from '../tools/registry';

export interface ToolActivityItem {
  id: string;
  toolName: string;
  displayName: string;
  icon: string;
  status: 'executing' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';
  args: Record<string, any>;
  formattedCall: string;
  formattedResult?: string;
  timestamp: string;
}

export interface PendingToolConfirmation {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  url?: string;
  formattedCall: string;
  resolve: (approved: boolean) => void;
}

export function useTools() {
  const [toolActivities, setToolActivities] = useState<ToolActivityItem[]>([]);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingToolConfirmation | null>(null);
  const [activeToolName, setActiveToolName] = useState<string | null>(null);

  const recordToolStart = useCallback((id: string, toolName: string, args: Record<string, any>, waitingApproval = false) => {
    setActiveToolName(toolName);
    const def = toolRegistry.get(toolName);
    const displayName = def?.displayName || toolName;
    const icon = def?.icon || 'Wrench';
    const formattedCall = def?.formatCallHuman(args) || JSON.stringify(args);

    const newItem: ToolActivityItem = {
      id,
      toolName,
      displayName,
      icon,
      status: waitingApproval ? 'waiting_approval' : 'executing',
      args,
      formattedCall,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    setToolActivities((prev) => [newItem, ...prev.slice(0, 19)]);
  }, []);

  const recordToolComplete = useCallback((id: string, toolName: string, success: boolean, resultText?: string) => {
    setActiveToolName(null);
    setToolActivities((prev) =>
      prev.map((item) => {
        if (item.id === id || (item.toolName === toolName && item.status === 'executing')) {
          return {
            ...item,
            status: success ? 'completed' : 'failed',
            formattedResult: resultText || (success ? 'Completed successfully' : 'Execution failed'),
          };
        }
        return item;
      })
    );
  }, []);

  const recordToolCancelled = useCallback((id: string) => {
    setActiveToolName(null);
    setToolActivities((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'cancelled', formattedResult: 'User cancelled' } : item))
    );
  }, []);

  const requestConfirmation = useCallback(
    (toolCallId: string, toolName: string, args: Record<string, any>): Promise<boolean> => {
      const def = toolRegistry.get(toolName);
      const formattedCall = def?.formatCallHuman(args) || args?.url || '';

      recordToolStart(toolCallId, toolName, args, true);

      return new Promise<boolean>((resolve) => {
        setPendingConfirmation({
          toolCallId,
          toolName,
          args,
          url: args?.url,
          formattedCall,
          resolve,
        });
      });
    },
    [recordToolStart]
  );

  const approvePendingConfirmation = useCallback(() => {
    if (pendingConfirmation) {
      pendingConfirmation.resolve(true);
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  const rejectPendingConfirmation = useCallback(() => {
    if (pendingConfirmation) {
      recordToolCancelled(pendingConfirmation.toolCallId);
      pendingConfirmation.resolve(false);
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation, recordToolCancelled]);

  const clearToolActivities = useCallback(() => {
    setToolActivities([]);
  }, []);

  return {
    toolActivities,
    pendingConfirmation,
    activeToolName,
    recordToolStart,
    recordToolComplete,
    recordToolCancelled,
    requestConfirmation,
    approvePendingConfirmation,
    rejectPendingConfirmation,
    clearToolActivities,
  };
}
