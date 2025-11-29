"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Sparkles, 
  MoreVertical, 
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
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Summarize the macros in my Keto plan",
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
      
      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col relative bg-white/50">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="text-sm font-medium text-gray-500">
            NutritionLM
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