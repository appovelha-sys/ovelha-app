import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, RotateCcw, Eye, Lock } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/versoes")({ component: VersoesPage });

type Version = { id: string; tag: string; date: string; author: string; desc: string; active: boolean; modules: number };

const SAMPLE: Version[] = [
  { id: "1", tag: "0.1-rascunho", date: "2026-11-25 18:00", author: "admin@ovelha.app", desc: "Estrutura inicial do Cérebro. Nenhum módulo publicado.", active: true, modules: 0 },
];

function VersoesPage() {
  const [versions] = useState<Version[]>(SAMPLE);
  const [selected, setSelected] = useState<Version | null>(null);

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Histórico de Versões</h1>
            <p className="admin-page-sub">Versionamento completo e imutável do Cérebro</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="admin-btn-ghost"><Download size={15} /> Exportar Cérebro</button>
          </div>
        </div>

        <div className="admin-alert admin-alert--info" style={{ marginBottom: 20, background: "#EBE3D8", borderColor: "#D4C4B0", color: "#6B5744" }}>
          <Lock size={15} /> Cada publicação gera uma versão imutável. Alterações em rascunho não afetam usuários em produção.
        </div>

        <div style={{ display: "flex", gap: 20 }}>
          <div className="admin-table-wrap" style={{ flex: 1 }}>
            <table className="admin-table">
              <thead><tr><th>Versão</th><th>Data</th><th>Autor</th><th>Módulos</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {versions.map(v => (
                  <tr key={v.id} style={{ cursor: "pointer" }} onClick={() => setSelected(v)}>
                    <td style={{ fontWeight: 700, fontFamily: "monospace" }}>{v.tag}</td>
                    <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{v.date}</td>
                    <td style={{ fontSize: 13 }}>{v.author}</td>
                    <td>{v.modules}</td>
                    <td>
                      {v.active
                        ? <span className="cerebro-tag cerebro-tag--live">Ativa em prod.</span>
                        : <span className="cerebro-tag cerebro-tag--off">Arquivada</span>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="icon-btn-sm" title="Ver detalhes" onClick={() => setSelected(v)}><Eye size={14} /></button>
                        <button className="icon-btn-sm" title="Restaurar versão" onClick={() => alert("Restauração disponível após integração com banco de dados.")}><RotateCcw size={14} /></button>
                        <button className="icon-btn-sm" title="Exportar"><Download size={14} /></button>
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
                <h3 style={{ fontWeight: 700, fontFamily: "monospace" }}>{selected.tag}</h3>
                <button className="admin-btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelected(null)}>Fechar</button>
              </div>
              <div className="admin-detail-row"><span>Data</span><strong>{selected.date}</strong></div>
              <div className="admin-detail-row"><span>Autor</span><strong>{selected.author}</strong></div>
              <div className="admin-detail-row"><span>Módulos ativos</span><strong>{selected.modules}</strong></div>
              <div style={{ marginTop: 12 }}>
                <label className="afield-label">Descrição das mudanças</label>
                <p style={{ fontSize: 14, marginTop: 6, lineHeight: 1.6 }}>{selected.desc}</p>
              </div>
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                <button className="admin-btn-ghost" style={{ fontSize: 13 }}><Download size={14} /> Exportar esta versão</button>
                {!selected.active && (
                  <button className="admin-btn-ghost" style={{ fontSize: 13 }}><RotateCcw size={14} /> Restaurar esta versão</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
