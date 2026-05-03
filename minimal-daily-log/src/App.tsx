import { useState } from 'react';
import { Home, ShoppingBag, Sparkles, Target, PenLine, Edit2, Check, LogOut } from 'lucide-react';
import HomeView from './views/HomeView';
import WishlistView from './views/WishlistView';
import AILogView from './views/AILogView';
import FocusView from './views/FocusView';
import MemoView from './views/MemoView';
import LoginView from './views/LoginView';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './lib/useLocalStorage';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [appName, setAppName] = useLocalStorage('app_name', 'Daily Log');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(appName);

  const tabs = [
    { id: 'home', icon: Home, label: '홈' },
    { id: 'wishlist', icon: ShoppingBag, label: '위시·소비' },
    { id: 'focus', icon: Target, label: '집중 목록' },
    { id: 'ai', icon: Sparkles, label: 'AI 일지' },
    { id: 'memo', icon: PenLine, label: '메모장' },
  ];

  const handleNameSave = () => {
    if (tempName.trim()) {
      setAppName(tempName.trim());
    } else {
      setTempName(appName);
    }
    setIsEditingName(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAFCFF] via-[#F4F5F7] to-[#EDEDF1] flex items-center justify-center">
        <p className="text-slate-400 font-bold">로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFCFF] via-[#F4F5F7] to-[#EDEDF1] text-slate-800 selection:bg-[#E2E8F0]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/40 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-white/60 mb-4 lg:mb-8">
        <div className="flex items-center gap-2">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => { if (e.key === 'Enter') handleNameSave(); }}
                className="text-[18px] font-bold tracking-tight text-slate-800 bg-white/80 border border-white px-2 py-0.5 rounded-lg outline-none focus:ring-2 focus:ring-[#D0DDF0] w-32 shadow-sm"
              />
            </div>
          ) : (
            <h1 className="text-[18px] font-bold tracking-tight text-slate-800 flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsEditingName(true)}>
              {appName.split(' ')[0]} <span className="text-[#6B8A9E] font-medium">{appName.split(' ').slice(1).join(' ')}</span>
              <Edit2 size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
          )}
        </div>
        <button 
          onClick={logout} 
          className="text-slate-400 hover:text-rose-400 transition-colors bg-white/50 p-2 rounded-full outline-none"
          title="로그아웃"
        >
          <LogOut size={16} strokeWidth={2.5} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="px-5 md:px-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && <HomeView key="home" />}
          {activeTab === 'wishlist' && <WishlistView key="wishlist" />}
          {activeTab === 'ai' && <AILogView key="ai" />}
          {activeTab === 'focus' && <FocusView key="focus" />}
          {activeTab === 'memo' && <MemoView key="memo" />}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white/60 backdrop-blur-xl border-t border-white/80 px-6 pt-3 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1.5 p-2 transition-colors stretch flex-1 outline-none ${isActive ? 'text-[#4A697E]' : 'text-slate-400 hover:text-slate-500'}`}
              >
                <div className="relative">
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-bg"
                      className="absolute inset-0 bg-black/[0.03] rounded-full scale-[1.7]"
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    />
                  )}
                  <motion.div
                    animate={{ scale: isActive ? 1.05 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="relative z-10"
                  >
                    <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </motion.div>
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-semibold'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
