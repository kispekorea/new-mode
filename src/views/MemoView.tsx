import React, { useState, useRef } from 'react';
import { Plus, Mic, Square, X, Trash2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirestoreCollection } from '../lib/useFirestoreSync';
import { MemoItem } from '../types';

const defaultMemo: MemoItem[] = [
  {
    id: '1',
    date: '2026-04-27',
    title: '미니멀 디자인 핵심',
    content: '여백을 아끼지 말 것. 색상은 메인 1개, 보조 1개로 제한할 때 가장 세련된 느낌을 준다.'
  }
];

export default function MemoView() {
  const { data: items, updateItem, deleteItem } = useFirestoreCollection<MemoItem>('memos');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [date, setDate] = useState(() => {
    const offset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - offset).toISOString().split('T')[0];
  });
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setAudioUrl(reader.result as string);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('마이크 접근 권한이 필요합니다.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !audioUrl) return;

    try {
      if (editingId) {
        await updateItem(editingId, { date, title: '', content, audioUrl });
      } else {
        const id = Date.now().toString();
        await updateItem(id, {
          id,
          date,
          title: '',
          content,
          audioUrl
        });
      }
    } catch (err: any) {
      alert("데이터 저장 실패: " + err?.message);
      return;
    }
    
    // Reset
    setIsAdding(false);
    setEditingId(null);
    setTitle('');
    setContent('');
    setAudioUrl('');
    const offset = new Date().getTimezoneOffset() * 60000;
    setDate(new Date(Date.now() - offset).toISOString().split('T')[0]);
  };

  const handleEditClick = (item: MemoItem) => {
    setEditingId(item.id);
    setDate(item.date);
    setTitle(item.title);
    setContent(item.content);
    setAudioUrl(item.audioUrl || '');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    deleteItem(id);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-24">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[18px] font-semibold tracking-tight text-stone-800">메모장</h2>
        <button 
          onClick={() => {
            if (isAdding) {
               setIsAdding(false);
               setEditingId(null);
               setTitle('');
               setContent('');
               setAudioUrl('');
               const offset = new Date().getTimezoneOffset() * 60000;
               setDate(new Date(Date.now() - offset).toISOString().split('T')[0]);
            } else {
               setIsAdding(true);
               setEditingId(null);
               setTitle('');
               setContent('');
               setAudioUrl('');
               const offset = new Date().getTimezoneOffset() * 60000;
               setDate(new Date(Date.now() - offset).toISOString().split('T')[0]);
            }
          }} 
          className="bg-stone-900 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-800 transition-transform active:scale-95 shadow-sm"
        >
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
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="어떤 생각을 기록할까요? (#태그를 활용해보세요)" className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[15px] focus:ring-1 focus:ring-stone-300 outline-none resize-none font-medium h-32" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-stone-50 border border-stone-100 rounded-xl px-4 py-3 text-[13px] focus:ring-1 focus:ring-stone-300 outline-none text-stone-500 font-bold" required />
            
            {/* Attachments Preview */}
            {(audioUrl) && (
              <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl border border-stone-100">
                {audioUrl && (
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-100 shadow-sm relative">
                    <audio src={audioUrl} controls className="w-full h-8" />
                    <button type="button" onClick={() => setAudioUrl('')} className="shrink-0 p-1 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-full">
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {isRecording ? (
                <button type="button" onClick={stopRecording} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border border-rose-200 bg-rose-50 text-rose-600 active:scale-95 transition-all animate-pulse">
                  <Square size={14} fill="currentColor" /> 녹음 중지
                </button>
              ) : (
                <button type="button" onClick={startRecording} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors active:scale-95">
                  <Mic size={16} /> 음성 녹음
                </button>
              )}
            </div>

            <button type="submit" className="w-full bg-stone-900 text-white rounded-xl py-3 text-sm font-bold mt-1 shadow-sm hover:bg-stone-800 transition-colors active:scale-95">
              기록하기
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-stone-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input 
          type="text" 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="메모 검색..."
          className="w-full bg-white border border-stone-200 shadow-sm rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#D0DDF0] focus:border-[#D0DDF0] outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...items].reverse().filter(item => (item.content || '').toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
          editingId === item.id ? (
            <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-5 rounded-[20px] border border-[#D0DDF0] shadow-[0_4px_20px_rgba(0,0,0,0.05)] col-span-1 sm:col-span-2">
              <form onSubmit={handleAdd} className="space-y-3">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="어떤 생각을 기록할까요? (#태그를 활용해보세요)" className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[15px] focus:ring-2 focus:ring-[#D0DDF0] outline-none resize-none font-medium h-32" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[13px] focus:ring-2 focus:ring-[#D0DDF0] outline-none text-stone-500 font-bold" required />
                
                {(audioUrl) && (
                  <div className="flex flex-col gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-stone-100 shadow-sm relative">
                      <audio src={audioUrl} controls className="w-full h-8" />
                      <button type="button" onClick={() => setAudioUrl('')} className="shrink-0 p-1 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-full border border-stone-200">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {isRecording ? (
                    <button type="button" onClick={stopRecording} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border border-rose-200 bg-rose-50 text-rose-600 active:scale-95 transition-all animate-pulse">
                      <Square size={14} fill="currentColor" /> 녹음 중지
                    </button>
                  ) : (
                    <button type="button" onClick={startRecording} className="flex-1 flex justify-center items-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors active:scale-95">
                      <Mic size={16} /> 다시 녹음
                    </button>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => { setEditingId(null); setContent(''); }} className="flex-1 bg-stone-100 text-stone-600 rounded-xl py-3 text-sm font-bold shadow-sm hover:bg-stone-200 transition-colors active:scale-95">
                    취소
                  </button>
                  <button type="submit" className="flex-1 bg-[#4A697E] text-white rounded-xl py-3 text-sm font-bold shadow-sm hover:bg-[#3A566B] transition-colors active:scale-95">
                    완료
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
          <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-5 rounded-[20px] border border-stone-100 flex flex-col gap-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-shadow relative group">
            <div className="absolute top-4 right-4 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-auto">
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditClick(item); }} className="p-1.5 text-stone-400 hover:text-stone-600 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer active:scale-95">
                <Edit2 size={14} />
              </button>
              <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer active:scale-95">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="pr-16">
              <div className="text-[10px] text-stone-400 font-medium mb-1 tracking-wide">{item.date}</div>
            </div>
            
            {item.audioUrl && (
              <div className="mt-1">
                <audio src={item.audioUrl} controls className="w-full h-8" />
              </div>
            )}

            {item.content && (
              <p className="text-[13px] text-stone-700 whitespace-pre-wrap leading-relaxed mt-1">
                {item.content.split('\n').map((line, i) => {
                  const parts = line.split(/(#\S+)/g);
                  return (
                    <React.Fragment key={i}>
                      {parts.map((part, j) => 
                        part.startsWith('#') ? <span key={j} className="text-sky-500 font-bold bg-sky-50 px-1 rounded-md py-0.5 inline-block mx-0.5">{part}</span> : part
                      )}
                      <br/>
                    </React.Fragment>
                  );
                })}
              </p>
            )}
          </motion.div>
          )
        ))}
        {items.filter(item => (item.content || '').toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
           <div className="col-span-full text-center py-12 text-stone-400 text-sm font-medium">
             기록된 메모가 없습니다.
           </div>
        )}
      </div>
    </motion.div>
  );
}
