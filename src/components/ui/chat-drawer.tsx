import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, User, Check, CheckCheck, Clock } from 'lucide-react';
import { Button } from './button';
import { useState, useEffect, useRef } from 'react';
import { useTripStore } from '../../stores/useTripStore';
import { EliftIntelligence } from '../../lib/elift-intelligence';

interface ChatDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    receiverName: string;
}

// Removed static QUICK_MESSAGES

export function ChatDrawer({ isOpen, onClose, receiverName }: ChatDrawerProps) {
    const { tripDetails, messages, sendMessage: sendChatMessage, userRole, status, markMessagesAsRead, userId } = useTripStore();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const quickMessages = EliftIntelligence.getQuickMessages(
        status,
        (userRole?.toLowerCase() || 'passenger') as 'passenger' | 'driver'
    );

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-mark as read when chat is open and new messages arrive
    useEffect(() => {
        if (isOpen && tripDetails) {
            markMessagesAsRead(tripDetails.id);
        }
    }, [isOpen, messages.length, tripDetails?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !tripDetails) return;
        setInputValue('');
        await sendChatMessage(tripDetails.id, text);
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
                        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2.5rem] z-[1000] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden"
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center pt-3 pb-1">
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <User size={20} className="text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{receiverName}</h3>
                                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Online</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
                                <X size={20} className="text-gray-400" />
                            </Button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 min-h-[300px]">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, scale: 0.9, x: msg.sender_id === userId ? 20 : -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    className={`flex flex-col ${msg.sender_id === userId ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium shadow-sm relative group ${msg.sender_id === userId
                                        ? 'bg-primary text-black rounded-tr-none'
                                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                        }`}>
                                        {msg.content}

                                        {/* Receipt Icons for sent messages */}
                                        {msg.sender_id === userId && (
                                            <div className="flex justify-end mt-1 gap-1 h-3 items-center">
                                                <span className="text-[9px] opacity-40 mr-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {msg.status === 'sending' && <Clock size={10} className="text-black/30" />}
                                                {msg.status === 'sent' && <Check size={12} className="text-black/40" />}
                                                {msg.status === 'delivered' && <CheckCheck size={12} className="text-black/60" />}
                                                {msg.status === 'read' && <CheckCheck size={12} className="text-[#054a29] font-bold" />}
                                            </div>
                                        )}
                                        {/* Timestamp for received messages */}
                                        {msg.sender_id !== userId && (
                                            <div className="flex justify-start mt-1 h-3 items-center">
                                                <span className="text-[9px] opacity-40">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Messages */}
                        <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-50 bg-white shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                            {quickMessages.map((msg, i) => (
                                <button
                                    key={i}
                                    onClick={() => setInputValue(msg)}
                                    className="whitespace-nowrap px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-xs font-bold transition-all border border-gray-100 active:scale-95"
                                >
                                    {msg}
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-6 pt-3 bg-white flex items-center gap-3 pb-8 md:pb-6">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    placeholder="Escreva uma mensagem..."
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                                    className="w-full bg-gray-100 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                />
                            </div>
                            <Button
                                size="icon"
                                className="w-14 h-14 rounded-2xl bg-black hover:bg-gray-900 text-white transition-all shrink-0 shadow-lg active:scale-90"
                                onClick={() => handleSendMessage(inputValue)}
                            >
                                <Send size={22} />
                            </Button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
