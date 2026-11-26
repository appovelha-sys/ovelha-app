import { createFileRoute, useNavigate } from "@tanstack/react-router";
import mascot from "@/assets/ovelha-mascote.png";

export const Route = createFileRoute("/app/")({
  component: SplashScreen,
});

function SplashScreen() {
  const navigate = useNavigate();

  return (
    <div className="splash">

      {/* Imagem já inclui mascote, estrela e logotipo "ovelha." */}
      <div className="splash-visual">
        <img
          src={mascot}
          alt="Ovelha"
          className="splash-mascot"
          draggable={false}
        />
      </div>

      {/* Slogan */}
      <div className="splash-brand">
        <p className="splash-tagline">Seu lugar pertinho de Jesus.</p>
      </div>

      {/* Botão */}
      <div className="splash-footer">
        <button
          className="splash-cta"
          onClick={() => navigate({ to: "/auth" })}
        >
          Começar
        </button>
      </div>

    </div>
  );
}
