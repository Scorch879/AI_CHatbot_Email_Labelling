import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Users, UserCheck, Briefcase } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ChatbotAssistant from '../components/ChatbotAssistant';

const Dashboard = () => {
  const [stats, setStats] = useState({ total: 0, intern: 0, regular: 0, rate: 0 });
  const [chartData, setChartData] = useState([]);
  const [filter, setFilter] = useState('Yearly');

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('applicants').select('status, type, created_at');
      if (!data) return;
      
      const total = data.length;
      const intern = data.filter(a => a.type === 'intern').length;
      const regular = data.filter(a => a.type === 'regular').length;
      const accepted = data.filter(a => a.status === 'accepted').length;
      setStats({ total, intern, regular, rate: total > 0 ? ((accepted / total) * 100).toFixed(1) : 0 });

      let processed;
      if (filter === 'Yearly') {
        processed = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => ({ 
          name: m, 
          InternAccepted: Math.floor(Math.random()*10), 
          InternRejected: Math.floor(Math.random()*5), 
          RegularAccepted: Math.floor(Math.random()*10), 
          RegularRejected: Math.floor(Math.random()*5) 
        }));
      } else if (filter === 'Monthly') {
        processed = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].map(w => ({ 
          name: w, 
          InternAccepted: Math.floor(Math.random()*8), 
          InternRejected: Math.floor(Math.random()*4), 
          RegularAccepted: Math.floor(Math.random()*8), 
          RegularRejected: Math.floor(Math.random()*4) 
        }));
      } else {
        processed = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => ({ 
          name: d, 
          InternAccepted: Math.floor(Math.random()*5), 
          InternRejected: Math.floor(Math.random()*2), 
          RegularAccepted: Math.floor(Math.random()*5), 
          RegularRejected: Math.floor(Math.random()*2) 
        }));
      }
      setChartData(processed);
    };
    fetchData();
  }, [filter]);

  return (
    <div className="flex min-h-screen bg-[#F9F7F7] dark:bg-[#08170d] transition-colors font-sans text-[#133020] dark:text-[#eff7ed]">
      <Sidebar activeTab="Dashboard" />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#133020] dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-gray-500 dark:text-white/60 text-sm mt-1">Applicant analytics · Lifewood Data Technology</p>
          </div>
          
          <div className="flex bg-white dark:bg-[#133020] p-1 rounded-full border border-gray-200 dark:border-white/10 shadow-xs self-start sm:self-auto">
            {['Yearly', 'Monthly', 'Weekly'].map((option) => (
              <button 
                key={option} 
                onClick={() => setFilter(option)} 
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  filter === option 
                    ? 'bg-[#046241] text-white shadow-md shadow-[#046241]/20' 
                    : 'text-[#133020]/70 dark:text-white/70 hover:bg-[#f5eedb] dark:hover:bg-white/10 hover:text-[#133020] dark:hover:text-white'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Analytics Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[ 
            { l: 'Total Applicants', v: stats.total, i: <Users/>, c: 'text-[#046241] dark:text-[#FFC370]', b: 'bg-[#f5eedb] dark:bg-[#046241]/20' }, 
            { l: 'Interns Accepted', v: stats.intern, i: <Briefcase/>, c: 'text-[#046241] dark:text-[#FFC370]', b: 'bg-[#f5eedb] dark:bg-[#046241]/20' }, 
            { l: 'Regular Accepted', v: stats.regular, i: <UserCheck/>, c: 'text-[#046241] dark:text-[#FFC370]', b: 'bg-[#f5eedb] dark:bg-[#046241]/20' }, 
            { l: 'Acceptance Rate', v: stats.rate + '%', i: <PieChart/>, c: 'text-[#046241] dark:text-[#FFC370]', b: 'bg-[#f5eedb] dark:bg-[#046241]/20' }
          ].map((s) => (
            <div 
              key={s.l} 
              className="bg-white dark:bg-[#133020] p-6 rounded-2xl shadow-xs border border-gray-200 dark:border-white/10 flex items-center gap-4 transition-all hover:shadow-md hover:border-[#FFC370]/50"
            >
              <div className={`p-3.5 rounded-xl ${s.b} ${s.c}`}>{s.i}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/60">{s.l}</p>
                <p className="text-2xl font-extrabold text-[#133020] dark:text-white mt-0.5">{s.v}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Analytics Chart */}
        <div className="bg-white dark:bg-[#133020] p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-200 dark:border-white/10 h-[400px] flex flex-col justify-between">
          <h3 className="text-base font-black text-[#133020] dark:text-white mb-4">Acceptance Analytics ({filter})</h3>
          <div className="flex-1 w-full min-h-0">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                  <XAxis dataKey="name" stroke="#88888880" fontSize={12} tickLine={false} />
                  <YAxis stroke="#88888880" fontSize={12} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#133020', 
                      color: '#ffffff', 
                      borderRadius: '12px', 
                      border: '1px solid #FFC370',
                      fontWeight: 'bold',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px', fontWeight: 'bold' }} />
                  <Bar dataKey="InternAccepted" name="Intern Accepted" fill="#046241" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="InternRejected" name="Intern Rejected" fill="#f87171" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="RegularAccepted" name="Regular Accepted" fill="#FFC370" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="RegularRejected" name="Regular Rejected" fill="#FFB347" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400 dark:text-white/40 font-bold text-lg h-full flex items-center justify-center">NO DATA AVAILABLE</div>
            )}
          </div>
        </div>

        <ChatbotAssistant />
      </main>
    </div>
  );
};
export default Dashboard;