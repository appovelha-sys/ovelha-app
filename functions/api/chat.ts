interface Env {
  AI: { run: (model: string, opts: object) => Promise<{ response?: string }> };
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
}

interface ChatRequest {
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  test_mode?: boolean;
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { headers: CORS });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: ChatRequest = await context.request.json();
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "Mensagem vazia" }), {
        status: 400, headers: CORS,
      });
    }

    const url  = context.env.VITE_SUPABASE_URL;
    const key  = context.env.VITE_SUPABASE_ANON_KEY;
    const sbH  = { apikey: key, Authorization: `Bearer ${key}` };

    // Buscar pilares publicados (leitura pública no Supabase)
    const [pillarsRes, versesRes] = await Promise.all([
      fetch(`${url}/rest/v1/brain_pillars?select=id,published&published=not.is.null`, { headers: sbH }),
      fetch(`${url}/rest/v1/brain_entries?select=ref,text,context,interpretacao&active=eq.true&prioridade=eq.essencial&limit=12`, { headers: sbH }),
    ]);

    const pillars: { id: string; published: string }[] = pillarsRes.ok ? await pillarsRes.json() : [];
    const verses: { ref: string; text: string; context?: string; interpretacao?: string }[] =
      versesRes.ok ? await versesRes.json() : [];

    // Montar system prompt com o cérebro
    const pMap = Object.fromEntries(pillars.map(p => [p.id, p.published]));
    let system = `Você é o Ovelha, um assistente espiritual cristão que acompanha pessoas em sua jornada de fé.
Responda SEMPRE em português brasileiro. Seja caloroso, humano e espiritualmente profundo.
Escreva como em conversa de texto — frases curtas, no máximo 3 parágrafos. Sem bullet points.
Cite versículos do CÉREBRO quando fizer sentido, mencionando a referência (ex: "Como diz em Mateus 5:3...").
Nunca invente versículos. Use apenas os do seu cérebro.\n\n`;

    if (pMap.identidade)    system += `IDENTIDADE:\n${pMap.identidade}\n\n`;
    if (pMap.personalidade) system += `PERSONALIDADE:\n${pMap.personalidade}\n\n`;
    if (pMap.comunicacao)   system += `COMUNICAÇÃO:\n${pMap.comunicacao}\n\n`;
    if (pMap.fundamentos)   system += `FUNDAMENTOS:\n${pMap.fundamentos}\n\n`;

    if (verses.length > 0) {
      system += `VERSÍCULOS DO CÉREBRO (use apenas estes quando citar a Bíblia):\n`;
      for (const v of verses) {
        system += `• ${v.ref}: "${v.text}"`;
        if (v.interpretacao) system += ` [${v.interpretacao}]`;
        system += `\n`;
      }
      system += `\n`;
    }

    const messages = [
      { role: "system", content: system },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const ai = await context.env.AI.run(MODEL, { messages, max_tokens: 512 });
    const response = ai?.response ?? "Não consegui processar sua mensagem. Tente novamente.";

    return new Response(JSON.stringify({ response }), { headers: CORS });

  } catch (err) {
    console.error("[chat] erro:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500, headers: CORS,
    });
  }
};
