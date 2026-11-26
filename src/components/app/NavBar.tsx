import { Link, useLocation } from "@tanstack/react-router";
import { Home, Compass, MessageCircle, Menu } from "lucide-react";

const NAV = [
  { to: "/app/home",    icon: Home,          label: "Início"   },
  { to: "/app/explore", icon: Compass,        label: "Explorar" },
  { to: "/app/chat",    icon: MessageCircle,  label: "Chat"     },
  { to: "/app/menu",    icon: Menu,           label: "Menu"     },
] as const;

export function NavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="app-nav" aria-label="Navegação principal">
      {NAV.map(({ to, icon: Icon, label }) => {
        const active = pathname === to || pathname.startsWith(to + "/");
        return (
          <Link
            key={to}
            to={to}
            className={`app-nav-item${active ? " app-nav-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={active ? 2.5 : 1.8} aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
