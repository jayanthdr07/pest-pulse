import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Volume2,
  ChevronDown,
  Languages,
  HelpCircle,
  Cpu,
  Sprout
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  source?: string;
}

export const FloatingChatbot: React.FC = () => {
  const { selectedField, language, t } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [chatLang, setChatLang] = useState<'en' | 'kn'>(language === 'kn' ? 'kn' : 'en');
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: chatLang === 'kn'
        ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ PestPulse AI ಡಿಜಿಟಲ್ ಕೃಷಿ ತಜ್ಞ. ಕೀಟ ನಿಯಂತ್ರಣ, ರಸಗೊಬ್ಬರ ಪ್ರಮಾಣ, ರೋಗಗಳು ಅಥವಾ ESP32 ಕ್ಯಾಮೆರಾ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.'
        : 'Hello! I am PestPulse AI, your digital agronomist. Ask me anything about pest control, fertilizer dosages, crop diseases, or your 1-min ESP32 trap setup.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'PestPulse AI Engine'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = chatLang === 'kn' ? [
    'ಬಿಳಿ ನೊಣ ನಿಯಂತ್ರಣ ಹೇಗೆ?',
    'ಟೊಮ್ಯಾಟೊ ಕಾಯಿ ಕೊರೆಯುವ ಹುಳು ಔಷಧ?',
    'ESP32 ಕ್ಯಾಮೆರಾ 1 ನಿಮಿಷ ಸೆಟ್ಟಿಂಗ್ ಹೇಗೆ?',
    '1 ಎಕರೆಗೆ 19-19-19 ಪ್ರಮಾಣ ಎಷ್ಟು?'
  ] : [
    'How to control whiteflies?',
    'Spray dosage for fruit borer',
    'How does 1-min ESP32 camera work?',
    'Fertilizer schedule for Tomato'
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(text, chatLang, selectedField?.field_id || 'field_001');
      if (res.ok && res.reply) {
        const botMsg: ChatMessage = {
          id: String(Date.now() + 1),
          sender: 'bot',
          text: res.reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.source || 'PestPulse AI'
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        throw new Error(res.error || 'Failed to get answer');
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      const errMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'bot',
        text: chatLang === 'kn'
          ? 'ಕ್ಷಮಿಸಿ, ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.'
          : 'I encountered an issue connecting to the agronomic server. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#•]/g, '');
      const u = new SpeechSynthesisUtterance(cleanText);
      u.lang = chatLang === 'kn' ? 'kn-IN' : 'en-IN';
      u.rate = 1.0;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-600 hover:from-purple-800 hover:to-emerald-700 text-white px-4 py-3.5 rounded-full shadow-2xl hover:shadow-purple-900/40 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/20"
          aria-label="Open PestPulse AI Chatbot"
        >
          <div className="relative">
            <Bot className="w-6 h-6 text-white animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-purple-950 animate-ping" />
          </div>
          <span className="font-extrabold text-sm tracking-wide hidden sm:inline">
            {chatLang === 'kn' ? 'ಕೀಟ AI ಸಹಾಯಕ' : 'Ask PestPulse AI'}
          </span>
          <span className="bg-white/20 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full backdrop-blur-xs font-bold">
            Live 24/7
          </span>
        </button>
      )}

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div className="w-[360px] sm:w-[410px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-900 via-stone-900 to-emerald-950 p-4 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-600/40 border border-purple-400/30 flex items-center justify-center">
                <Bot className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <span>PestPulse Agronomy AI</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-[11px] text-stone-300 flex items-center gap-1">
                  <span>{selectedField?.crop_type || 'Tomato'} Specialist</span>
                  <span>•</span>
                  <span>1-Min Trap Synced</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Language Switcher */}
              <button
                onClick={() => setChatLang(chatLang === 'en' ? 'kn' : 'en')}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold transition flex items-center gap-1"
                title="Switch Language"
              >
                <Languages className="w-3.5 h-3.5 text-purple-300" />
                <span>{chatLang === 'en' ? 'ಕನ್ನಡ' : 'English'}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-stone-50/70 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 shadow-xs whitespace-pre-line leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-purple-700 text-white rounded-br-xs'
                      : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                  }`}
                >
                  <div>{m.text}</div>
                  <div className="flex items-center justify-between gap-3 mt-1.5 text-[10px] opacity-70">
                    <span>{m.time}</span>
                    {m.sender === 'bot' && (
                      <button
                        onClick={() => handleSpeak(m.text)}
                        className="hover:opacity-100 p-0.5 text-purple-600 transition"
                        title="Read Aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-stone-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center text-stone-500 text-xs italic">
                <div className="w-7 h-7 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-white rounded-2xl border border-stone-200 flex items-center gap-2 shadow-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  <span>Consulting ICAR-IIHR crop knowledge & AI model...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-stone-100/90 border-t border-stone-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-stone-200 text-[11px] font-semibold text-stone-700 transition cursor-pointer shadow-2xs shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={chatLang === 'kn' ? 'ಕೃಷಿ, ಕೀಟ, ರಸಗೊಬ್ಬರ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ...' : 'Ask about pests, spray dose, ESP32...'}
              className="flex-1 py-2.5 px-3.5 text-xs bg-stone-100/80 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:bg-white transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white transition shadow-md cursor-pointer"
              aria-label="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
