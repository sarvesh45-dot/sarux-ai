import React, { useRef, useEffect, useState } from 'react';
import { Message, VoiceState } from '../types/chat';
import { ChatMessage } from './ChatMessage';
import { EmptyState } from './EmptyState';
import { ChatInput } from './ChatInput';
import { ArrowDown } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onClearChat: () => void;
  onStopGeneration: () => void;
  onRetry?: () => void;
  isOnline: boolean;
  currentSpeakingMessageId?: string | null;
  onSpeakMessage?: (text: string, id: string) => void;
  onStopSpeaking?: () => void;
  voiceState?: VoiceState;
  wakeWordDetected?: boolean;
  isSpeaking?: boolean;
  wakeTriggerSignal?: number;
  injectedCommand?: string | null;
  onSpeechListeningChange?: (isListening: boolean) => void;
  isHandsFreeEnabled?: boolean;
  onToggleHandsFree?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onClearChat,
  onStopGeneration,
  onRetry,
  isOnline,
  currentSpeakingMessageId,
  onSpeakMessage,
  onStopSpeaking,
  voiceState = 'WAKE_DISABLED',
  wakeWordDetected = false,
  isSpeaking = false,
  wakeTriggerSignal,
  injectedCommand,
  onSpeechListeningChange,
  isHandsFreeEnabled = false,
  onToggleHandsFree,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    if (bottomAnchorRef.current) {
      bottomAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Handle user scroll detection
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    bottomAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#08090D]">
      {/* Scrollable Message Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scrollbar-thin flex flex-col"
      >
        {isEmpty ? (
          <EmptyState
            onSelectPrompt={onSendMessage}
            isThinking={isLoading}
            isSpeaking={isSpeaking}
            voiceState={voiceState}
            wakeWordDetected={wakeWordDetected}
          />
        ) : (
          <div className="flex-1 pb-4">
            {messages.map((msg, index) => {
              const isLastMessage = index === messages.length - 1;
              const isCurrentlyStreaming = isLastMessage && isLoading && msg.role === 'model';
              return (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  isStreaming={isCurrentlyStreaming}
                  onRetry={onRetry}
                  isSpeakingThis={currentSpeakingMessageId === msg.id}
                  onSpeak={() => onSpeakMessage?.(msg.content, msg.id)}
                  onStopSpeaking={onStopSpeaking}
                />
              );
            })}
            <div ref={bottomAnchorRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute right-6 bottom-28 p-2 rounded-full glass-panel-elevated text-cyan-400 hover:text-white transition-all shadow-lg hover:scale-105 z-20 cursor-pointer"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Bottom Input Bar */}
      <ChatInput
        onSendMessage={onSendMessage}
        onClearChat={onClearChat}
        onStopGeneration={onStopGeneration}
        isLoading={isLoading}
        onSpeechListeningChange={onSpeechListeningChange}
        wakeTriggerSignal={wakeTriggerSignal}
        injectedCommand={injectedCommand}
        voiceState={voiceState}
        isHandsFreeEnabled={isHandsFreeEnabled}
        onToggleHandsFree={onToggleHandsFree}
      />
    </div>
  );
};
