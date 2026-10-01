import React, { useState } from 'react';
import { Message } from '../types/chat';
import { Copy, Check, User, Bot, AlertCircle, Volume2, Square, VolumeX } from 'lucide-react';
import { marked } from 'marked';
import { ToolCallBadge } from './ToolCallBadge';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onRetry?: () => void;
  isSpeakingThis?: boolean;
  onSpeak?: () => void;
  onStopSpeaking?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isStreaming = false,
  onRetry,
  isSpeakingThis = false,
  onSpeak,
  onStopSpeaking,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy message:', e);
    }
  };

  const formattedTime = (() => {
    try {
      const date = new Date(message.timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <div
      className={`group w-full py-4 px-3 sm:px-6 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-slate-900/30 border-y border-slate-800/40 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-300 shadow-sm">
              <User className="w-4 h-4 text-slate-300" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-violet-700 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-900/20 text-white font-bold text-xs font-mono">
              SX
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header (Role + Timestamp) */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {isUser ? 'You' : 'SaruX'}
              </span>
              {!isUser && (
                <span className="text-[10px] text-cyan-400 font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                  AI Intelligence
                </span>
              )}
              {formattedTime && (
                <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                  {formattedTime}
                </span>
              )}
            </div>

            {/* Quick Actions (Copy & Read Aloud) */}
            <div className="flex items-center gap-1">
              {/* Speaker TTS Control (AI responses only) */}
              {!isUser && message.content && message.status !== 'error' && (
                <button
                  type="button"
                  onClick={isSpeakingThis ? onStopSpeaking : onSpeak}
                  title={isSpeakingThis ? 'Stop speaking' : 'Read aloud'}
                  className={`transition-all p-1 rounded text-xs flex items-center gap-1 cursor-pointer ${
                    isSpeakingThis
                      ? 'opacity-100 bg-red-950/60 border border-red-500/50 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                      : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                  }`}
                >
                  {isSpeakingThis ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span className="text-[11px] font-mono text-red-300">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Speak</span>
                    </>
                  )}
                </button>
              )}

              {/* Copy Message */}
              {message.content && (
                <button
                  type="button"
                  onClick={handleCopyAll}
                  title="Copy entire response"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded text-xs flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[11px] text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Error Alert Display */}
          {message.status === 'error' && (
            <div className="p-3 my-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-red-200">Request Error</div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="px-2.5 py-1 rounded bg-red-900/60 hover:bg-red-800/80 text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      Retry
                    </button>
                  )}
                </div>
                <div className="text-red-300/90 mt-1">{message.error || message.content}</div>
                {message.error?.includes('API_KEY') && (
                  <div className="text-[11px] text-red-400 mt-1.5">
                    Tip: Add your <code className="bg-red-900/40 px-1 py-0.5 rounded font-mono">GEMINI_API_KEY</code> in the project settings or .env file.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tool Call Activity Banner */}
          {message.toolCall && (
            <div className="mb-2">
              <ToolCallBadge toolCall={message.toolCall} />
            </div>
          )}

          {/* Thinking State */}
          {message.status === 'pending' && !message.content && !message.toolCall && (
            <div className="flex items-center gap-2 py-2 text-cyan-400 text-xs font-mono">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" />
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              </div>
              <span className="animate-pulse">SaruX is analyzing and generating response...</span>
            </div>
          )}

          {/* Rendered Text / Markdown */}
          {message.content && (
            <div className="text-slate-100 text-xs sm:text-sm leading-relaxed break-words">
              {isUser ? (
                <div className="whitespace-pre-wrap font-sans text-slate-100">
                  {message.content}
                </div>
              ) : (
                <MarkdownRenderer content={message.content} isStreaming={isStreaming} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Markdown Renderer with Code Blocks and Copy Action
const MarkdownRenderer: React.FC<{ content: string; isStreaming?: boolean }> = ({
  content,
  isStreaming,
}) => {
  // Parse markdown into segments so code blocks can have custom interactive headers
  const segments = React.useMemo(() => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: Array<{ type: 'markdown' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'markdown',
          content: content.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'code',
        language: match[1] || 'plaintext',
        content: match[2].trimEnd(),
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'markdown',
        content: content.substring(lastIndex),
      });
    }

    return parts;
  }, [content]);

  return (
    <div className="space-y-3">
      {segments.map((part, index) => {
        if (part.type === 'code') {
          return (
            <CodeBlockItem
              key={index}
              code={part.content}
              language={part.language || 'plaintext'}
            />
          );
        }

        // Render standard markdown HTML safely
        const rawHtml = marked.parse(part.content, { breaks: true, gfm: true }) as string;

        return (
          <div
            key={index}
            className="prose-sarux prose prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-headings:text-cyan-300 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-cyan-200"
            dangerouslySetInnerHTML={{ __html: rawHtml }}
          />
        );
      })}

      {isStreaming && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
      )}
    </div>
  );
};

// Interactive Code Block with Copy Button
const CodeBlockItem: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-[#090C14] my-3 shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/70 border-b border-slate-700/60 text-[11px] font-mono text-slate-400">
        <span className="text-cyan-400 lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-slate-700/70 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-slate-400" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto leading-relaxed scrollbar-thin">
        <code>{code}</code>
      </pre>
    </div>
  );
};
