import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "@/assets/ovelha-logo.png";

export const Route = createFileRoute("/auth/")({
  component: AuthEntry,
});

function AuthEntry() {
  return (
    <div className="auth-entry">
      <div className="auth-entry-visual">
        <img src={logo} alt="Ovelha" className="auth-entry-mascot" draggable={false} />
      </div>

      <div className="auth-entry-body">
        <h1 className="auth-entry-title">Seu lugar pertinho<br />de Jesus.</h1>
        <p className="auth-entry-sub">
          Converse, ore, aprenda e cresça na fé.<br />Gratuito para sempre.
        </p>

        <div className="auth-entry-actions">
          <Link to="/auth/signup" className="btn-auth-primary">
            Criar conta gratuita
          </Link>
          <Link to="/auth/login" className="btn-auth-outline">
            Já tenho conta
          </Link>
        </div>

        <p className="auth-entry-note">
          Sem anúncios. Sem cobranças. Só fé. 🐑
        </p>
      </div>
    </div>
  );
}
