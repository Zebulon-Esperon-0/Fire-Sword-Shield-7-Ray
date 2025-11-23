import React, { useState, useRef, useEffect } from 'react';
import { 
    Bot, Mic, Image as ImageIcon, Film, Send, X, Minimize2, 
    Sparkles, Loader2, MapPin, Search, Brain, Volume2, FileAudio, Play 
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import * as GeminiService from '../services/geminiService';

export default function FloatingAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<'chat' | 'live' | 'image' | 'video'>('chat');
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedAudio, setUploadedAudio] = useState<string | null>(null);
    
    // Config State
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [imageSize, setImageSize] = useState('1K');
    const [thinkingMode, setThinkingMode] = useState(false);
    const [useGrounding, setUseGrounding] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);

    // Refs
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    
    // Live API State
    const [isLiveConnected, setIsLiveConnected] = useState(false);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const liveSessionRef = useRef<any>(null); 
    const [liveVolume, setLiveVolume] = useState(0);
    
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    // --- HANDLERS ---

    const handleSendMessage = async () => {
        if (!input.trim() && !uploadedImage && !uploadedAudio) return;
        
        const userMsg = { role: 'user', content: input, image: uploadedImage };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            if (mode === 'image') {
                // Image Generation
                const images = await GeminiService.generateImage(userMsg.content, imageSize, aspectRatio);
                setMessages(prev => [...prev, { role: 'ai', type: 'image', content: images }]);
            } else if (mode === 'video') {
                // Veo Generation
                let videoUrl;
                if (uploadedImage) {
                     videoUrl = await GeminiService.generateVeoVideo(userMsg.content, aspectRatio, uploadedImage.split(',')[1]);
                } else {
                     videoUrl = await GeminiService.generateVeoVideo(userMsg.content, aspectRatio);
                }
                
                if (videoUrl) {
                    setMessages(prev => [...prev, { role: 'ai', type: 'video', content: videoUrl }]);
                } else {
                    setMessages(prev => [...prev, { role: 'ai', content: "Failed to generate video. Please try again." }]);
                }
            } else {
                // Chat / Analysis / Editing
                
                // 1. Transcribe Audio if present
                let prompt = userMsg.content;
                if (uploadedAudio) {
                    const transcription = await GeminiService.transcribeAudio(uploadedAudio.split(',')[1]);
                    prompt = prompt ? `${prompt}\n\nAudio Context: ${transcription}` : `Audio Transcription: ${transcription}`;
                }

                // 2. Image Editing check
                if (uploadedImage && (prompt.toLowerCase().includes('edit') || prompt.toLowerCase().includes('change') || prompt.toLowerCase().includes('remove'))) {
                    const edited = await GeminiService.editImage(prompt, uploadedImage.split(',')[1]);
                    if (edited) {
                        setMessages(prev => [...prev, { role: 'ai', type: 'image', content: [edited] }]);
                        setLoading(false);
                        setUploadedImage(null);
                        setUploadedAudio(null);
                        return;
                    }
                }

                // 3. General Generation
                const mediaParts = [];
                if (uploadedImage) {
                    mediaParts.push({ inlineData: { mimeType: 'image/png', data: uploadedImage.split(',')[1] } });
                }

                const tools = [];
                if (useSearch) tools.push('search');
                if (useMaps) tools.push('maps');

                const responseText = await GeminiService.generateAIResponse(
                    prompt, 
                    messages.map(m => typeof m.content === 'string' ? m.content : '').filter(Boolean), 
                    mediaParts,
                    {
                        mode: thinkingMode ? 'think' : (useGrounding || tools.length > 0) ? 'grounding' : 'fast',
                        tools: tools as any
                    }
                );
                
                setMessages(prev => [...prev, { role: 'ai', content: responseText }]);
                
                if (ttsEnabled) {
                    const audioData = await GeminiService.generateSpeech(responseText.substring(0, 200)); // Limit TTS for demo
                    if (audioData) {
                        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const buffer = await ctx.decodeAudioData(audioData);
                        const source = ctx.createBufferSource();
                        source.buffer = buffer;
                        source.connect(ctx.destination);
                        source.start();
                    }
                }
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', content: "An error occurred processing your request." }]);
        } finally {
            setLoading(false);
            setUploadedImage(null);
            setUploadedAudio(null);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                // Switch mode hint
                if (mode === 'chat' && !uploadedImage) {
                    // Don't force switch, just let them know they can analyze
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
         const file = e.target.files?.[0];
         if (file) {
             const reader = new FileReader();
             reader.onloadend = () => {
                 setUploadedAudio(reader.result as string);
             };
             reader.readAsDataURL(file);
         }
    }

    const toggleLive = async () => {
        if (isLiveConnected) {
            // Disconnect
            liveSessionRef.current?.close();
            setIsLiveConnected(false);
            audioContext?.close();
            setAudioContext(null);
            setMessages(prev => [...prev, { role: 'ai', content: "Live session ended." }]);
        } else {
            // Connect
            try {
                setMode('live');
                setIsLiveConnected(true);
                
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                setAudioContext(ctx);

                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                
                // Basic Audio IO Setup
                const inputCtx = new AudioContext({ sampleRate: 16000 });
                const source = inputCtx.createMediaStreamSource(stream);
                const processor = inputCtx.createScriptProcessor(4096, 1, 1);
                
                // Volume visualizer
                const analyser = inputCtx.createAnalyser();
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const updateVolume = () => {
                    if (!isLiveConnected) return;
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a,b) => a+b) / dataArray.length;
                    setLiveVolume(avg);
                    requestAnimationFrame(updateVolume);
                };
                updateVolume();
                
                const sessionPromise = ai.live.connect({
                    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                    config: {
                        responseModalities: [Modality.AUDIO],
                        systemInstruction: "You are a helpful assistant."
                    },
                    callbacks: {
                        onopen: () => {
                            setMessages(prev => [...prev, { role: 'ai', content: "Live Voice Connected. Speak naturally." }]);
                            processor.onaudioprocess = (e) => {
                                const inputData = e.inputBuffer.getChannelData(0);
                                const b64 = btoa(String.fromCharCode(...new Uint8Array(new Int16Array(inputData.map(n => n * 32768)).buffer)));
                                sessionPromise.then(session => session.sendRealtimeInput({
                                    media: { mimeType: 'audio/pcm;rate=16000', data: b64 }
                                }));
                            };
                            source.connect(processor);
                            processor.connect(inputCtx.destination);
                        },
                        onmessage: async (msg: LiveServerMessage) => {
                           const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                           if (audioData && ctx) {
                               const binary = atob(audioData);
                               const bytes = new Uint8Array(binary.length).map((_, i) => binary.charCodeAt(i));
                               const buffer = await ctx.decodeAudioData(bytes.buffer.slice(0) as ArrayBuffer);
                               const src = ctx.createBufferSource();
                               src.buffer = buffer;
                               src.connect(ctx.destination);
                               src.start();
                           }
                        },
                        onclose: () => setIsLiveConnected(false),
                        onerror: (e) => console.error(e)
                    }
                });
                liveSessionRef.current = { close: () => { stream.getTracks().forEach(t => t.stop()); sessionPromise.then(s => s.close()); } }; 

            } catch (e) {
                console.error(e);
                setIsLiveConnected(false);
                setMessages(prev => [...prev, { role: 'ai', content: "Failed to connect to Live API." }]);
            }
        }
    };

    // --- RENDER ---

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 w-20 h-14 rounded-full bg-gradient-to-r from-brand-blue to-brand-gold shadow-[0_0_20px_rgba(251,191,36,0.4)] flex items-center justify-center hover:scale-105 transition-all z-50 group border-2 border-white/20 animate-bounce"
            >
                <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                <span className="ml-2 font-bold text-white text-xs">AI</span>
            </button>
        );
    }

    return (
        <div className="fixed inset-0 md:inset-auto md:bottom-8 md:right-8 md:w-[500px] md:h-[750px] bg-brand-dark/95 backdrop-blur-xl border border-brand-gold/20 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-blue via-brand-dark to-brand-dark border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-gold rounded-full shadow-lg shadow-brand-gold/20">
                        <Bot className="w-5 h-5 text-brand-dark" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Gemini Assistant</h3>
                        <div className="flex items-center gap-1 text-[10px] text-brand-green uppercase tracking-wider">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75 ${loading ? 'animate-ping' : ''}`}></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-green"></span>
                            </span>
                            {isLiveConnected ? 'Live Voice Active' : 'System Online'}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                        <Minimize2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Live Visualizer Banner */}
            {isLiveConnected && (
                <div className="bg-brand-red/10 border-b border-brand-red/20 p-2 flex justify-center items-center gap-1 h-8">
                     {[1,2,3,4,5,6,7,8].map(i => (
                         <div 
                            key={i} 
                            className="w-1 bg-brand-red rounded-full transition-all duration-75"
                            style={{ height: `${Math.max(4, Math.min(24, liveVolume / (i % 2 === 0 ? 2 : 1) ))}px` }}
                         />
                     ))}
                </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-blue/5 to-transparent" ref={scrollRef}>
                {messages.length === 0 && (
                    <div className="text-center mt-24 space-y-6 px-8">
                        <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto border border-brand-blue/20">
                            <Sparkles className="w-10 h-10 text-brand-blue" />
                        </div>
                        <h2 className="text-xl font-bold text-white">How can I help?</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            I can generate art, create videos, analyze files, edit images, or just chat.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setMode('image')} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-gold/30 transition-all text-sm text-slate-300 flex flex-col items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-brand-gold" /> Generate Image
                            </button>
                            <button onClick={() => setMode('video')} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-blue/30 transition-all text-sm text-slate-300 flex flex-col items-center gap-2">
                                <Film className="w-5 h-5 text-brand-blue" /> Create Video
                            </button>
                            <button onClick={toggleLive} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-red/30 transition-all text-sm text-slate-300 flex flex-col items-center gap-2">
                                <Mic className="w-5 h-5 text-brand-red" /> Live Voice
                            </button>
                            <button onClick={() => { setMode('chat'); setThinkingMode(true); }} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-green/30 transition-all text-sm text-slate-300 flex flex-col items-center gap-2">
                                <Brain className="w-5 h-5 text-brand-green" /> Deep Think
                            </button>
                        </div>
                    </div>
                )}
                
                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                            msg.role === 'user' 
                            ? 'bg-brand-blue text-white rounded-tr-none' 
                            : 'bg-white/10 text-slate-200 rounded-tl-none border border-white/5 backdrop-blur-md'
                        }`}>
                            {msg.image && (
                                <img src={msg.image} className="w-full h-32 object-cover rounded-lg mb-3 border border-white/10" />
                            )}
                            
                            {msg.type === 'image' ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400 mb-2">Generated with Nano Banana Pro</p>
                                    {msg.content.map((img: string, idx: number) => (
                                        <div key={idx} className="relative group">
                                            <img src={img} className="rounded-lg w-full shadow-lg" />
                                            <a href={img} download={`gemini_gen_${idx}.png`} className="absolute top-2 right-2 bg-black/60 p-1.5 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Minimize2 className="w-4 h-4 rotate-180" /> {/* Using as download icon proxy */}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : msg.type === 'video' ? (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-400 mb-2">Generated with Veo</p>
                                    <video src={msg.content} controls className="w-full rounded-lg shadow-lg border border-white/10" autoPlay loop muted />
                                </div>
                            ) : (
                                <div className="whitespace-pre-wrap text-sm leading-relaxed markdown-body">
                                    {msg.content}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-3 border border-white/5">
                            <Loader2 className="w-4 h-4 animate-spin text-brand-gold" />
                            <span className="text-sm text-slate-400 animate-pulse">Processing request...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-brand-dark/80 backdrop-blur-md border-t border-white/5 space-y-3">
                
                {/* Tools / Config Row */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <div className="flex items-center gap-2">
                        {mode === 'chat' && (
                            <>
                                <button 
                                    onClick={() => setThinkingMode(!thinkingMode)}
                                    className={`px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border transition-all flex items-center gap-1 ${thinkingMode ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'border-white/10 text-slate-500 hover:border-slate-400'}`}
                                >
                                    <Brain className="w-3 h-3" /> Think
                                </button>
                                <button 
                                    onClick={() => setUseSearch(!useSearch)}
                                    className={`px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border transition-all flex items-center gap-1 ${useSearch ? 'bg-brand-blue/20 border-brand-blue text-brand-blue' : 'border-white/10 text-slate-500 hover:border-slate-400'}`}
                                >
                                    <Search className="w-3 h-3" /> Search
                                </button>
                                <button 
                                    onClick={() => setUseMaps(!useMaps)}
                                    className={`px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border transition-all flex items-center gap-1 ${useMaps ? 'bg-brand-red/20 border-brand-red text-brand-red' : 'border-white/10 text-slate-500 hover:border-slate-400'}`}
                                >
                                    <MapPin className="w-3 h-3" /> Maps
                                </button>
                                <button 
                                    onClick={() => setTtsEnabled(!ttsEnabled)}
                                    className={`px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold border transition-all flex items-center gap-1 ${ttsEnabled ? 'bg-brand-gold/20 border-brand-gold text-brand-gold' : 'border-white/10 text-slate-500 hover:border-slate-400'}`}
                                >
                                    <Volume2 className="w-3 h-3" /> Speak
                                </button>
                            </>
                        )}
                        {(mode === 'video' || mode === 'image') && (
                             <select 
                                value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}
                                className="bg-white/5 border border-white/10 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-brand-blue"
                            >
                                <option value="16:9">16:9</option>
                                <option value="9:16">9:16</option>
                                <option value="1:1">1:1</option>
                                <option value="4:3">4:3</option>
                                <option value="3:4">3:4</option>
                                <option value="2:3">2:3</option>
                                <option value="3:2">3:2</option>
                                <option value="21:9">21:9</option>
                            </select>
                        )}
                        {mode === 'image' && (
                            <select 
                                value={imageSize} onChange={(e) => setImageSize(e.target.value)}
                                className="bg-white/5 border border-white/10 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-brand-blue"
                            >
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                            </select>
                        )}
                    </div>

                    {/* Mode Switcher */}
                    <div className="flex bg-white/5 rounded-lg p-1 border border-white/5">
                        <button title="Chat" onClick={() => setMode('chat')} className={`p-1.5 rounded-md transition-all ${mode === 'chat' ? 'bg-brand-blue text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Bot className="w-3 h-3"/></button>
                        <button title="Image" onClick={() => setMode('image')} className={`p-1.5 rounded-md transition-all ${mode === 'image' ? 'bg-brand-gold text-black shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><ImageIcon className="w-3 h-3"/></button>
                        <button title="Video" onClick={() => setMode('video')} className={`p-1.5 rounded-md transition-all ${mode === 'video' ? 'bg-brand-red text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}><Film className="w-3 h-3"/></button>
                    </div>
                </div>

                {/* Main Input Bar */}
                <div className="flex items-end gap-2 relative">
                    {/* Attachments */}
                    <div className="flex flex-col gap-2 pb-1">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className={`p-2.5 rounded-xl border transition-colors ${uploadedImage ? 'bg-brand-green/20 border-brand-green text-brand-green' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                            <ImageIcon className="w-4 h-4" />
                        </button>
                        <button 
                             onClick={() => audioInputRef.current?.click()}
                             className={`p-2.5 rounded-xl border transition-colors ${uploadedAudio ? 'bg-brand-gold/20 border-brand-gold text-brand-gold' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                             <FileAudio className="w-4 h-4" />
                        </button>
                    </div>

                    <input 
                        type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload}
                    />
                     <input 
                        type="file" ref={audioInputRef} className="hidden" accept="audio/*" onChange={handleAudioUpload}
                    />
                    
                    <div className="flex-1 relative">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={
                                mode === 'video' ? "Describe the video to generate..." : 
                                mode === 'image' ? "Describe the image to generate..." : 
                                uploadedImage ? "Ask about or edit this image..." :
                                "Ask anything..."
                            }
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue/50 resize-none custom-scrollbar"
                            rows={input.length > 60 ? 2 : 1}
                            style={{ minHeight: '46px' }}
                        />
                        
                        {/* Upload Indicators */}
                        <div className="absolute -top-10 left-0 flex gap-2">
                            {uploadedImage && (
                                <div className="h-8 px-2 rounded-lg bg-brand-dark border border-brand-green flex items-center gap-2 text-xs text-brand-green shadow-lg">
                                    <ImageIcon className="w-3 h-3" /> Image attached 
                                    <button onClick={() => setUploadedImage(null)}><X className="w-3 h-3 hover:text-white" /></button>
                                </div>
                            )}
                            {uploadedAudio && (
                                <div className="h-8 px-2 rounded-lg bg-brand-dark border border-brand-gold flex items-center gap-2 text-xs text-brand-gold shadow-lg">
                                    <FileAudio className="w-3 h-3" /> Audio attached 
                                    <button onClick={() => setUploadedAudio(null)}><X className="w-3 h-3 hover:text-white" /></button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 pb-1">
                         <button 
                            onClick={toggleLive}
                            className={`p-2.5 rounded-xl transition-colors ${isLiveConnected ? 'bg-brand-red text-white animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white'}`}
                            title="Live Voice Mode"
                        >
                            <Mic className="w-4 h-4" />
                        </button>
                        
                        <button 
                            onClick={handleSendMessage}
                            disabled={loading || (!input.trim() && !uploadedImage && !uploadedAudio)}
                            className="p-2.5 rounded-xl bg-brand-blue text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-blue/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
                <div className="text-[10px] text-slate-600 text-center">
                    Gemini 2.5 & 3.0 Models • Veo 3.1 • Live API
                </div>
            </div>
        </div>
    );
}