import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Upload, Plus, Search, Tag, Eye, EyeOff, Trash2,
  FileText, FileJson, RefreshCw,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/biblioteca")({ component: BibliotecaPage });

const CATEGORIES = [
  "Bíblia", "Evangelhos", "Falas de Jesus", "Parábolas",
  "Interações de Jesus", "Estudos Comportamentais", "Contexto Histórico",
  "Grego", "Hebraico", "Aramaico", "Estudos Teológicos", "Documentos Personalizados",
];

type Doc = {
  id: string; title: string; category: string; tags: string[];
  type: "pdf" | "txt" | "docx" | "json" | "manual";
  status: "indexado" | "processando" | "erro";
  active: boolean; size: string; date: string;
};

const SAMPLE: Doc[] = [
  { id: "1", title: "Bíblia NVI — Novo Testamento", category: "Bíblia", tags: ["NVI","NT"], type: "pdf", status: "indexado", active: true, size: "2.4 MB", date: "2026-01-01" },
  { id: "2", title: "Evangelhos Sinóticos — Comparativo", category: "Evangelhos", tags: ["sinóticos","Mt","Mc","Lc"], type: "txt", status: "indexado", active: true, size: "380 KB", date: "2026-01-05" },
];

function FileIcon({ type }: { type: Doc["type"] }) {
  if (type === "json") return <FileJson size={16} style={{ color: "#0369a1" }} />;
  return <FileText size={16} style={{ color: type === "pdf" ? "#b91c1c" : "var(--admin-muted)" }} />;
}

function StatusBadge({ status }: { status: Doc["status"] }) {
  const map = { indexado: "admin-tag--live", processando: "admin-tag--draft", erro: "admin-tag--danger" };
  return <span className={`cerebro-tag ${map[status]}`}>{status}</span>;
}

function BibliotecaPage() {
  const [docs, setDocs] = useState<Doc[]>(SAMPLE);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todos");
  const [showUpload, setShowUpload] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ title: "", category: CATEGORIES[0], content: "", tags: "" });

  const filtered = docs.filter(d =>
    (cat === "Todos" || d.category === cat) &&
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  function addManual() {
    if (!manual.title || !manual.content) return;
    setDocs(d => [...d, {
      id: Date.now().toString(),
      title: manual.title,
      category: manual.category,
      tags: manual.tags.split(",").map(t => t.trim()).filter(Boolean),
      type: "manual",
      status: "indexado",
      active: true,
      size: `${manual.content.length} chars`,
      date: new Date().toISOString().slice(0, 10),
    }]);
    setManual({ title: "", category: CATEGORIES[0], content: "", tags: "" });
    setShowManual(false);
  }

  function toggle(id: string) { setDocs(d => d.map(x => x.id === id ? { ...x, active: !x.active } : x)); }
  function remove(id: string) { if (!confirm("Remover documento?")) return; setDocs(d => d.filter(x => x.id !== id)); }
  function reprocess(id: string) {
    setDocs(d => d.map(x => x.id === id ? { ...x, status: "processando" } : x));
    setTimeout(() => setDocs(d => d.map(x => x.id === id ? { ...x, status: "indexado" } : x)), 2000);
  }

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Biblioteca de Conhecimento</h1>
            <p className="admin-page-sub">{docs.filter(d => d.active).length} documentos ativos · {docs.length} total</p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="admin-btn-ghost" onClick={() => setShowManual(s => !s)}><Plus size={15} /> Cadastro manual</button>
            <button className="admin-btn-primary" onClick={() => setShowUpload(s => !s)}><Upload size={15} /> Upload</button>
          </div>
        </div>

        {showUpload && (
          <div className="admin-upload-zone">
            <Upload size={28} style={{ color: "var(--admin-muted)" }} />
            <p>Arraste arquivos aqui ou clique para selecionar</p>
            <p style={{ fontSize: 12, opacity: 0.6 }}>PDF, TXT, DOCX, JSON, CSV — máx 50 MB por arquivo</p>
            <input type="file" multiple accept=".pdf,.txt,.docx,.json,.csv" style={{ display: "none" }}
              id="lib-upload" onChange={() => alert("Conecte o backend de processamento para indexação real.")} />
            <label htmlFor="lib-upload" className="admin-btn-sm" style={{ cursor: "pointer" }}>Selecionar arquivos</label>
            <p className="admin-login-note">⚠️ Requer integração com serviço de embeddings e banco vetorial (pgvector / Pinecone).</p>
          </div>
        )}

        {showManual && (
          <div className="cerebro-form" style={{ marginBottom: 24 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 12 }}>Cadastro manual de conteúdo</h3>
            <input className="afield-input" placeholder="Título" value={manual.title}
              onChange={e => setManual(m => ({ ...m, title: e.target.value }))} />
            <select className="afield-select" value={manual.category}
              onChange={e => setManual(m => ({ ...m, category: e.target.value }))}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <textarea className="afield-textarea" rows={6} placeholder="Conteúdo do documento..."
              value={manual.content} onChange={e => setManual(m => ({ ...m, content: e.target.value }))} />
            <input className="afield-input" placeholder="Tags separadas por vírgula"
              value={manual.tags} onChange={e => setManual(m => ({ ...m, tags: e.target.value }))} />
            <div className="cerebro-form-actions">
              <button className="admin-btn-ghost" onClick={() => setShowManual(false)}>Cancelar</button>
              <button className="admin-btn-primary" onClick={addManual}>Salvar e indexar</button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="admin-filters">
          <div className="admin-search-wrap">
            <Search size={15} className="admin-search-icon" />
            <input className="admin-search" placeholder="Buscar documentos..." value={search}
              onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="admin-cat-tabs">
            {["Todos", ...CATEGORIES].map(c => (
              <button key={c} className={`admin-cat-tab${cat === c ? " admin-cat-tab--active" : ""}`}
                onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Categoria</th>
                <th>Tags</th>
                <th>Tamanho</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} style={{ opacity: d.active ? 1 : 0.5 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileIcon type={d.type} />
                      <span style={{ fontWeight: 500 }}>{d.title}</span>
                    </div>
                  </td>
                  <td><span className="admin-cat-pill">{d.category}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {d.tags.map(t => <span key={t} className="admin-tag-pill"><Tag size={10} />{t}</span>)}
                    </div>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--admin-muted)" }}>{d.size}</td>
                  <td><StatusBadge status={d.status} /></td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="icon-btn-sm" title="Reprocessar" onClick={() => reprocess(d.id)}><RefreshCw size={14} /></button>
                      <button className="icon-btn-sm" title={d.active ? "Desativar" : "Ativar"} onClick={() => toggle(d.id)}>
                        {d.active ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button className="icon-btn-sm icon-btn-sm--danger" title="Remover" onClick={() => remove(d.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "var(--admin-muted)" }}>Nenhum documento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
