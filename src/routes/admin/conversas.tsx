import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { AlertTriangle, MessageSquare, ThumbsDown, ThumbsUp, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/conversas")({ component: ConversasPage });

const REPORTS = [
  { id: "1", issue: "Resposta teologicamente imprecisa", category: "Falha de fundamentação", date: "2026-11-24", status: "pendente" },
  { id: "2", issue: "Tom inadequado ao contexto de luto", category: "Falha de personalidade", date: "2026-11-23", status: "revisado" },
  { id: "3", issue: "Resposta muito longa para pergunta simples", category: "Identidade comunicacional", date: "2026-11-22", status: "pendente" },
];

function ConversasPage() {
  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Conversas e Feedbacks</h1>
            <p className="admin-page-sub">Qualidade das respostas com proteção de privacidade</p>
          </div>
        </div>

        <div className="admin-alert admin-alert--warn" style={{ marginBottom: 20 }}>
          <Shield size={15} /> Acesso irrestrito às conversas privadas é bloqueado por padrão. Requer justificativa de acesso e registro de auditoria (LGPD).
        </div>

        {/* KPIs */}
        <div className="admin-cards" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {[
            { label: "Conversas totais", value: "—", icon: MessageSquare },
            { label: "Avaliações positivas", value: "—", icon: ThumbsUp },
            { label: "Avaliações negativas", value: "—", icon: ThumbsDown },
            { label: "Alertas de segurança", value: "0", icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="admin-card">
              <Icon size={18} style={{ color: "var(--admin-accent)" }} />
              <p className="admin-card-value">{value}</p>
              <p className="admin-card-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Denúncias */}
        <div className="admin-chart-card" style={{ marginTop: 24 }}>
          <h2 className="admin-section-title">Respostas denunciadas / feedbacks negativos</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Problema reportado</th><th>Categoria</th><th>Data</th><th>Status</th></tr></thead>
              <tbody>
                {REPORTS.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.issue}</td>
                    <td><span className="admin-cat-pill">{r.category}</span></td>
                    <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{r.date}</td>
                    <td>
                      <span className={`cerebro-tag ${r.status === "revisado" ? "cerebro-tag--live" : "cerebro-tag--draft"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="admin-login-note" style={{ marginTop: 20 }}>
          ⚠️ Dados agregados reais disponíveis após integração com Supabase. Acesso a conversas individuais requer auditoria ativada.
        </p>
      </div>
    </AdminShell>
  );
}
