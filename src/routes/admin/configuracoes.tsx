import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Settings, Users, Shield, Bell, CreditCard, Mail, FileText, Database, AlertTriangle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/configuracoes")({ component: ConfiguracoesPage });

const SECTIONS = [
  { key: "geral", label: "Geral", icon: Settings },
  { key: "admins", label: "Administradores", icon: Users },
  { key: "seguranca", label: "Segurança", icon: Shield },
  { key: "notif", label: "Notificações", icon: Bell },
  { key: "pagamento", label: "Meios de Pagamento", icon: CreditCard },
  { key: "email", label: "Configuração de E-mail", icon: Mail },
  { key: "privacidade", label: "Privacidade e Termos", icon: FileText },
  { key: "backup", label: "Backup e Logs", icon: Database },
];

function ConfiguracoesPage() {
  const [section, setSection] = useState("geral");
  const [appName, setAppName] = useState("Ovelha");
  const [maintenance, setMaintenance] = useState(false);

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Configurações</h1>
            <p className="admin-page-sub">Configurações gerais, segurança e integrações</p>
          </div>
        </div>

        <div className="cerebro-layout">
          <nav className="cerebro-nav">
            {SECTIONS.map(s => (
              <button key={s.key}
                className={`cerebro-nav-item${section === s.key ? " cerebro-nav-item--active" : ""}`}
                onClick={() => setSection(s.key)}>
                <s.icon size={16} />
                <span>{s.label}</span>
              </button>
            ))}
          </nav>

          <div className="cerebro-editor">
            {section === "geral" && (
              <div className="cerebro-module">
                <h3 className="cerebro-module-title">Configurações Gerais</h3>
                <div className="afield">
                  <label className="afield-label">Nome do aplicativo</label>
                  <input className="afield-input" value={appName} onChange={e => setAppName(e.target.value)} />
                </div>
                <div className="afield" style={{ marginTop: 12 }}>
                  <label className="afield-label">Modo de manutenção</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" id="maint" checked={maintenance} onChange={e => setMaintenance(e.target.checked)} />
                    <label htmlFor="maint" style={{ fontSize: 14 }}>Ativar modo de manutenção (bloqueia acesso de usuários)</label>
                  </div>
                </div>
                <button className="admin-btn-primary" style={{ marginTop: 20 }}>Salvar</button>
              </div>
            )}
            {section === "admins" && (
              <div className="cerebro-module">
                <h3 className="cerebro-module-title">Administradores</h3>
                <p className="admin-empty">Gerenciamento de administradores e cargos disponível após integração com Supabase Auth e tabela de roles.</p>
                <div className="admin-alert admin-alert--warn" style={{ marginTop: 16 }}>
                  <AlertTriangle size={15} /> Configure autenticação real com Supabase antes de adicionar administradores.
                </div>
              </div>
            )}
            {section === "seguranca" && (
              <div className="cerebro-module">
                <h3 className="cerebro-module-title">Segurança</h3>
                <div className="afield">
                  <label className="afield-label">Autenticação de dois fatores (2FA)</label>
                  <select className="afield-select"><option>Desativado</option><option>Obrigatório para admins</option><option>Opcional</option></select>
                </div>
                <div className="afield" style={{ marginTop: 12 }}>
                  <label className="afield-label">Logs de auditoria</label>
                  <select className="afield-select"><option>Ativado</option><option>Desativado</option></select>
                </div>
                <button className="admin-btn-primary" style={{ marginTop: 20 }}>Salvar</button>
              </div>
            )}
            {section === "pagamento" && (
              <div className="cerebro-module">
                <h3 className="cerebro-module-title">Meios de Pagamento</h3>
                <div className="admin-alert admin-alert--warn">
                  <AlertTriangle size={15} /> Configure as chaves do Stripe ou Hotmart. As chaves devem ser armazenadas em variáveis de ambiente seguras no backend.
                </div>
                <div className="afield" style={{ marginTop: 16 }}>
                  <label className="afield-label">Stripe Secret Key</label>
                  <input className="afield-input" type="password" placeholder="sk_live_..." />
                </div>
                <div className="afield" style={{ marginTop: 12 }}>
                  <label className="afield-label">Stripe Webhook Secret</label>
                  <input className="afield-input" type="password" placeholder="whsec_..." />
                </div>
                <button className="admin-btn-primary" style={{ marginTop: 20 }}>Salvar (backend)</button>
              </div>
            )}
            {section === "email" && (
              <div className="cerebro-module">
                <h3 className="cerebro-module-title">Configuração de E-mail</h3>
                {[{ l: "SMTP Host", p: "smtp.sendgrid.net" }, { l: "SMTP Port", p: "587" }, { l: "Usuário", p: "apikey" }, { l: "Senha", p: "SG.xxx" }, { l: "E-mail remetente", p: "noreply@ovelha.app" }].map(f => (
                  <div className="afield" key={f.l} style={{ marginTop: 12 }}>
                    <label className="afield-label">{f.l}</label>
                    <input className="afield-input" placeholder={f.p} />
                  </div>
                ))}
                <button className="admin-btn-primary" style={{ marginTop: 20 }}>Salvar</button>
              </div>
            )}
            {section === "privacidade" && (
              <div className="cerebro-module">
                <h3 className="cerebro-module-title">Privacidade e Termos</h3>
                <div className="afield" style={{ marginTop: 12 }}>
                  <label className="afield-label">Política de Privacidade (Markdown)</label>
                  <textarea className="afield-textarea" rows={8} placeholder="# Política de Privacidade..." />
                </div>
                <div className="afield" style={{ marginTop: 12 }}>
                  <label className="afield-label">Termos de Uso (Markdown)</label>
                  <textarea className="afield-textarea" rows={8} placeholder="# Termos de Uso..." />
                </div>
                <button className="admin-btn-primary" style={{ marginTop: 20 }}>Publicar</button>
              </div>
            )}
            {section === "backup" && (
              <div className="cerebro-module">
                <h3 className="cerebro-module-title">Backup e Logs</h3>
                <p className="admin-empty">Backups automáticos e logs de auditoria disponíveis após integração com Supabase.</p>
                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button className="admin-btn-ghost">Exportar banco de dados</button>
                  <button className="admin-btn-ghost">Ver logs de auditoria</button>
                </div>
              </div>
            )}
            {!["geral","admins","seguranca","pagamento","email","privacidade","backup"].includes(section) && (
              <div className="cerebro-module">
                <p className="admin-empty">Seção em construção.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
