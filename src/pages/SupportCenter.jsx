import React, { useEffect, useMemo, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { Bot, Send, Headphones, PackageSearch, CreditCard, Ban, Store, AlertTriangle, UserRound, RefreshCw, CheckCircle2, ExternalLink, Utensils, ShoppingCart, HelpCircle } from 'lucide-react';

const QUICK = [
  { label: 'How to reorder', icon: Utensils, text: 'reorder kaise kare' },
  { label: 'How to use the website', icon: HelpCircle, text: 'website ko kaise use kare? saare main features samjhao' },
  { label: 'How to use Cart', icon: ShoppingCart, text: 'cart kaise use kare aur checkout kaise kare?' },
  { label: 'Track my live order', icon: PackageSearch, text: 'I want to track my live order.' },
  { label: 'Payment problem', icon: CreditCard, text: 'I have a payment problem. Please check my latest order/payment status.' },
  { label: 'Cancel an order', icon: Ban, text: 'I want to cancel an order. Please check which of my orders can be cancelled.' },
  { label: 'Restaurant / delivery issue', icon: Store, text: 'I have a restaurant or delivery problem with my order.' },
  { label: 'Website problem', icon: AlertTriangle, text: 'I think the website is not working correctly. Please analyse the problem.' },
  { label: 'Another problem', icon: UserRound, text: '' }
];

const greeting = {
  id: 'greeting', senderType: 'AI', senderName: 'Panipuri Store AI',
  content: 'Welcome to Panipuri Store Support 👋 I can analyse your order, payment, delivery, restaurant, account or website issue. Choose an option below or type your own question. If I cannot safely solve it, I will route the issue to the right support team.',
  sources: []
};

export default function SupportCenter() {
  const [conversations, setConversations] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingCancel, setPendingCancel] = useState(null);

  const messages = useMemo(() => {
    const server = conversation?.messages || [];
    return server.length ? server : [greeting];
  }, [conversation]);

  useEffect(() => {
    axios.get('/support/mine').then(res => {
      setConversations(res.data || []);
      if (res.data?.length) setConversation(res.data[0]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const sendMessage = async (text = input) => {
    const message = (text || '').trim();
    if (!message || sending) return;
    setSending(true);
    setInput('');
    try {
      const res = await axios.post('/support/chat', { conversationId: conversation?.id || null, message, category: null });
      setConversation(res.data.conversation);
      setConversations(prev => [res.data.conversation, ...prev.filter(c => c.id !== res.data.conversation.id)]);
      if (res.data.action === 'CANCEL_ORDER' && res.data.actionOrderId) {
        setPendingCancel({ orderId: res.data.actionOrderId, reason: message });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Support is temporarily unavailable. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const cancelOrder = async () => {
    if (!pendingCancel) return;
    try {
      await axios.post('/support/action/cancel-order', pendingCancel);
      toast.success('Order cancellation request processed.');
      setPendingCancel(null);
      setConversation(prev => prev ? {
        ...prev,
        messages: [...(prev.messages || []), {
          id: 'cancel-' + Date.now(), senderType: 'AI', senderName: 'Panipuri Store AI',
          content: 'I processed the cancellation request. Please check your Orders section for the latest status.',
          createdAt: new Date().toISOString(), sources: []
        }]
      } : prev);
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'This order cannot be cancelled.');
    }
  };

  const startNew = () => { setConversation(null); setPendingCancel(null); };

  return (
    <div className="pt-28 pb-20 min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20"><Headphones className="w-6 h-6" /></div>
            <div><h1 className="text-3xl md:text-4xl font-black tracking-tight">Customer Support</h1><p className="text-muted-foreground text-sm font-medium">AI support + human escalation</p></div>
          </div>
          <button onClick={startNew} className="px-4 py-2.5 rounded-xl bg-muted font-bold text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4" /> New chat</button>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr] gap-5">
          <aside className="card-premium p-4 h-fit">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground px-2 mb-3">What do you need?</p>
            <div className="space-y-2">
              {QUICK.map((q) => {
                const Icon = q.icon;
                return <button key={q.label} onClick={() => q.text ? sendMessage(q.text) : document.getElementById('support-input')?.focus()}
                  className="w-full text-left p-3 rounded-xl bg-muted/70 hover:bg-primary/10 transition-colors flex items-center gap-3 font-bold text-sm">
                  <Icon className="w-4 h-4 text-primary shrink-0" /> {q.label}
                </button>;
              })}
            </div>
          </aside>

          <section className="card-premium overflow-hidden min-h-[650px] flex flex-col">
            <div className="px-5 py-4 border-b border-border bg-muted/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="w-5 h-5 text-primary" /></div>
              <div><p className="font-black">Panipuri Store AI</p><p className="text-xs text-muted-foreground">Analyses your account and order context</p></div>
              <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Online</span>
            </div>

            <div className="flex-1 p-4 md:p-6 space-y-4 overflow-y-auto max-h-[620px]">
              {loading ? <div className="text-center py-20 text-muted-foreground">Loading support…</div> :
                messages.map((m, i) => (
                  <div key={m.id || i} className={'flex ' + (m.senderType === 'USER' ? 'justify-end' : 'justify-start')}>
                    <div className={'max-w-[88%] rounded-2xl px-4 py-3 ' + (m.senderType === 'USER' ? 'bg-primary text-white rounded-br-md' : 'bg-muted rounded-bl-md')}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{m.senderName || m.senderType}</p>
                      <p className="text-sm leading-6 whitespace-pre-wrap">{m.content}</p>
                      {m.sources?.length > 0 && <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
                        {m.sources.slice(0, 3).map((s, idx) => <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="text-xs text-primary font-bold flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {s.title}</a>)}
                      </div>}
                    </div>
                  </div>
                ))
              }
              {sending && <div className="text-xs text-muted-foreground px-3">AI is analysing your issue…</div>}
              {pendingCancel && (
                <div className="p-4 rounded-2xl border border-red-200 bg-red-50 dark:bg-red-950/20">
                  <p className="font-black text-sm mb-2">Confirm order cancellation</p>
                  <p className="text-xs text-muted-foreground mb-3">The AI identified an order that may be cancellable. Please confirm before any cancellation action.</p>
                  <div className="flex gap-2">
                    <button onClick={cancelOrder} className="px-4 py-2 rounded-xl bg-red-500 text-white font-black text-sm">Confirm Cancel</button>
                    <button onClick={() => setPendingCancel(null)} className="px-4 py-2 rounded-xl bg-muted font-bold text-sm">Keep Order</button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-4">
              <div className="flex items-end gap-2">
                <textarea id="support-input" value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Type your problem or question…" rows={2} className="input-premium flex-1 resize-none" />
                <button onClick={() => sendMessage()} disabled={sending || !input.trim()} className="btn-primary px-5 py-3 flex items-center gap-2"><Send className="w-4 h-4" /> Send</button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">For website/developer issues, the AI can create a human escalation for the admin/support team.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}