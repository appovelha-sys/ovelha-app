import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/auth/signup")({
  component: SignupScreen,
});

function SignupScreen() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({ name: "", email: "", password: "" });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Digite seu nome.";
    if (!form.email.includes("@")) e.email = "E-mail inválido.";
    if (form.password.length < 6) e.password = "Mínimo de 6 caracteres.";
    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { nome: form.name } },
    });
    setLoading(false);
    if (error) {
      setErrors({ email: error.message });
      return;
    }
    setDone(true);
    setTimeout(() => navigate({ to: "/app/home" }), 1800);
  }

  if (done) {
    return (
      <div className="auth-success">
        <CheckCircle2 size={56} className="auth-success-icon" />
        <h2 className="auth-success-title">Conta criada!</h2>
        <p className="auth-success-sub">Bem-vindo(a) ao Ovelha, {form.name.split(" ")[0]} 🐑</p>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      {/* Header */}
      <header className="auth-header">
        <Link to="/auth" className="auth-back" aria-label="Voltar">
          <ArrowLeft size={22} />
        </Link>
        <span className="auth-header-logo">ovelha<span>.</span></span>
        <span style={{ width: 40 }} />
      </header>

      {/* Formulário */}
      <div className="auth-scroll">
        <div className="auth-form-wrap">
          <h1 className="auth-title">Criar sua conta</h1>
          <p className="auth-subtitle">Gratuito para sempre. Sem cartão de crédito.</p>

          <form onSubmit={handleSubmit} noValidate className="auth-form">

            {/* Nome */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">Seu nome</label>
              <div className={`auth-input${errors.name ? " auth-input--error" : ""}`}>
                <User size={18} className="auth-input-icon" />
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Como podemos te chamar?"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              {errors.name && <p className="auth-error">{errors.name}</p>}
            </div>

            {/* E-mail */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="email">E-mail</label>
              <div className={`auth-input${errors.email ? " auth-input--error" : ""}`}>
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="voce@exemplo.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
              {errors.email && <p className="auth-error">{errors.email}</p>}
            </div>

            {/* Senha */}
            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Senha</label>
              <div className={`auth-input${errors.password ? " auth-input--error" : ""}`}>
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Mínimo de 6 caracteres"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                />
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="auth-error">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-auth-primary btn-auth-submit" disabled={loading}>
              {loading ? <span className="auth-spinner" /> : "Criar minha conta"}
            </button>

            <p className="auth-switch">
              Já tem uma conta?{" "}
              <Link to="/auth/login" className="auth-switch-link">Entrar</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
