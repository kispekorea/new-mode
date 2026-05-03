import React, { useState, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, Check, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreCollection } from '../lib/useFirestoreSync';
import { WishlistItem, ItemType, WishNecessity } from '../types';

const defaultWishlist: WishlistItem[] = [
  {
    id: '1',
    date: new Date().toISOString().split('T')[0],
    name: '점심 식사',
    imageUrl: '',
    type: 'expense',
    status: 'bought',
    necessity: 'essential',
    price: '12,000'
  },
  {
    id: '2',
    date: new Date().toISOString().split('T')[0],
    name: '디자이너 조명',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600&auto=format&fit=crop',
    type: 'wish',
    status: 'wish',
    necessity: 'thinking',
    price: '85,000'
  }
];

export default function WishlistView() {
  const { data: items, updateItem, deleteItem } = useFirestoreCollection<WishlistItem>('wishlistItems');
  
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'expense' | 'wish'>('expense');

  // Form State
  const [date, setDate] = useState(() => {
    const offset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().split('T')[0];
  });
  const [type, setType] = useState<ItemType>('expense');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [necessity, setNecessity] = useState<WishNecessity>('thinking');

  const monthItems = useMemo(() => items.filter(i => i.date.startsWith(monthPrefix)), [items, monthPrefix]);
  
  // 가계부: 이번 달 소비 + 이번 달 구매한 위시
  const expenseItems = useMemo(() => 
    monthItems.filter(i => i.type === 'expense' || i.status === 'bought').sort((a,b) => b.date.localeCompare(a.date))
  , [monthItems]);
  
  const wishItems = useMemo(() => 
    monthItems.filter(i => i.type === 'wish' && i.status === 'wish').sort((a,b) => b.date.localeCompare(a.date))
  , [monthItems]);

  const totalExpense = expenseItems.reduce((acc, cur) => acc + (parseInt(cur.price.replace(/[^0-9]/g, '')) || 0), 0);

  const groupedExpenseItems = useMemo(() => {
    const groups: Record<string, WishlistItem[]> = {};
    expenseItems.forEach(item => {
      if (!groups[item.date]) groups[item.date] = [];
      groups[item.date].push(item);
    });
    return Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
  }, [expenseItems]);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editingId) {
        await updateItem(editingId, { date, name: name.trim(), imageUrl: '', type, necessity: type === 'wish' ? necessity : 'essential', price: price || '0', linkUrl: type === 'wish' ? linkUrl.trim() : '' });
      } else {
        const id = Date.now().toString();
        await updateItem(id, {
          id,
          date,
          name: name.trim(),
          imageUrl: '',
          type,
          status: type === 'expense' ? 'bought' : 'wish',
          necessity: type === 'wish' ? necessity : 'essential',
          price: price || '0',
          linkUrl: type === 'wish' ? linkUrl.trim() : ''
        });
      }
    } catch (err: any) {
      alert("데이터 저장 실패: " + err?.message);
      return;
    }

    setIsAdding(false);
    setEditingId(null);
    setName('');
    setPrice('');
    setLinkUrl('');
    setNecessity('thinking');
    const offset = new Date().getTimezoneOffset() * 60000;
    setDate(new Date(Date.now() - offset).toISOString().split('T')[0]);
  };

  const markAsBought = (id: string) => {
    const offset = new Date().getTimezoneOffset() * 60000;
    updateItem(id, { status: 'bought', date: new Date(Date.now() - offset).toISOString().split('T')[0] });
  };

  const updateNecessity = (id: string, currentNecessity: WishNecessity) => {
    const next = currentNecessity === 'essential' ? 'thinking' : currentNecessity === 'thinking' ? 'unnecessary' : 'essential';
    updateItem(id, { necessity: next });
  };

  const handleEditClick = (item: WishlistItem) => {
    setEditingId(item.id);
    setDate(item.date);
    setType(item.type);
    setName(item.name);
    setPrice(item.price);
    setLinkUrl(item.linkUrl || '');
    setNecessity(item.necessity);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">
      
      {/* Month Navigator */}
      <div className="flex justify-between items-center mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-stone-100">
        <button onClick={prevMonth} className="p-2 hover:bg-stone-50 rounded-xl transition-colors"><ChevronLeft size={20} className="text-stone-500" /></button>
        <span className="font-semibold text-stone-800 tracking-tight">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</span>
        <button onClick={nextMonth} className="p-2 hover:bg-stone-50 rounded-xl transition-colors"><ChevronRight size={20} className="text-stone-500" /></button>
      </div>

      {/* View Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1 bg-stone-200/50 p-1 rounded-xl">
          <button onClick={() => setViewTab('expense')} className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${viewTab === 'expense' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>가계부</button>
          <button onClick={() => setViewTab('wish')} className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all ${viewTab === 'wish' ? 'bg-white shadow-sm text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}>위시리스트</button>
        </div>
        <button onClick={() => {
          if (isAdding) {
            setIsAdding(false);
            setEditingId(null);
            setName('');
            setPrice('');
            setLinkUrl('');
            setNecessity('thinking');
            const offset = new Date().getTimezoneOffset() * 60000;
            setDate(new Date(Date.now() - offset).toISOString().split('T')[0]);
          } else {
            setIsAdding(true);
            setEditingId(null);
            setType(viewTab);
            setName('');
            setPrice('');
            setLinkUrl('');
            setNecessity('thinking');
            const offset = new Date().getTimezoneOffset() * 60000;
            setDate(new Date(Date.now() - offset).toISOString().split('T')[0]);
          }
        }} className="bg-stone-900 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-800 transition-transform active:scale-95 shadow-sm">
          <Plus size={18} className={isAdding && !editingId ? "rotate-45" : "transition-transform"} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && !editingId && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-stone-100 mb-6 space-y-3 overflow-hidden"
            onSubmit={handleAdd}
          >
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="항목 이름" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[14px] font-medium focus:ring-1 focus:ring-stone-300 outline-none" required />
            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="금액 (예: 15,000)" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[14px] font-medium focus:ring-1 focus:ring-stone-300 outline-none" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] text-stone-500 focus:ring-1 focus:ring-stone-300 outline-none font-bold" required />
            
            {type === 'wish' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="참고 URL (선택사항)" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] focus:ring-1 focus:ring-stone-300 outline-none mb-3" />
                <div className="flex gap-2">
                  {(['essential','thinking','unnecessary'] as WishNecessity[]).map(n => (
                     <button type="button" key={n} onClick={() => setNecessity(n)} className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all ${necessity === n ? 'border-stone-400 bg-stone-800 text-white shadow-sm' : 'border-stone-100 text-stone-400 hover:bg-stone-50'}`}>
                       {n === 'essential' ? '꼭 필요함' : n === 'unnecessary' ? '불필요' : '고민중'}
                     </button>
                  ))}
                </div>
              </motion.div>
            )}
            <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-3 text-sm font-medium mt-2 hover:bg-stone-800 transition-colors">
              추가하기
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {viewTab === 'expense' && (
          <motion.div key="expense" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            {/* 총 지출 데시보드 */}
            <div className="bg-gradient-to-br from-[#E6EEF4] to-[#D0DDF0] border border-white rounded-[24px] p-6 text-center mb-6 shadow-lg shadow-[#D0DDF0]/50">
              <p className="text-[#6B8A9E] text-sm font-bold mb-1.5 opacity-90">이번 달 총 지출</p>
              <h3 className="text-3xl font-bold tracking-tight text-slate-800 mb-1">₩{totalExpense.toLocaleString()}</h3>
            </div>
            
            <div className="space-y-6">
              {groupedExpenseItems.length > 0 ? groupedExpenseItems.map(([dateGroup, items]) => (
                <div key={dateGroup}>
                  <div className="text-[12px] font-bold text-stone-400 mb-2 px-1 tracking-wider">{dateGroup}</div>
                  <div className="bg-white rounded-[20px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden border border-stone-100">
                    {items.map((item, idx) => (
                      editingId === item.id ? (
                        <div key={item.id} className="p-4 bg-stone-50/50">
                          <form onSubmit={handleAdd} className="space-y-3">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="항목 이름" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[14px] font-medium focus:ring-1 focus:ring-stone-300 outline-none" required />
                            <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="금액 (예: 15,000)" className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[14px] font-medium focus:ring-1 focus:ring-stone-300 outline-none" />
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[13px] text-stone-500 focus:ring-1 focus:ring-stone-300 outline-none font-bold" required />
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingId(null)} className="w-1/3 bg-stone-200 text-stone-600 rounded-xl py-3 text-sm font-medium hover:bg-stone-300 transition-colors">취소</button>
                              <button type="submit" className="w-2/3 bg-stone-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-stone-800 transition-colors">수정 완료</button>
                            </div>
                          </form>
                        </div>
                      ) : (
                      <div key={item.id} className={`flex justify-between items-center p-4 group relative ${idx !== items.length - 1 ? 'border-b border-stone-50' : ''} transition-colors hover:bg-stone-50/50`}>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-stone-800 flex items-center gap-2">
                              {item.name}
                              {item.type === 'wish' && <span className="bg-indigo-50/80 text-indigo-500 px-1.5 py-0.5 text-[9px] rounded-full font-bold tracking-tight border border-indigo-100">위시 달성✨</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-stone-800 text-[15px] tracking-tight mr-1 transition-opacity group-hover:opacity-0 sm:group-hover:opacity-100">₩{item.price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-1 bg-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm p-1 rounded-xl z-20 pointer-events-auto">
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(item); }} className="p-1.5 text-stone-400 hover:text-stone-600 bg-white/80 rounded-lg hover:bg-stone-100 shadow-sm transition-colors cursor-pointer active:scale-95">
                              <Edit2 size={14} />
                            </button>
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-rose-400 hover:text-rose-600 bg-white/80 rounded-lg hover:bg-rose-50 shadow-sm transition-colors cursor-pointer active:scale-95">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                    ))}
                  </div>
                </div>
              )) : (
                <p className="text-center text-stone-400 py-10 text-sm">지출 내역이 없습니다.</p>
              )}
            </div>
          </motion.div>
        )}

        {viewTab === 'wish' && (
          <motion.div key="wish" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="grid grid-cols-2 gap-4">
              {wishItems.map(item => (
                editingId === item.id ? (
                  <div key={item.id} className="col-span-2 bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#D0DDF0] p-5">
                    <form onSubmit={handleAdd} className="space-y-3">
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="항목 이름" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[14px] font-medium focus:ring-2 focus:ring-[#D0DDF0] outline-none" required />
                      <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="금액 (예: 15,000)" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[14px] font-medium focus:ring-2 focus:ring-[#D0DDF0] outline-none" />
                      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[13px] text-stone-500 focus:ring-2 focus:ring-[#D0DDF0] outline-none font-bold" required />
                      
                      <div className="mt-2">
                        <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="참고 URL (선택사항)" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[13px] focus:ring-2 focus:ring-[#D0DDF0] outline-none mb-3" />
                        <div className="flex gap-2">
                          {(['essential','thinking','unnecessary'] as WishNecessity[]).map(n => (
                             <button type="button" key={n} onClick={() => setNecessity(n)} className={`flex-1 py-2 rounded-lg text-[12px] font-bold border transition-all ${necessity === n ? 'border-stone-400 bg-stone-800 text-white shadow-sm' : 'border-stone-100 text-stone-400 hover:bg-stone-50'}`}>
                               {n === 'essential' ? '꼭 필요함' : n === 'unnecessary' ? '불필요' : '고민중'}
                             </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button type="button" onClick={() => setEditingId(null)} className="w-1/3 bg-stone-200 text-stone-600 rounded-xl py-3 text-sm font-medium hover:bg-stone-300 transition-colors">취소</button>
                         <button type="submit" className="w-2/3 bg-stone-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-stone-800 transition-colors">수정 완료</button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div key={item.id} className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-stone-100 flex flex-col group p-4">
                    <div className="flex gap-1 mb-2">
                      {item.necessity === 'essential' && <span className="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 text-[10px] rounded-full font-bold">🔥 필요함</span>}
                      {item.necessity === 'unnecessary' && <span className="bg-stone-100 text-stone-500 border border-stone-200 px-2 py-0.5 text-[10px] rounded-full font-bold">🧊 불필요</span>}
                      {item.necessity === 'thinking' && <span className="bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 text-[10px] rounded-full font-bold">🤔 고민중</span>}
                    </div>
                    <div className="flex-1 flex flex-col justify-between relative">
                      <div className="absolute top-0 right-0 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(item); }} className="p-1.5 text-stone-400 hover:text-stone-600 bg-stone-50 shadow-sm border border-stone-100 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer active:scale-95">
                          <Edit2 size={12} />
                        </button>
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 shadow-sm border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer active:scale-95">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div>
                        <div className="flex justify-between items-start mb-0.5">
                          <div className="text-[10px] text-stone-400 font-medium">{item.date}</div>
                        </div>
                        <h3 className="text-[14px] font-semibold leading-tight mb-1 text-stone-800 pr-12">{item.name}</h3>
                        {item.linkUrl && (
                          <a href={item.linkUrl} target="_blank" rel="noreferrer" className="text-[11px] text-sky-500 font-medium hover:underline mb-2 inline-block">🔗 링크 열기</a>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-3 pt-3 border-t border-stone-50">
                        <p className="text-[14px] text-stone-700 font-bold tracking-tight">{item.price ? `₩${item.price.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` : '-'}</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => updateNecessity(item.id, item.necessity)} className="w-8 h-8 rounded-full bg-stone-50 text-stone-400 flex items-center justify-center hover:bg-stone-100 hover:text-stone-600 transition-colors border border-stone-200" title="필요도 변경">
                            <span className="text-[13px] font-bold">⇄</span>
                          </button>
                          <button onClick={() => markAsBought(item.id)} className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center hover:bg-stone-800 transition-colors shadow-sm" title="구매 완료 (가계부로 이동)">
                            <Check size={14} strokeWidth={3} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              ))}
              {wishItems.length === 0 && <div className="col-span-2 text-center text-stone-400 py-10 text-sm">위시 아이템이 없습니다.</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
