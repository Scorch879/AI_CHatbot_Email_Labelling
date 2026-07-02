import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, FileText, UserCheck } from 'lucide-react';

let msgIdCounter = 10;
const getNowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatbotAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hello Linda! I am your Lifewood AI Automation Assistant. I am monitoring your HR internal mail and applicant pipelines in real time. How can I assist you today?",
      time: 'Just now'
    }
  ]);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend) => {
    const content = typeof textToSend === 'string' ? textToSend : input;
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMsg = {
      id: ++msgIdCounter,
      sender: 'user',
      text: trimmed,
      time: getNowTime()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (content === input) setInput('');

    // Simulate intelligent AI response
    setTimeout(() => {
      let replyText = "I have logged your request and cross-referenced it with the Lifewood HR database. All candidate records and email classifications are up to date.";
      const lower = trimmed.toLowerCase();

      if (lower.includes('summarize') || lower.includes('email') || lower.includes('mail') || lower.includes('urgent')) {
        replyText = "Summary of Urgent Mails: You have 2 urgent messages. Sarah Chen requested Q4 hiring target shortlists by EOD Thursday, and Miguel Torres reported an AI labeling accuracy increase to 96.4%.";
      } else if (lower.includes('hire') || lower.includes('q4') || lower.includes('target') || lower.includes('progress')) {
        replyText = "Q4 Hiring Status: Currently targeting 15 additional positions (3 Data Analyst Interns, 2 Senior Software Engineers, 2 Business Analysts, and 1 DevOps Lead). Screening scores average 88%.";
      } else if (lower.includes('report') || lower.includes('export') || lower.includes('analytics')) {
        replyText = "Acceptance Analytics are currently showing a 42% acceptance rate for interns and regular employees. An Excel summary report has been compiled for your weekly board review.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: ++msgIdCounter,
          sender: 'ai',
          text: replyText,
          time: getNowTime()
        }
      ]);
    }, 700);
  };

  const quickActions = [
    { label: 'Summarize urgent emails', icon: Sparkles },
    { label: 'Check Q4 hiring progress', icon: UserCheck },
    { label: 'Export analytics report', icon: FileText },
  ];

  return (
    <>
      {/* Floating Chat Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        title="AI Support & Automation Assistant"
        className="fixed bottom-6 right-6 grid size-12 place-items-center rounded-full bg-[#046241] hover:bg-[#133020] text-white shadow-2xl transition-all hover:scale-110 border-2 border-[#FFC370]/60 z-50 cursor-pointer" 
        type="button"
      >
        {isOpen ? <X size={24} /> : <Bot size={24} className="text-[#FFC370]" />}
      </button>

      {/* Chatbot Window Modal */}
      {isOpen && (
        <div className="fixed bottom-22 right-6 w-96 max-w-[calc(100vw-3rem)] rounded-2xl bg-white dark:bg-[#133020] border border-gray-200 dark:border-white/15 shadow-2xl z-50 flex flex-col h-[500px] max-h-[80vh] overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-[#046241] px-4 py-3.5 flex items-center justify-between text-white border-b border-[#FFC370]/30 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#133020] text-[#FFC370]">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-wide flex items-center gap-2">
                  <span>LIFEMAIL AI</span>
                  <span className="text-[9px] bg-[#FFC370] text-[#133020] px-1.5 py-0.5 rounded font-extrabold uppercase">Online</span>
                </h3>
                <p className="text-[11px] text-white/80 font-medium">HR Automation & Screening Engine</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              type="button"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F9F7F7] dark:bg-[#08170d]">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-medium leading-5 shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#046241] text-white rounded-br-xs'
                      : 'bg-white dark:bg-[#133020] text-[#133020] dark:text-white border border-gray-200 dark:border-white/10 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[9px] font-bold text-gray-400 dark:text-white/40 mt-1 px-1">
                  {msg.time}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Chips */}
          <div className="px-3 py-2 bg-white dark:bg-[#133020] border-t border-gray-100 dark:border-white/10 flex gap-1.5 overflow-x-auto shrink-0">
            {quickActions.map((qa, i) => {
              const Icon = qa.icon;
              return (
                <button
                  key={i}
                  onClick={() => handleSend(qa.label)}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f5eedb] dark:bg-white/10 px-3 py-1 text-[11px] font-bold text-[#133020] dark:text-white hover:bg-[#046241] hover:text-white dark:hover:bg-[#FFC370] dark:hover:text-[#133020] transition cursor-pointer shrink-0"
                  type="button"
                >
                  <Icon size={12} className="text-[#046241] dark:text-[#FFC370] group-hover:text-current" />
                  <span>{qa.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white dark:bg-[#133020] border-t border-gray-100 dark:border-white/10 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Lifemail AI anything..."
              className="flex-1 rounded-xl bg-[#F9F7F7] dark:bg-[#08170d] px-3.5 py-2 text-xs text-[#133020] dark:text-white border border-gray-200 dark:border-white/10 outline-none focus:border-[#046241] dark:focus:border-[#FFC370]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className={`size-9 rounded-xl flex items-center justify-center text-white transition cursor-pointer shrink-0 ${
                input.trim() ? 'bg-[#046241] hover:bg-[#133020]' : 'bg-gray-300 dark:bg-white/20 opacity-50 cursor-not-allowed'
              }`}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
