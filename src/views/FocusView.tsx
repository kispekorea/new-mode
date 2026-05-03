import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, BarChart2, BookOpen, Hash, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreCollection } from '../lib/useFirestoreSync';
import { FocusItem, FocusReflection } from '../types';

const BIBLE_VERSES = [
  { text: "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라", ref: "빌립보서 4:13" },
  { text: "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라", ref: "이사야 41:10" },
  { text: "우리가 알거니와 하나님을 사랑하는 자 곧 그의 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라", ref: "로마서 8:28" },
  { text: "여호와는 나의 목자시니 내게 부족함이 없으리로다", ref: "시편 23:1" },
  { text: "네 짐을 여호와께 맡기라 그가 너를 붙드시고 의인의 요동함을 영원히 허락하지 아니하시리로다", ref: "시편 55:22" },
  { text: "너희는 마음에 근심하지 말라 하나님을 믿으니 또 나를 믿으라", ref: "요한복음 14:1" },
  { text: "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라", ref: "빌립보서 4:6" },
  { text: "강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라", ref: "여호수아 1:9" },
  { text: "예수께서 이르시되 할 수 있거든이 무슨 말이냐 믿는 자에게는 능히 하지 못할 일이 없느니라", ref: "마가복음 9:23" },
  { text: "나의 영혼아 잠잠히 하나님만 바라라 무릇 나의 소망이 그로부터 나오는도다", ref: "시편 62:5" },
  { text: "사람이 마음으로 자기의 길을 계획할지라도 그의 걸음을 인도하시는 이는 여호와시니라", ref: "잠언 16:9" },
  { text: "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라", ref: "데살로니가전서 5:16-18" },
  { text: "나의 하나님이 그리스도 예수 안에서 영광 가운데 그 풍성한 대로 너희 모든 쓸 것을 채우시리라", ref: "빌립보서 4:19" },
  { text: "여호와를 경외하는 것이 지식의 근본이거늘 미련한 자는 지혜와 훈계를 멸시하느니라", ref: "잠언 1:7" },
  { text: "믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니", ref: "히브리서 11:1" }
];

const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
  return new Date(d.setDate(diff));
};

const getWeekString = (date: Date) => {
  const start = getStartOfWeek(date);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
};

export default function FocusView() {
  const { data: items, updateItem, deleteItem } = useFirestoreCollection<FocusItem>('focusItems');
  const { data: reflections, updateItem: updateReflectionItem } = useFirestoreCollection<FocusReflection>('focusReflections');
  
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  // yyyy-mm-dd (local formatting to avoid timezone offset issue)
  const offset = currentDate.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(currentDate.getTime() - offset)).toISOString().slice(0, 10);
  const dateStr = localISOTime;

  const monthId = `month-${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

  const [goal, setGoal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const dayItems = useMemo(() => items.filter(i => i.date === dateStr), [items, dateStr]);
  
  const monthItems = useMemo(() => items.filter(i => {
    const parts = i.date.split('-');
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    return y === currentDate.getFullYear() && m === currentDate.getMonth();
  }), [items, currentDate]);

  const weeksInMonth = useMemo(() => {
    const currentYear = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth();
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate();
    
    const weeks: { weekStr: string, weekLabel: string, items: FocusItem[], weekId: string }[] = [];
    let currentWeekNumber = 1;
    let lastWeekStr = '';
    
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(currentYear, currentMonthIndex, day);
      const weekStr = getWeekString(d);
      
      if (weekStr !== lastWeekStr) {
         weeks.push({
           weekStr,
           weekLabel: `${currentMonthIndex + 1}월 ${currentWeekNumber}주차`, 
           items: [],
           weekId: `week-${weekStr}`
         });
         lastWeekStr = weekStr;
         currentWeekNumber++;
      }
    }
    
    monthItems.forEach(item => {
       const parts = item.date.split('-');
       if (parts.length === 3) {
         const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
         const wStr = getWeekString(dateObj);
         const weekObj = weeks.find(w => w.weekStr === wStr);
         if (weekObj) {
            weekObj.items.push(item);
         }
       }
    });
    
    return weeks;
  }, [currentDate, monthItems]);

  const prevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };
  
  const nextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    try {
      if (editingId) {
        await updateItem(editingId, { goal: goal.trim() });
        setEditingId(null);
      } else {
        const id = Date.now().toString();
        await updateItem(id, {
          id,
          date: dateStr,
          goal: goal.trim()
        });
      }
    } catch(err: any) {
      alert("데이터 저장 실패: " + err?.message);
      return;
    }
    setGoal('');
  };

  const handleEdit = (item: FocusItem) => {
    setGoal(item.goal);
    setEditingId(item.id);
  };

  const removeFocus = (id: string) => {
     deleteItem(id);
  };

  // Safe daily verse logic
  const daysSinceEpoch = Math.floor(currentDate.getTime() / 86400000);
  const currentVerse = BIBLE_VERSES[Math.abs(daysSinceEpoch) % BIBLE_VERSES.length];

  const getTopKeywords = (filteredItems: FocusItem[]) => {
    const counts: Record<string, number> = {};
    filteredItems.forEach(item => {
      const k = item.goal.trim();
      if(k) counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5); // top 5
  };

  const topMonthItems = getTopKeywords(monthItems);

  const currentMonthReflection = reflections.find(r => r.id === monthId)?.content || '';

  const updateReflection = (id: string, content: string) => {
    updateReflectionItem(id, { id, content });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">
      
      {/* Date Navigator */}
      <div className="flex justify-between items-center mb-6 bg-white/80 backdrop-blur-md p-2 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white">
        <button onClick={prevDay} className="p-2 hover:bg-white rounded-xl transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out outline-none">
          <ChevronLeft size={20} className="text-[#6B8A9E]" />
        </button>
        <span className="font-bold text-slate-800 tracking-tight">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월 {currentDate.getDate()}일
        </span>
        <button onClick={nextDay} className="p-2 hover:bg-white rounded-xl transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out outline-none">
          <ChevronRight size={20} className="text-[#6B8A9E]" />
        </button>
      </div>

      {/* Daily Bible Verse */}
      <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 mb-8 border border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <h3 className="text-[#6B8A9E] text-[11px] font-bold mb-3 tracking-wide flex items-center gap-1.5 mix-blend-multiply uppercase">
          📖 매일 성경 말씀
        </h3>
        <p className="text-[14px] font-bold leading-relaxed text-slate-700 mb-3 relative z-10 break-keep">
          "{currentVerse.text}"
        </p>
        <p className="text-[11px] text-slate-400 font-bold relative z-10 mix-blend-multiply">
          - {currentVerse.ref}
        </p>
      </div>

      <div className="mb-10">
        <h2 className="text-[18px] font-bold tracking-tight text-slate-800 mb-4 px-1">오늘 집중대상</h2>
        
        {/* Simplified Input Form */}
        {!editingId && (
          <form onSubmit={handleAdd} className="flex items-center gap-2 mb-6">
            <input 
              type="text" 
              value={goal} 
              onChange={e => setGoal(e.target.value)} 
              placeholder="어떤것에 집중하나요?" 
              className="flex-1 bg-white/80 backdrop-blur-md border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] rounded-[16px] px-4 py-3.5 text-[13px] focus:bg-white focus:ring-2 focus:ring-[#D0DDF0] outline-none font-bold text-slate-700 placeholder:text-slate-400 transition-all block w-full"
            />
              <button 
                type="submit" 
                className="bg-[#4A697E] text-white p-3.5 rounded-[16px] flex items-center justify-center hover:bg-[#3A566B] transition-all active:scale-[0.98] hover:-translate-y-0.5 duration-200 ease-out shadow-[0_4px_20px_rgba(74,105,126,0.2)] shrink-0 outline-none"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
          </form>
        )}

        {/* Daily Focus List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {dayItems.map(item => (
              editingId === item.id ? (
                <motion.div 
                  key={item.id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  className="py-3 px-4 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] bg-white border border-[#D0DDF0]"
                >
                  <form onSubmit={handleAdd} className="flex items-center gap-2">
                    <input 
                      autoFocus
                      type="text" 
                      value={goal} 
                      onChange={e => setGoal(e.target.value)} 
                      className="flex-1 bg-transparent text-[14px] font-bold text-slate-700 outline-none w-full"
                    />
                    <div className="flex gap-1 shrink-0">
                      <button type="submit" className="text-[#4A697E] hover:text-[#3A566B] text-[13px] font-bold px-2 py-1 rounded-lg">완료</button>
                      <button type="button" onClick={() => { setEditingId(null); setGoal(''); }} className="text-slate-400 hover:text-slate-600 text-[13px] font-bold px-2 py-1 rounded-lg">취소</button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key={item.id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  className="py-3.5 px-4 rounded-[20px] flex items-center justify-between group transition-colors border shadow-[0_4px_20px_rgba(0,0,0,0.02)] backdrop-blur-md bg-white/80 border-white"
                >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-[#EAF0F4] flex items-center justify-center border border-white text-[#6B8A9E]">
                    <Hash size={14} />
                  </div>
                  <span className="text-[14px] font-bold text-slate-700 truncate">
                    {item.goal}
                  </span>
                </div>
                
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="shrink-0 p-2 text-slate-300 hover:text-slate-500 md:opacity-0 group-hover:opacity-100 transition-all outline-none"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => removeFocus(item.id)}
                    className="shrink-0 p-2 text-slate-300 hover:text-rose-400 md:opacity-0 group-hover:opacity-100 transition-all outline-none"
                  >
                    <X size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </motion.div>
              )
            ))}
          </AnimatePresence>
          
          {dayItems.length === 0 && (
             <div className="text-center py-12 text-slate-400">
               <p className="text-[13px] font-bold text-slate-500">오늘의 집중대상이 아직 없습니다.</p>
               <p className="text-[11px] font-bold text-slate-400 mt-1 mix-blend-multiply">하루 동안 나의 관심이 향하는 곳을 기록해보세요.</p>
             </div>
          )}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 mb-6 border border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] relative overflow-hidden group">
        <h3 className="text-[15px] font-bold text-slate-800 mb-5 flex items-center gap-2 tracking-tight">
          <span className="bg-[#4A697E] text-white p-1 rounded-md"><BarChart2 size={16} /></span> 주간 집중 결산
        </h3>
        
        <div className="space-y-8">
          {weeksInMonth.map(week => {
            const topItems = getTopKeywords(week.items);
            const reflection = reflections.find(r => r.id === week.weekId)?.content || '';

            return (
              <div key={week.weekId} className="border-t border-[#EAF0F4] pt-6 first:border-0 first:pt-0">
                <h4 className="text-[14px] font-bold text-[#4A697E] mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6B8A9E] shadow-sm" />
                  {week.weekLabel}
                </h4>
                
                <div className="mb-4 bg-white/60 p-4 rounded-[16px] border border-white">
                   <p className="text-[11px] font-bold text-slate-400 mb-3 mix-blend-multiply">주요 집중대상 (TOP 5)</p>
                   {topItems.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                       {topItems.map(wk => (
                         <span key={wk[0]} className="bg-[#EAF0F4] text-[#4A697E] border border-white px-3 py-1.5 rounded-full text-[12px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-1.5">
                           {wk[0]} <span className="text-[#6B8A9E] font-medium bg-white px-1.5 py-0.5 rounded-full text-[10px]">{wk[1]}</span>
                         </span>
                       ))}
                     </div>
                   ) : (
                     <p className="text-[13px] font-medium text-slate-400 py-1">해당 주차에 기록이 없습니다.</p>
                   )}
                </div>

                <div>
                   <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 mix-blend-multiply uppercase tracking-wider"><BookOpen size={12}/> 주간 느낀점</p>
                  <textarea 
                    value={reflection}
                    onChange={(e) => updateReflection(week.weekId, e.target.value)}
                    placeholder={`${week.weekLabel}에는 어떤 것들에 집중하며 보냈나요? \n그 과정에서 어떤 생각과 감정이 들었는지 적어보세요.`}
                    className="w-full bg-white/60 border border-white rounded-[16px] px-4 py-4 text-[13px] font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#D0DDF0] outline-none transition-all resize-none placeholder:text-slate-300 placeholder:font-medium min-h-[100px] shadow-inner"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white/80 backdrop-blur-md rounded-[24px] p-6 mb-8 border border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
        <h3 className="text-[15px] font-bold text-slate-800 mb-5 flex items-center gap-2 tracking-tight">
          <span className="bg-[#4A697E] text-white p-1 rounded-md"><BarChart2 size={16} /></span> 월간 집중 결산
        </h3>
        
        <div className="mb-6 bg-white/60 p-4 rounded-[16px] border border-white">
           <p className="text-[11px] font-bold text-slate-400 mb-3 mix-blend-multiply">이번 달 주요 집중대상 (TOP 5)</p>
           {topMonthItems.length > 0 ? (
             <div className="flex flex-wrap gap-2">
               {topMonthItems.map(wk => (
                 <span key={wk[0]} className="bg-[#EAF0F4] text-[#4A697E] border border-white px-3 py-1.5 rounded-full text-[12px] font-bold shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex items-center gap-1.5">
                   {wk[0]} <span className="text-[#6B8A9E] font-medium bg-white px-1.5 py-0.5 rounded-full text-[10px]">{wk[1]}</span>
                 </span>
               ))}
             </div>
           ) : (
             <p className="text-[13px] font-medium text-slate-400 py-2">이번 달 기록이 없습니다.</p>
           )}
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-400 mb-2 flex items-center gap-1.5 mix-blend-multiply uppercase tracking-wider"><BookOpen size={12}/> 월간 느낀점</p>
          <textarea 
            value={currentMonthReflection}
            onChange={(e) => updateReflection(monthId, e.target.value)}
            placeholder="한 달 동안 어디에 많은 시간을 쏟았나요? 
앞으로는 나의 관심을 어디로 향하게 하고 싶은지 기록해보세요."
            className="w-full bg-white/60 border border-white rounded-[16px] px-4 py-4 text-[13px] font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-[#D0DDF0] outline-none transition-all resize-none placeholder:text-slate-300 placeholder:font-medium min-h-[120px] shadow-inner"
          />
        </div>
      </div>

    </motion.div>
  );
}
