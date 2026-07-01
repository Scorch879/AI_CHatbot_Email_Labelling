import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MessageCircle, LayoutDashboard, FileText, Settings, LogOut, Sun, Moon, Mail, PieChart, Users, UserCheck, Briefcase, Inbox, ShieldCheck, BarChart3 } from 'lucide-react';
import logo from '../assets/logo.jpg';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, intern: 0, regular: 0, rate: 0 });
  const [chartData, setChartData] = useState([]);
  const [filter, setFilter] = useState('Yearly');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('applicants').select('status, type, created_at');
      if (!data) return;
      
      const total = data.length;
      const intern = data.filter(a => a.type === 'intern').length;
      const regular = data.filter(a => a.type === 'regular').length;
      const accepted = data.filter(a => a.status === 'accepted').length;
      setStats({ total, intern, regular, rate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0 });

      let processed = [];
      if (filter === 'Yearly') {
        processed = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ name: m, InternAccepted: Math.floor(Math.random()*10), InternRejected: Math.floor(Math.random()*5), RegularAccepted: Math.floor(Math.random()*10), RegularRejected: Math.floor(Math.random()*5) }));
      } else if (filter === 'Monthly') {
        processed = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => ({ name: w, InternAccepted: Math.floor(Math.random()*8), InternRejected: Math.floor(Math.random()*4), RegularAccepted: Math.floor(Math.random()*8), RegularRejected: Math.floor(Math.random()*4) }));
      } else {
        processed = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => ({ name: d, InternAccepted: Math.floor(Math.random()*3), InternRejected: Math.floor(Math.random()*2), RegularAccepted: Math.floor(Math.random()*3), RegularRejected: Math.floor(Math.random()*2) }));
      }
      setChartData(processed);
    };
    fetchData();
  }, [filter]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors font-sans">
      <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="Lifemail Logo" className="h-12 w-auto object-contain" />
          </div>
          <div className="space-y-4">
            <button className="flex items-center gap-3 text-[#046241] dark:text-green-400 font-bold"><LayoutDashboard size={20}/> Dashboard</button>
            <button className="flex items-center gap-3 text-gray-500 dark:text-gray-400"><FileText size={20}/> Applicants</button>
            <button className="flex items-center gap-3 text-gray-500 dark:text-gray-400"><Mail size={20}/> Internal Mail</button>
            <button className="flex items-center gap-3 text-gray-500 dark:text-gray-400"><PieChart size={20}/> Reports</button>
            <button className="flex items-center gap-3 text-gray-500 dark:text-gray-400"><Settings size={20}/> Settings</button>
          </div>
        </div>
        <div className="space-y-4">
          <button onClick={toggleDarkMode} className="flex items-center gap-3 text-gray-600 dark:text-gray-300 font-bold w-full">
            {isDarkMode ? <Sun size={20}/> : <Moon size={20}/>} {isDarkMode ? 'Light' : 'Dark'} Mode
          </button>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/'))} className="flex items-center gap-3 text-red-500 font-bold w-full">
            <LogOut size={20}/> Logout
          </button>
        </div>
      </nav>

      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#133020] dark:text-white">Dashboard</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Applicant analytics · Lifewood Data Technology</p>
          </div>
          
          <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-full border border-gray-300 dark:border-gray-700">
            {['Yearly', 'Monthly', 'Weekly'].map((option) => (
              <button key={option} onClick={() => setFilter(option)} className={`px-6 py-1.5 rounded-full text-sm font-semibold transition-all ${filter === option ? 'bg-[#046241] text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-8">
          {[ 
            {l: 'Total Applicants', v: stats.total, i: <Users/>, c: 'text-blue-500', b: 'bg-blue-100 dark:bg-blue-900/30'}, 
            {l: 'Interns Accepted', v: stats.intern, i: <Briefcase/>, c: 'text-purple-500', b: 'bg-purple-100 dark:bg-purple-900/30'}, 
            {l: 'Regular Accepted', v: stats.regular, i: <UserCheck/>, c: 'text-green-500', b: 'bg-green-100 dark:bg-green-900/30'}, 
            {l: 'Acceptance Rate', v: stats.rate + '%', i: <PieChart/>, c: 'text-orange-500', b: 'bg-orange-100 dark:bg-orange-900/30'}
          ].map(s => (
            <div key={s.l} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.b} ${s.c}`}>{s.i}</div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.l}</p>
                <p className="text-2xl font-extrabold text-[#133020] dark:text-white">{s.v}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Insert francis: Internal Mail CTA and info panel so both features are present */}
        <section className="grid gap-4 md:grid-cols-3 mb-8">
          <button
            onClick={() => navigate('/dashboard/internal-mail')}
            className="group rounded-2xl border border-[#ffc370]/30 bg-[#133020] p-6 text-left shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#ffc370]/70 text-white"
          >
            <Inbox className="text-[#ffc370]" size={28} />
            <h2 className="mt-5 text-xl font-black text-white">Internal Mail</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Open the HR inbox UI prepared for live message data.
            </p>
          </button>

          <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
            <Users className="text-[#ffb347]" size={28} />
            <h2 className="mt-5 text-xl font-black">Applicants</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Candidate records and extracted email labels.</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.06] p-6">
            <BarChart3 className="text-[#ffb347]" size={28} />
            <h2 className="mt-5 text-xl font-black">Reports</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">Excel exports and HR automation summaries.</p>
          </article>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#f5eedb] p-6 text-[#133020] mb-8">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 text-[#046241]" size={22} />
            <div>
              <h2 className="text-lg font-black">Internal Mail is ready to connect</h2>
              <p className="mt-1 text-sm leading-6 text-[#133020]/70">
                The dashboard now routes to the Internal Mail page. Wire the page to Supabase or an API endpoint when the live inbox feed is available.
              </p>
            </div>
          </div>
        </section>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 h-96 flex items-center justify-center">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ paddingTop: '20px', display: 'flex', justifyContent: 'center', gap: '40px' }} />
                <Bar dataKey="InternAccepted" fill="#10b981" />
                <Bar dataKey="InternRejected" fill="#f87171" />
                <Bar dataKey="RegularAccepted" fill="#34d399" />
                <Bar dataKey="RegularRejected" fill="#fb923c" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-gray-500 dark:text-gray-400 font-bold text-xl">NO DATA AVAILABLE</div>
          )}
        </div>

        <button className="fixed bottom-8 right-8 bg-[#046241] p-4 rounded-full text-white shadow-lg hover:scale-110 transition-transform">
          <MessageCircle size={30} />
        </button>
      </main>
    </div>
  );
};
export default Dashboard;