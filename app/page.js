"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  Menu, 
  Plus, 
  FileText, 
  MoreVertical, 
  X
} from 'lucide-react';

export default function NutritionLM() {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      role: 'ai', 
      text: "Hello! I'm NutritionLM. I've analyzed your uploaded dietary guidelines and meal plans. How can I help you eat better today?" 
    }
  ]);
  const [input, setInput] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef(null);

  const sources = [
    { id: 1, title: 'My Diet Plan (Nov).docx', type: 'DOC', color: 'bg-blue-100 text-blue-700' },
    { id: 2, title: 'Vitamin D Research', type: 'TXT', color: 'bg-green-100 text-green-700' },
    { id: 3, title: 'My Allergies List', type: 'PDF', color: 'bg-purple-100 text-purple-700' },
  ];

  const suggestedPrompts = [
    "Summarize my diet plan",
    "Create a grocery list based on my allergies"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // Add User Message
    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    // AI Mock Response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { 
          id: Date.now() + 1, 
          role: 'ai', 
          text: `No connected model yet.` 
        }
      ]);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-[#F0F2F5] font-sans text-gray-800 overflow-hidden">
      
      {/* LEFT SIDEBAR */}
      <div 
        className={`${isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'} 
        transition-all duration-300 ease-in-out border-r border-gray-200 bg-white flex flex-col shrink-0`}
      >
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
            <Sparkles className="w-6 h-6 fill-current" />
            <span>NutritionLM</span>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sources ({sources.length})</h2>
            <button className="text-gray-400 hover:text-indigo-600">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Upload New Source Card */}
            <div className="border border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                <Plus className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-600">Add source</span>
              <span className="text-xs text-gray-400">PDF, TXT, MD, Audio</span>
            </div>

            {/* Source Cards */}
            {sources.map((source) => (
              <div key={source.id} className="group relative bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${source.color}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{source.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{source.type} • Added today</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* User Profile */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
              CB
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">Cool Beans</div>
              <div className="text-xs text-gray-400">Pro Plan</div>
            </div>
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-white/50">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <div className="text-sm font-medium text-gray-500">
            {sources.length} sources selected
          </div>
          
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">
            <MoreVertical className="w-5 h-5" />
          </button>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
                  ${msg.role === 'ai' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <span className="text-xs font-bold">You</span>}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`text-sm leading-relaxed whitespace-pre-wrap py-2 px-4 rounded-2xl
                    ${msg.role === 'user' 
                      ? 'bg-gray-100 text-gray-900 rounded-tr-none' 
                      : 'bg-transparent text-gray-800 -ml-2'
                    }`}>
                    {msg.text}
                  </div>
                  
                  {/* TODO: Citations */}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 pb-8">
          <div className="max-w-3xl mx-auto">
            
            {/* Suggested Chips */}
            {messages.length < 3 && (
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {suggestedPrompts.map((prompt, i) => (
                  <button 
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="whitespace-nowrap px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors shadow-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className="relative bg-white rounded-[2rem] shadow-lg border border-gray-200">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask NutritionLM specifically about your sources..."
                className="w-full bg-transparent border-none focus:ring-0 outline-none p-4 pl-6 pr-24 min-h-[60px] max-h-40 resize-none text-gray-700 placeholder:text-gray-400"
                rows={1}
              />
              
              <div className="absolute right-3 bottom-2.5 flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`p-2 rounded-full transition-all duration-200 
                    ${input.trim() 
                      ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' 
                      : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              NutritionLM may produce inaccurate information about health. Verify with a professional.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}