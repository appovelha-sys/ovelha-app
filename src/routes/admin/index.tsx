import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/")({ component: AdminLogin });

const ADMIN_EMAIL = "sarahstefhani1999@gmail.com";

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
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (err || !data.user) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }
    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setError("Acesso restrito ao administrador.");
      setLoading(false);
      return;
    }
    sessionStorage.setItem("admin_auth", "true");
    navigate({ to: "/admin/dashboard" });
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
              placeholder="seu@email.com"
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

      </div>
    </div>
  );
}
