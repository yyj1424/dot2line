'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';

type Reply = { content: string; at: string };
type Row = { caseNo: string; category: string; statusLabel: string; at: string; replies: Reply[] };
type Options = { consult: Record<string, string>; claim: Record<string, string> };

// 배송조회 페이지 하단의 "문의하기". 로그인 없이 배송조회 링크(토큰)로 남기며, 내용은 항상 글자 그대로(textContent 성격) 표시한다.
export default function TrackInquiry({ token }: { token: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [options, setOptions] = useState<Options | null>(null);
  const [categoryCd, setCategoryCd] = useState('DELIVERY_INQUIRY');
  const [content, setContent] = useState('');
  const [contact, setContact] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  // 같은 입력을 더블클릭·재시도해도 한 건만 접수되도록, 입력을 바꿀 때까지 같은 키를 쓴다.
  const requestKey = useRef<string>(typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()));

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}/inquiry`, { cache: 'no-store' });
      const d = await res.json();
      if (d.success) { setRows(d.rows || []); setOptions(d.options || null); }
    } catch { /* 목록을 못 불러와도 접수는 계속 할 수 있다 */ }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!content.trim()) { setMessage({ ok: false, text: '문의 내용을 입력해 주세요.' }); return; }
    setSending(true); setMessage(null);
    try {
      const res = await fetch(`/api/track/${encodeURIComponent(token)}/inquiry`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryCd, content: content.trim(), contact: contact.trim() || null, requestKey: requestKey.current }),
      });
      const d = await res.json();
      if (d.success) {
        setMessage({ ok: true, text: d.message || '문의가 접수되었습니다.' });
        setContent(''); setContact(''); requestKey.current = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
        await load();
      } else {
        setMessage({ ok: false, text: d.message || '접수하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
      }
    } catch {
      setMessage({ ok: false, text: '서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setSending(false);
    }
  };

  const groups: [string, Record<string, string>][] = options
    ? [['문의', options.consult], ['불편·클레임', options.claim]]
    : [['문의', { DELIVERY_INQUIRY: '배송 문의', ETC: '기타 문의' }]];

  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <MessageSquare size={14} /> 문의하기
      </h3>

      {rows.length > 0 && (
        <div className="space-y-3 mb-4">
          {rows.map((r) => (
            <div key={r.caseNo} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-200">{r.category} · {r.caseNo}</span>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">{r.statusLabel}</span>
              </div>
              <p className="text-slate-500 mt-1">{r.at}</p>
              {r.replies.map((p, i) => (
                <div key={i} className="mt-2 p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <p className="text-[11px] text-indigo-300 mb-1">담당자 답변 · {p.at}</p>
                  <p className="text-slate-200 whitespace-pre-wrap break-words">{p.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3">
        <select
          value={categoryCd}
          onChange={(e) => setCategoryCd(e.target.value)}
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500"
        >
          {groups.map(([label, items]) => (
            <optgroup key={label} label={label}>
              {Object.entries(items).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </optgroup>
          ))}
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={1000}
          rows={4}
          placeholder="문의 내용을 적어 주세요. 주민번호·카드번호 같은 민감한 정보는 적지 마세요."
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500 resize-none"
        />
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          maxLength={100}
          placeholder="회신받을 연락처(선택)"
          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 outline-none focus:border-indigo-500"
        />
        {message && (
          <p className={`text-xs p-2.5 rounded-lg border ${message.ok ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800' : 'text-red-300 bg-red-950/40 border-red-800'}`}>
            {message.text}
          </p>
        )}
        <button
          type="submit"
          disabled={sending}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition active:scale-95"
        >
          <Send size={14} /> {sending ? '접수 중...' : '문의 접수'}
        </button>
        <p className="text-[11px] text-slate-500">접수된 문의는 담당자가 확인한 뒤 연락드리거나 이 화면에 답변을 남깁니다.</p>
      </form>
    </div>
  );
}
