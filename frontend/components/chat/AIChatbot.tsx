'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, ChatMessage } from '@/store/useStore';
import { RiSendPlaneLine, RiRobotLine, RiUserLine, RiDeleteBinLine, RiSparklingLine } from 'react-icons/ri';

const QUICK_PROMPTS = [
  'What should I work on next?',
  'Help me plan my day',
  'Give me a productivity tip',
  'Break down my biggest task',
];

export default function AIChatbot() {
  const { messages, isChatLoading, fetchChatHistory, sendMessage, clearChat } = useStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isChatLoading) return;
    setInput('');
    await sendMessage(msg);
    inputRef.current?.focus();
  };

  // Render message content — strip JSON blocks for display
  const renderContent = (content: string) => {
    const cleaned = content.replace(/```json[\s\S]*?```/g, '').trim();
    return cleaned;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <RiRobotLine className="text-indigo-400" />
            AI Assistant
          </h2>
          <p className="text-gray-400 text-sm mt-0.5">Powered by Groq · Llama 3 · Ask anything</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="btn-ghost text-sm flex items-center gap-1.5 text-gray-500 hover:text-red-400"
          >
            <RiDeleteBinLine /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="w-16 h-16 bg-indigo-600/20 rounded-full flex items-center justify-center mb-4">
              <RiSparklingLine className="text-3xl text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">How can I help you today?</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              I can help with task management, productivity tips, planning, and more.
            </p>
            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                  className="text-xs text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl px-3 py-2 text-left transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} renderContent={renderContent} />
          ))}
        </AnimatePresence>

        {/* Loading indicator */}
        {isChatLoading && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 items-start"
          >
            <div className="w-8 h-8 bg-indigo-600/20 rounded-full flex items-center justify-center shrink-0">
              <RiRobotLine className="text-indigo-400 text-sm" />
            </div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-3 items-end">
        <input
          ref={inputRef}
          className="input flex-1"
          placeholder="Ask anything... or say 'Create a task to...'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isChatLoading}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleSend}
          disabled={!input.trim() || isChatLoading}
          className="btn-primary p-3 aspect-square rounded-xl shrink-0"
          aria-label="Send message"
        >
          <RiSendPlaneLine className="text-xl" />
        </motion.button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  renderContent,
}: {
  message: ChatMessage;
  renderContent: (content: string) => string;
}) {
  const isUser = message.role === 'user';
  const content = isUser ? message.content : renderContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm ${
          isUser ? 'bg-indigo-600' : 'bg-gray-700'
        }`}
      >
        {isUser ? <RiUserLine className="text-white" /> : <RiRobotLine className="text-indigo-400" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-indigo-600 text-white rounded-tr-sm'
            : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
        }`}
      >
        {content}
      </div>
    </motion.div>
  );
}
