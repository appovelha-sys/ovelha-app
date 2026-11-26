import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { BarChart2 } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({ component: AnalyticsPage });

const METRICS = [
  { label: "Taxa de ativação", desc: "Usuários que enviaram ao menos 1 mensagem" },
  { label: "Retenção D7", desc: "Usuários ativos 7 dias após cadastro" },
  { label: "Retenção D30", desc: "Usuários ativos 30 dias após cadastro" },
  { label: "Taxa de conversão Gratuito→Pro", desc: "% que upgradam o plano" },
  { label: "Churn rate", desc: "Cancelamentos no período" },
  { label: "Sessões por usuário/semana", desc: "Frequência de uso" },
  { label: "Duração média de sessão", desc: "Tempo por acesso" },
  { label: "Mensagens por sessão", desc: "Profundidade do engajamento" },
  { label: "Funcionalidade mais usada", desc: "Top recursos acessados" },
  { label: "NPS de resposta", desc: "Avaliação qualitativa das respostas" },
];

function AnalyticsPage() {
  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Analytics</h1>
            <p className="admin-page-sub">Métricas de aquisição, engajamento e retenção</p>
          </div>
        </div>

        <div className="admin-alert admin-alert--warn" style={{ marginBottom: 20 }}>
          Dados reais disponíveis após integração com Supabase + PostHog/Mixpanel (opcional). Todos os dados são agregados e anonimizados (LGPD).
        </div>

        <div className="admin-cards">
          {METRICS.map(m => (
            <div key={m.label} className="admin-card">
              <BarChart2 size={18} style={{ color: "var(--admin-accent)", marginBottom: 8 }} />
              <p className="admin-card-value" style={{ fontSize: 22 }}>—</p>
              <p className="admin-card-label">{m.label}</p>
              <p className="admin-card-sub">{m.desc}</p>
            </div>
          ))}
        </div>

        <div className="admin-two-col" style={{ marginTop: 24 }}>
          <div className="admin-chart-card">
            <h2 className="admin-section-title">Funil de ativação</h2>
            <div className="admin-chart-placeholder" style={{ height: 180 }}>
              <p>Cadastro → Primeira mensagem → Retorno D7 → Conversão Pro</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Aguardando dados do Supabase</p>
            </div>
          </div>
          <div className="admin-chart-card">
            <h2 className="admin-section-title">Desempenho por versão do Cérebro</h2>
            <div className="admin-chart-placeholder" style={{ height: 180 }}>
              <p>Avaliação de respostas por versão publicada</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>Versão 0.1 — sem dados ainda</p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
