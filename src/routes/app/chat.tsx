import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/app/chat")({ component: ChatScreen });

function ChatScreen() {
  return (
    <AppShell>
      <div className="simple-page">
        <header className="page-header">
          <h1 className="page-title">Chat</h1>
          <p className="page-subtitle">Converse e compartilhe sua fé</p>
        </header>
        <div className="empty-state">
          <div className="empty-icon-wrap">
            <MessageCircle size={48} strokeWidth={1.4} style={{ color: "var(--cocoa)" }} />
          </div>
          <h2 className="empty-title">Em breve</h2>
          <p className="empty-text">O chat com a comunidade estará disponível em breve. Fique ligado!</p>
        </div>
        <div className="nav-spacer" />
      </div>
    </AppShell>
  );
}
