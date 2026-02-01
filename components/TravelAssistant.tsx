import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithTravelAssistant } from '../services/geminiService';

interface TravelAssistantProps {
    start: string;
    destination: string;
    activeRouteId?: string;
}

const TravelAssistant: React.FC<TravelAssistantProps> = ({ start, destination, activeRouteId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', text: 'Hi! I\'m Navi. Ask me about weather, food, or travel tips for your trip!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Add a temporary thinking bubble
        const thinkingMsgId = Date.now();
        setMessages(prev => [...prev, { role: 'model', text: '', isThinking: true }]);

        try {
            const response = await chatWithTravelAssistant(
                messages, 
                userMsg.text, 
                { start, destination, selectedRoute: activeRouteId }
            );
            
            setMessages(prev => prev.map(msg => {
                if (msg.isThinking) {
                    return { role: 'model', text: response.text, sources: response.sources };
                }
                return msg;
            }));
        } catch (err) {
             setMessages(prev => prev.filter(msg => !msg.isThinking));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 animate-bounce-slow"
                    aria-label="Open Travel Assistant"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                    </svg>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-96 h-[500px] bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden transform transition-all animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center text-white">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <h3 className="font-bold text-lg">Navi Co-Pilot</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                    msg.role === 'user' 
                                    ? 'bg-blue-600 text-white rounded-br-none' 
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700'
                                }`}>
                                    {msg.isThinking ? (
                                        <div className="flex space-x-1 h-4 items-center">
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="whitespace-pre-wrap">{msg.text}</p>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-black/10 dark:border-white/10 text-xs">
                                                    <p className="opacity-70 mb-1">Sources:</p>
                                                    <ul className="space-y-1">
                                                        {msg.sources.map((source, i) => (
                                                            <li key={i}>
                                                                <a href={source.uri} target="_blank" rel="noreferrer" className="text-blue-500 dark:text-blue-300 hover:underline truncate block">
                                                                    {source.title}
                                                                </a>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about your trip..."
                            className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim() || isLoading}
                            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                            </svg>
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default TravelAssistant;