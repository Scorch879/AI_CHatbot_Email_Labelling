import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Send, 
  Paperclip, 
  X, 
  Archive, 
  Briefcase, 
  MapPin, 
  GraduationCap, 
  Award, 
  Clock, 
  Star,
  MessageSquare,
  Check,
  Trash2,
  Reply,
  AlignLeft,
  Hash,
  ArrowLeft,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ChatbotAssistant from '../components/ChatbotAssistant';
import { supabase } from '../supabaseClient';

const logDatabaseError = (action, error) => {
  if (error) {
    console.warn(`${action}:`, error.message || error);
  }
};

const normalizeApplicantStatus = (status) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized || normalized === 'new') return 'pending';
  return normalized;
};

// Default initial data matching exact counts: 8 Total (3 Interns, 5 Regular), 4 Accepted, 2 Rejected, 2 Pending
const INITIAL_APPLICANTS = [
  {
    id: '1',
    name: 'Maria Santos',
    initials: 'MS',
    country: 'Philippines',
    position: 'Data Analyst Intern',
    type: 'intern',
    status: 'accepted',
    matchScore: 94,
    urgent: true,
    education: 'BS Computer Science',
    experience: '2 years internship at TechCorp',
    skills: ['Python', 'SQL', 'Power BI', 'Tableau', 'Excel'],
    summary: 'Strong technical foundation with 94% match. Academic background aligns well with Data Analyst requirements. Recommended for fast-track interview.',
    message: 'Dear HR Team,\n\nI am writing to express my strong interest in the Data Analyst Intern position at Lifewood Data Technology. With a solid foundation in Python, SQL, and data visualization tools, I am confident in my ability to contribute meaningfully to your team.\n\nI recently completed my Bachelor of Science in Computer Science at UP Diliman, graduating with honors. During my studies, I completed an internship at TechCorp Philippines where I built automated reporting dashboards using Power BI and Tableau.\n\nI have attached my resume and portfolio for your review. I look forward to the opportunity to discuss my qualifications further.\n\nBest regards,\nMaria Santos',
    timeAgo: '2m ago',
    resumeName: 'resume_maria_santos.pdf',
    resumeSize: '1.2 MB',
    replies: []
  },
  {
    id: '2',
    name: 'Lucas Ferreira',
    initials: 'LF',
    country: 'Brazil',
    position: 'Project Mgr Intern',
    type: 'intern',
    status: 'rejected',
    matchScore: 61,
    urgent: false,
    education: 'BA Business Admin',
    experience: '1 year academic projects',
    skills: ['Agile', 'Scrum', 'Jira', 'Trello'],
    summary: 'Moderate skill alignment (61% match). Lacks direct technical project management experience for HR data workflows.',
    message: 'Hello Lifewood team,\n\nI am applying for the Project Manager Intern role. I am passionate about agile methodologies and coordinating teams to deliver software on time.\n\nThank you for considering my application.\n\nBest,\nLucas',
    timeAgo: '2h ago',
    resumeName: 'lucas_ferreira_cv.pdf',
    resumeSize: '890 KB',
    replies: []
  },
  {
    id: '3',
    name: 'Amara Diallo',
    initials: 'AD',
    country: 'Senegal',
    position: 'Marketing Intern',
    type: 'intern',
    status: 'accepted',
    matchScore: 85,
    urgent: false,
    education: 'BS Digital Marketing',
    experience: 'Freelance social media manager',
    skills: ['Canva', 'SEO', 'Meta Ads', 'Google Analytics'],
    summary: 'Great brand alignment and SEO knowledge (85% match). Demonstrated portfolio of B2B tech campaigns.',
    message: 'Dear Hiring Manager,\n\nI would love to join Lifewood Data Technology as a Marketing Intern. I have built successful digital campaigns and understand tech branding.\n\nBest regards,\nAmara',
    timeAgo: '6h ago',
    resumeName: 'amara_diallo_resume.pdf',
    resumeSize: '1.5 MB',
    replies: []
  },
  {
    id: '4',
    name: 'Elena Rostova',
    initials: 'ER',
    country: 'Germany',
    position: 'Senior Software Engineer',
    type: 'regular',
    status: 'accepted',
    matchScore: 96,
    urgent: true,
    education: 'MS Computer Science',
    experience: '6 years full-stack development',
    skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'],
    summary: 'Top tier candidate (96% match). Extensive experience building high-scale enterprise email automation systems.',
    message: 'Hi Lifewood Team,\n\nWith over 6 years of engineering experience specializing in React and distributed backend systems, I am excited to apply for the Senior Software Engineer position.\n\nLooking forward to speaking with you,\nElena',
    timeAgo: '1d ago',
    resumeName: 'elena_rostova_cv.pdf',
    resumeSize: '2.1 MB',
    replies: []
  },
  {
    id: '5',
    name: 'David Kim',
    initials: 'DK',
    country: 'South Korea',
    position: 'AI Systems Architect',
    type: 'regular',
    status: 'pending',
    matchScore: 89,
    urgent: false,
    education: 'PhD Artificial Intelligence',
    experience: '4 years LLM fine-tuning & RAG',
    skills: ['PyTorch', 'LangChain', 'Python', 'Kubernetes', 'Vector DBs'],
    summary: 'Very strong AI background (89% match). Currently undergoing technical review with the AI engineering team.',
    message: 'Dear Recruiting Team,\n\nMy research and industry experience align closely with your AI Chatbot and email labeling initiatives. I have deployed production RAG architectures and customized transformer models.\n\nSincerely,\nDavid',
    timeAgo: '1d ago',
    resumeName: 'david_kim_resume.pdf',
    resumeSize: '3.0 MB',
    replies: []
  },
  {
    id: '6',
    name: 'Sophie Laurent',
    initials: 'SL',
    country: 'France',
    position: 'HR Automation Specialist',
    type: 'regular',
    status: 'accepted',
    matchScore: 91,
    urgent: false,
    education: 'MA Human Resources',
    experience: '5 years HRIS & Workflow Automation',
    skills: ['Workday', 'Zapier', 'Python Scripting', 'Employee Relations'],
    summary: 'Excellent combination of HR domain expertise and technical workflow scripting (91% match).',
    message: 'Hello,\n\nI specialize in bridging the gap between HR policy and technical automation. I would love to help optimize Lifewood\'s internal HR operations.\n\nWarm regards,\nSophie',
    timeAgo: '2d ago',
    resumeName: 'sophie_laurent_cv.pdf',
    resumeSize: '1.1 MB',
    replies: []
  },
  {
    id: '7',
    name: 'Rajesh Patel',
    initials: 'RP',
    country: 'India',
    position: 'Backend Developer',
    type: 'regular',
    status: 'pending',
    matchScore: 78,
    urgent: false,
    education: 'BTech Information Tech',
    experience: '3 years Node/Express development',
    skills: ['Node.js', 'Express', 'MongoDB', 'Redis', 'GraphQL'],
    summary: 'Solid backend engineer (78% match). Good API skills, currently waiting on coding assessment results.',
    message: 'Dear HR Team,\n\nI have 3 years of experience building high-throughput microservices. I am eager to contribute to Lifewood\'s backend infrastructure.\n\nThanks,\nRajesh',
    timeAgo: '3d ago',
    resumeName: 'rajesh_patel_resume.pdf',
    resumeSize: '950 KB',
    replies: []
  },
  {
    id: '8',
    name: 'James Wilson',
    initials: 'JW',
    country: 'United Kingdom',
    position: 'Product Designer',
    type: 'regular',
    status: 'rejected',
    matchScore: 58,
    urgent: false,
    education: 'BA Graphic Design',
    experience: '2 years agency UI design',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    summary: 'Portfolio focuses primarily on consumer branding rather than enterprise B2B data tools (58% match).',
    message: 'Hi,\n\nI am a UI/UX designer applying for the Product Designer role. I love creating beautiful user interfaces.\n\nBest,\nJames',
    timeAgo: '4d ago',
    resumeName: 'james_wilson_portfolio.pdf',
    resumeSize: '4.5 MB',
    replies: []
  }
];

export default function Applicants() {
  // ==========================================
  // EXPOSED DATABASE & STATE VARIABLES
  // ==========================================
  const [applicants, setApplicants] = useState(INITIAL_APPLICANTS);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem('lifemail_applicants_selected_id') || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'intern' | 'regular'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'accepted' | 'rejected' | 'pending' | 'archived'
  const [replyText, setReplyText] = useState('');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(() => localStorage.getItem('lifemail_applicants_detail_open') === 'true');

  // Resizing state for Left Workspace Pane
  const [listWidth, setListWidth] = useState(() => {
    const saved = localStorage.getItem('lifemail_applicants_list_width');
    return saved ? parseInt(saved, 10) : 500;
  });
  const [isResizing, setIsResizing] = useState(false);
  const leftPaneRef = useRef(null);
  const isResizingRef = useRef(false);

  useEffect(() => {
    if (selectedId) {
      localStorage.setItem('lifemail_applicants_selected_id', selectedId);
    } else {
      localStorage.removeItem('lifemail_applicants_selected_id');
    }
  }, [selectedId]);

  useEffect(() => {
    localStorage.setItem('lifemail_applicants_detail_open', isDetailOpen ? 'true' : 'false');
  }, [isDetailOpen]);

  useEffect(() => {
    localStorage.setItem('lifemail_applicants_list_width', listWidth);
  }, [listWidth]);

  const startResizing = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = leftPaneRef.current ? leftPaneRef.current.getBoundingClientRect().width : listWidth;

    const container = leftPaneRef.current?.parentElement;
    const containerWidth = container ? container.getBoundingClientRect().width : window.innerWidth - 256;
    const maxAllowedWidth = Math.min(1000, Math.max(380, containerWidth - 380));
    const minAllowedWidth = 340;

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

  // Attempt to load from Supabase database on mount (if table exists)
  useEffect(() => {
    const fetchFromDatabase = async () => {
      setIsLoadingDb(true);
      try {
        if (!supabase) return;

        const { data, error } = await supabase.from('applicants').select('*');
        if (error) {
          logDatabaseError('Applicant fetch failed', error);
          return;
        }

        if (!data || data.length === 0) return;

        const mapped = data.map(item => ({
          id: item.id?.toString() || crypto.randomUUID(),
          name: item.name || item.full_name || 'Unnamed Applicant',
          initials: item.initials || (item.name ? item.name.split(' ').map(n=>n[0]).join('') : 'AP'),
          country: item.country || 'International',
          position: item.position || item.role || 'General Application',
          type: item.type || 'regular',
          status: normalizeApplicantStatus(item.status),
          matchScore: item.match_score || item.score || 75,
          urgent: item.urgent || false,
          education: item.education || 'University Degree',
          experience: item.experience || 'Prior industry experience',
          skills: Array.isArray(item.skills) ? item.skills : ['Python', 'SQL', 'Communication'],
          summary: item.summary || 'Applicant record synchronized from Supabase database.',
          message: item.message || item.cover_letter || 'No cover letter attached.',
          rawEmail: item.raw_email || (item.email_subject ? `From: ${item.email || item.name || 'Applicant'}\nSubject: ${item.email_subject}\nDate: ${item.email_date || item.created_at || 'Recent'}\n\n${item.message || item.cover_letter || ''}` : null),
          timeAgo: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently',
          resumeName: item.resume_name || 'applicant_resume.pdf',
          resumeSize: item.resume_size || '1.0 MB',
          replies: Array.isArray(item.replies) ? item.replies : []
        }));
        setApplicants(mapped);
        setSelectedId(current =>
          current && mapped.some(applicant => applicant.id === current)
            ? current
            : null
        );
      } catch (err) {
        logDatabaseError('Using default applicant dataset', err);
      } finally {
        setIsLoadingDb(false);
      }
    };
    fetchFromDatabase();
  }, []);

  // ==========================================
  // EXPOSED FUNCTIONAL HANDLERS FOR DB SYNC
  // ==========================================

  // Update applicant status (Accept, Reject, Shortlist, Archive, etc.)
  const handleStatusChange = async (id, newStatus) => {
    const nextStatus = normalizeApplicantStatus(newStatus);

    setApplicants(prev => prev.map(app => 
      app.id === id ? { ...app, status: nextStatus } : app
    ));

    try {
      if (!supabase) return;

      const { error } = await supabase.from('applicants').update({ status: nextStatus }).eq('id', id);
      logDatabaseError('Applicant status update failed', error);
    } catch (err) {
      logDatabaseError(`Applicant status update failed for ${id} -> ${nextStatus}`, err);
    }
  };

  // Toggle Urgent status
  const handleToggleUrgent = async (id) => {
    const target = applicants.find(a => a.id === id);
    if (!target) return;
    const newUrgent = !target.urgent;

    setApplicants(prev => prev.map(app => 
      app.id === id ? { ...app, urgent: newUrgent } : app
    ));

    try {
      if (!supabase) return;

      const { error } = await supabase.from('applicants').update({ urgent: newUrgent }).eq('id', id);
      logDatabaseError('Applicant urgent update failed', error);
    } catch (err) {
      logDatabaseError(`Applicant urgent update failed for ${id} -> ${newUrgent}`, err);
    }
  };

  // Send reply message
  const handleSendReply = async (id) => {
    if (!replyText.trim()) return;
    const newReply = {
      id: Date.now().toString(),
      sender: 'Linda Martinez (HR)',
      text: replyText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setApplicants(prev => prev.map(app => {
      if (app.id === id) {
        const updatedReplies = [...(app.replies || []), newReply];
        return { ...app, replies: updatedReplies };
      }
      return app;
    }));

    setReplyText('');

    try {
      if (!supabase) return;

      const target = applicants.find(a => a.id === id);
      const { error } = await supabase.from('applicants').update({
        replies: [...(target?.replies || []), newReply] 
      }).eq('id', id);
      logDatabaseError('Applicant reply update failed', error);
    } catch (err) {
      logDatabaseError(`Applicant reply update failed for ${id}`, err);
    }
  };

  // Delete / Remove Applicant
  const handleDeleteApplicant = async (id) => {
    if (!window.confirm("Are you sure you want to remove this applicant?")) return;
    setApplicants(prev => prev.filter(app => app.id !== id));
    if (selectedId === id) setSelectedId(null);

    try {
      if (!supabase) return;

      const { error } = await supabase.from('applicants').delete().eq('id', id);
      logDatabaseError('Applicant delete failed', error);
    } catch (err) {
      logDatabaseError(`Applicant delete failed for ${id}`, err);
    }
  };

  // ==========================================
  // COMPUTED STATS & FILTERED DATA
  // ==========================================
  const stats = useMemo(() => {
    const total = applicants.length;
    const accepted = applicants.filter(a => normalizeApplicantStatus(a.status) === 'accepted').length;
    const rejected = applicants.filter(a => normalizeApplicantStatus(a.status) === 'rejected').length;
    const pending = applicants.filter(a => normalizeApplicantStatus(a.status) === 'pending').length;
    const totalScore = applicants.reduce((acc, curr) => acc + (curr.matchScore || 0), 0);
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;
    const internCount = applicants.filter(a => a.type === 'intern').length;
    const regularCount = applicants.filter(a => a.type === 'regular').length;

    return { total, accepted, rejected, pending, avgScore, internCount, regularCount };
  }, [applicants]);

  const filteredApplicants = useMemo(() => {
    return applicants.filter(app => {
      const matchesSearch = searchQuery === '' || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === 'all' || app.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || normalizeApplicantStatus(app.status) === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [applicants, searchQuery, typeFilter, statusFilter]);

  const selectedApplicant = useMemo(() => {
    const found = applicants.find(a => a.id === selectedId) || null;
    if (!found) return null;
    return {
      ...found,
      rawEmail: found.rawEmail || found.raw_email || `From: ${found.name} <${found.name.toLowerCase().replace(/\s+/g, '.')}@email.com>\nTo: careers@lifemail.tech\nSubject: Application for ${found.position} (${found.type})\nDate: ${new Date().toUTCString()}\nMIME-Version: 1.0\nContent-Type: text/plain; charset="UTF-8"\nX-Lifemail-Match-Score: ${found.matchScore}%\nX-Lifemail-AI-Confidence: 0.964\n\n${found.message}`
    };
  }, [applicants, selectedId]);

  // Status Badge Styling Helper
  const getStatusBadge = (status) => {
    switch (normalizeApplicantStatus(status)) {
      case 'accepted':
        return { label: 'Accepted', bg: 'bg-[#046241]/10 text-[#046241] dark:bg-[#046241]/30 dark:text-[#FFC370] border-[#046241]/20', icon: CheckCircle2 };
      case 'rejected':
        return { label: 'Rejected', bg: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border-red-200 dark:border-red-800/40', icon: XCircle };
      case 'shortlisted':
        return { label: 'Shortlisted', bg: 'bg-[#FFB347]/20 text-[#133020] dark:bg-[#FFB347]/30 dark:text-[#FFC370] border-[#FFB347]/40', icon: Star };
      case 'archived':
        return { label: 'Archived', bg: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-200', icon: Archive };
      default:
        return { label: 'Pending', bg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/40', icon: Clock };
    }
  };

  const selectedStatusBadge = selectedApplicant ? getStatusBadge(selectedApplicant.status) : null;
  const SelectedStatusIcon = selectedStatusBadge?.icon;
  const selectedApplicantIndex = selectedApplicant
    ? filteredApplicants.findIndex(app => app.id === selectedApplicant.id)
    : -1;
  const canNavigateApplicants = filteredApplicants.length > 1 && selectedApplicantIndex !== -1;

  const selectAdjacentApplicant = (direction) => {
    if (!canNavigateApplicants) return;

    const nextIndex = (selectedApplicantIndex + direction + filteredApplicants.length) % filteredApplicants.length;
    setSelectedId(filteredApplicants[nextIndex].id);
    setIsDetailOpen(true);
  };

  return (
    <div className={`flex flex-col lg:flex-row min-h-screen bg-[#F9F7F7] dark:bg-[#08170d] transition-colors font-sans text-[#133020] dark:text-[#eff7ed] ${isResizing ? "select-none cursor-col-resize" : ""}`}>
      <Sidebar activeTab="Applicants" />

      <main className="flex-1 flex h-[calc(100vh-69px)] lg:h-screen overflow-hidden w-full">
        
        {/* Left Workspace Column */}
        <div 
          ref={leftPaneRef}
          style={{ "--left-width": `${listWidth}px` }}
          className={`h-full flex-col overflow-hidden min-w-0 ${
            selectedApplicant && isDetailOpen ? "hidden lg:flex" : "flex"
          } w-full lg:w-[var(--left-width)] lg:max-w-[calc(100%-360px)] shrink-0`}
        >
          
          {/* Sticky Header Row with Unified Search + Filter Bar */}
          <header className="p-4 sm:p-6 lg:p-8 pb-4 sm:pb-5 lg:pb-6 border-b border-gray-200 dark:border-white/10 bg-[#F9F7F7] dark:bg-[#08170d] shrink-0 z-10 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-[180px] flex-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#133020] dark:text-white tracking-tight flex items-center gap-2 sm:gap-3 truncate">
                Applicants
                {isLoadingDb && <span className="text-xs font-normal text-gray-500 animate-pulse shrink-0">(Syncing DB...)</span>}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60 mt-1 truncate">
                {filteredApplicants.length} of {stats.total} applicants · Lifewood Data Technology
              </p>
            </div>

            {/* Combined Search Bar & Filter Button in Header */}
            <div className="w-full max-w-full sm:w-auto sm:min-w-[260px] sm:max-w-[420px] flex-1 shrink-0 relative">
              <div className="flex items-center justify-between bg-white dark:bg-[#133020] rounded-full border border-gray-200 dark:border-white/10 p-1 shadow-xs focus-within:border-[#046241] dark:focus-within:border-[#FFC370] focus-within:ring-2 focus-within:ring-[#046241]/20 dark:focus-within:ring-[#FFC370]/20 transition-all">
                <div className="flex items-center gap-2 pl-3.5 flex-1 min-w-0">
                  <Search className="text-gray-400 dark:text-white/40 shrink-0" size={16} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search applicants or positions..."
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-[#133020] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 outline-none truncate"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-white shrink-0 pr-1 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  title="Filter Applicants"
                  className={`size-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ml-1 relative ${
                    isFilterMenuOpen || statusFilter !== 'all' || typeFilter !== 'all'
                      ? 'bg-[#046241] text-white shadow-sm dark:bg-[#FFC370] dark:text-[#133020]'
                      : 'bg-[#F9F7F7] dark:bg-white/10 text-[#133020] dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
                >
                  <Filter size={15} />
                  {(statusFilter !== 'all' || typeFilter !== 'all') && (
                    <span className="absolute top-1 right-1 size-2 rounded-full bg-[#FFB347] ring-1 ring-white dark:ring-[#133020]" />
                  )}
                </button>
              </div>

              {/* Mini Dropdown for Filters */}
              {isFilterMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-[340px] max-w-[calc(100%-10px)] bg-[#133020] dark:bg-[#08170d] text-white p-4 rounded-2xl border border-[#046241]/40 dark:border-white/15 shadow-2xl z-50 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-xs font-black uppercase tracking-wider text-white/80 flex items-center gap-1.5">
                      <Filter size={12} className="text-[#FFC370]" /> Filter Options
                    </span>
                    {(statusFilter !== 'all' || typeFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
                        className="text-[11px] font-bold text-[#FFC370] hover:underline cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                  </div>

                  {/* Applicant Type Pillboxes */}
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/50 block mb-2">Applicant Type</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setTypeFilter('all')}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer ${
                          typeFilter === 'all'
                            ? 'bg-white text-[#133020] border-transparent shadow-xs'
                            : 'bg-white/10 text-white/80 border-transparent hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        All ({stats.total})
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter(typeFilter === 'intern' ? 'all' : 'intern')}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                          typeFilter === 'intern'
                            ? 'bg-white text-[#133020] border-transparent shadow-xs'
                            : 'bg-white/10 text-white/80 border-transparent hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        <span>Intern</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          typeFilter === 'intern' ? 'bg-[#133020]/15 text-[#133020]' : 'bg-white/20 text-white'
                        }`}>
                          {stats.internCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTypeFilter(typeFilter === 'regular' ? 'all' : 'regular')}
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1 ${
                          typeFilter === 'regular'
                            ? 'bg-white text-[#133020] border-transparent shadow-xs'
                            : 'bg-white/10 text-white/80 border-transparent hover:bg-white/20 hover:text-white'
                        }`}
                      >
                        <span>Regular</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                          typeFilter === 'regular' ? 'bg-[#133020]/15 text-[#133020]' : 'bg-white/20 text-white'
                        }`}>
                          {stats.regularCount}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Status Pillboxes */}
                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-white/50 block mb-2">Application Status</label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {['all', 'accepted', 'rejected', 'pending'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(statusFilter === st ? 'all' : st)}
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border capitalize transition-all cursor-pointer ${
                            statusFilter === st
                              ? 'bg-white/25 text-white border-white/50 shadow-xs'
                              : 'bg-white/10 text-white/70 border-transparent hover:bg-white/20 hover:text-white'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Scrollable Workspace Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pt-4 sm:pt-6 lg:pt-6 space-y-6">
            {/* Top 5 Summary Stats Boxes */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-2 sm:gap-3.5 mb-6">
            <div 
              onClick={() => { setStatusFilter('all'); setTypeFilter('all'); }}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-xs flex flex-col items-center justify-center min-w-[90px] overflow-hidden ${
                statusFilter === 'all' && typeFilter === 'all'
                  ? 'bg-white dark:bg-[#133020] border-[#046241] dark:border-[#FFC370] ring-2 ring-[#046241]/20 dark:ring-[#FFC370]/20 shadow-md'
                  : 'bg-white/80 dark:bg-[#133020]/60 border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-[#133020]'
              }`}
            >
              <p className="text-xl sm:text-2xl font-black text-[#133020] dark:text-white">{stats.total}</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-white/60 mt-1 truncate max-w-full">TOTAL</p>
            </div>

            <div 
              onClick={() => setStatusFilter(statusFilter === 'accepted' ? 'all' : 'accepted')}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-xs flex flex-col items-center justify-center min-w-[90px] overflow-hidden ${
                statusFilter === 'accepted'
                  ? 'bg-[#046241]/10 dark:bg-[#046241]/30 border-[#046241] dark:border-[#FFC370] ring-2 ring-[#046241]/20 shadow-md'
                  : 'bg-white/80 dark:bg-[#133020]/60 border-gray-200 dark:border-white/10 hover:bg-[#046241]/5 dark:hover:bg-[#046241]/20'
              }`}
            >
              <p className="text-xl sm:text-2xl font-black text-[#046241] dark:text-[#FFC370]">{stats.accepted}</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#046241] dark:text-[#FFC370] mt-1 truncate max-w-full">ACCEPTED</p>
            </div>

            <div 
              onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-xs flex flex-col items-center justify-center min-w-[90px] overflow-hidden ${
                statusFilter === 'rejected'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-500 ring-2 ring-red-500/20 shadow-md'
                  : 'bg-white/80 dark:bg-[#133020]/60 border-gray-200 dark:border-white/10 hover:bg-red-50/50 dark:hover:bg-red-950/20'
              }`}
            >
              <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400">{stats.rejected}</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-1 truncate max-w-full">REJECTED</p>
            </div>

            <div 
              onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
              className={`p-3 sm:p-4 rounded-2xl border text-center transition-all cursor-pointer shadow-xs flex flex-col items-center justify-center min-w-[90px] overflow-hidden ${
                statusFilter === 'pending'
                  ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                  : 'bg-white/80 dark:bg-[#133020]/60 border-gray-200 dark:border-white/10 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
              }`}
            >
              <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-1 truncate max-w-full">PENDING</p>
            </div>

            <div className="p-3 sm:p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-[#133020]/60 text-center shadow-xs flex flex-col items-center justify-center min-w-[90px] overflow-hidden">
              <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">{stats.avgScore}%</p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mt-1 truncate max-w-full">AVG SCORE</p>
            </div>
          </div>
          {/* Filtering Pillboxes Card (below the summary stats cards) */}
          <div className="bg-[#133020] dark:bg-[#0a1e13] text-white p-3.5 sm:p-4 rounded-2xl border border-[#046241]/30 dark:border-white/10 shadow-md mb-6 flex flex-col gap-3 text-xs font-extrabold overflow-hidden">
            
            {/* Top row: Type filters (All, Intern, Regular) */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-full border transition-all cursor-pointer ${
                  typeFilter === 'all'
                    ? 'bg-white text-[#133020] border-transparent shadow-sm'
                    : 'text-white/80 border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                All {stats.total}
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter(typeFilter === 'intern' ? 'all' : 'intern')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'intern'
                    ? 'bg-white text-[#133020] border-transparent shadow-sm'
                    : 'text-white/80 border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Intern</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  typeFilter === 'intern' ? 'bg-[#133020]/15 text-[#133020]' : 'bg-white/20 text-white'
                }`}>
                  {stats.internCount}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter(typeFilter === 'regular' ? 'all' : 'regular')}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                  typeFilter === 'regular'
                    ? 'bg-white text-[#133020] border-transparent shadow-sm'
                    : 'text-white/80 border-transparent hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>Regular</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  typeFilter === 'regular' ? 'bg-[#133020]/15 text-[#133020]' : 'bg-white/20 text-white'
                }`}>
                  {stats.regularCount}
                </span>
              </button>
            </div>

            {/* Bottom row: Status filters */}
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap border-t border-white/10 pt-3">
              {['all', 'accepted', 'rejected', 'pending'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === st ? 'all' : st)}
                  className={`px-3 sm:px-3.5 py-1.5 rounded-full border capitalize transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-white/20 text-white border-white/40 shadow-xs'
                      : 'text-white/70 border-transparent hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Applicant Cards Grid Section */}
          <div className="transition-all duration-300 pb-12">
            {filteredApplicants.length === 0 ? (
              <div className="bg-white dark:bg-[#133020] rounded-2xl p-12 text-center border border-gray-200 dark:border-white/10 shadow-xs">
                <Users className="mx-auto text-gray-400 dark:text-white/30 mb-3" size={40} />
                <h3 className="text-lg font-bold text-[#133020] dark:text-white">No applicants found</h3>
                <p className="text-sm text-gray-500 dark:text-white/60 mt-1">
                  Try adjusting your search query or filter criteria.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }}
                  className="mt-4 px-4 py-2 bg-[#046241] text-white rounded-full text-xs font-bold hover:opacity-90 transition cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                  {filteredApplicants.map((app) => {
                    const isSelected = selectedId === app.id;
                    const badge = getStatusBadge(app.status);
                    const StatusIcon = badge.icon;

                    return (
                      <div
                        key={app.id}
                        onClick={() => { setSelectedId(app.id); setIsDetailOpen(true); }}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-xs hover:shadow-md ${
                          isSelected
                            ? 'bg-[#f5eedb]/50 dark:bg-white/10 border-[#046241] dark:border-[#FFC370] ring-2 ring-[#046241]/20 dark:ring-[#FFC370]/20'
                            : app.urgent
                            ? 'bg-white dark:bg-[#133020] border-[#FFB347] dark:border-[#FFC370] shadow-sm shadow-[#FFB347]/10'
                            : 'bg-white dark:bg-[#133020] border-gray-200 dark:border-white/10 hover:border-[#046241]/50 dark:hover:border-[#FFC370]/50'
                        }`}
                      >
                        {app.urgent && (
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FFB347] to-[#FFC370]" />
                        )}

                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="size-10 rounded-full bg-[#046241] text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm ring-2 ring-[#FFC370]/30 group-hover:scale-105 transition-transform">
                              {app.initials}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-[#133020] dark:text-white text-base truncate flex items-center gap-1.5">
                                {app.name}
                                {app.urgent && (
                                  <span title="Urgent Review Required" className="text-[#FFB347] dark:text-[#FFC370] shrink-0">
                                    <AlertTriangle size={14} />
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-white/60 flex items-center gap-1 truncate">
                                <MapPin size={11} className="shrink-0" />
                                {app.country}
                              </p>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm font-bold text-[#133020] dark:text-white mb-3">
                          {app.position}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40 capitalize">
                            {app.type}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                            <StatusIcon size={12} />
                            <span>{badge.label}</span>
                          </span>
                          {app.replies && app.replies.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 flex items-center gap-1">
                              <MessageSquare size={10} />
                              {app.replies.length}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4">
                          {app.skills.slice(0, 4).map((sk) => (
                            <span 
                              key={sk} 
                              className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 rounded text-[11px] font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                          {app.skills.length > 4 && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/60 rounded text-[11px] font-bold">
                              +{app.skills.length - 4}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10 text-xs text-gray-400 dark:text-white/50">
                          <span>Processed</span>
                          <span className="font-semibold">{app.timeAgo}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div> {/* End of Scrollable Workspace Content */}
        </div> {/* End of Left Workspace Column */}

        {/* Resizer Handle */}
        <div 
          onMouseDown={startResizing}
          title="Drag to resize applicants workspace pane"
          className={`hidden lg:flex w-2 -ml-1 h-full bg-transparent hover:bg-[#046241] dark:hover:bg-[#FFC370] cursor-col-resize transition-colors shrink-0 z-30 relative items-center justify-center group ${
            isResizing ? "bg-[#046241] dark:bg-[#FFC370]" : ""
          }`}
        >
          <div className="w-[2px] h-12 bg-gray-300 dark:bg-white/20 group-hover:bg-white dark:group-hover:bg-[#133020] rounded-full transition-colors" />
        </div>

          {/* Continuous Right Sidebar: Spans entire height from top to bottom exactly like Internal Mail! */}
          <div className={`flex-1 w-full flex-col h-full bg-white dark:bg-[#133020] border-l border-gray-200 dark:border-white/10 shadow-xl overflow-hidden min-w-0 ${
            selectedApplicant && isDetailOpen ? "flex" : "hidden lg:flex"
          }`}>
            {selectedApplicant && isDetailOpen ? (
              <>
                {/* Unified Design Header Toolbar for Sidebar (without Star button as requested!) */}
                <div className="flex h-14 items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#133020] px-6 shrink-0 sticky top-0 z-20 gap-4 overflow-x-auto">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-white/60 shrink-0">
                    <button 
                      onClick={() => setIsDetailOpen(false)}
                      title="Back to applicants list" 
                      className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-extrabold bg-gray-100 dark:bg-white/10 px-3 mr-2 text-[#133020] dark:text-white" 
                      type="button"
                    >
                      <ChevronLeft size={18} />
                      <span>Back</span>
                    </button>
                    <button 
                      onClick={() => selectAdjacentApplicant(-1)}
                      title="Previous Applicant (Arrow Left)" 
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer" 
                      type="button"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button 
                      onClick={() => selectAdjacentApplicant(1)}
                      title="Next Applicant (Arrow Right)" 
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white transition cursor-pointer" 
                      type="button"
                    >
                      <ArrowRight size={18} />
                    </button>

                    <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10 mx-1" />

                    {/* Archive and Delete Buttons with Card Design in Upper Header */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(selectedApplicant.id, 'archived')}
                      title="Archive Applicant"
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-[#133020] dark:text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-gray-200 dark:border-white/10 shadow-xs"
                    >
                      <Archive size={14} />
                      <span>Archive</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteApplicant(selectedApplicant.id)}
                      title="Delete / Remove Applicant"
                      className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-200 hover:text-red-700 dark:hover:text-white border border-red-200 dark:border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button 
                      onClick={() => { setIsDetailOpen(false); setSelectedId(null); }}
                      title="Close applicant view (X)"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer" 
                      type="button"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Scrollable Right Sidebar Body (Card acts as the sidetab heading!) */}
                <div className="overflow-y-auto flex-1">

                  {/* 1. Dark Green Top Header Card */}
                  <div className="bg-[#0c1f14] dark:bg-black/40 text-white rounded-2xl m-4 p-5 border border-emerald-500/20 shadow-md">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-11 rounded-full bg-[#046241] text-white font-black text-sm flex items-center justify-center shrink-0 ring-2 ring-emerald-400/30 shadow-md">
                        {selectedApplicant.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white truncate">
                          Application for {selectedApplicant.position}
                        </h3>
                        <p className="text-xs text-emerald-200/60 mt-0.5 truncate">
                          {selectedApplicant.name} · {selectedApplicant.timeAgo}
                        </p>
                      </div>
                    </div>

                    {/* Badges Row inside Dark Card */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-3.5">
                      {selectedApplicant.urgent && (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-black bg-[#FFB347] dark:bg-[#FFC370] text-[#133020] shadow-2xs">
                          Urgent
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 capitalize">
                        {selectedApplicant.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1 ${selectedStatusBadge?.bg || ''}`}>
                        {SelectedStatusIcon && <SelectedStatusIcon size={11} />}
                        <span>{selectedStatusBadge?.label || 'Pending'}</span>
                      </span>
                    </div>

                    {/* Glowing Match Score at Bottom Right */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-end gap-2">
                      <span className="text-[10px] uppercase font-bold text-emerald-300/70 tracking-wider">Match Score</span>
                      <div className="size-10 rounded-full border-2 border-emerald-400 bg-emerald-950/60 flex items-center justify-center text-emerald-400 font-black text-sm shadow-lg shadow-emerald-500/20 shrink-0" title={`Match Score: ${selectedApplicant.matchScore}%`}>
                        {selectedApplicant.matchScore}
                      </div>
                    </div>
                  </div>

                  {/* 2. 1x3 Metadata Grid with borders side-by-side (Position, Work Experience, Education) */}
                  <div className="grid grid-cols-3 border-y border-gray-200 dark:border-white/10 text-xs">
                    <div className="p-4 border-r border-gray-200 dark:border-white/10 overflow-hidden">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1 truncate">
                        <Briefcase size={12} className="text-[#046241] dark:text-[#FFC370] shrink-0" />
                        POSITION
                      </span>
                      <span className="font-semibold text-[#133020] dark:text-white text-sm truncate block" title={selectedApplicant.position}>
                        {selectedApplicant.position}
                      </span>
                    </div>
                    <div className="p-4 border-r border-gray-200 dark:border-white/10 overflow-hidden">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1 truncate">
                        <Award size={12} className="text-[#046241] dark:text-[#FFC370] shrink-0" />
                        WORK EXPERIENCE
                      </span>
                      <span className="font-semibold text-[#133020] dark:text-white text-sm">
                        {selectedApplicant.experience}
                      </span>
                    </div>
                    <div className="p-4 overflow-hidden">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-1 truncate">
                        <GraduationCap size={12} className="text-[#046241] dark:text-[#FFC370] shrink-0" />
                        EDUCATION
                      </span>
                      <span className="font-semibold text-[#133020] dark:text-white text-sm">
                        {selectedApplicant.education}
                      </span>
                    </div>
                  </div>

                  {/* 4. Scrollable Body Content (Message, Skills, Attachment, HR Decision, Reply Box) */}
                  <div className="p-6 space-y-6">
                    
                    {/* MESSAGE Section */}
                    <div>
                      <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2.5">
                        COVER LETTER / MESSAGE
                      </h4>
                      <div className="text-gray-700 dark:text-white/90 whitespace-pre-line leading-relaxed text-xs sm:text-sm font-normal">
                        {selectedApplicant.message}
                      </div>
                    </div>

                    {/* EMAIL Section */}
                    <div className="pt-3 border-t border-gray-100 dark:border-white/10">
                      <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2.5">
                        EMAIL
                      </h4>
                      <div className="p-3.5 bg-gray-900 text-emerald-400 dark:bg-black dark:text-emerald-300 rounded-xl border border-gray-800 dark:border-white/10 font-mono text-[11px] overflow-x-auto whitespace-pre leading-relaxed shadow-inner max-h-72 overflow-y-auto">
                        {selectedApplicant.rawEmail}
                      </div>
                    </div>

                    {/* SKILLS Section */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                      <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2.5">
                        SKILLS
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedApplicant.skills.map((sk) => (
                          <span
                            key={sk}
                            className="px-3.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white rounded-full text-xs font-bold border border-gray-200 dark:border-white/10 shadow-2xs"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* ATTACHMENT Section */}
                    <div>
                      <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-2.5">
                        ATTACHMENT
                      </h4>
                      <div 
                        onClick={() => alert(`Opening document: ${selectedApplicant.resumeName}`)}
                        className="flex items-center justify-between p-4 rounded-2xl bg-[#f5eedb]/60 dark:bg-white/5 border border-[#046241]/20 dark:border-[#FFC370]/30 hover:border-[#046241] transition cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="p-2.5 rounded-xl bg-[#FFB347]/20 text-[#FFB347] dark:text-[#FFC370] shrink-0 font-bold flex items-center justify-center">
                            <FileText size={20} className="text-[#FFB347]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-extrabold text-[#133020] dark:text-white truncate group-hover:text-[#046241] dark:group-hover:text-[#FFC370] transition-colors">
                              {selectedApplicant.resumeName}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-white/60 font-medium mt-0.5">
                              PDF • {selectedApplicant.resumeSize}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FUNCTIONAL HR DECISION BUTTONS */}
                    <div>
                      <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-wider mb-3">
                        HR DECISION
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedApplicant.id, 'accepted')}
                          className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                            selectedApplicant.status === 'accepted'
                              ? 'bg-[#046241] text-white ring-2 ring-[#FFC370] shadow-md'
                              : 'bg-[#046241] hover:opacity-90 text-white'
                          }`}
                        >
                          <Check size={14} />
                          <span>Accept</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedApplicant.id, 'rejected')}
                          className={`py-2 px-3 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                            selectedApplicant.status === 'rejected'
                              ? 'bg-red-500 text-white ring-2 ring-red-300 shadow-md'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleUrgent(selectedApplicant.id)}
                          className={`py-2 px-3 rounded-full text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm ${
                            selectedApplicant.urgent
                              ? 'bg-[#FFB347] text-[#133020] border-[#FFB347] ring-2 ring-[#133020] shadow-md font-black'
                              : 'bg-[#FFB347]/20 dark:bg-[#FFC370]/20 text-[#133020] dark:text-[#FFC370] border-[#FFB347] dark:border-[#FFC370] hover:bg-[#FFB347]/30'
                          }`}
                        >
                          <AlertTriangle size={14} className={selectedApplicant.urgent ? 'text-[#133020] fill-current' : 'text-[#FFB347] dark:text-[#FFC370]'} />
                          <span>Urgent</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(selectedApplicant.id, 'archived')}
                          className={`py-2 px-3 rounded-full text-xs font-bold border flex items-center justify-center gap-1.5 transition cursor-pointer ${
                            selectedApplicant.status === 'archived'
                              ? 'bg-gray-200 dark:bg-white/20 text-gray-800 dark:text-white border-gray-400 font-black'
                              : 'bg-transparent text-gray-600 dark:text-white/80 border-gray-300 dark:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          <Archive size={13} />
                          <span>Archive</span>
                        </button>
                      </div>
                    </div>

                    {/* Previous Replies List */}
                    {selectedApplicant.replies && selectedApplicant.replies.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
                        <h4 className="text-[10px] font-extrabold text-gray-400 dark:text-white/40 uppercase tracking-wider">
                          REPLY HISTORY ({selectedApplicant.replies.length})
                        </h4>
                        {selectedApplicant.replies.map(rep => (
                          <div key={rep.id} className="p-3.5 rounded-2xl bg-[#f5eedb]/40 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs">
                            <div className="flex justify-between font-bold text-[#046241] dark:text-[#FFC370] mb-1">
                              <span>{rep.sender}</span>
                              <span className="text-[10px] text-gray-400 dark:text-white/40">{rep.timestamp}</span>
                            </div>
                            <p className="text-gray-700 dark:text-white/80">{rep.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FUNCTIONAL REPLY BOX */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                      <div className="border border-gray-200 dark:border-white/15 rounded-2xl overflow-hidden bg-[#f5eedb]/30 dark:bg-white/5 focus-within:border-[#046241] dark:focus-within:border-[#FFC370] focus-within:ring-1 focus-within:ring-[#046241] transition-all">
                        <div className="px-3.5 py-2.5 border-b border-gray-200/60 dark:border-white/10 flex items-center gap-2 text-xs font-bold text-[#046241] dark:text-[#FFC370]">
                          <Reply size={14} className="rotate-180" />
                          <span>Reply to {selectedApplicant.name.split(' ')[0]}</span>
                        </div>

                        <textarea
                          rows={3}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="w-full p-3.5 bg-transparent text-xs text-[#133020] dark:text-white placeholder-gray-400 dark:placeholder-white/40 outline-none resize-none leading-relaxed"
                        />

                        <div className="flex items-center justify-between px-3.5 py-2 bg-white/60 dark:bg-black/20 border-t border-gray-200/60 dark:border-white/10">
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-white/60">
                            <button 
                              type="button" 
                              onClick={() => alert("Text alignment formatting")}
                              title="Align"
                              className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-white/10 rounded-lg hover:text-[#133020] dark:hover:text-white transition cursor-pointer"
                            >
                              <AlignLeft size={15} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => alert("Attach interview schedule or document")}
                              title="Attach File"
                              className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-white/10 rounded-lg hover:text-[#133020] dark:hover:text-white transition cursor-pointer"
                            >
                              <Paperclip size={15} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => alert("Insert template tag")}
                              title="Tag"
                              className="p-1.5 hover:bg-gray-200/60 dark:hover:bg-white/10 rounded-lg hover:text-[#133020] dark:hover:text-white transition cursor-pointer"
                            >
                              <Hash size={15} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSendReply(selectedApplicant.id)}
                            disabled={!replyText.trim()}
                            className="px-4 py-1.5 bg-[#046241] hover:bg-opacity-90 disabled:opacity-40 text-white font-bold text-xs rounded-full flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                          >
                            <Send size={13} />
                            <span>Send</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </>
            ) : (
              /* Clean Empty State when No Applicant is Selected or Back/Close was clicked */
              <div className="flex-1 w-full h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in mx-auto my-auto">
                <div className="p-5 rounded-full bg-[#f5eedb] dark:bg-[#046241]/20 border border-gray-200 dark:border-white/10 text-[#046241] dark:text-[#FFC370] mb-4 shadow-sm">
                  <Users size={44} />
                </div>
                <h3 className="text-xl font-black text-[#133020] dark:text-white">No Applicant Selected</h3>
                <p className="mt-2 text-xs leading-6 text-gray-500 dark:text-white/60 max-w-md mx-auto">
                  Select an applicant from the list on the left to view their cover letter, screening score, resume, and communication history.
                </p>
              </div>
            )}
          </div>

      </main>

      <ChatbotAssistant />
    </div>
  );
}
