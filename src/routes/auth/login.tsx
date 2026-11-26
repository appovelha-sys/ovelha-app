import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/login")({
  component: LoginScreen,
});

function LoginScreen() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ email: "", password: "" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email.includes("@")) e.email = "E-mail inválido.";
    if (!forgot && form.password.length < 6) e.password = "Mínimo de 6 caracteres.";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);

    if (forgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      setLoading(false);
      if (error) { setErrors({ email: error.message }); return; }
      setDone(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    if (error) {
      setErrors({ password: "E-mail ou senha incorretos." });
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/app/home" }), 1200);
  }

  /* ── Estado de sucesso ── */
  if (done && !forgot) {
    return (
      <div className="auth-success">
        <CheckCircle2 size={56} className="auth-success-icon" />
        <h2 className="auth-success-title">Bem-vindo(a) de volta!</h2>
        <p className="auth-success-sub">Entrando no Ovelha… 🐑</p>
      </div>
    );
  }

  if (done && forgot) {
    return (
      <div className="auth-success">
        <CheckCircle2 size={56} className="auth-success-icon" />
        <h2 className="auth-success-title">E-mail enviado!</h2>
        <p className="auth-success-sub">Verifique sua caixa de entrada para redefinir sua senha.</p>
        <button className="btn-auth-outline" style={{ marginTop: 24 }} onClick={() => { setDone(false); setForgot(false); }}>
          Voltar para entrar
        </button>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      {/* Header */}
      <header className="auth-header">
        <button
          className="auth-back"
          aria-label="Voltar"
          onClick={() => forgot ? setForgot(false) : navigate({ to: "/auth" })}
        >
          <ArrowLeft size={22} />
        </button>
        <span className="auth-header-logo">ovelha<span>.</span></span>
        <span style={{ width: 40 }} />
      </header>

      <div className="auth-scroll">
        <div className="auth-form-wrap">
          <h1 className="auth-title">
            {forgot ? "Recuperar senha" : "Bem-vindo(a) de volta"}
          </h1>
          <p className="auth-subtitle">
            {forgot
              ? "Informe seu e-mail e enviaremos um link de acesso."
              : "Entre para continuar sua jornada de fé."}
          </p>

          <form onSubmit={handleSubmit} noValidate className="auth-form">

            {/* E-mail */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">E-mail</label>
              <div className={`auth-input${errors.email ? " auth-input--error" : ""}`}>
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              {errors.email && <p className="auth-error">{errors.email}</p>}
            </div>

            {/* Senha (oculta no modo recuperar) */}
            {!forgot && (
              <div className="auth-field">
                <div className="auth-label-row">
                  <label className="auth-label" htmlFor="login-password">Senha</label>
                  <button
                    type="button"
                    className="auth-forgot"
                    onClick={() => setForgot(true)}
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className={`auth-input${errors.password ? " auth-input--error" : ""}`}>
                  <Lock size={18} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={show ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                  />
                  <button
                    type="button"
                    className="auth-eye"
                    onClick={() => setShow(!show)}
                    aria-label={show ? "Ocultar" : "Mostrar"}
                  >
                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="auth-error">{errors.password}</p>}
              </div>
            )}

            <button
              type="submit"
              className="btn-auth-primary btn-auth-submit"
              disabled={loading}
            >
              {loading
                ? <span className="auth-spinner" />
                : forgot ? "Enviar link de acesso" : "Entrar"}
            </button>

            {!forgot && (
              <p className="auth-switch">
                Não tem conta?{" "}
                <Link to="/auth/signup" className="auth-switch-link">Criar conta gratuita</Link>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
