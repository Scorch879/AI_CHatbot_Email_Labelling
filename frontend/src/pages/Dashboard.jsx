import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Inbox, LogOut, ShieldCheck, Users, BarChart3 } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#07130d] p-6 text-[#f9f7f7]">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#0b2014] p-6 shadow-2xl shadow-black/30 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ffc370]">Lifemail</p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">HR Email Automation Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
              Manage internal HR messages, applicants, and reports from one secure workspace.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-300/20 bg-red-500/10 px-4 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
          >
            <LogOut size={16} />
            Log out
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => navigate('/dashboard/internal-mail')}
            className="group rounded-2xl border border-[#ffc370]/30 bg-[#133020] p-6 text-left shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#ffc370]/70"
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

        <section className="rounded-2xl border border-white/10 bg-[#f5eedb] p-6 text-[#133020]">
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
      </div>
    </div>
  );
};

export default Dashboard;
