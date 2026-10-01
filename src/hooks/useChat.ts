import { useState, useEffect, useRef, useCallback } from 'react';
import { Conversation, Message, ServerStatusResponse, MessageToolCall, VoicePipelineStage } from '../types/chat';
import { checkServerStatus, streamChatResponse } from '../services/gemini';

const STORAGE_KEY = 'sarux_ai_conversations_v1';
const ACTIVE_CONV_KEY = 'sarux_ai_active_id_v1';

function createDefaultConversation(): Conversation {
  return {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'New Intelligence Session',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
}

export interface UseChatOptions {
  onAssistantMessageComplete?: (messageId: string, content: string) => void;
  onToolStart?: (call: MessageToolCall) => void;
  onToolComplete?: (toolName: string, success: boolean, resultText?: string) => void;
  onToolConfirmationRequired?: (
    toolCallId: string,
    toolName: string,
    args: Record<string, any>,
    pendingContext: any
  ) => Promise<boolean>;
  onPipelineStageChange?: (stage: VoicePipelineStage) => void;
}

export function useChat(options?: UseChatOptions) {
  const onAssistantMessageCompleteRef = useRef(options?.onAssistantMessageComplete);
  const onToolStartRef = useRef(options?.onToolStart);
  const onToolCompleteRef = useRef(options?.onToolComplete);
  const onToolConfirmationRequiredRef = useRef(options?.onToolConfirmationRequired);
  const onPipelineStageChangeRef = useRef(options?.onPipelineStageChange);

  useEffect(() => {
    onAssistantMessageCompleteRef.current = options?.onAssistantMessageComplete;
    onToolStartRef.current = options?.onToolStart;
    onToolCompleteRef.current = options?.onToolComplete;
    onToolConfirmationRequiredRef.current = options?.onToolConfirmationRequired;
    onPipelineStageChangeRef.current = options?.onPipelineStageChange;
  }, [
    options?.onAssistantMessageComplete,
    options?.onToolStart,
    options?.onToolComplete,
    options?.onToolConfirmationRequired,
    options?.onPipelineStageChange,
  ]);

  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load stored conversations:', e);
    }
    return [createDefaultConversation()];
  });

  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    try {
      const storedId = localStorage.getItem(ACTIVE_CONV_KEY);
      if (storedId) return storedId;
    } catch (e) {
      console.error('Failed to load active conversation id:', e);
    }
    return conversations[0]?.id || '';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState<ServerStatusResponse | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync active conversation id to storage
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_CONV_KEY, activeConversationId);
    }
  }, [activeConversationId]);

  // Sync conversations to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to save conversations to storage:', e);
    }
  }, [conversations]);

  // Check server status on mount
  const checkStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    try {
      const status = await checkServerStatus();
      setServerStatus(status);
    } catch {
      setServerStatus({
        status: 'error',
        model: 'gemini-3.8-flash',
        configured: false,
        name: 'SaruX AI',
        version: '1.0.0-step1',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Current active conversation
  const activeConversation =
    conversations.find((c) => c.id === activeConversationId) ||
    conversations[0] ||
    createDefaultConversation();

  // Create new chat
  const createNewChat = useCallback(() => {
    // If current conversation is already empty, just stay on it
    if (activeConversation && activeConversation.messages.length === 0) {
      return;
    }
    const newConv = createDefaultConversation();
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
  }, [activeConversation]);

  // Switch conversation
  const switchConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  // Delete conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const fresh = createDefaultConversation();
        setActiveConversationId(fresh.id);
        return [fresh];
      }
      return filtered;
    });

    setActiveConversationId((currentActiveId) => {
      if (currentActiveId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        return remaining[0]?.id || '';
      }
      return currentActiveId;
    });
  }, [conversations]);

  // Rename conversation
  const renameConversation = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: trimmed, updatedAt: new Date().toISOString() } : c))
    );
  }, []);

  // Clear messages in current conversation
  const clearCurrentConversation = useCallback(() => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [], updatedAt: new Date().toISOString() }
          : c
      )
    );
  }, [activeConversationId]);

  // Clear all conversations
  const clearAllConversations = useCallback(() => {
    const fresh = createDefaultConversation();
    setConversations([fresh]);
    setActiveConversationId(fresh.id);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_CONV_KEY);
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsgId = `msg_user_${Date.now()}`;
      const assistantMsgId = `msg_ai_${Date.now()}`;
      const timestamp = new Date().toISOString();

      const userMessage: Message = {
        id: userMsgId,
        role: 'user',
        content: trimmed,
        timestamp,
        status: 'complete',
      };

      const assistantPlaceholder: Message = {
        id: assistantMsgId,
        role: 'model',
        content: '',
        timestamp,
        status: 'pending',
      };

      // Determine updated conversation title if it's the first message
      const isFirstMessage = activeConversation.messages.length === 0;
      const derivedTitle = isFirstMessage
        ? trimmed.length > 32
          ? trimmed.slice(0, 30) + '...'
          : trimmed
        : activeConversation.title;

      // Update state immediately with user message and placeholder
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              title: derivedTitle,
              updatedAt: timestamp,
              messages: [...c.messages, userMessage, assistantPlaceholder],
            };
          }
          return c;
        })
      );

      setIsLoading(true);

      // Prepare context history for Gemini
      // Include prior messages up to last 14 messages + current message
      const contextMessages = [
        ...activeConversation.messages
          .filter((m) => m.content && m.status !== 'error')
          .slice(-14)
          .map((m) => ({
            role: m.role,
            content: m.content,
          })),
        {
          role: 'user' as const,
          content: trimmed,
        },
      ];

      // Setup AbortController
      abortControllerRef.current = new AbortController();

      let streamedText = '';

      await streamChatResponse({
        messages: contextMessages,
        signal: abortControllerRef.current.signal,
        onToolStart: (toolCall: MessageToolCall) => {
          onPipelineStageChangeRef.current?.('tool_execution');
          onToolStartRef.current?.(toolCall);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId ? { ...m, toolCall } : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onToolComplete: (toolName: string, success: boolean, resultText?: string) => {
          onPipelineStageChangeRef.current?.('gemini_response');
          onToolCompleteRef.current?.(toolName, success, resultText);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId && m.toolCall
                      ? {
                          ...m,
                          toolCall: {
                            ...m.toolCall,
                            status: success ? 'completed' : 'failed',
                            formattedResult: resultText,
                          },
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onToolConfirmationRequired: async (toolCallId, toolName, args, pendingContext) => {
          onPipelineStageChangeRef.current?.('tool_selection');
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          toolCall: {
                            toolName,
                            displayName: 'Open Website',
                            icon: 'Globe',
                            args,
                            formattedCall: args?.url || 'open website',
                            status: 'waiting_approval',
                          },
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );

          if (onToolConfirmationRequiredRef.current) {
            return onToolConfirmationRequiredRef.current(toolCallId, toolName, args, pendingContext);
          }
          return false;
        },
        onChunk: (chunk: string) => {
          onPipelineStageChangeRef.current?.('gemini_response');
          streamedText += chunk;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: streamedText, status: 'streaming' }
                      : m
                  ),
                };
              }
              return c;
            })
          );
        },
        onDone: (fullText: string) => {
          const completedText = fullText || streamedText;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: completedText, status: 'complete' }
                      : m
                  ),
                };
              }
              return c;
            })
          );
          setIsLoading(false);
          if (completedText && completedText.trim()) {
            onAssistantMessageCompleteRef.current?.(assistantMsgId, completedText);
          }
        },
        onError: (errorMessage: string) => {
          console.error('Chat stream error:', errorMessage);
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMsgId
                      ? {
                          ...m,
                          status: 'error',
                          error: errorMessage,
                          content:
                            streamedText.length > 0
                              ? streamedText
                              : `[Communication Error] ${errorMessage}`,
                        }
                      : m
                  ),
                };
              }
              return c;
            })
          );
          setIsLoading(false);
        },
      });
    },
    [activeConversation, activeConversationId, isLoading]
  );

  const retryLastMessage = useCallback(() => {
    if (isLoading || activeConversation.messages.length === 0) return;

    // Find the last user message
    const msgs = activeConversation.messages;
    let lastUserContent = '';
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user' && msgs[i].content) {
        lastUserContent = msgs[i].content;
        break;
      }
    }

    if (!lastUserContent) return;

    // Remove any trailing error message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          const cleaned = c.messages.filter((m, idx) => {
            const isLast = idx === c.messages.length - 1;
            return !(isLast && m.status === 'error');
          });
          return { ...c, messages: cleaned };
        }
        return c;
      })
    );

    // Re-send
    sendMessage(lastUserContent);
  }, [activeConversation, activeConversationId, isLoading, sendMessage]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isLoading,
    serverStatus,
    isCheckingStatus,
    sendMessage,
    retryLastMessage,
    stopGeneration,
    createNewChat,
    switchConversation,
    deleteConversation,
    renameConversation,
    clearCurrentConversation,
    clearAllConversations,
    checkStatus,
  };
}
