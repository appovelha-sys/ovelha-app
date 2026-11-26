import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import logo from "@/assets/ovelha-logo.png";

export const Route = createFileRoute("/app/favorites")({ component: FavoritesScreen });

function FavoritesScreen() {
  return (
    <AppShell>
      <div className="simple-page">
        <header className="page-header">
          <h1 className="page-title">Favoritos</h1>
          <p className="page-subtitle">Seus momentos especiais guardados</p>
        </header>
        <div className="empty-state">
          <img src={logo} alt="Ovelha" className="empty-mascot" draggable={false} />
          <h2 className="empty-title">Ainda não há favoritos</h2>
          <p className="empty-text">
            Toque no{" "}
            <Heart size={14} fill="currentColor" style={{ display: "inline", verticalAlign: "middle", color: "var(--cocoa)" }} />{" "}
            em uma história, oração ou versículo e ele aparecerá aqui.
          </p>
          <Link to="/app/explore" className="btn-primary">Explorar conteúdos</Link>
        </div>
        <div className="nav-spacer" />
      </div>
    </AppShell>
  );
}
