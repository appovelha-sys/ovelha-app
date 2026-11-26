import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: AdminLogin });

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    // TODO: substituir por autenticação real via Supabase Auth com role admin
    if (email === "admin@ovelha.app" && pass === "admin123") {
      sessionStorage.setItem("admin_auth", "true");
      navigate({ to: "/admin/dashboard" });
    } else {
      setError("Credenciais inválidas.");
    }
    setLoading(false);
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-login-logo">
          <span className="admin-brand-name">ovelha.</span>
          <span className="admin-brand-tag">admin</span>
        </div>
        <h1 className="admin-login-title">Acesso Administrativo</h1>
        <p className="admin-login-sub">Área restrita. Acesso autorizado somente.</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="afield">
            <label className="afield-label">E-mail</label>
            <input
              className="afield-input"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@ovelha.app"
              required
              autoComplete="email"
            />
          </div>
          <div className="afield">
            <label className="afield-label">Senha</label>
            <div className="afield-pass">
              <Lock size={16} className="afield-icon" />
              <input
                className="afield-input afield-input--pass"
                type={show ? "text" : "password"}
                value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button type="button" className="afield-eye" onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="admin-error">{error}</p>}
          <button className="admin-btn-primary" type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Entrar"}
          </button>
        </form>

        <p className="admin-login-note">
          ⚠️ Credenciais de acesso provisórias. Configurar autenticação real via Supabase Auth.
        </p>
      </div>
    </div>
  );
}
