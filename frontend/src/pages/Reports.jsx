import React, { useState, useEffect, useMemo } from 'react';
import { FileDown, UserCheck, UserX } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { supabase } from '../supabaseClient';

const SummaryCard = ({ title, count, avgMatch, color, icon: Icon }) => (
  <div className="bg-white dark:bg-[#133020] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs flex flex-col justify-between">
    <div className="flex justify-between items-start mb-4">
      <Icon size={20} style={{ color: color }} />
      <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 tracking-wider">avg match</span>
    </div>
    <p className="text-3xl font-black text-[#133020] dark:text-white">{count}</p>
    <h3 className="text-sm font-bold text-[#133020] dark:text-white mt-1">{title}</h3>
    <div className="w-full bg-gray-100 dark:bg-white/10 h-1.5 mt-4 rounded-full overflow-hidden">
      <div style={{ width: `${avgMatch || 0}%`, backgroundColor: color }} className="h-full rounded-full"></div>
    </div>
    <p className="text-[10px] font-bold mt-2" style={{ color: color }}>{avgMatch || 0}% avg</p>
  </div>
);

const ReportsPage = () => {
  const [applicants, setApplicants] = useState([]);
  const [activeTab, setActiveTab] = useState('internAcc');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const { data } = await supabase.from('applicants').select('*');
        setApplicants(data || []);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplicants();
  }, []);

  const stats = useMemo(() => {
    const filter = (t, s) => applicants.filter(a => 
      String(a.type || '').toLowerCase().includes(t.toLowerCase()) && 
      String(a.status || '').toLowerCase().includes(s.toLowerCase())
    );

    const getAvg = (list) => list.length > 0 
      ? Math.round(list.reduce((acc, curr) => acc + (Number(curr.match_score) || Number(curr.matchScore) || Number(curr.score) || 0), 0) / list.length) 
      : 0;

    return {
      internAcc: { list: filter('intern', 'accepted'), color: '#046241', icon: UserCheck, label: 'Intern - Accepted' },
      internRej: { list: filter('intern', 'rejected'), color: '#dc2626', icon: UserX, label: 'Intern - Rejected' },
      regAcc: { list: filter('regular', 'accepted'), color: '#046241', icon: UserCheck, label: 'Regular - Accepted' },
      regRej: { list: filter('regular', 'rejected'), color: '#ea580c', icon: UserX, label: 'Regular - Rejected' }
    };
  }, [applicants]);

  return (
    <div className="flex min-h-screen bg-[#F9F7F7] dark:bg-[#08170d] font-sans text-[#133020] dark:text-[#eff7ed]">
      <Sidebar activeTab="Reports" />
      <main className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#133020] dark:text-white tracking-tight">Reports</h1>
            <p className="text-sm text-gray-500 dark:text-white/60">Applicant summary · Export to Excel</p>
          </div>
          <button className="flex items-center gap-2 bg-[#046241] dark:bg-[#FFC370] hover:opacity-90 text-white dark:text-[#133020] px-6 py-2.5 rounded-full text-sm font-bold transition shadow-xs">
            <FileDown size={16} /> Export to Excel
          </button>
        </div>

        <div className="grid grid-cols-4 gap-6 mb-10">
          {Object.entries(stats).map(([key, val]) => (
            <SummaryCard 
              key={key}
              title={val.label} 
              count={val.list.length} 
              avgMatch={val.avg}
              color={val.color} 
              icon={val.icon}
            />
          ))}
        </div>

        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-[#133020] p-1.5 rounded-full inline-flex border border-gray-200 dark:border-white/10 shadow-xs">
            {Object.entries(stats).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-8 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTab === key ? 'bg-[#046241] text-white shadow-md dark:bg-[#046241]' : 'text-gray-500 dark:text-white/70 hover:text-[#133020] dark:hover:text-white'
                }`}
              >
                {val.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#133020] p-8 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs">
          <h2 className="text-lg font-extrabold text-[#133020] dark:text-white mb-6">• {stats[activeTab].label}</h2>
          {isLoading ? <p className="text-center py-10">Loading...</p> : stats[activeTab].list.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase text-gray-400 dark:text-white/40 border-b border-gray-200 dark:border-white/10">
                  <th className="pb-4">Name</th>
                  <th className="pb-4">Position</th>
                  <th className="pb-4">Country</th>
                  <th className="pb-4">Education</th>
                  <th className="pb-4">AI Score</th>
                  <th className="pb-4">Applied</th>
                </tr>
              </thead>
              <tbody className="text-sm font-bold text-[#133020] dark:text-white">
                {stats[activeTab].list.map((app, i) => (
                  <tr key={i} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="py-5">{app.name || app.full_name || 'N/A'}</td>
                    <td className="py-5 text-gray-600 dark:text-white/70 font-normal">{app.position || app.role || 'N/A'}</td>
                    <td className="py-5 text-gray-600 dark:text-white/70 font-normal">{app.country || 'N/A'}</td>
                    <td className="py-5 text-gray-600 dark:text-white/70 font-normal">{app.education || 'N/A'}</td>
                    <td className="py-5" style={{ color: stats[activeTab].color }}>{app.match_score || app.matchScore || app.score || 0}%</td>
                    <td className="py-5 text-gray-500 font-normal">{app.timeAgo || 'Recently'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">No applicants found in this category.</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;