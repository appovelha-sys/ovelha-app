import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Brain, BookOpen, FlaskConical, Users, MessageSquare,
  CreditCard, DollarSign, Bell, Bot, BarChart2, History, Settings,
  ChevronLeft, ChevronRight, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { to: "/admin/dashboard",      icon: LayoutDashboard, label: "Dashboard"           },
  { to: "/admin/cerebro",        icon: Brain,           label: "Cérebro"             },
  { to: "/admin/biblioteca",     icon: BookOpen,        label: "Biblioteca"          },
  { to: "/admin/laboratorio",    icon: FlaskConical,    label: "Laboratório"         },
  { to: "/admin/usuarios",       icon: Users,           label: "Usuários"            },
  { to: "/admin/conversas",      icon: MessageSquare,   label: "Conversas"           },
  { to: "/admin/assinaturas",    icon: CreditCard,      label: "Assinaturas"         },
  { to: "/admin/financeiro",     icon: DollarSign,      label: "Financeiro"          },
  { to: "/admin/notificacoes",   icon: Bell,            label: "Notificações"        },
  { to: "/admin/ia",             icon: Bot,             label: "Inteligência Artif." },
  { to: "/admin/analytics",      icon: BarChart2,       label: "Analytics"           },
  { to: "/admin/versoes",        icon: History,         label: "Hist. de Versões"    },
  { to: "/admin/configuracoes",  icon: Settings,        label: "Configurações"       },
];

interface Props { children: React.ReactNode }

export function AdminShell({ children }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    sessionStorage.removeItem("admin_auth");
    navigate({ to: "/admin" });
  }

  const sidebar = (
    <aside className={`admin-sidebar${collapsed ? " admin-sidebar--collapsed" : ""}`}>
      <div className="admin-sidebar-top">
        <div className="admin-brand">
          {!collapsed && <span className="admin-brand-name">ovelha.</span>}
          <span className="admin-brand-tag">admin</span>
        </div>
        <button className="admin-collapse-btn" onClick={() => setCollapsed(c => !c)} aria-label="Recolher menu">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="admin-nav">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`admin-nav-item${active ? " admin-nav-item--active" : ""}`}
              title={collapsed ? label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <button className="admin-nav-item admin-logout" onClick={logout}>
        <LogOut size={18} />
        {!collapsed && <span>Sair</span>}
      </button>
    </aside>
  );

  return (
    <div className="admin-shell">
      {/* mobile overlay */}
      {mobileOpen && <div className="admin-overlay" onClick={() => setMobileOpen(false)} />}
      {mobileOpen && sidebar}
      {/* desktop sidebar */}
      <div className="admin-sidebar-desktop">{sidebar}</div>

      <div className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setMobileOpen(o => !o)} aria-label="Menu">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="admin-topbar-title">
            {NAV.find(n => pathname.startsWith(n.to))?.label ?? "Admin"}
          </span>
          <div className="admin-topbar-right">
            <span className="admin-badge">Admin</span>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
