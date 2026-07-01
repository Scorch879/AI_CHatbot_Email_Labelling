import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  ChevronLeft,
  Grid2X2,
  Hash,
  Inbox,
  Lock,
  Menu,
  Paperclip,
  Search,
  Send,
  Settings,
  Shield,
  Star,
  Sun,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { supabase } from "../supabaseClient";

const navItems = [
  { label: "Dashboard", icon: Grid2X2, path: "/dashboard" },
  { label: "Internal Mail", icon: Inbox, path: "/dashboard/internal-mail", active: true },
  { label: "Applicants", icon: Users },
  { label: "Reports", icon: BriefcaseBusiness },
  { label: "Settings", icon: Settings },
];

const messages = [
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
    badge: "Not Urgent",
    badgeType: "info",
    color: "#5245e8",
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
    body: [
      "Reached out to 45 candidates this week. 12 responded and 8 are ready for HR screening.",
      "The strongest responses came from data analyst and business analyst profiles.",
    ],
  },
];

const badgeStyles = {
  urgent: "bg-red-950 text-red-300 ring-red-500/25",
  important: "bg-yellow-950 text-yellow-300 ring-yellow-500/25",
  info: "bg-sky-950 text-sky-300 ring-sky-500/25",
  muted: "bg-white/10 text-white/55 ring-white/10",
};

function Badge({ type, children }) {
  return (
    <span className={`rounded px-2 py-1 text-[10px] font-black ring-1 ${badgeStyles[type]}`}>
      {children}
    </span>
  );
}

export default function InternalMail() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(messages[0].id);
  const selectedMessage = useMemo(
    () => messages.find((message) => message.id === selectedId) ?? messages[0],
    [selectedId],
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#07130d] text-[#eff7ed] lg:grid-cols-[190px_360px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-white/10 bg-[#082112] lg:min-h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5 text-sm font-black">
          <Shield size={18} fill="currentColor" className="text-[#ffc370]" />
          <span>LIFEMAIL</span>
        </div>

        <nav className="grid gap-1 p-3">
          {navItems.map(({ label, icon: Icon, path, active }) => (
            <button
              className={`flex h-10 items-center gap-3 rounded-xl px-3 text-left text-xs font-bold transition ${
                active ? "border border-[#248557] bg-[#0d4a2b] text-white" : "text-white/75 hover:bg-white/10"
              }`}
              key={label}
              onClick={() => path && navigate(path)}
              type="button"
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto grid gap-4 p-5">
          <label className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2"><Sun size={14} /> Light Mode</span>
            <input type="checkbox" className="accent-[#ffb347]" />
          </label>

          <div className="flex items-center gap-3">
            <span className="grid size-7 place-items-center rounded-full bg-[#24c17c] text-xs font-black text-white">LM</span>
            <span>
              <strong className="block text-xs">Linda Martinez</strong>
              <small className="text-[11px] text-white/50">HR Director</small>
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-bold text-white/60 hover:bg-white/10"
            type="button"
          >
            <Lock size={14} />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#9edcaf]">
            <span className="size-1.5 rounded-full bg-[#1ee578]" />
            AI Engine Online
          </div>
        </div>
      </aside>

      <section className="h-screen overflow-hidden border-r border-white/10 bg-[#08170d] p-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">Internal Mail</h1>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.22em] text-[#ffc370]">Dashboard connected</p>
          </div>
          <span className="rounded-full bg-[#f5a12a] px-3 py-1 text-xs font-black text-[#07130d]">3 unread</span>
        </header>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            ["8", "Total"],
            ["3", "Unread"],
            ["2", "Urgent"],
          ].map(([value, label]) => (
            <article className="grid h-14 place-items-center rounded-xl border border-white/10 bg-white/10" key={label}>
              <strong>{value}</strong>
              <span className="text-[10px] font-black uppercase text-white/45">{label}</span>
            </article>
          ))}
        </div>

        <label className="mt-3 flex h-10 items-center gap-2 rounded-xl bg-white/10 px-3 text-white/45">
          <Search size={16} />
          <input className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35" placeholder="Search messages..." />
        </label>

        <div className="mt-3 flex flex-wrap items-center gap-2 pb-3 text-[11px] font-black">
          <button className="h-9 rounded-lg bg-[#2d9b68] px-4 text-white" type="button">All</button>
          <button className="text-white/70" type="button">Urgent</button>
          <button className="text-white/70" type="button">Important</button>
          <button className="text-white/70" type="button">Not Urgent</button>
        </div>

        <div className="h-[calc(100vh-244px)] overflow-y-auto">
          {messages.map((message) => (
            <button
              className={`grid w-full grid-cols-[32px_1fr] gap-3 border-b border-white/10 px-1 py-4 text-left transition hover:bg-white/[0.04] ${
                selectedId === message.id ? "bg-white/[0.06]" : ""
              }`}
              key={message.id}
              onClick={() => setSelectedId(message.id)}
              type="button"
            >
              <span className="grid size-7 place-items-center rounded-full text-[10px] font-black text-white" style={{ background: message.color }}>
                {message.initials}
              </span>
              <span className="min-w-0">
                <span className="flex items-center justify-between gap-2">
                  <strong className="flex items-center gap-1 text-xs">
                    {message.sender}
                    {message.unread && <i className="size-1.5 rounded-full bg-[#efa52f]" />}
                  </strong>
                  <time className="text-[10px] text-white/40">{message.time}</time>
                </span>
                <span className="mt-1 block truncate text-xs font-bold text-white/70">{message.subject}</span>
                <span className="mt-1 block truncate text-[11px] text-white/45">{message.preview}</span>
                <span className="mt-2 flex items-center gap-2">
                  <Badge type={message.badgeType}>{message.badge}</Badge>
                  {message.starred && <Star size={13} fill="#f3a532" className="text-[#f3a532]" />}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="h-screen overflow-auto bg-[#07130d]">
        <div className="flex h-12 items-center justify-between border-b border-white/10 bg-[#06110c] px-5">
          <div className="flex gap-4 text-white/40">
            {[ArrowLeft, ChevronLeft, ArrowRight, Archive, Trash2].map((Icon, index) => (
              <button className="hover:text-white" key={index} type="button"><Icon size={16} /></button>
            ))}
          </div>
          <div className="flex gap-4">
            <button className="text-[#f3a532]" type="button"><Star size={18} fill="#f3a532" /></button>
            <button className="text-white/40 hover:text-white" type="button"><X size={16} /></button>
          </div>
        </div>

        <article className="px-6 py-7 md:px-9">
          <h2 className="text-2xl font-black">{selectedMessage.subject}</h2>

          <section className="mt-5 grid gap-4 rounded-xl border border-white/10 bg-white/[0.06] p-4 sm:grid-cols-[44px_1fr_auto] sm:items-center">
            <span className="grid size-11 place-items-center rounded-full text-sm font-black text-white" style={{ background: selectedMessage.color }}>
              {selectedMessage.initials}
            </span>
            <div>
              <strong className="block">{selectedMessage.sender}</strong>
              <span className="text-sm text-white/55">{selectedMessage.role}</span>
            </div>
            <div className="grid gap-2 sm:justify-items-end">
              <Badge type={selectedMessage.badgeType}>{selectedMessage.badge}</Badge>
              <time className="text-xs text-white/45">{selectedMessage.time} ago</time>
            </div>
          </section>

          <div className="max-w-4xl py-7 text-sm leading-7 text-white/70">
            {selectedMessage.body.map((line) => (
              <p className="mb-5" key={line}>{line}</p>
            ))}
          </div>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#08160d]">
            <div className="border-b border-white/10 px-4 py-3 text-xs font-black text-[#9ab9a6]">
              Reply to {selectedMessage.sender}
            </div>
            <textarea
              className="h-32 w-full resize-none bg-transparent p-4 text-sm text-white outline-none placeholder:text-white/35"
              placeholder="Write a reply to your team..."
            />
            <div className="flex items-center justify-between px-4 pb-4">
              <div className="flex gap-4 text-white/40">
                {[Menu, Paperclip, Hash].map((Icon, index) => (
                  <button className="hover:text-white" key={index} type="button"><Icon size={16} /></button>
                ))}
              </div>
              <button className="flex h-10 items-center gap-2 rounded-xl bg-[#2d9b68] px-4 text-sm font-black text-white" type="button">
                <Send size={16} />
                Send Reply
              </button>
            </div>
          </section>
        </article>
      </section>

      <button className="fixed bottom-5 right-5 grid size-12 place-items-center rounded-full bg-[#06442f] text-[#dffbed] shadow-2xl" type="button">
        <Bot size={20} />
      </button>
      <button className="fixed bottom-20 right-6 grid size-8 place-items-center rounded-full bg-white text-lg font-black text-[#122117] shadow-xl" type="button">
        ?
      </button>
    </main>
  );
}
