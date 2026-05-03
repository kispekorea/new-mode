import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreCollection } from '../lib/useFirestoreSync';
import { BodyStateRecord, BodyWeightState, RhythmState, WalkState, MuscleState, BodyCheckState } from '../types';
import { MessageSquare, Moon, X, BarChart2, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

type ChartPeriod = '1w' | '1m' | '6m' | '1y';

const MOOD_EMOJIS = ['😃', '😎', '😌', '😐', '😔', '😫', '😡', '🌤️', '🌧️', '❄️', '🌿', '☕'];

export default function HomeView() {
  const { data: records, updateItem } = useFirestoreCollection<BodyStateRecord>('bodyRecords');
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1w');
  const [showChart, setShowChart] = useState(false);
  
  const getTodayStr = () => {
    const offset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().split('T')[0];
  };

  const [realTodayStr, setRealTodayStr] = useState(getTodayStr());

  useEffect(() => {
    const checkDate = () => {
      const current = getTodayStr();
      if (current !== realTodayStr) {
        setRealTodayStr(current);
      }
    };
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, [realTodayStr]);

  const [viewDateStr, setViewDateStr] = useState(realTodayStr);

  useEffect(() => {
    if (viewDateStr < realTodayStr && viewDateStr !== realTodayStr) {
      // Do not auto-force if user is viewing past. But if they just opened the app, 
      // or if it was the same as old realToday, we could... let's just let viewDateStr be viewDateStr.
      // But if user wants to go to today, they can use the right arrow.
    }
  }, [realTodayStr]);

  const [todayRecord, setTodayRecord] = useState<BodyStateRecord>({
    id: viewDateStr,
    date: viewDateStr,
    weight: null,
    rhythm: null,
    walk: null,
    muscle: null,
    bodyCheck: null,
    sleep: null,
    memo: '',
    moodEmoji: null
  });

  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Check if all tasks are completed
  const allCompleted = 
    todayRecord.weight !== null && 
    todayRecord.rhythm !== null && 
    todayRecord.rhythm !== 'yes' &&
    todayRecord.walk !== null && 
    todayRecord.muscle !== null && 
    todayRecord.bodyCheck !== null &&
    todayRecord.sleep !== null;

  useEffect(() => {
    if (allCompleted) {
      const lastShown = localStorage.getItem('completionPopupShownDate');
      if (lastShown !== viewDateStr) {
        const timer = setTimeout(() => {
          setShowCompletionPopup(true);
          localStorage.setItem('completionPopupShownDate', viewDateStr);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [allCompleted, viewDateStr]);

  // Initialize or load today's record
  useEffect(() => {
    const existing = records.find(r => r.date === viewDateStr);
    if (existing) {
      setTodayRecord(existing);
      if (existing.memo) setIsMemoOpen(true);
    } else {
      setTodayRecord({
        id: viewDateStr,
        date: viewDateStr,
        weight: null,
        rhythm: null,
        walk: null,
        muscle: null,
        bodyCheck: null,
        sleep: null,
        memo: '',
        moodEmoji: null
      });
      setIsMemoOpen(false);
    }
  }, [records, viewDateStr]);

  // Handle immediate save
  const updateRecord = async (updates: Partial<BodyStateRecord>) => {
    const updated = { ...todayRecord, ...updates };
    setTodayRecord(updated);
    try {
      await updateItem(updated.id, updated);
    } catch(err: any) {
      alert("데이터 저장 실패: " + err?.message);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const hasEnoughData = records.length >= 3;
  
  // Patterns (Simple generic ones based on presence of data)
  const patternMessage = hasEnoughData && records.filter(r => r.walk !== 'none').length > 2 
    ? "산책 기록이 3회 이상 관찰됨"
    : "기록 축적 중";

  // Generate Chart Data
  const getChartData = () => {
    const now = new Date(realTodayStr);
    let daysPast = 7;
    if (chartPeriod === '1m') daysPast = 30;
    if (chartPeriod === '6m') daysPast = 180;
    if (chartPeriod === '1y') daysPast = 365;

    const startDate = new Date(now);
    startDate.setDate(now.getDate() - daysPast);

    const filtered = records
      .filter(r => new Date(r.date) >= startDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filtered.map(r => {
      let val = 3; // default normal
      if (r.weight === 'very_light') val = 5;
      if (r.weight === 'light') val = 4;
      if (r.weight === 'heavy') val = 2;
      if (r.weight === 'very_heavy') val = 1;
      
      const d = new Date(r.date);
      return {
        date: r.date,
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        value: val
      };
    });
  };

  const chartData = getChartData();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">
      
      {/* Date */}
      <div className="mb-8 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const d = new Date(viewDateStr);
              d.setDate(d.getDate() - 1);
              setViewDateStr(d.toISOString().split('T')[0]);
            }} 
            className="w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm hover:scale-105 transition-transform outline-none text-stone-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold tracking-tight text-stone-800">{formatDate(viewDateStr)}</h2>
            {viewDateStr !== realTodayStr && <span className="text-[12px] font-bold text-sky-500 uppercase tracking-widest mt-0.5">과거 기록</span>}
          </div>
          <button 
            onClick={() => {
              const d = new Date(viewDateStr);
              d.setDate(d.getDate() + 1);
              setViewDateStr(d.toISOString().split('T')[0]);
            }} 
            disabled={viewDateStr >= realTodayStr}
            className={`w-10 h-10 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm transition-transform outline-none text-stone-600 ${viewDateStr >= realTodayStr ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-3xl hover:scale-110 transition-transform bg-white/50 backdrop-blur-sm rounded-2xl w-14 h-14 flex items-center justify-center border border-white/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-none"
            title="기분/날씨 변경"
          >
            {todayRecord.moodEmoji || '🌤️'}
          </button>
          <AnimatePresence>
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowEmojiPicker(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className="absolute right-0 top-16 bg-white/95 backdrop-blur-xl border border-stone-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[20px] p-3 z-50 w-[220px] grid grid-cols-4 gap-2"
                >
                  {MOOD_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        updateRecord({ moodEmoji: emoji });
                        setShowEmojiPicker(false);
                      }}
                      className="text-2xl aspect-square flex items-center justify-center hover:bg-stone-100 rounded-[12px] transition-colors outline-none active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="space-y-5">
        
        {/* 1. 몸 (Weight) */}
        <section className={`bg-white/50 backdrop-blur-md rounded-[24px] p-5 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-colors ${todayRecord.weight !== null ? 'border-sky-300 bg-sky-50/50' : 'border-white/60'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[14px] font-bold text-stone-700 flex items-center gap-1.5">
              <span className="text-lg">🪶</span> 몸
            </label>
            {todayRecord.weight !== null && <CheckCircle2 size={18} className="text-sky-500" />}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'light', label: '가벼움' },
              { value: 'normal', label: '보통' },
              { value: 'heavy', label: '약간 무거움' },
              { value: 'very_heavy', label: '매우 무거움' }
            ].map(opt => {
              const isActive = todayRecord.weight === opt.value || (opt.value === 'light' && todayRecord.weight === 'very_light');
              return (
                <button
                  key={opt.value}
                  onClick={() => updateRecord({ weight: opt.value as BodyWeightState })}
                  className={`py-3.5 px-1 flex items-center justify-center rounded-[16px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out ${
                    isActive
                      ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                      : 'bg-white/60 border border-white text-stone-500 hover:bg-white/80'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. 리듬 (Rhythm) */}
        <section className={`bg-white/50 backdrop-blur-md rounded-[24px] p-5 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-colors ${todayRecord.rhythm !== null ? 'border-sky-300 bg-sky-50/50' : 'border-white/60'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[14px] font-bold text-stone-700 flex items-center gap-1.5">
              <span className="text-lg">🌊</span> 리듬
            </label>
            {todayRecord.rhythm !== null && <CheckCircle2 size={18} className="text-sky-500" />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateRecord({ rhythm: 'none' })}
              className={`py-3 px-2 flex-1 rounded-[16px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out flex items-center justify-center ${
                todayRecord.rhythm === 'none'
                  ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                  : 'bg-white/60 border border-white text-stone-500 hover:bg-white/80'
              }`}
            >
              없음
            </button>
            <button
              onClick={() => updateRecord({ rhythm: (todayRecord.rhythm === 'none' || todayRecord.rhythm === null) ? 'yes' : todayRecord.rhythm })}
              className={`py-3 px-2 flex-1 rounded-[16px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out flex items-center justify-center ${
                todayRecord.rhythm !== 'none' && todayRecord.rhythm !== null
                  ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                  : 'bg-white/60 border border-white text-stone-500 hover:bg-white/80'
              }`}
            >
              있음
            </button>
          </div>
          
          <AnimatePresence>
            {todayRecord.rhythm !== null && todayRecord.rhythm !== 'none' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'weak', label: '약함' },
                    { value: 'normal', label: '보통' },
                    { value: 'strong', label: '강함' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => updateRecord({ rhythm: opt.value as RhythmState })}
                      className={`py-3 px-1 flex items-center justify-center rounded-[14px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out ${
                        todayRecord.rhythm === opt.value
                          ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                          : 'bg-white/40 border border-white/50 text-stone-500 hover:bg-white/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 3. 산책 (Walk) */}
        <section className={`bg-white/50 backdrop-blur-md rounded-[24px] p-5 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-colors ${todayRecord.walk !== null ? 'border-sky-300 bg-sky-50/50' : 'border-white/60'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[14px] font-bold text-stone-700 flex items-center gap-1.5">
              <span className="text-lg">🌿</span> 산책
            </label>
            {todayRecord.walk !== null && <CheckCircle2 size={18} className="text-sky-500" />}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'none', label: '안 함' },
              { value: '10min', label: '10분' },
              { value: '20min', label: '20분' },
              { value: 'over_30min', label: '30분 이상' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateRecord({ walk: opt.value as WalkState })}
                className={`py-3.5 px-1 flex items-center justify-center rounded-[16px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out ${
                  todayRecord.walk === opt.value
                    ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                    : 'bg-white/60 border border-white text-stone-500 hover:bg-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* 4. 근육 (Muscle Exercise) */}
        <section className={`bg-white/50 backdrop-blur-md rounded-[24px] p-5 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-colors ${todayRecord.muscle !== null ? 'border-sky-300 bg-sky-50/50' : 'border-white/60'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[14px] font-bold text-stone-700 flex items-center gap-1.5">
              <span className="text-lg">💪</span> 근육
            </label>
            {todayRecord.muscle !== null && <CheckCircle2 size={18} className="text-sky-500" />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'none', label: '안 함' },
              { value: 'done', label: '함' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateRecord({ muscle: opt.value as MuscleState })}
                className={`py-3.5 px-2 rounded-[16px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out flex items-center justify-center ${
                  todayRecord.muscle === opt.value
                    ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                    : 'bg-white/60 border border-white text-stone-500 hover:bg-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* 5. 거울 · 스트레칭 (Body Check) */}
        <section className={`bg-white/50 backdrop-blur-md rounded-[24px] p-5 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-colors ${todayRecord.bodyCheck !== null ? 'border-sky-300 bg-sky-50/50' : 'border-white/60'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[14px] font-bold text-stone-700 flex items-center gap-1.5">
              <span className="text-lg">🪞</span> 거울 · 스트레칭
            </label>
            {todayRecord.bodyCheck !== null && <CheckCircle2 size={18} className="text-sky-500" />}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'none', label: '안 함' },
              { value: 'done', label: '함' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateRecord({ bodyCheck: opt.value as BodyCheckState })}
                className={`py-3.5 px-2 rounded-[16px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out flex items-center justify-center ${
                  todayRecord.bodyCheck === opt.value
                    ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                    : 'bg-white/60 border border-white text-stone-500 hover:bg-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* 6. 수면 (Sleep) */}
        <section className={`bg-white/50 backdrop-blur-md rounded-[24px] p-5 border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-colors ${todayRecord.sleep !== null ? 'border-sky-300 bg-sky-50/50' : 'border-white/60'}`}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-[14px] font-bold text-stone-700 flex items-center gap-1.5">
              <span className="text-lg">🌙</span> 수면
            </label>
            {todayRecord.sleep !== null && <CheckCircle2 size={18} className="text-sky-500" />}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'not_enough', label: '부족' },
              { value: 'adequate', label: '적정' },
              { value: 'too_much', label: '과다' }
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => updateRecord({ sleep: opt.value as any })}
                className={`py-3.5 px-2 rounded-[16px] text-[13px] font-bold transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out flex items-center justify-center ${
                  todayRecord.sleep === opt.value
                    ? 'bg-stone-200 text-stone-800 border-stone-300 shadow-inner'
                    : 'bg-white/60 border border-white text-stone-500 hover:bg-white/80'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Memo (Optional) */}
        <section>
            {!isMemoOpen ? (
              <button 
                onClick={() => setIsMemoOpen(true)}
                className="flex items-center gap-2 text-[12px] font-bold text-stone-400 hover:text-stone-600 transition-colors px-2 py-1 outline-none mix-blend-multiply"
              >
                <MessageSquare size={14} /> 메모 추가하기 (선택)
              </button>
            ) : (
               <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="relative">
                 <input
                   type="text"
                   maxLength={30}
                   value={todayRecord.memo}
                   onChange={(e) => updateRecord({ memo: e.target.value })}
                   placeholder="간단한 메모 (30자 이내)"
                   className="w-full bg-white/60 backdrop-blur-md border border-white/80 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.02)] rounded-[16px] px-4 py-3.5 text-[13px] focus:bg-white focus:ring-2 focus:ring-stone-200 outline-none font-bold text-stone-800 placeholder:text-stone-400 transition-all"
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400 bg-white/50 px-1.5 rounded backdrop-blur-sm">
                   {todayRecord.memo.length}/30
                 </div>
               </motion.div>
            )}
        </section>

        {/* Observation Pattern & Chart */}
        {hasEnoughData && (
          <div className="mt-8 mb-4">
            <div className="bg-white/50 backdrop-blur-md rounded-[24px] p-5 border border-white/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[14px] font-bold text-stone-700 flex items-center gap-1.5">
                   <BarChart2 size={18} /> 상태 흐름 (몸)
                </label>
                <div className="flex gap-1.5">
                   {[
                     { id: '1w', label: '1주' },
                     { id: '1m', label: '1달' },
                     { id: '6m', label: '6개월' },
                     { id: '1y', label: '1년' }
                   ].map(p => (
                     <button
                       key={p.id}
                       onClick={() => setChartPeriod(p.id as ChartPeriod)}
                       className={`text-[11px] px-2.5 py-1 rounded-full font-bold transition-all ${
                         chartPeriod === p.id 
                           ? 'bg-stone-700 text-white shadow-sm' 
                           : 'bg-white/60 text-stone-500 hover:bg-white/80 border border-white/50'
                       }`}
                     >
                       {p.label}
                     </button>
                   ))}
                </div>
              </div>

              {chartData.length > 1 ? (
                <div className="h-[140px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 600 }} dy={10} minTickGap={20} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold', color: '#44403c' }} 
                        itemStyle={{ color: '#44403c' }}
                        formatter={(value) => {
                           if (value === 5) return ['매우 가벼움', ''];
                           if (value === 4) return ['가벼움', ''];
                           if (value === 3) return ['보통', ''];
                           if (value === 2) return ['약간 무거움', ''];
                           if (value === 1) return ['매우 무거움', ''];
                           return [value, ''];
                        }}
                        labelStyle={{ color: '#a8a29e', marginBottom: '4px', fontSize: '11px' }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[140px] flex items-center justify-center text-[12px] text-stone-400 font-bold mix-blend-multiply">
                  데이터를 더 기록해주세요
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-white/50 text-center">
                <p className="text-[12px] font-bold text-stone-500 tracking-wide mix-blend-multiply">
                  {patternMessage}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
      
      <AnimatePresence>
        {showCompletionPopup && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-sm px-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-[320px] w-full shadow-2xl flex flex-col items-center text-center relative"
            >
              <button onClick={() => setShowCompletionPopup(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 outline-none">
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-sky-100 text-sky-500 rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner">
                🎉
              </div>
              <h3 className="text-xl font-bold text-stone-800 mb-2">오늘 하루도 수고했어요!</h3>
              <p className="text-[14px] font-medium text-stone-500 mb-6 leading-relaxed">
                모든 항목 체크를 완료했습니다.<br/> 편안한 밤 보내세요. 🌙
              </p>
              <button 
                onClick={() => setShowCompletionPopup(false)}
                className="w-full bg-sky-500 text-white rounded-[16px] py-3.5 font-bold hover:bg-sky-600 transition-colors shadow-md outline-none"
              >
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
