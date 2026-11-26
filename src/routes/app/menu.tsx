import { createFileRoute } from "@tanstack/react-router";
import { Bell, Shield, HelpCircle, LogOut, ChevronRight, Heart } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import logo from "@/assets/ovelha-logo.png";

export const Route = createFileRoute("/app/menu")({ component: MenuScreen });

const ITEMS = [
  { icon: Bell,        label: "Notificações", sub: "Lembretes e avisos",       danger: false },
  { icon: Shield,      label: "Privacidade",  sub: "Suas informações e dados",  danger: false },
  { icon: HelpCircle,  label: "Ajuda",        sub: "Perguntas frequentes",      danger: false },
  { icon: LogOut,      label: "Sair",         sub: "Encerrar sessão",           danger: true  },
] as const;

function MenuScreen() {
  return (
    <AppShell>
      <div className="simple-page">
        <header className="page-header">
          <h1 className="page-title">Menu</h1>
        </header>

        <div className="profile-card">
          <img src={logo} alt="Ovelha" className="profile-avatar" draggable={false} />
          <div className="profile-info">
            <p className="profile-name">Sua conta</p>
            <p className="profile-sub">Entre para personalizar</p>
          </div>
          <button className="btn-outline">Entrar</button>
        </div>

        <nav className="profile-menu" aria-label="Configurações">
          {ITEMS.map(({ icon: Icon, label, sub, danger }) => (
            <button key={label} className={`profile-row${danger ? " profile-row--danger" : ""}`}>
              <span className="profile-row-icon"><Icon size={20} /></span>
              <span className="profile-row-body">
                <span className="profile-row-label">{label}</span>
                <span className="profile-row-sub">{sub}</span>
              </span>
              <ChevronRight size={17} className="profile-row-arrow" />
            </button>
          ))}
        </nav>

        <p className="profile-version"><Heart size={11} /> Ovelha · Versão 1.0.0 · 100% gratuito</p>
        <div className="nav-spacer" />
      </div>
    </AppShell>
  );
}
