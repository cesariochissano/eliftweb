import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, Bot } from 'lucide-react';
import { Button } from './button';
import { useState, useRef, useEffect } from 'react';
import { EliftIntelligence } from '../../lib/elift-intelligence';

interface AIAssistantDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    userRole: 'passenger' | 'driver' | 'fleet';
    contextData?: any;
}

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

export function AIAssistantDrawer({ isOpen, onClose, userRole, contextData }: AIAssistantDrawerProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: `Olá! Sou a Assistente eLift. Como posso ajudar com a sua jornada hoje?`, sender: 'ai', timestamp: new Date() }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        // Simulate AI "thinking" time
        setTimeout(() => {
            const response = EliftIntelligence.processAssistantMessage(userMsg.text, {
                userRole: userRole,
                tripStatus: contextData?.status || 'IDLE',
                ...contextData
            });

            const aiMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: response.text,
                sender: 'ai',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 z-[900] backdrop-blur-[2px]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[1000] flex flex-col h-[85vh] shadow-2xl overflow-hidden border-t-4 border-primary"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center shadow-lg border-2 border-primary">
                                    <Bot size={24} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                        eLift Intelligence
                                        <Sparkles size={14} className="text-primary animate-pulse" />
                                    </h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Módulo de IA Ativo</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                                <X size={24} className="text-gray-400" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[85%] px-5 py-4 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                                        ? 'bg-gray-900 text-white rounded-br-none shadow-md'
                                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200 shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex gap-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-6 pt-4 bg-white flex items-center gap-3 pb-safe border-t border-gray-100">
                            <input
                                type="text"
                                placeholder="Pergunte algo à IA..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                className="flex-1 bg-gray-100 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                            />
                            <Button
                                size="icon"
                                className="w-14 h-14 rounded-2xl bg-black hover:bg-gray-800 transition-all shrink-0 shadow-lg"
                                onClick={handleSendMessage}
                            >
                                <Send size={22} className="text-primary" />
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
