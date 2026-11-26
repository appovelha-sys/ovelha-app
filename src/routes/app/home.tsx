import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, HandHeart, BookMarked, GraduationCap, Gamepad2, Heart, Bell, ChevronRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import logo from "@/assets/ovelha-logo.png";

export const Route = createFileRoute("/app/home")({ component: HomeScreen });

const SHORTCUTS = [
  { icon: BookOpen,      label: "Bíblia",      bg: "#EDE8DF" },
  { icon: HandHeart,     label: "Orações",     bg: "#E6DDD3" },
  { icon: BookMarked,    label: "Histórias",   bg: "#EBE3D8" },
  { icon: GraduationCap, label: "Aprendizado", bg: "#E8E0D5" },
  { icon: Gamepad2,      label: "Jogos",       bg: "#EDE5DA" },
  { icon: Heart,         label: "Favoritos",   bg: "#EBDCD8" },
] as const;

const RECENT = [
  { title: "Oração da Manhã",      sub: "Salmos 23 · 3 min",  icon: HandHeart,  progress: 60 },
  { title: "A História de Moisés", sub: "Histórias Bíblicas",  icon: BookMarked, progress: 30 },
];

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function HomeScreen() {
  return (
    <AppShell>
      <div className="home-page">
        <header className="home-header">
          <div>
            <p className="home-greeting">{getGreeting()} 🌿</p>
            <h1 className="home-title">Sua jornada de fé</h1>
          </div>
          <button className="icon-btn" aria-label="Notificações"><Bell size={20} /></button>
        </header>

        <div className="feat-card">
          <div className="feat-body">
            <p className="feat-eyebrow"><Sparkles size={12} /> Devocional de hoje</p>
            <h2 className="feat-title">Hoje é dia de<br />conversar com Deus.</h2>
            <p className="feat-text">Ele sempre te ouve, te ama e está com você.</p>
            <button className="feat-btn">Começar agora</button>
          </div>
          <img src={logo} alt="Ovelha" className="feat-mascot" draggable={false} />
        </div>

        <section className="home-section">
          <h2 className="section-title">O que você quer hoje?</h2>
          <div className="shortcuts-grid">
            {SHORTCUTS.map(({ icon: Icon, label, bg }) => (
              <button key={label} className="shortcut" style={{ "--sc-bg": bg } as React.CSSProperties}>
                <span className="shortcut-icon"><Icon size={24} /></span>
                <span className="shortcut-label">{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="home-section">
          <h2 className="section-title">Continue de onde parou</h2>
          <div className="recent-list">
            {RECENT.map(({ title, sub, icon: Icon, progress }) => (
              <div key={title} className="recent-item">
                <div className="recent-icon"><Icon size={20} /></div>
                <div className="recent-info">
                  <p className="recent-title">{title}</p>
                  <p className="recent-sub">{sub}</p>
                  <div className="recent-bar"><div className="recent-fill" style={{ width: `${progress}%` }} /></div>
                </div>
                <ChevronRight size={18} className="recent-arrow" />
              </div>
            ))}
          </div>
        </section>

        <div className="nav-spacer" />
      </div>
    </AppShell>
  );
}
