import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  FileText,
  Search,
  Wrench,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  Bot,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Conversation, ServerStatusResponse } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  serverStatus: ServerStatusResponse | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  serverStatus,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onOpenSettings,
  isOpen,
  onClose,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const isOnline = serverStatus?.status === 'online';

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveRename = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRenameConversation(id, editingTitle);
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      onDeleteConversation(id);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 lg:w-72 bg-[#090C14] border-r border-slate-800/80 flex flex-col h-full transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand / Logo Top Row */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-violet-600 flex items-center justify-center text-white font-bold font-mono text-sm shadow-md shadow-cyan-500/20">
              SX
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-wide font-['Syne']">
                SaruX AI
              </span>
              <div className="text-[10px] text-cyan-400 font-mono">v1.0 Intelligence</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Action: New Chat */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600/80 to-blue-600/80 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold tracking-wide shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Primary Navigation Modules */}
        <div className="px-3 py-2 space-y-1 border-b border-slate-800/80">
          {/* Active: AI Assistant */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <Bot className="w-4 h-4 text-cyan-400" />
              <span>AI Assistant</span>
            </div>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>

          {/* Documents (Coming Soon) */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-slate-300 text-xs font-medium cursor-not-allowed group opacity-75"
            title="Multimodal Document RAG coming in Step 8"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
              <span>Documents</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              Soon
            </span>
          </div>

          {/* Research (Coming Soon) */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-slate-300 text-xs font-medium cursor-not-allowed group opacity-75"
            title="Deep Research agent capability"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
              <span>Research</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              Soon
            </span>
          </div>

          {/* AI Tools (Coming Soon) */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-slate-300 text-xs font-medium cursor-not-allowed group opacity-75"
            title="Tool calling & system executions coming in Step 5 & 6"
          >
            <div className="flex items-center gap-2.5">
              <Wrench className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
              <span>AI Tools</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
              Soon
            </span>
          </div>
        </div>

        {/* Chat History Section */}
        <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono px-2 mb-2 flex items-center justify-between">
            <span>Chat History</span>
            <span className="text-slate-400 font-mono text-[10px]">
              {conversations.length}
            </span>
          </div>

          <div className="space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-slate-800/80 text-white border border-cyan-500/30 font-medium'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-cyan-400' : 'text-slate-500'
                      }`}
                    />

                    {isEditing ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(conv.id, e as unknown as React.MouseEvent);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="bg-slate-950 text-white text-xs px-1.5 py-0.5 rounded border border-cyan-500 focus:outline-none w-full"
                      />
                    ) : (
                      <span className="truncate">{conv.title || 'Untitled Session'}</span>
                    )}
                  </div>

                  {/* Action Icons (Rename & Delete) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          className="p-1 hover:text-emerald-400"
                          title="Save title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-1 hover:text-red-400"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartRename(conv, e)}
                          className="p-1 text-slate-400 hover:text-slate-200"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(conv.id, e)}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Settings & System Status */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {/* Settings Trigger */}
          <button
            onClick={() => {
              onOpenSettings();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 text-xs transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </button>

          {/* Status Footnote */}
          <div className="pt-2 border-t border-slate-800/60 px-1 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">Gemini</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {isOnline ? 'Connected' : 'Missing Key'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">System Status</span>
              <span className="text-cyan-400 font-medium">Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
