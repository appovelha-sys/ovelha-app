import { createFileRoute } from "@tanstack/react-router";
import { Search, BookOpen, HandHeart, BookMarked, GraduationCap, Gamepad2 } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";

export const Route = createFileRoute("/app/explore")({ component: ExploreScreen });

const CATEGORIES = [
  { icon: BookOpen,      label: "Bíblia",      count: "66 livros"    },
  { icon: HandHeart,     label: "Orações",     count: "48 orações"   },
  { icon: BookMarked,    label: "Histórias",   count: "30 histórias" },
  { icon: GraduationCap, label: "Aprendizado", count: "12 lições"    },
  { icon: Gamepad2,      label: "Jogos",       count: "8 atividades" },
] as const;

const FEATURED = [
  { tag: "Bíblia",    title: "Salmo 23",            sub: "O Senhor é o meu pastor"         },
  { tag: "Oração",   title: "Oração do Pai Nosso",  sub: "Uma oração para toda hora"        },
  { tag: "História", title: "Noé e o Dilúvio",      sub: "Uma história de fé e obediência"  },
  { tag: "Lição",    title: "Os Dez Mandamentos",   sub: "O que Deus nos pediu para guardar"},
];

function ExploreScreen() {
  return (
    <AppShell>
      <div className="explore-page">
        <header className="page-header">
          <h1 className="page-title">Explorar</h1>
          <p className="page-subtitle">Descubra o que Deus tem para você hoje</p>
        </header>

        <div className="search-wrap">
          <Search size={17} className="search-icon" aria-hidden />
          <input type="search" placeholder="Buscar histórias, orações, versículos…" className="search-input" aria-label="Buscar" />
        </div>

        <section className="home-section">
          <h2 className="section-title">Categorias</h2>
          <div className="cat-list">
            {CATEGORIES.map(({ icon: Icon, label, count }) => (
              <button key={label} className="cat-item">
                <span className="cat-icon"><Icon size={24} /></span>
                <div className="cat-info">
                  <p className="cat-label">{label}</p>
                  <p className="cat-count">{count}</p>
                </div>
                <span className="cat-arrow">›</span>
              </button>
            ))}
          </div>
        </section>

        <section className="home-section">
          <h2 className="section-title">Em destaque</h2>
          <div className="featured-list">
            {FEATURED.map(({ tag, title, sub }) => (
              <button key={title} className="featured-item">
                <span className="featured-tag">{tag}</span>
                <p className="featured-title">{title}</p>
                <p className="featured-sub">{sub}</p>
              </button>
            ))}
          </div>
        </section>

        <div className="nav-spacer" />
      </div>
    </AppShell>
  );
}
