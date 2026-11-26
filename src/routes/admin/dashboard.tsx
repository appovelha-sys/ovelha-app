import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users, TrendingUp, MessageSquare, DollarSign, Brain,
  AlertTriangle, Zap, ChevronDown,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/dashboard")({ component: Dashboard });

const PERIODS = ["Hoje", "7 dias", "30 dias", "90 dias", "12 meses"];

const CARDS = [
  { label: "Total de Usuários",         value: "—",   sub: "Aguardando Supabase",  icon: Users,          color: "#6B5744" },
  { label: "Novos Cadastros",           value: "—",   sub: "no período",           icon: TrendingUp,     color: "#7A6552" },
  { label: "Usuários Ativos",           value: "—",   sub: "últimos 7 dias",       icon: Users,          color: "#5A7A6A" },
  { label: "Receita Mensal (MRR)",      value: "—",   sub: "Aguardando Stripe",    icon: DollarSign,     color: "#7A6A3A" },
  { label: "Conversas Totais",          value: "—",   sub: "no período",           icon: MessageSquare,  color: "#6A5A7A" },
  { label: "Tokens Consumidos",         value: "—",   sub: "Aguardando integr. IA",icon: Zap,            color: "#7A5A5A" },
  { label: "Custo de IA",               value: "—",   sub: "no período",           icon: DollarSign,     color: "#7A6552" },
  { label: "Versão do Cérebro",         value: "0.1", sub: "rascunho",             icon: Brain,          color: "#5A6A7A" },
];

const ALERTS = [
  { type: "warn", msg: "Supabase não conectado — dados reais indisponíveis." },
  { type: "warn", msg: "Integração de IA não configurada — configure em Inteligência Artificial." },
  { type: "warn", msg: "Nenhum plano de assinatura publicado." },
];

function MiniChart({ color }: { color: string }) {
  const pts = [20, 35, 28, 45, 38, 55, 48].map((y, i) => `${i * 16},${60 - y}`).join(" ");
  return (
    <svg viewBox="0 0 96 60" className="admin-sparkline" aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  );
}

export default function Dashboard() {
  const [period, setPeriod] = useState("30 dias");
  const [open, setOpen] = useState(false);

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Dashboard</h1>
            <p className="admin-page-sub">Visão geral do OVELHA</p>
          </div>
          <div className="admin-period-select" style={{ position: "relative" }}>
            <button className="admin-select-btn" onClick={() => setOpen(o => !o)}>
              {period} <ChevronDown size={14} />
            </button>
            {open && (
              <div className="admin-dropdown">
                {PERIODS.map(p => (
                  <button key={p} className={`admin-dropdown-item${p === period ? " admin-dropdown-item--active" : ""}`}
                    onClick={() => { setPeriod(p); setOpen(false); }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alertas */}
        <div className="admin-alerts">
          {ALERTS.map((a, i) => (
            <div key={i} className={`admin-alert admin-alert--${a.type}`}>
              <AlertTriangle size={15} /> {a.msg}
            </div>
          ))}
        </div>

        {/* Métricas */}
        <div className="admin-cards">
          {CARDS.map(({ label, value, sub, icon: Icon, color }) => (
            <div key={label} className="admin-card">
              <div className="admin-card-top">
                <div className="admin-card-icon" style={{ background: color + "20", color }}>
                  <Icon size={18} />
                </div>
                <MiniChart color={color} />
              </div>
              <p className="admin-card-value">{value}</p>
              <p className="admin-card-label">{label}</p>
              <p className="admin-card-sub">{sub}</p>
            </div>
          ))}
        </div>

        {/* Gráfico placeholder */}
        <div className="admin-chart-card">
          <h2 className="admin-section-title">Evolução de Usuários</h2>
          <div className="admin-chart-placeholder">
            <Brain size={32} style={{ color: "var(--admin-muted)" }} />
            <p>Conecte o Supabase para visualizar dados reais</p>
          </div>
        </div>

        <div className="admin-two-col">
          <div className="admin-chart-card">
            <h2 className="admin-section-title">Planos e Assinaturas</h2>
            <div className="admin-chart-placeholder" style={{ height: 140 }}>
              <p>Aguardando integração com Stripe / provedor de pagamento</p>
            </div>
          </div>
          <div className="admin-chart-card">
            <h2 className="admin-section-title">Consumo de IA</h2>
            <div className="admin-chart-placeholder" style={{ height: 140 }}>
              <p>Aguardando configuração do provedor de IA</p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
