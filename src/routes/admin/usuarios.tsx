import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Shield, Trash2, Ban, CheckCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/usuarios")({ component: UsuariosPage });

type User = { id: string; name: string; email: string; plan: string; status: "ativo" | "suspenso"; created: string; lastAccess: string; msgs: number };

const SAMPLE: User[] = [
  { id: "1", name: "Ana Paula", email: "ana@email.com", plan: "Gratuito", status: "ativo", created: "2026-01-10", lastAccess: "2026-11-25", msgs: 42 },
  { id: "2", name: "Carlos Mendes", email: "carlos@email.com", plan: "Pro", status: "ativo", created: "2026-02-14", lastAccess: "2026-11-24", msgs: 310 },
  { id: "3", name: "Fernanda Lima", email: "fernanda@email.com", plan: "Gratuito", status: "suspenso", created: "2026-03-01", lastAccess: "2026-10-15", msgs: 8 },
];

function UsuariosPage() {
  const [users, setUsers] = useState<User[]>(SAMPLE);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  function toggleStatus(id: string) {
    setUsers(u => u.map(x => x.id === id ? { ...x, status: x.status === "ativo" ? "suspenso" : "ativo" } : x));
  }
  function remove(id: string) {
    if (!confirm("Excluir conta permanentemente?")) return;
    setUsers(u => u.filter(x => x.id !== id));
    if (selected?.id === id) setSelected(null);
  }

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Usuários</h1>
            <p className="admin-page-sub">{users.length} usuários cadastrados</p>
          </div>
        </div>

        <div className="admin-filters">
          <div className="admin-search-wrap">
            <Search size={15} className="admin-search-icon" />
            <input className="admin-search" placeholder="Buscar por nome ou e-mail..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <div className="admin-table-wrap" style={{ flex: 1 }}>
            <table className="admin-table">
              <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Plano</th><th>Status</th><th>Último acesso</th><th>Msgs</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} style={{ cursor: "pointer" }} onClick={() => setSelected(u)}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{u.email}</td>
                    <td><span className="admin-cat-pill">{u.plan}</span></td>
                    <td>
                      <span className={`cerebro-tag ${u.status === "ativo" ? "cerebro-tag--live" : "cerebro-tag--off"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{u.lastAccess}</td>
                    <td>{u.msgs}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="icon-btn-sm" title={u.status === "ativo" ? "Suspender" : "Reativar"}
                          onClick={() => toggleStatus(u.id)}>
                          {u.status === "ativo" ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button className="icon-btn-sm icon-btn-sm--danger" title="Excluir" onClick={() => remove(u.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected && (
            <div className="admin-side-panel">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700 }}>Perfil</h3>
                <button className="admin-btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelected(null)}>Fechar</button>
              </div>
              <div className="admin-detail-row"><span>Nome</span><strong>{selected.name}</strong></div>
              <div className="admin-detail-row"><span>E-mail</span><strong>{selected.email}</strong></div>
              <div className="admin-detail-row"><span>Plano</span><strong>{selected.plan}</strong></div>
              <div className="admin-detail-row"><span>Status</span><strong>{selected.status}</strong></div>
              <div className="admin-detail-row"><span>Cadastro</span><strong>{selected.created}</strong></div>
              <div className="admin-detail-row"><span>Último acesso</span><strong>{selected.lastAccess}</strong></div>
              <div className="admin-detail-row"><span>Mensagens</span><strong>{selected.msgs}</strong></div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="admin-btn-ghost" style={{ fontSize: 13 }}><Shield size={14} /> Gerenciar permissões</button>
                <button className="admin-btn-ghost" style={{ fontSize: 13, color: "var(--admin-danger)" }}
                  onClick={() => remove(selected.id)}>
                  <Trash2 size={14} /> Excluir conta
                </button>
              </div>
              <p style={{ fontSize: 11, color: "var(--admin-muted)", marginTop: 16 }}>
                ⚠️ Dados reais disponíveis após integração com Supabase.
              </p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
