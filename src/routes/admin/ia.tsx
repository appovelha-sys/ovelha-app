import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, XCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/ia")({ component: IAPage });

type Provider = {
  id: string; name: string; logo: string; configured: boolean;
  models: { key: string; label: string }[];
};

const PROVIDERS: Provider[] = [
  { id: "anthropic", name: "Anthropic (Claude)", logo: "🧠", configured: false, models: [{ key: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" }, { key: "claude-opus-4", label: "Claude Opus 4" }] },
  { id: "openai", name: "OpenAI", logo: "⚡", configured: false, models: [{ key: "gpt-4o", label: "GPT-4o" }, { key: "gpt-4o-mini", label: "GPT-4o Mini" }] },
  { id: "google", name: "Google Gemini", logo: "✨", configured: false, models: [{ key: "gemini-1.5-pro", label: "Gemini 1.5 Pro" }, { key: "gemini-flash", label: "Gemini Flash" }] },
];

const MODEL_ROLES = [
  { key: "principal", label: "Modelo principal" },
  { key: "alternativo", label: "Modelo alternativo (fallback)" },
  { key: "validacao", label: "Modelo de validação" },
  { key: "embeddings", label: "Modelo de embeddings" },
  { key: "voz", label: "Modelo de voz" },
];

function IAPage() {
  const [providers, setProviders] = useState(PROVIDERS);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [config, setConfig] = useState({ temperature: "0.7", maxTokens: "2048", contextWindow: "8192", costLimit: "50" });
  const [roles, setRoles] = useState<Record<string, string>>({});
  const [fallback, setFallback] = useState(true);

  function testConnection(id: string) {
    if (!keys[id]) { alert("Informe a chave de API primeiro."); return; }
    alert(`Teste simulado para ${id}. Implemente verificação real via Edge Function do Supabase.`);
  }

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Inteligência Artificial</h1>
            <p className="admin-page-sub">Fornecedores, modelos e configurações de IA</p>
          </div>
        </div>

        <div className="admin-alert admin-alert--warn" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} /> As chaves de API são armazenadas localmente nesta sessão. Configure variáveis de ambiente seguras no backend (Edge Functions / Supabase Vault) antes do deploy.
        </div>

        {/* Fornecedores */}
        <h2 className="admin-section-title" style={{ marginBottom: 16 }}>Fornecedores</h2>
        <div className="admin-plan-grid">
          {providers.map(p => (
            <div key={p.id} className="admin-plan-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{p.logo}</span>
                  <div>
                    <p style={{ fontWeight: 700 }}>{p.name}</p>
                    <p style={{ fontSize: 12, color: "var(--admin-muted)" }}>{p.id}.com</p>
                  </div>
                </div>
                {p.configured
                  ? <CheckCircle2 size={18} style={{ color: "#16a34a" }} />
                  : <XCircle size={18} style={{ color: "var(--admin-danger)" }} />}
              </div>
              <div className="afield">
                <label className="afield-label">Chave de API</label>
                <div className="afield-pass">
                  <input
                    className="afield-input afield-input--pass"
                    type={showKeys[p.id] ? "text" : "password"}
                    placeholder="sk-..."
                    value={keys[p.id] ?? ""}
                    onChange={e => setKeys(k => ({ ...k, [p.id]: e.target.value }))}
                  />
                  <button type="button" className="afield-eye"
                    onClick={() => setShowKeys(s => ({ ...s, [p.id]: !s[p.id] }))}>
                    {showKeys[p.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button className="admin-btn-sm" onClick={() => testConnection(p.id)}>Testar conexão</button>
                <button className="admin-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={() => setProviders(pr => pr.map(x => x.id === p.id ? { ...x, configured: !!keys[p.id] } : x))}>
                  Salvar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Atribuição de modelos */}
        <div className="admin-chart-card" style={{ marginTop: 24 }}>
          <h2 className="admin-section-title">Atribuição de modelos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {MODEL_ROLES.map(r => (
              <div key={r.key} className="afield">
                <label className="afield-label">{r.label}</label>
                <select className="afield-select" value={roles[r.key] ?? ""}
                  onChange={e => setRoles(ro => ({ ...ro, [r.key]: e.target.value }))}>
                  <option value="">Não configurado</option>
                  {PROVIDERS.flatMap(p => p.models.map(m => (
                    <option key={m.key} value={m.key}>{p.name} — {m.label}</option>
                  )))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Parâmetros */}
        <div className="admin-chart-card" style={{ marginTop: 20 }}>
          <h2 className="admin-section-title">Parâmetros globais</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {[
              { key: "temperature", label: "Temperatura", hint: "0.0–2.0" },
              { key: "maxTokens", label: "Máx. de tokens", hint: "por resposta" },
              { key: "contextWindow", label: "Janela de contexto", hint: "tokens" },
              { key: "costLimit", label: "Limite de custo mensal", hint: "USD" },
            ].map(({ key, label, hint }) => (
              <div key={key} className="afield">
                <label className="afield-label">{label} <span style={{ opacity: 0.6 }}>({hint})</span></label>
                <input className="afield-input" type="number" value={(config as any)[key]}
                  onChange={e => setConfig(c => ({ ...c, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <input type="checkbox" id="fallback" checked={fallback} onChange={e => setFallback(e.target.checked)} />
            <label htmlFor="fallback" style={{ fontSize: 14 }}>Ativar fallback automático para modelo alternativo em caso de falha</label>
          </div>
          <button className="admin-btn-primary" style={{ marginTop: 16 }}>Salvar configurações</button>
        </div>
      </div>
    </AdminShell>
  );
}
