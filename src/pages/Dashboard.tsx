import React, { useState, useCallback } from 'react';
import { useChat } from '../hooks/useChat';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useWakeWord } from '../hooks/useWakeWord';
import { useTools } from '../hooks/useTools';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { ChatWindow } from '../components/ChatWindow';
import { AIStatus } from '../components/AIStatus';
import { SettingsModal } from '../components/SettingsModal';
import { ToolConfirmationModal } from '../components/ToolConfirmationModal';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';
import { VoicePipelineStage } from '../types/chat';

export const Dashboard: React.FC = () => {
  // Step 3: Text-to-Speech Hook
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    currentMessageId: currentSpeakingMessageId,
    autoVoiceResponse,
    setAutoVoiceResponse,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
  } = useTextToSpeech();

  // Step 5: Tools & Function Calling Hook
  const {
    toolActivities,
    pendingConfirmation,
    recordToolStart,
    recordToolComplete,
    requestConfirmation,
    approvePendingConfirmation,
    rejectPendingConfirmation,
    clearToolActivities,
  } = useTools();

  // Automatic speech callback: called when Gemini successfully completes generating a response
  const handleAssistantMessageComplete = useCallback(
    (messageId: string, content: string) => {
      if (autoVoiceResponse) {
        speak(content, messageId);
      }
    },
    [autoVoiceResponse, speak]
  );

  const [activePipelineStage, setActivePipelineStage] = useState<VoicePipelineStage | null>(null);

  const {
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
  } = useChat({
    onAssistantMessageComplete: handleAssistantMessageComplete,
    onToolStart: (toolCall) => {
      recordToolStart(toolCall.toolName + '_' + Date.now(), toolCall.toolName, toolCall.args);
    },
    onToolComplete: (toolName, success, resultText) => {
      recordToolComplete(toolName, toolName, success, resultText);
    },
    onToolConfirmationRequired: async (toolCallId, toolName, args) => {
      return requestConfirmation(toolCallId, toolName, args);
    },
    onPipelineStageChange: (stage) => {
      setActivePipelineStage(stage);
    },
  });

  // State coordination between Wake Word and ChatInput Speech Recognition
  const [wakeTriggerSignal, setWakeTriggerSignal] = useState(0);
  const [injectedCommand, setInjectedCommand] = useState<string | null>(null);
  const [isSpeechListening, setIsSpeechListening] = useState(false);

  // Step 4: Hands-free Wake Word Hook ("Hey Saru")
  const {
    isHandsFreeEnabled,
    isMonitoring,
    wakeWordDetected,
    voiceState,
    pipelineStage: wakePipelineStage,
    error: wakeWordError,
    enableHandsFree,
    disableHandsFree,
    toggleHandsFree,
    clearError: clearWakeWordError,
  } = useWakeWord({
    isExternalListening: isSpeechListening,
    isExternalThinking: isLoading,
    isExternalSpeaking: isSpeaking,
    onWakeWordTriggered: () => {
      // User said "Hey Saru" alone -> trigger speech recognition in ChatInput
      stopSpeaking();
      setWakeTriggerSignal((prev) => prev + 1);
    },
    onCommandCaptured: (command) => {
      // User said "Hey Saru, <command>" in the same breath -> send only the command to Gemini
      stopSpeaking();
      setInjectedCommand(command);
      sendMessage(command);
    },
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIStatusOpen, setIsAIStatusOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dismissKeyWarning, setDismissKeyWarning] = useState(false);

  const isOnline = serverStatus?.status === 'online';
  const isMissingKey = serverStatus?.status === 'unconfigured';

  // Overall combined pipeline stage
  const effectivePipelineStage: VoicePipelineStage = isLoading
    ? activePipelineStage || 'gemini'
    : isSpeaking
    ? 'tts'
    : wakePipelineStage;

  const handleStopAll = useCallback(() => {
    stopGeneration();
    stopSpeaking();
  }, [stopGeneration, stopSpeaking]);

  const handleSwitchSession = useCallback(
    (id: string) => {
      stopSpeaking();
      switchConversation(id);
    },
    [stopSpeaking, switchConversation]
  );

  const handleNewChat = useCallback(() => {
    stopSpeaking();
    createNewChat();
  }, [stopSpeaking, createNewChat]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090D] text-slate-100 select-none">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        serverStatus={serverStatus}
        onNewChat={handleNewChat}
        onSelectConversation={handleSwitchSession}
        onDeleteConversation={deleteConversation}
        onRenameConversation={renameConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* 2. Top Header */}
        <Header
          serverStatus={serverStatus}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onToggleAIStatus={() => setIsAIStatusOpen((prev) => !prev)}
          isAIStatusOpen={isAIStatusOpen}
          autoVoiceResponse={autoVoiceResponse}
          onToggleVoiceResponse={() => {
            if (isSpeaking) {
              stopSpeaking();
            }
            setAutoVoiceResponse(!autoVoiceResponse);
          }}
          isSpeaking={isSpeaking}
          isHandsFreeEnabled={isHandsFreeEnabled}
          onToggleHandsFree={toggleHandsFree}
          isMonitoring={isMonitoring}
        />

        {/* Missing API Key Guidance Banner */}
        {isMissingKey && !dismissKeyWarning && (
          <div className="bg-amber-950/40 border-b border-amber-800/60 px-4 py-2 flex items-center justify-between text-xs text-amber-200 z-10">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="font-semibold text-amber-300">Configuration Notice:</strong>{' '}
                <code className="bg-amber-900/40 px-1 py-0.5 rounded font-mono text-[11px]">
                  GEMINI_API_KEY
                </code>{' '}
                is not configured yet. Set it in the Secrets panel or .env file to enable live Gemini generation.
              </span>
            </div>
            <button
              onClick={() => setDismissKeyWarning(true)}
              className="text-amber-400 hover:text-white font-mono text-[11px] ml-4 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Wake Word Permission / Error Banner */}
        {wakeWordError && (
          <div className="bg-red-950/60 border-b border-red-800/80 px-4 py-2 flex items-center justify-between text-xs text-red-200 z-10">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{wakeWordError}</span>
            </div>
            <button
              onClick={clearWakeWordError}
              className="p-1 rounded text-red-400 hover:text-white hover:bg-red-900/40 transition-colors cursor-pointer"
              title="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 3 & 4. Main Chat Area & Right Panel Layout */}
        <div className="flex-1 flex h-full overflow-hidden">
          {/* Main Chat Conversation View */}
          <ChatWindow
            messages={activeConversation.messages}
            isLoading={isLoading}
            onSendMessage={(text) => {
              stopSpeaking();
              sendMessage(text);
            }}
            onClearChat={() => {
              stopSpeaking();
              clearCurrentConversation();
            }}
            onStopGeneration={handleStopAll}
            onRetry={() => {
              stopSpeaking();
              retryLastMessage();
            }}
            isOnline={isOnline}
            currentSpeakingMessageId={currentSpeakingMessageId}
            onSpeakMessage={(text, id) => speak(text, id)}
            onStopSpeaking={stopSpeaking}
            voiceState={voiceState}
            wakeWordDetected={wakeWordDetected}
            isSpeaking={isSpeaking}
            wakeTriggerSignal={wakeTriggerSignal}
            injectedCommand={injectedCommand}
            onSpeechListeningChange={setIsSpeechListening}
            isHandsFreeEnabled={isHandsFreeEnabled}
            onToggleHandsFree={toggleHandsFree}
          />

          {/* 5. Right Information Panel (AI Status with Voice Pipeline & Tool Activity) */}
          <AIStatus
            serverStatus={serverStatus}
            messageCount={activeConversation.messages.length}
            isOpen={isAIStatusOpen}
            onClose={() => setIsAIStatusOpen(false)}
            voiceState={voiceState}
            pipelineStage={effectivePipelineStage}
            isHandsFreeEnabled={isHandsFreeEnabled}
            onToggleHandsFree={toggleHandsFree}
            wakeWordError={wakeWordError}
            toolActivities={toolActivities}
            onClearToolActivities={clearToolActivities}
          />
        </div>
      </div>

      {/* Step 5 & 6: Tool Confirmation Modal */}
      <ToolConfirmationModal
        isOpen={pendingConfirmation !== null}
        toolName={pendingConfirmation?.toolName || 'open_website'}
        args={pendingConfirmation?.args}
        url={pendingConfirmation?.url}
        formattedCall={pendingConfirmation?.formattedCall}
        onConfirm={approvePendingConfirmation}
        onCancel={rejectPendingConfirmation}
      />


      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        serverStatus={serverStatus}
        onRefreshStatus={checkStatus}
        isCheckingStatus={isCheckingStatus}
        conversations={conversations}
        onClearAllChats={() => {
          stopSpeaking();
          clearAllConversations();
        }}
        autoVoiceResponse={autoVoiceResponse}
        onToggleVoiceResponse={setAutoVoiceResponse}
        availableVoices={availableVoices}
        selectedVoiceURI={selectedVoiceURI}
        onSelectVoice={setSelectedVoiceURI}
        onTestVoice={() => speak('Hello, I am SaruX, your personal AI intelligence.')}
        isHandsFreeEnabled={isHandsFreeEnabled}
        onToggleHandsFree={(val) => {
          if (val) {
            enableHandsFree();
          } else {
            disableHandsFree();
          }
        }}
      />
    </div>
  );
};
