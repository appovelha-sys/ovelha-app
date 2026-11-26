import type { ReactNode } from "react";
import { NavBar } from "./NavBar";

interface Props {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav = false }: Props) {
  return (
    <div className="app-shell">
      <div className="app-scroll">{children}</div>
      {!hideNav && <NavBar />}
    </div>
  );
}
