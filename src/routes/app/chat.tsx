import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/app/chat")({ component: ChatScreen });

type Msg = {
  id?: string;
  role: "user" | "ai";
  content: string;
  created_at?: string;
};

type SupabaseMsg = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

async function loadHistory(userId: string): Promise<Msg[]> {
  const { data } = await supabase
    .from("conversations")
    .select("id, role, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(60);
  return (data as SupabaseMsg[] ?? []).map(r => ({
    id: r.id,
    role: r.role as "user" | "ai",
    content: r.content,
    created_at: r.created_at,
  }));
}

async function saveMsg(userId: string, role: "user" | "ai", content: string) {
  await supabase.from("conversations").insert({ user_id: userId, role, content });
}

async function callAI(message: string, history: Msg[]): Promise<string> {
  const aiHistory = history.slice(-10).map(m => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.content,
  }));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history: aiHistory }),
  });

  if (!res.ok) throw new Error("API error");
  const json = await res.json();
  return json.response ?? "Não consegui responder agora. Tente novamente!";
}

function ChatScreen() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [msgs, typing, scrollToBottom]);

  useEffect(() => {
    (async () => {
      const uid = await getUserId();
      setUserId(uid);
      if (uid) {
        const hist = await loadHistory(uid);
        setMsgs(hist);
      }
      setLoading(false);
    })();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || typing) return;

    setInput("");
    textareaRef.current && (textareaRef.current.style.height = "auto");

    const userMsg: Msg = { role: "user", content: text };
    setMsgs(m => [...m, userMsg]);
    setTyping(true);

    if (userId) await saveMsg(userId, "user", text);

    try {
      const allMsgs = [...msgs, userMsg];
      const aiText = await callAI(text, allMsgs);
      const aiMsg: Msg = { role: "ai", content: aiText };
      setMsgs(m => [...m, aiMsg]);
      if (userId) await saveMsg(userId, "ai", aiText);
    } catch {
      const errMsg: Msg = {
        role: "ai",
        content: "Ops, tive um problema técnico. Tente de novo daqui a pouco 🙏",
      };
      setMsgs(m => [...m, errMsg]);
    } finally {
      setTyping(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function onInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  if (loading) {
    return (
      <AppShell>
        <div className="app-chat-screen">
          <div className="app-chat-loading">
            <span /><span /><span />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="app-chat-screen">
        {/* Header */}
        <header className="app-chat-header">
          <div className="app-chat-avatar">🐑</div>
          <div>
            <div className="app-chat-name">ovelha.</div>
            <div className="app-chat-status">Seu lugar pertinho de Jesus</div>
          </div>
        </header>

        {/* Mensagens */}
        <div className="app-chat-msgs">
          {msgs.length === 0 && !typing && (
            <div className="app-chat-empty">
              <p>Olá! Estou aqui para caminhar com você na fé. O que está no seu coração hoje? 🙏</p>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={m.id ?? i} className={`app-chat-msg app-chat-msg--${m.role}`}>
              {m.role === "ai" && <div className="app-chat-ai-avatar">🐑</div>}
              <div className="app-chat-bubble">{m.content}</div>
            </div>
          ))}

          {typing && (
            <div className="app-chat-msg app-chat-msg--ai">
              <div className="app-chat-ai-avatar">🐑</div>
              <div className="app-chat-bubble app-chat-bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="app-chat-input-row">
          <textarea
            ref={textareaRef}
            className="app-chat-input"
            rows={1}
            placeholder="Escreva algo..."
            value={input}
            onChange={onInput}
            onKeyDown={onKey}
            disabled={typing}
          />
          <button
            className="app-chat-send"
            onClick={send}
            disabled={!input.trim() || typing}
            aria-label="Enviar"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
