import { useMemo, useState, useRef, useEffect } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Hash,
  Menu,
  Paperclip,
  Search,
  Send,
  Star,
  Trash2,
  X,
  Sparkles,
  CheckCircle2,
  Inbox
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatbotAssistant from "../components/ChatbotAssistant";
import { supabase } from "../supabaseClient";

const logDatabaseError = (action, error) => {
  if (error) {
    console.warn(`${action}:`, error.message || error);
  }
};

const initialMessages = [
  {
    id: "q4-hiring",
    initials: "SC",
    sender: "Sarah Chen",
    role: "Head of Talent Acquisition",
    subject: "Q4 Hiring Targets - Action Required",
    preview: "Following the board meeting, we need to accelerate our Q4 hiring plan...",
    time: "5m",
    badge: "Urgent",
    badgeType: "urgent",
    color: "#a135f0",
    unread: true,
    starred: true,
    body: [
      "Team,",
      "Following the board meeting yesterday, we've been tasked with filling 15 additional positions before the end of Q4. This means accelerating our intern intake by 40% and finalizing 8 senior regular positions.",
      "Priority roles: 3 Data Analyst Interns, 2 Senior Software Engineers, 2 Business Analysts, and 1 DevOps Lead.",
      "I need everyone's updated shortlist by EOD Thursday.",
      "Sarah",
    ],
  },
  {
    id: "pipeline-accuracy",
    initials: "MT",
    sender: "Miguel Torres",
    role: "Automation Lead",
    subject: "AI Pipeline Performance - 96.4% Accuracy",
    preview: "Good news - accuracy rate hit 96.4% this week, up from the last run...",
    time: "1h",
    badge: "Important",
    badgeType: "important",
    color: "#2563eb",
    unread: true,
    starred: false,
    body: [
      "The latest applicant labeling run is stable at 96.4% accuracy.",
      "The biggest gains came from clearer category separation between intern, regular, and pending review applicants.",
      "I recommend keeping the current prompt version active for this week's intake.",
    ],
  },
  {
    id: "interview-schedule",
    initials: "PN",
    sender: "Priya Nair",
    role: "HR Coordinator",
    subject: "Interview Schedule: Week of July 7",
    preview: "Please find attached the confirmed interview schedule for next week...",
    time: "2h",
    badge: "Important",
    badgeType: "important",
    color: "#e90058",
    unread: true,
    starred: false,
    body: [
      "The interview schedule for the week of July 7 is ready for review.",
      "Please check the senior engineer slots first because two candidates requested time changes.",
    ],
  },
  {
    id: "gdpr-policy",
    initials: "DL",
    sender: "David Lim",
    role: "Compliance",
    subject: "GDPR Reminder: Applicant Data Retention Policy",
    preview: "As we approach the 90-day mark for several applications, please review...",
    time: "3h",
    badge: "Follow-up",
    badgeType: "followup",
    color: "#5245e8",
    unread: false,
    starred: false,
    body: [
      "Please review applicants that are near the 90-day retention window.",
      "Archived applicant records should be exported before cleanup if HR still needs historical reporting.",
    ],
  },
  {
    id: "sourcing-results",
    initials: "AR",
    sender: "Amy Reyes",
    role: "Sourcing Specialist",
    subject: "LinkedIn Sourcing Results - July Batch",
    preview: "Reached out to 45 candidates this week. 12 responded, 8 are qualified...",
    time: "5h",
    badge: "Not Important",
    badgeType: "muted",
    color: "#0891b2",
    unread: true,
    starred: false,
    body: [
      "Reached out to 45 candidates this week. 12 responded and 8 are ready for HR screening.",
      "The strongest responses came from data analyst and business analyst profiles.",
    ],
  },
];

const badgeStyles = {
  urgent: "bg-red-500/15 text-red-700 dark:bg-red-500/25 dark:text-red-300 ring-red-500/30 font-black",
  important: "bg-amber-100 text-amber-800 dark:bg-yellow-950/80 dark:text-yellow-300 ring-amber-500/30 font-bold",
  followup: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 ring-blue-500/30 font-bold",
  info: "bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 ring-blue-500/30 font-bold",
  muted: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/60 ring-gray-400/20 font-medium",
  notimportant: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white/60 ring-gray-400/20 font-medium",
};

function Badge({ type, children }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[10px] font-black ring-1 ${badgeStyles[type] || badgeStyles.muted}`}>
      {children}
    </span>
  );
}

export default function InternalMail() {
  const [messagesList, setMessagesList] = useState(initialMessages);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('lifemail_internal_selected_id') || null);
  const [isDetailOpen, setIsDetailOpen] = useState(() => localStorage.getItem('lifemail_internal_detail_open') === 'true');
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  
  // Attempt to load from Supabase database on mount (if table exists)
  useEffect(() => {
    const fetchFromDatabase = async () => {
      try {
        if (!supabase) return;
        const { data, error } = await supabase.from('internal_mail').select('*');
        if (error) {
          logDatabaseError('Internal Mail fetch failed', error);
          return;
        }
        if (!data || data.length === 0) return;

        const mapped = data.map(item => ({
          id: item.id?.toString() || crypto.randomUUID(),
          initials: item.initials || (item.sender ? item.sender.split(' ').map(n=>n[0]).join('') : 'IM'),
          sender: item.sender || item.name || 'Internal Sender',
          role: item.role || item.position || 'Team Member',
          subject: item.subject || item.email_subject || 'No Subject',
          preview: item.preview || (Array.isArray(item.body) ? item.body[0] : (item.body ? item.body.toString().slice(0, 80) : 'No content preview...')),
          time: item.time || (item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'),
          badge: item.badge || (item.badge_type === 'info' ? 'Follow-up' : 'Follow-up'),
          badgeType: item.badge_type || item.badgeType || 'followup',
          color: item.color || '#2563eb',
          unread: item.unread !== undefined ? item.unread : true,
          starred: item.starred !== undefined ? item.starred : false,
          body: Array.isArray(item.body) ? item.body : (item.body ? item.body.toString().split('\n') : ['No message body stored.']),
          replies: Array.isArray(item.replies) ? item.replies : []
        }));
        setMessagesList(mapped);
        setSelectedId(current =>
          current && mapped.some(message => message.id === current)
            ? current
            : null
        );
      } catch (err) {
        logDatabaseError('Using default internal mail dataset', err);
      }
    };
    fetchFromDatabase();
  }, []);

  // Resizing state
  const [listWidth, setListWidth] = useState(() => {
    const saved = localStorage.getItem('lifemail_internal_list_width');
    return saved ? parseInt(saved, 10) : 380;
  });
  const [isResizing, setIsResizing] = useState(false);
  const leftPaneRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (selectedId) {
      localStorage.setItem('lifemail_internal_selected_id', selectedId);
    } else {
      localStorage.removeItem('lifemail_internal_selected_id');
    }
  }, [selectedId]);

  useEffect(() => {
    localStorage.setItem('lifemail_internal_detail_open', isDetailOpen ? 'true' : 'false');
  }, [isDetailOpen]);

  useEffect(() => {
    localStorage.setItem('lifemail_internal_list_width', listWidth);
  }, [listWidth]);

  const startResizing = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = leftPaneRef.current ? leftPaneRef.current.getBoundingClientRect().width : listWidth;

    const container = leftPaneRef.current?.parentElement;
    const containerWidth = container ? container.getBoundingClientRect().width : window.innerWidth - 256;
    const maxAllowedWidth = Math.min(800, Math.max(340, containerWidth - 400));
    const minAllowedWidth = 320;

    const handleMouseMove = (moveEvent) => {
      if (!isResizingRef.current) return;
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.min(Math.max(startWidth + deltaX, minAllowedWidth), maxAllowedWidth);
      setListWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  
  // Toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3500);
  };

  const filteredMessages = useMemo(() => {
    return messagesList.filter((msg) => {
      const matchesSearch = msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            msg.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            msg.preview.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filter === "Urgent") return msg.badgeType === "urgent" || msg.badge === "Urgent";
      if (filter === "Important") return msg.badgeType === "important" || msg.badge === "Important";
      if (filter === "Follow-up") return msg.badgeType === "followup" || msg.badgeType === "info" || msg.badge === "Follow-up";
      if (filter === "Not Important") return msg.badgeType === "muted" || msg.badgeType === "notimportant" || msg.badge === "Not Important" || msg.badge === "Not Urgent";
      if (filter === "Starred") return msg.starred;
      return true;
    });
  }, [messagesList, filter, searchQuery]);

  const selectedMessage = useMemo(
    () => messagesList.find((message) => message.id === selectedId) ?? null,
    [messagesList, selectedId]
  );

  const handleSelectMessage = async (id) => {
    setSelectedId(id);
    setIsDetailOpen(true);
    // Mark read
    setMessagesList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unread: false } : m))
    );
    try {
      if (!supabase) return;
      const { error } = await supabase.from('internal_mail').update({ unread: false }).eq('id', id);
      logDatabaseError('Internal Mail read update failed', error);
    } catch (err) {
      logDatabaseError(`Internal Mail read update failed for ${id}`, err);
    }
  };

  const handlePrevMessage = () => {
    if (!filteredMessages.length) return;
    const currentIndex = filteredMessages.findIndex((m) => m.id === selectedId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredMessages.length - 1;
    handleSelectMessage(filteredMessages[prevIndex].id);
  };

  const handleNextMessage = () => {
    if (!filteredMessages.length) return;
    const currentIndex = filteredMessages.findIndex((m) => m.id === selectedId);
    const nextIndex = currentIndex < filteredMessages.length - 1 ? currentIndex + 1 : 0;
    handleSelectMessage(filteredMessages[nextIndex].id);
  };

  const handleToggleStar = async (idToStar = selectedId) => {
    if (!idToStar) return;
    let targetStarred = false;
    setMessagesList((prev) =>
      prev.map((m) => {
        if (m.id === idToStar) {
          const newStarred = !m.starred;
          targetStarred = newStarred;
          if (idToStar === selectedId) {
            triggerToast(newStarred ? "Message marked as starred." : "Message removed from starred.");
          }
          return { ...m, starred: newStarred };
        }
        return m;
      })
    );
    try {
      if (!supabase) return;
      const { error } = await supabase.from('internal_mail').update({ starred: targetStarred }).eq('id', idToStar);
      logDatabaseError('Internal Mail star update failed', error);
    } catch (err) {
      logDatabaseError(`Internal Mail star update failed for ${idToStar}`, err);
    }
  };

  const handleArchive = async () => {
    if (!selectedMessage) return;
    const idToRemove = selectedMessage.id;
    triggerToast("Message archived to Lifewood cold storage.");
    
    // Select next
    const currentIndex = filteredMessages.findIndex((m) => m.id === idToRemove);
    const nextMsg = filteredMessages[currentIndex + 1] || filteredMessages[currentIndex - 1] || null;
    
    setMessagesList((prev) => prev.filter((m) => m.id !== idToRemove));
    if (nextMsg) {
      setSelectedId(nextMsg.id);
    } else {
      setIsDetailOpen(false);
    }
    try {
      if (!supabase) return;
      const { error } = await supabase.from('internal_mail').delete().eq('id', idToRemove);
      logDatabaseError('Internal Mail archive failed', error);
    } catch (err) {
      logDatabaseError(`Internal Mail archive failed for ${idToRemove}`, err);
    }
  };

  const handleDelete = async () => {
    if (!selectedMessage) return;
    const idToRemove = selectedMessage.id;
    triggerToast("Message permanently deleted from inbox.");
    
    const currentIndex = filteredMessages.findIndex((m) => m.id === idToRemove);
    const nextMsg = filteredMessages[currentIndex + 1] || filteredMessages[currentIndex - 1] || null;
    
    setMessagesList((prev) => prev.filter((m) => m.id !== idToRemove));
    if (nextMsg) {
      setSelectedId(nextMsg.id);
    } else {
      setIsDetailOpen(false);
    }
    try {
      if (!supabase) return;
      const { error } = await supabase.from('internal_mail').delete().eq('id', idToRemove);
      logDatabaseError('Internal Mail delete failed', error);
    } catch (err) {
      logDatabaseError(`Internal Mail delete failed for ${idToRemove}`, err);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) return;
    const newReply = {
      id: crypto.randomUUID(),
      sender: "Linda Martinez",
      time: "Just now",
      text: replyText.trim()
    };
    setReplyText("");
    setMessagesList((prev) =>
      prev.map((m) => (m.id === selectedMessage.id ? { ...m, replies: [...(m.replies || []), newReply] } : m))
    );
    triggerToast("Reply sent securely via Lifewood internal network.");
    try {
      if (!supabase) return;
      const { error } = await supabase.from('internal_mail').update({ 
        replies: [...(selectedMessage.replies || []), newReply] 
      }).eq('id', selectedMessage.id);
      logDatabaseError('Internal Mail reply update failed', error);
    } catch (err) {
      logDatabaseError(`Internal Mail reply update failed for ${selectedMessage.id}`, err);
    }
  };

  const unreadCount = messagesList.filter((m) => m.unread).length;
  const starredCount = messagesList.filter((m) => m.starred).length;

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen bg-[#F9F7F7] dark:bg-[#08170d] text-[#133020] dark:text-[#eff7ed] font-sans ${isResizing ? "select-none cursor-col-resize" : ""}`}>
      <Sidebar activeTab="Internal Mail" />

      {/* Main Mail Workspace */}
      <main className="flex-1 flex h-[calc(100vh-69px)] lg:h-screen overflow-hidden w-full">
        
        {/* Left Message List Pane (Background color unified with Applicants!) */}
        <section 
          ref={leftPaneRef}
          style={{ "--list-width": `${listWidth}px` }}
          className={`flex-col h-full overflow-hidden shrink-0 w-full lg:w-[var(--list-width)] lg:max-w-[calc(100%-380px)] ${
            isDetailOpen && selectedMessage ? "hidden lg:flex" : "flex"
          }`}
        >
          <header className="p-4 sm:p-6 lg:p-8 pb-4 sm:pb-5 lg:pb-6 border-b border-gray-200 dark:border-white/10 bg-[#F9F7F7] dark:bg-[#08170d] shrink-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#133020] dark:text-white tracking-tight">Internal Mail</h1>
                <p className="text-gray-500 dark:text-white/60 text-xs sm:text-sm mt-1">Secure communication · Lifewood Data Technology</p>
              </div>
              {/* Starred Section replacing unread text while maintaining exact orange colors! */}
              <button
                type="button"
                onClick={() => setFilter(filter === 'Starred' ? 'All' : 'Starred')}
                className="rounded-full bg-[#FFB347] hover:bg-[#FFC370] px-3 py-1 sm:px-3.5 sm:py-1.5 text-xs font-black text-[#133020] shadow-xs shrink-0 ml-2 transition cursor-pointer flex items-center gap-1.5"
                title="Click to view Starred messages"
              >
                <Star size={13} className="fill-current" />
                <span>{starredCount} Starred</span>
              </button>
            </div>

            {/* Unified Search Bar matching Applicants design */}
            <div className="mt-3.5 flex items-center justify-between bg-white dark:bg-[#133020] rounded-full border border-gray-200 dark:border-white/10 p-1 shadow-xs focus-within:border-[#046241] dark:focus-within:border-[#FFC370] focus-within:ring-2 focus-within:ring-[#046241]/20 dark:focus-within:ring-[#FFC370]/20 transition-all">
              <div className="flex items-center gap-2 pl-3.5 flex-1 min-w-0">
                <Search className="text-gray-400 dark:text-white/40 shrink-0" size={16} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages, applicants..."
                  className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#133020] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 outline-none truncate"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-[#133020] dark:hover:text-white cursor-pointer pr-2 shrink-0"
                    type="button"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Pillbox Cards Filter Area unified with Applicants */}
            <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
              {["All", "Urgent", "Important", "Follow-up", "Not Important", "Starred"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                    filter === tab 
                      ? "bg-[#046241] text-white border-transparent shadow-xs dark:bg-[#FFC370] dark:text-[#133020]" 
                      : "bg-white/80 dark:bg-white/10 text-gray-700 dark:text-white/80 border-gray-200 dark:border-transparent hover:bg-white dark:hover:bg-white/20 hover:text-[#133020] dark:hover:text-white"
                  }`}
                  type="button"
                >
                  {tab === "Starred" && <Star size={12} className={filter === tab ? "fill-current" : "text-[#FFB347] fill-current"} />}
                  <span>{tab}</span>
                </button>
              ))}
            </div>
          </header>

          {/* Message Scroll List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-white/10">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message) => {
                const isSelected = selectedId === message.id && isDetailOpen;
                return (
                  <button
                    key={message.id}
                    onClick={() => handleSelectMessage(message.id)}
                    className={`grid w-full grid-cols-[36px_1fr] gap-3 px-4 py-4 text-left transition-all relative cursor-pointer ${
                      isSelected 
                        ? "bg-[#f5eedb] dark:bg-[#133020] border-l-4 border-l-[#046241] dark:border-l-[#FFC370] shadow-sm" 
                        : message.unread
                        ? "bg-[#f5eedb]/30 dark:bg-white/5 hover:bg-[#f5eedb]/60 dark:hover:bg-white/10"
                        : "hover:bg-gray-50 dark:hover:bg-white/5 opacity-75 dark:opacity-70"
                    }`}
                    type="button"
                  >
                    <span 
                      className="grid size-9 place-items-center rounded-full text-xs font-black text-white shadow-xs shrink-0" 
                      style={{ background: message.color }}
                    >
                      {message.initials}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 min-w-0">
                          {message.unread && (
                            <span 
                              title="Unread message"
                              className="size-2.5 rounded-full bg-[#046241] dark:bg-[#FFC370] shadow-[0_0_8px_rgba(255,195,112,0.8)] shrink-0 animate-pulse" 
                            />
                          )}
                          <strong className={`truncate text-xs font-black ${message.unread ? "text-[#133020] dark:text-[#FFC370]" : "text-[#133020] dark:text-white"}`}>
                            {message.sender}
                          </strong>
                        </span>
                        <time className="text-[10px] font-medium text-gray-400 dark:text-white/40 shrink-0">{message.time}</time>
                      </span>
                      <span className={`mt-1 block truncate text-xs ${message.unread ? "font-black text-[#133020] dark:text-white" : "font-bold text-[#133020]/70 dark:text-white/70"}`}>
                        {message.subject}
                      </span>
                      <span className={`mt-1 block truncate text-[11px] ${message.unread ? "text-gray-700 dark:text-white/80 font-medium" : "text-gray-400 dark:text-white/50"}`}>
                        {message.preview}
                      </span>
                      <span className="mt-2.5 flex items-center justify-between gap-2">
                        <Badge type={message.badgeType}>{message.badge}</Badge>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStar(message.id);
                          }}
                          className="p-1 hover:scale-125 transition-transform cursor-pointer"
                          title={message.starred ? "Unstar message" : "Star message"}
                        >
                          <Star 
                            size={14} 
                            fill={message.starred ? "#FFB347" : "none"} 
                            className={message.starred ? "text-[#FFB347]" : "text-gray-300 dark:text-white/20"} 
                          />
                        </button>
                      </span>
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-400 dark:text-white/40 text-xs font-bold">
                No messages found matching "{searchQuery}"
              </div>
            )}
          </div>
        </section>

        {/* Resizer Handle */}
        <div
          onMouseDown={startResizing}
          title="Drag to resize message list pane"
          className={`hidden lg:flex w-2 -ml-1 h-full bg-transparent hover:bg-[#046241] dark:hover:bg-[#FFC370] cursor-col-resize transition-colors shrink-0 z-30 relative items-center justify-center group ${
            isResizing ? "bg-[#046241] dark:bg-[#FFC370]" : ""
          }`}
        >
          <div className="w-0.5 h-10 rounded-full bg-gray-300 dark:bg-white/20 group-hover:bg-white dark:group-hover:bg-[#133020] transition-colors" />
        </div>

        {/* Right Message Detail Pane (Background color & borders unified with Applicants!) */}
        <section className={`flex-1 w-full flex-col h-full bg-white dark:bg-[#133020] border-l border-gray-200 dark:border-white/10 shadow-xl overflow-hidden min-w-0 ${
          isDetailOpen && selectedMessage ? "flex" : "hidden lg:flex"
        }`}>
          {selectedMessage && isDetailOpen ? (
            <>
              {/* Unified Design Header Toolbar for Sidebar */}
              <div className="flex h-14 items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#133020] px-6 shrink-0 sticky top-0 z-20 gap-4 overflow-x-auto">
                <div className="flex items-center gap-2 text-gray-500 dark:text-white/60 shrink-0">
                  <button 
                    onClick={() => setIsDetailOpen(false)}
                    title="Back to messages list" 
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-extrabold bg-gray-100 dark:bg-white/10 px-3 mr-2 text-[#133020] dark:text-white" 
                    type="button"
                  >
                    <ChevronLeft size={18} />
                    <span>Back</span>
                  </button>
                  <button 
                    onClick={handlePrevMessage}
                    title="Previous Message (Arrow Left)" 
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer" 
                    type="button"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <button 
                    onClick={handleNextMessage}
                    title="Next Message (Arrow Right)" 
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer" 
                    type="button"
                  >
                    <ArrowRight size={18} />
                  </button>

                  <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10 mx-1" />

                  {/* Archive and Delete Buttons in Upper Header */}
                  <button
                    type="button"
                    onClick={handleArchive}
                    title="Archive Message"
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#133020] dark:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-gray-200 dark:border-white/10 shadow-xs"
                  >
                    <Archive size={14} />
                    <span>Archive</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    title="Delete Message"
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-200 hover:text-red-700 dark:hover:text-white border border-red-200 dark:border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => handleToggleStar(selectedMessage.id)}
                    title={selectedMessage.starred ? "Remove Star" : "Star Message"}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition cursor-pointer" 
                    type="button"
                  >
                    <Star 
                      size={18} 
                      fill={selectedMessage.starred ? "#FFB347" : "none"} 
                      className={selectedMessage.starred ? "text-[#FFB347]" : "text-gray-400"} 
                    />
                  </button>
                  <button 
                    onClick={() => { setIsDetailOpen(false); setSelectedId(null); }}
                    title="Close message view (X)"
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer" 
                    type="button"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Scrollable Right Sidebar Body */}
              <div className="overflow-y-auto flex-1">

                {/* 1. Dark Green Top Header Card (Unified with Applicants sidebar view header style!) */}
                <div className="bg-[#0c1f14] dark:bg-black/40 text-white rounded-2xl m-4 p-5 border border-emerald-500/20 shadow-md">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span 
                      className="grid size-11 place-items-center rounded-full text-sm font-black text-white shadow-md shrink-0 ring-2 ring-emerald-400/30" 
                      style={{ background: selectedMessage.color }}
                    >
                      {selectedMessage.initials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white truncate">
                        {selectedMessage.subject}
                      </h3>
                      <p className="text-xs text-emerald-200/60 mt-0.5 truncate">
                        {selectedMessage.sender} · {selectedMessage.role} · {selectedMessage.time} ago
                      </p>
                    </div>
                  </div>

                  {/* Badges Row inside Dark Card */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-3.5">
                    <Badge type={selectedMessage.badgeType}>{selectedMessage.badge}</Badge>
                    {selectedMessage.unread && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFB347] text-[#133020] shadow-2xs">
                        Unread
                      </span>
                    )}
                  </div>
                </div>

              {/* Feedback Toast */}
              {showToast && (
                <div className="mx-6 mt-2 p-3 rounded-xl bg-[#046241] text-white flex items-center justify-between shadow-lg animate-fade-in shrink-0">
                  <div className="flex items-center gap-2.5 text-xs font-bold">
                    <CheckCircle2 size={18} className="text-[#FFC370]" />
                    <span>{toastMsg}</span>
                  </div>
                  <button onClick={() => setShowToast(false)} className="text-white/80 hover:text-white cursor-pointer" type="button"><X size={14} /></button>
                </div>
              )}

              {/* Message Content */}
              <article className="p-6 md:p-8 flex-1 flex flex-col max-w-4xl mx-auto w-full">

                {/* AI Summary Banner */}
                <div className="mt-6 rounded-2xl border border-[#FFC370]/50 bg-[#f5eedb] dark:bg-[#133020]/90 p-4.5 flex items-start gap-3.5 shadow-xs">
                  <div className="p-2 rounded-xl bg-[#046241] text-white shrink-0">
                    <Sparkles size={18} className="text-[#FFC370]" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#046241] dark:text-[#FFC370]">AI Content Analysis</h4>
                    <p className="mt-1 text-xs leading-5 text-[#133020]/80 dark:text-white/80 font-medium">
                      This message discusses high-priority Q4 applicant labeling targets and interview timelines. Recommended action: coordinate shortlists with automation lead.
                    </p>
                  </div>
                </div>

                {/* Message Body Paragraphs */}
                <div className="py-8 text-sm md:text-base leading-7 text-gray-700 dark:text-white/80 font-normal space-y-4">
                  {selectedMessage.body.map((line, idx) => (
                    <p key={idx}>{line}</p>
                  ))}
                </div>

                {/* Reply Section */}
                <section className="mt-auto overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#133020] shadow-sm">
                  <div className="border-b border-gray-100 dark:border-white/10 px-5 py-3 text-xs font-bold text-gray-500 dark:text-white/60 flex items-center justify-between bg-[#F9F7F7] dark:bg-white/5">
                    <span>Reply to <strong className="text-[#133020] dark:text-white font-black">{selectedMessage.sender}</strong></span>
                    <span className="text-[10px] uppercase tracking-wider text-[#046241] dark:text-[#FFC370] font-black">Encrypted Feed</span>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="h-32 w-full resize-none bg-transparent p-5 text-sm text-[#133020] dark:text-white outline-none placeholder:text-gray-400 dark:placeholder:text-white/40"
                    placeholder="Write a reply to your team..."
                  />
                  <div className="flex items-center justify-between px-5 pb-4 pt-2 border-t border-gray-100 dark:border-white/5">
                    <div className="flex gap-2 text-gray-400 dark:text-white/50">
                      <button 
                        onClick={() => setReplyText((prev) => prev + " [Template: Interview Follow-up] ")}
                        title="Insert Template"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px] font-bold" 
                        type="button"
                      >
                        <Menu size={15} />
                        <span>Template</span>
                      </button>
                      <button 
                        onClick={() => setReplyText((prev) => prev + " [Attachment: Candidate_Shortlist_Q4.pdf] ")}
                        title="Attach File"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px] font-bold" 
                        type="button"
                      >
                        <Paperclip size={15} />
                        <span>Attach</span>
                      </button>
                      <button 
                        onClick={() => setReplyText((prev) => prev + " #Urgent-HR-Action ")}
                        title="Add Tag"
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer flex items-center gap-1 text-[11px] font-bold" 
                        type="button"
                      >
                        <Hash size={15} />
                        <span>Tag</span>
                      </button>
                    </div>
                    <button 
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                      className={`flex h-10 items-center gap-2 rounded-xl px-5 text-xs font-black text-white transition-all cursor-pointer shadow-md ${
                        replyText.trim() 
                          ? "bg-[#046241] hover:bg-[#133020] shadow-[#046241]/20 scale-100" 
                          : "bg-gray-300 dark:bg-white/20 opacity-50 cursor-not-allowed"
                      }`} 
                      type="button"
                    >
                      <Send size={15} />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </section>
              </article>
              </div>
            </>
          ) : (
            /* Clean Empty State when No Message is Selected or X was clicked */
            <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in mx-auto my-auto">
              <div className="p-5 rounded-full bg-white dark:bg-[#133020] border border-gray-200 dark:border-white/10 text-[#046241] dark:text-[#FFC370] mb-4 shadow-sm">
                <Inbox size={44} />
              </div>
              <h3 className="text-xl font-black text-[#133020] dark:text-white">No Message Selected</h3>
              <p className="mt-2 text-xs leading-6 text-gray-500 dark:text-white/60 max-w-md mx-auto">
                Select an email from the inbox list on the left to view encrypted message details, candidate screening scores, and AI content analysis.
              </p>
            </div>
          )}
        </section>

        {/* Standardized Interactive Chatbot Assistant Modal */}
        <ChatbotAssistant />
      </main>
    </div>
  );
}
