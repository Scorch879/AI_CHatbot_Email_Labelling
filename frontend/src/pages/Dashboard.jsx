import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#f9f7f7] flex flex-col items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-[600px] p-8 border border-gray-100 text-center">
        <h1 className="text-3xl font-extrabold text-[#133020] mb-4">Welcome to your Dashboard</h1>
        <p className="text-gray-600 mb-8">This is a temporary dashboard page. You have successfully authenticated!</p>
        <button 
          onClick={handleLogout}
          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-6 rounded-lg transition-colors border border-red-200"
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
