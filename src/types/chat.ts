export type MessageRole = 'user' | 'model';

export interface MessageToolCall {
  toolName: string;
  displayName: string;
  icon: string;
  args: Record<string, any>;
  formattedCall: string;
  status: 'executing' | 'completed' | 'failed' | 'waiting_approval' | 'cancelled';
  result?: any;
  formattedResult?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status?: 'pending' | 'streaming' | 'complete' | 'error';
  error?: string;
  toolCall?: MessageToolCall;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface ServerStatusResponse {
  status: 'online' | 'unconfigured' | 'offline' | 'error';
  model: string;
  configured: boolean;
  name: string;
  version: string;
  timestamp: string;
}

export interface AIStatusMetrics {
  engine: string;
  model: string;
  status: 'online' | 'unconfigured' | 'offline';
  mode: string;
  activeTools: number;
  sessionTurns: number;
  tokenEstimate: number;
}

export type VoiceState =
  | 'WAKE_DISABLED'
  | 'WAKE_MONITORING'
  | 'WAKE_DETECTED'
  | 'LISTENING'
  | 'THINKING'
  | 'SPEAKING';

export type VoicePipelineStage =
  | 'wake_word'
  | 'speech_recognition'
  | 'gemini'
  | 'tool_selection'
  | 'tool_execution'
  | 'gemini_response'
  | 'tts'
  | 'idle';
