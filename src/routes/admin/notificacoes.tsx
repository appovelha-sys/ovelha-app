import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Send, Clock, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/notificacoes")({ component: NotificacoesPage });

type Notif = { id: string; title: string; type: string; segment: string; status: "enviada" | "agendada" | "rascunho"; date: string };

const TYPES = ["Push", "Interna", "E-mail", "Boas-vindas", "Lembrete", "Campanha", "Devocional", "Assinatura"];
const SEGMENTS = ["Todos os usuários", "Gratuitos", "Pro", "Inativos 7+ dias", "Novos (7 dias)"];

const SAMPLE: Notif[] = [
  { id: "1", title: "Bom dia! Seu devocional de hoje está pronto 🌿", type: "Push", segment: "Todos os usuários", status: "agendada", date: "2026-11-26 07:00" },
  { id: "2", title: "Bem-vindo ao OVELHA!", type: "Boas-vindas", segment: "Novos (7 dias)", status: "enviada", date: "2026-11-25 10:30" },
];

function NotificacoesPage() {
  const [notifs, setNotifs] = useState<Notif[]>(SAMPLE);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", type: TYPES[0], segment: SEGMENTS[0], scheduled: "" });

  function save(asDraft: boolean) {
    if (!form.title) return;
    setNotifs(n => [...n, {
      id: Date.now().toString(),
      title: form.title,
      type: form.type,
      segment: form.segment,
      status: asDraft ? "rascunho" : form.scheduled ? "agendada" : "enviada",
      date: form.scheduled || new Date().toLocaleString("pt-BR"),
    }]);
    setForm({ title: "", body: "", type: TYPES[0], segment: SEGMENTS[0], scheduled: "" });
    setShowForm(false);
  }

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Notificações</h1>
            <p className="admin-page-sub">Comunicações e campanhas</p>
          </div>
          <button className="admin-btn-primary" onClick={() => setShowForm(s => !s)}>
            <Plus size={15} /> Nova notificação
          </button>
        </div>

        {showForm && (
          <div className="cerebro-form" style={{ marginBottom: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="afield" style={{ gridColumn: "1 / -1" }}>
                <label className="afield-label">Título</label>
                <input className="afield-input" placeholder="Título da notificação" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="afield" style={{ gridColumn: "1 / -1" }}>
                <label className="afield-label">Corpo da mensagem</label>
                <textarea className="afield-textarea" rows={3} placeholder="Texto da notificação..."
                  value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div className="afield">
                <label className="afield-label">Tipo</label>
                <select className="afield-select" value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="afield">
                <label className="afield-label">Segmento</label>
                <select className="afield-select" value={form.segment}
                  onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                  {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="afield" style={{ gridColumn: "1 / -1" }}>
                <label className="afield-label">Agendar para (opcional)</label>
                <input className="afield-input" type="datetime-local" value={form.scheduled}
                  onChange={e => setForm(f => ({ ...f, scheduled: e.target.value }))} />
              </div>
            </div>
            <div className="cerebro-form-actions">
              <button className="admin-btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="admin-btn-ghost" onClick={() => save(true)}><Clock size={14} /> Salvar rascunho</button>
              <button className="admin-btn-primary" onClick={() => save(false)}><Send size={14} /> {form.scheduled ? "Agendar" : "Enviar agora"}</button>
            </div>
            <p className="admin-login-note" style={{ marginTop: 10 }}>⚠️ Envio real requer integração com FCM/APNs (push), SMTP (e-mail) e supabase.functions.</p>
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Título</th><th>Tipo</th><th>Segmento</th><th>Data</th><th>Status</th></tr></thead>
            <tbody>
              {notifs.map(n => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 500 }}>{n.title}</td>
                  <td><span className="admin-cat-pill">{n.type}</span></td>
                  <td><div style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /><span style={{ fontSize: 13 }}>{n.segment}</span></div></td>
                  <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{n.date}</td>
                  <td>
                    <span className={`cerebro-tag ${n.status === "enviada" ? "cerebro-tag--live" : n.status === "agendada" ? "cerebro-tag--draft" : "cerebro-tag--off"}`}>
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
