import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import {
  FlaskConical, Send, ThumbsUp, ThumbsDown, Edit2, Save,
  Zap, Clock, ChevronDown, ChevronUp,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/laboratorio")({ component: LaboratorioPage });

type Msg = {
  role: "user" | "ai";
  text: string;
  tokens?: number;
  latency?: number;
  cached?: number;
  rating?: "ok" | "bad" | null;
  seqId?: string;
};

/** Estrutura de saída da IA — um array de blocos independentes. */
type AiResponse = {
  blocks: { text: string; urgent?: boolean }[];
  totalTokens: number;
  latencyMs: number;
};

const MODELS = ["Claude Sonnet 4.5", "Claude Opus 4", "GPT-4o", "Gemini 1.5 Pro"];
const VERSIONS = ["0.1-rascunho (atual)", "0.0-base"];
const DELAYS = [
  { label: "Rápido (0.5s)", ms: 500 },
  { label: "Natural (1.2s)", ms: 1200 },
  { label: "Pausado (2s)", ms: 2000 },
];

type BrainStatus = { pillar: string; label: string; icon: string; status: "publicado" | "rascunho" | "vazio" };
const BRAIN_STATUS: BrainStatus[] = [
  { pillar: "identidade",    label: "Identidade",    icon: "🌱", status: "vazio" },
  { pillar: "fundamentos",   label: "Fundamentos",   icon: "📖", status: "publicado" },
  { pillar: "personalidade", label: "Personalidade", icon: "🧠", status: "vazio" },
  { pillar: "comunicacao",   label: "Comunicação",   icon: "💬", status: "vazio" },
];

/** Simula chamada à IA que retorna estrutura com múltiplos blocos. */
async function simulateAiCall(userText: string, model: string): Promise<AiResponse> {
  // Simula latência de rede para primeira resposta
  await new Promise(r => setTimeout(r, Math.floor(Math.random() * 800 + 400)));

  const totalTokens = Math.floor(Math.random() * 300 + 50);
  const latencyMs = Math.floor(Math.random() * 1500 + 300);

  // Determina número de blocos (1–3) baseado no conteúdo simulado
  const roll = Math.random();
  const isUrgent = /ajuda|emergência|perigo|socorro/i.test(userText);

  let blocks: { text: string; urgent?: boolean }[];

  if (isUrgent) {
    blocks = [{ text: "Estou aqui com você agora.", urgent: true }];
  } else if (roll < 0.4) {
    // Resposta única
    blocks = [{ text: `[Simulação — ${model}] Uma resposta completa e direta à sua mensagem. Conecte a integração real para respostas reais.` }];
  } else if (roll < 0.75) {
    // Dois blocos
    blocks = [
      { text: `Boa pergunta! 😊 Deixa eu pensar aqui...` },
      { text: `[Simulação — ${model}] Essa é a resposta completa. No OVELHA real, cada bloco seria gerado pelo cérebro publicado com base nos fundamentos e personalidade configurados.` },
    ];
  } else {
    // Três blocos
    blocks = [
      { text: `Hmm, interessante isso que você trouxe! 🤔` },
      { text: `[Simulação — ${model}] Segundo bloco — desenvolvendo a ideia com mais profundidade.` },
      { text: `Faz sentido? Me fala o que você achou 🙏` },
    ];
  }

  return { blocks, totalTokens, latencyMs };
}

function LaboratorioPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState(MODELS[0]);
  const [version, setVersion] = useState(VERSIONS[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [correction, setCorrection] = useState<{ idx: number; text: string } | null>(null);
  const [showBrain, setShowBrain] = useState(true);
  const [blockDelay, setBlockDelay] = useState(DELAYS[1].ms);
  const seqRef = useRef<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll quando novas mensagens chegam
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, isTyping]);

  const totalIn = msgs.filter(m => m.role === "ai").reduce((s, m) => s + (m.tokens ?? 0), 0);
  const totalCached = msgs.filter(m => m.role === "ai").reduce((s, m) => s + (m.cached ?? 0), 0);
  const aiMsgsWithLatency = msgs.filter(m => m.role === "ai" && m.latency);
  const avgLatency = aiMsgsWithLatency.length > 0
    ? Math.round(aiMsgsWithLatency.reduce((s, m) => s + (m.latency ?? 0), 0) / aiMsgsWithLatency.length)
    : 0;

  async function send() {
    if (!input.trim() || isTyping) return;

    // Cancela sequência em andamento (nova mensagem interrompe blocos pendentes)
    const seqId = crypto.randomUUID();
    seqRef.current = seqId;

    const userMsg: Msg = { role: "user", text: input };
    setMsgs(m => [...m, userMsg]);
    setInput("");
    setIsTyping(true);

    let response: AiResponse;
    try {
      // Uma única chamada à IA que retorna todos os blocos
      response = await simulateAiCall(userMsg.text, model);
    } catch {
      if (seqRef.current !== seqId) return;
      setIsTyping(false);
      return;
    }

    const { blocks, totalTokens, latencyMs } = response;

    for (let i = 0; i < blocks.length; i++) {
      // Verifica se a sequência ainda é válida (usuário pode ter enviado nova mensagem)
      if (seqRef.current !== seqId) return;

      const block = blocks[i];

      // Urgente: entrega imediata sem atraso entre blocos
      if (!block.urgent && i > 0) {
        await new Promise(r => setTimeout(r, blockDelay));
        if (seqRef.current !== seqId) return;
      }

      setIsTyping(false);

      const isFirst = i === 0;
      const cached = isFirst ? Math.floor(Math.random() * totalTokens * 0.6) : 0;
      const msg: Msg = {
        role: "ai",
        text: block.text,
        tokens: isFirst ? totalTokens : Math.floor(Math.random() * 60 + 10),
        latency: isFirst ? latencyMs : undefined,
        cached: isFirst ? cached : undefined,
        rating: null,
        seqId,
      };

      setMsgs(m => [...m, msg]);

      // Exibe digitando antes do próximo bloco
      if (i < blocks.length - 1) {
        await new Promise(r => setTimeout(r, 120));
        if (seqRef.current !== seqId) return;
        setIsTyping(true);
      }
    }

    setIsTyping(false);
  }

  function rate(idx: number, r: "ok" | "bad") {
    setMsgs(m => m.map((x, i) => i === idx ? { ...x, rating: r } : x));
  }

  function saveCorrection() {
    if (!correction) return;
    setMsgs(m => m.map((x, i) => i === correction.idx ? { ...x, text: correction.text } : x));
    setCorrection(null);
    alert("Correção salva. Revise em Cérebro > Exemplos antes de publicar.");
  }

  return (
    <AdminShell>
      <div className="admin-page" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)", overflow: "hidden" }}>
        <div className="admin-page-header" style={{ flexShrink: 0 }}>
          <div>
            <h1 className="admin-page-title">Laboratório de Personalidade</h1>
            <p className="admin-page-sub">Teste o Cérebro sem afetar usuários reais</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div className="admin-select-wrap">
              <label style={{ fontSize: 12, color: "var(--admin-muted)" }}>Intervalo</label>
              <select className="afield-select" value={blockDelay} onChange={e => setBlockDelay(Number(e.target.value))}>
                {DELAYS.map(d => <option key={d.ms} value={d.ms}>{d.label}</option>)}
              </select>
            </div>
            <div className="admin-select-wrap">
              <label style={{ fontSize: 12, color: "var(--admin-muted)" }}>Versão</label>
              <select className="afield-select" value={version} onChange={e => setVersion(e.target.value)}>
                {VERSIONS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="admin-select-wrap">
              <label style={{ fontSize: 12, color: "var(--admin-muted)" }}>Modelo de IA</label>
              <select className="afield-select" value={model} onChange={e => setModel(e.target.value)}>
                {MODELS.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Brain Engine context panel */}
        <div style={{ flexShrink: 0, borderBottom: "1px solid var(--admin-border)", background: "#FDFAF7" }}>
          <button
            onClick={() => setShowBrain(s => !s)}
            style={{ width: "100%", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8,
              background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--admin-text)" }}>
            <Zap size={14} style={{ color: "#F59E0B" }} />
            Brain Engine
            <span style={{ marginLeft: 4, fontWeight: 400, color: "var(--admin-muted)", fontSize: 12 }}>
              {BRAIN_STATUS.filter(b => b.status === "publicado").length}/{BRAIN_STATUS.length} pilares compilados
            </span>
            {totalIn > 0 && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)", display: "flex", gap: 12 }}>
                <span><Zap size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {totalIn.toLocaleString()} tokens</span>
                {totalCached > 0 && <span style={{ color: "#16a34a" }}>⚡ {totalCached.toLocaleString()} cache</span>}
                {avgLatency > 0 && <span><Clock size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {avgLatency}ms</span>}
              </span>
            )}
            <span style={{ marginLeft: totalIn > 0 ? 8 : "auto" }}>{showBrain ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</span>
          </button>
          {showBrain && (
            <div style={{ padding: "0 20px 14px", display: "flex", gap: 12, flexWrap: "wrap" }}>
              {BRAIN_STATUS.map(b => (
                <div key={b.pillar} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12,
                  padding: "5px 12px", borderRadius: 999, border: "1px solid var(--admin-border)",
                  background: b.status === "publicado" ? "#F0FDF4" : b.status === "rascunho" ? "#FEF9EC" : "#F7F3EF",
                  color: b.status === "publicado" ? "#15803d" : b.status === "rascunho" ? "#A07820" : "var(--admin-muted)" }}>
                  <span>{b.icon}</span>
                  <span style={{ fontWeight: 600 }}>{b.label}</span>
                  <span style={{ opacity: 0.7 }}>
                    {b.status === "publicado" ? "✓ compilado" : b.status === "rascunho" ? "rascunho" : "vazio"}
                  </span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: "var(--admin-muted)", alignSelf: "center", marginLeft: 4 }}>
                Os pilares são injetados no prompt antes de cada conversa.
              </div>
            </div>
          )}
        </div>

        {/* Chat */}
        <div ref={chatRef} className="lab-chat">
          {msgs.length === 0 && !isTyping && (
            <div className="admin-chart-placeholder" style={{ flex: 1 }}>
              <FlaskConical size={32} style={{ color: "var(--admin-muted)" }} />
              <p>Envie uma mensagem para testar o Cérebro</p>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`lab-msg lab-msg--${m.role}`}>
              <div className="lab-bubble">
                {correction?.idx === i ? (
                  <div>
                    <textarea className="afield-textarea" rows={4}
                      value={correction.text}
                      onChange={e => setCorrection(c => c ? { ...c, text: e.target.value } : c)}
                    />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button className="admin-btn-ghost" style={{ fontSize: 12 }} onClick={() => setCorrection(null)}>Cancelar</button>
                      <button className="admin-btn-primary" style={{ fontSize: 12 }} onClick={saveCorrection}><Save size={12} /> Salvar correção</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
                )}
              </div>
              {m.role === "ai" && (
                <div className="lab-msg-meta">
                  {m.tokens != null && <span><Zap size={11} /> {m.tokens} tokens</span>}
                  {m.cached != null && m.cached > 0 && <span style={{ color: "#16a34a" }}>⚡ {m.cached} cache</span>}
                  {m.latency != null && <span><Clock size={11} /> {m.latency}ms</span>}
                  <button className={`lab-rate${m.rating === "ok" ? " lab-rate--ok" : ""}`} onClick={() => rate(i, "ok")}><ThumbsUp size={13} /></button>
                  <button className={`lab-rate${m.rating === "bad" ? " lab-rate--bad" : ""}`} onClick={() => rate(i, "bad")}><ThumbsDown size={13} /></button>
                  <button className="icon-btn-sm" title="Corrigir resposta" onClick={() => setCorrection({ idx: i, text: m.text })}><Edit2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
          {/* Indicador de digitação — aparece antes da primeira mensagem e entre blocos */}
          {isTyping && (
            <div className="lab-msg lab-msg--ai">
              <div className="lab-bubble lab-bubble--loading">
                <span /><span /><span />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="lab-input-row">
          <textarea
            className="lab-input"
            rows={2}
            placeholder={isTyping ? "Enviando nova mensagem cancela a sequência em andamento..." : "Digite uma mensagem de teste..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          <button className="admin-btn-primary lab-send" onClick={send} disabled={!input.trim()}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
