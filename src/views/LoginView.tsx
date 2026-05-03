import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginView() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFCFF] via-[#F4F5F7] to-[#EDEDF1] text-slate-800 flex items-center justify-center p-6 selection:bg-[#E2E8F0]">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-white mx-auto w-full max-w-sm p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D0DDF0]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E8EDF2]/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 mix-blend-multiply" />

        <div className="relative z-10">
          <div className="w-16 h-16 bg-[#F8FAFC] rounded-2xl mx-auto flex items-center justify-center mb-6 border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <LogIn size={28} className="text-[#6B8A9E]" />
          </div>
          
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">Daily Log</h1>
          <p className="text-sm font-bold text-slate-400 mb-8 opacity-80">
            나의 기록을 클라우드에 안전하게 보관하세요.
          </p>

          <button
            onClick={login}
            className="w-full bg-[#4A697E] text-white font-bold py-4 rounded-[20px] shadow-lg shadow-[#4A697E]/20 transition-all hover:-translate-y-0.5 hover:bg-[#3d576a] active:scale-[0.98] outline-none"
          >
            Google 로 로그인
          </button>
        </div>
      </motion.div>
    </div>
  );
}
