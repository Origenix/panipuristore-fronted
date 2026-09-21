import React, { useEffect, useRef, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';

export default function AdminSupportPanel() {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const knownEscalations = useRef(new Set());
  const firstLoad = useRef(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/support/admin/all');
      const next = res.data || [];
      if (!firstLoad.current) {
        next.filter(x => x.status === 'WAITING_HUMAN' && !knownEscalations.current.has(x.id)).forEach(x => {
          toast.error('New support escalation: ' + x.customerName + ' · ' + x.category, { duration: 5000 });
        });
      }
      next.forEach(x => { if (x.status === 'WAITING_HUMAN') knownEscalations.current.add(x.id); });
      firstLoad.current = false;
      setItems(next);
      setSelected(prev => prev ? (next.find(x => x.id === prev.id) || prev) : prev);
    } catch { toast.error('Failed to load support conversations.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, []);

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    try {
      const res = await axios.post('/support/' + selected.id + '/reply', { message: reply });
      setSelected(res.data); setReply('');
      setItems(prev => prev.map(x => x.id === res.data.id ? res.data : x));
      toast.success('Reply sent.');
    } catch (e) { toast.error(e.response?.data?.message || 'Reply failed.'); }
  };

  const setStatus = async (status) => {
    if (!selected) return;
    try {
      const res = await axios.put('/support/' + selected.id + '/status', { status });
      setSelected(res.data); setItems(prev => prev.map(x => x.id === res.data.id ? res.data : x));
    } catch (e) { toast.error(e.response?.data?.message || 'Status update failed.'); }
  };

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-5">
      <div className="card-premium overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div><h2 className="text-xl font-black">Support Inbox</h2><p className="text-xs text-muted-foreground">{items.length} conversations</p></div>
          <button onClick={load} className="p-2 rounded-xl bg-muted"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="max-h-[680px] overflow-y-auto">
          {loading ? <p className="p-6 text-sm text-muted-foreground">Loading…</p> :
            items.map(item => <button key={item.id} onClick={() => setSelected(item)} className={'w-full text-left p-4 border-b border-border hover:bg-muted/50 ' + (selected?.id === item.id ? 'bg-primary/5' : '')}>
              <div className="flex items-center justify-between gap-2"><span className="font-black text-sm truncate">{item.customerName}</span><span className="text-[10px] font-black">{item.priority}</span></div>
              <p className="text-xs text-muted-foreground truncate mt-1">{item.category} · {item.status}</p>
              <p className="text-xs mt-2 line-clamp-2">{item.aiSummary || 'No AI summary yet'}</p>
            </button>)
          }
          {!loading && !items.length && <p className="p-8 text-sm text-muted-foreground">No support conversations yet.</p>}
        </div>
      </div>

      <div className="card-premium min-h-[680px] flex flex-col">
        {!selected ? <div className="flex-1 flex items-center justify-center text-muted-foreground"><div className="text-center"><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Select a support conversation.</p></div></div> :
          <>
            <div className="p-5 border-b border-border flex flex-wrap items-center gap-3">
              <div><h2 className="font-black">{selected.customerName}</h2><p className="text-xs text-muted-foreground">{selected.customerEmail} · {selected.customerPhone || 'No phone'}</p></div>
              <div className="ml-auto flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-muted text-[10px] font-black">{selected.priority}</span>
                <select value={selected.status} onChange={e => setStatus(e.target.value)} className="input-premium py-2 text-xs">
                  <option>OPEN</option><option>WAITING_HUMAN</option><option>RESOLVED</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[550px]">
              {selected.messages?.map(m => <div key={m.id} className={'flex ' + (m.senderType === 'USER' ? 'justify-end' : 'justify-start')}>
                <div className={'max-w-[85%] rounded-2xl px-4 py-3 ' + (m.senderType === 'USER' ? 'bg-primary text-white' : m.senderType === 'AI' ? 'bg-muted' : 'bg-blue-50 dark:bg-blue-950/20')}>
                  <p className="text-[10px] font-black uppercase opacity-60 mb-1">{m.senderType} · {m.senderName}</p>
                  <p className="text-sm whitespace-pre-wrap leading-6">{m.content}</p>
                </div>
              </div>)}
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <input value={reply} onChange={e => setReply(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendReply()} className="input-premium flex-1" placeholder="Reply to customer / add resolution…" />
              <button onClick={sendReply} className="btn-primary px-5 flex items-center gap-2"><Send className="w-4 h-4" /> Reply</button>
            </div>
          </>
        }
      </div>
    </div>
  );
}