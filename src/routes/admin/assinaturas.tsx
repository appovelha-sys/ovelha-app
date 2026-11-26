import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit2, Trash2, Check } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/assinaturas")({ component: AssinaturasPage });

type Plan = { id: string; name: string; price: number; period: "mensal" | "anual"; msgs: number; active: boolean; free: boolean };

const INITIAL: Plan[] = [
  { id: "1", name: "Gratuito", price: 0, period: "mensal", msgs: 30, active: true, free: true },
  { id: "2", name: "Pro", price: 19.90, period: "mensal", msgs: 500, active: true, free: false },
  { id: "3", name: "Pro Anual", price: 179.90, period: "anual", msgs: 500, active: false, free: false },
];

function AssinaturasPage() {
  const [plans, setPlans] = useState<Plan[]>(INITIAL);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", period: "mensal", msgs: "" });

  function addPlan() {
    if (!form.name) return;
    setPlans(p => [...p, {
      id: Date.now().toString(),
      name: form.name,
      price: Number(form.price),
      period: form.period as "mensal" | "anual",
      msgs: Number(form.msgs),
      active: false,
      free: Number(form.price) === 0,
    }]);
    setForm({ name: "", price: "", period: "mensal", msgs: "" });
    setShowForm(false);
  }

  function remove(id: string) {
    if (!confirm("Remover plano?")) return;
    setPlans(p => p.filter(x => x.id !== id));
  }

  function toggle(id: string) {
    setPlans(p => p.map(x => x.id === id ? { ...x, active: !x.active } : x));
  }

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Assinaturas</h1>
            <p className="admin-page-sub">Planos, preços e gerenciamento de assinantes</p>
          </div>
          <button className="admin-btn-primary" onClick={() => setShowForm(s => !s)}>
            <Plus size={15} /> Novo plano
          </button>
        </div>

        <div className="admin-alert admin-alert--warn" style={{ marginBottom: 20 }}>
          Integração com provedor de pagamento (Stripe/Hotmart) não configurada. Configure em Configurações &gt; Meios de Pagamento.
        </div>

        {showForm && (
          <div className="cerebro-form" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Novo plano</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input className="afield-input" placeholder="Nome do plano" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input className="afield-input" placeholder="Preço (R$) — 0 para gratuito" type="number" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              <select className="afield-select" value={form.period}
                onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
              <input className="afield-input" placeholder="Limite de mensagens/mês" type="number" value={form.msgs}
                onChange={e => setForm(f => ({ ...f, msgs: e.target.value }))} />
            </div>
            <div className="cerebro-form-actions" style={{ marginTop: 12 }}>
              <button className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="admin-btn-primary" onClick={addPlan}>Salvar plano</button>
            </div>
          </div>
        )}

        <div className="admin-plan-grid">
          {plans.map(p => (
            <div key={p.id} className={`admin-plan-card${p.active ? " admin-plan-card--active" : ""}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: 18 }}>{p.name}</h3>
                  <p style={{ fontSize: 13, color: "var(--admin-muted)" }}>{p.period}</p>
                </div>
                <span className={`cerebro-tag ${p.active ? "cerebro-tag--live" : "cerebro-tag--off"}`}>
                  {p.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p style={{ fontSize: 32, fontWeight: 900, margin: "12px 0 4px", color: "var(--admin-accent)" }}>
                {p.price === 0 ? "Grátis" : `R$ ${p.price.toFixed(2)}`}
              </p>
              <div style={{ fontSize: 13, color: "var(--admin-muted)", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={13} /> {p.msgs} mensagens/mês</div>
                {p.free && <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Check size={13} /> Funcionalidades básicas</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="admin-btn-sm" onClick={() => toggle(p.id)}>{p.active ? "Desativar" : "Ativar"}</button>
                <button className="icon-btn-sm" onClick={() => alert("Edição de plano em breve.")}><Edit2 size={14} /></button>
                <button className="icon-btn-sm icon-btn-sm--danger" onClick={() => remove(p.id)}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
