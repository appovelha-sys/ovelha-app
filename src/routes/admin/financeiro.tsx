import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { DollarSign, TrendingUp, AlertTriangle, Download } from "lucide-react";

export const Route = createFileRoute("/admin/financeiro")({ component: FinanceiroPage });

const ROWS = [
  { label: "Receita bruta", value: "—", note: "Aguardando Stripe" },
  { label: "Receita líquida", value: "—", note: "Bruta - taxas" },
  { label: "MRR", value: "—", note: "Receita recorrente mensal" },
  { label: "ARR", value: "—", note: "Receita recorrente anual" },
  { label: "Custo de IA", value: "—", note: "Aguardando integr. IA" },
  { label: "Custo de infraestrutura", value: "—", note: "Supabase + Cloudflare" },
  { label: "Taxas de pagamento", value: "—", note: "Taxas do processador" },
  { label: "Margem por usuário", value: "—", note: "Receita - custo / usuário" },
  { label: "Reembolsos", value: "—", note: "No período" },
  { label: "Pagamentos pendentes", value: "—", note: "Inadimplentes" },
];

function FinanceiroPage() {
  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Financeiro</h1>
            <p className="admin-page-sub">Receitas, custos e margens</p>
          </div>
          <button className="admin-btn-ghost"><Download size={15} /> Exportar relatório</button>
        </div>

        <div className="admin-alert admin-alert--warn" style={{ marginBottom: 20 }}>
          <AlertTriangle size={15} /> Dados reais disponíveis após integração com Stripe e provedor de IA. Os valores abaixo são placeholders.
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Indicador</th><th>Valor</th><th>Observação</th></tr></thead>
            <tbody>
              {ROWS.map(r => (
                <tr key={r.label}>
                  <td style={{ fontWeight: 500 }}>{r.label}</td>
                  <td style={{ fontWeight: 700, fontSize: 15 }}>{r.value}</td>
                  <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="admin-two-col" style={{ marginTop: 24 }}>
          <div className="admin-chart-card">
            <h2 className="admin-section-title"><TrendingUp size={16} /> Evolução de MRR</h2>
            <div className="admin-chart-placeholder" style={{ height: 160 }}>
              <DollarSign size={28} style={{ color: "var(--admin-muted)" }} />
              <p>Aguardando integração com Stripe</p>
            </div>
          </div>
          <div className="admin-chart-card">
            <h2 className="admin-section-title">Custos vs Receita</h2>
            <div className="admin-chart-placeholder" style={{ height: 160 }}>
              <p>Aguardando dados reais de integração</p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
