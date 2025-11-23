import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, RefreshCcw } from 'lucide-react';
import { generateAIStream } from '../services/geminiService';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isTyping?: boolean;
}

export default function AIAssistant() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
        id: 'welcome', 
        role: 'ai', 
        content: 'Greetings, adventurer. I am the Oracle. What wisdom do you seek?' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Create placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'ai', content: '', isTyping: true }]);

    let fullText = "";

    await generateAIStream(userMessage.content, (chunk) => {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: fullText, isTyping: false } : msg
        ));
    });
    
    setIsLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-brand-blue to-blue-800 shadow-lg">
            <Bot className="w-8 h-8 text-white" />
        </div>
        <div>
            <h1 className="text-2xl font-bold text-white">The Oracle</h1>
            <p className="text-slate-400 text-sm">Powered by Gemini</p>
        </div>
      </div>

      <div className="flex-1 bg-brand-dark/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col glass-effect shadow-2xl">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
                <div 
                    key={msg.id} 
                    className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                        msg.role === 'ai' 
                        ? 'bg-brand-blue/20 border-brand-blue/30 text-brand-blue' 
                        : 'bg-white/10 border-white/10 text-slate-200'
                    }`}>
                        {msg.role === 'ai' ? <Sparkles className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    
                    <div className={`max-w-[80%] p-4 rounded-2xl leading-relaxed text-sm md:text-base ${
                        msg.role === 'ai'
                        ? 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                        : 'bg-brand-blue text-white rounded-tr-none shadow-lg shadow-blue-900/20'
                    }`}>
                        {msg.content}
                        {msg.isTyping && (
                            <span className="inline-block w-2 h-4 ml-1 align-middle bg-brand-gold animate-pulse"/>
                        )}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <form onSubmit={handleSend} className="relative">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={isLoading}
                    placeholder="Ask the Oracle..."
                    className="w-full bg-brand-dark text-slate-200 pl-4 pr-12 py-4 rounded-xl border border-white/10 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold placeholder:text-slate-600 disabled:opacity-50"
                />
                <button 
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-3 top-3 p-2 bg-brand-gold text-black rounded-lg hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isLoading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
}