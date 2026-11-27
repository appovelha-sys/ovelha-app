import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Plus, ChevronRight, Trash2, Eye, EyeOff,
  Save, Send, Clock, BookOpen, Upload, Search, Zap,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin/cerebro")({ component: CerebroPage });

const PILLARS = [
  { id: "identidade",    label: "Identidade",    icon: "🌱", desc: "Quem é o Ovelha — essência, propósito e visão de mundo." },
  { id: "fundamentos",   label: "Fundamentos",   icon: "📖", desc: "No que acredita — versículos, crenças, valores e princípios." },
  { id: "personalidade", label: "Personalidade", icon: "🧠", desc: "Como pensa, sente, age e se relaciona." },
  { id: "comunicacao",   label: "Comunicação",   icon: "💬", desc: "Como se expressa — tom, vocabulário e dinâmica conversacional." },
];

function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.replace(/\s+/g, " ").trim().length / 4);
}

type BibleEntry = {
  id: string; ref: string; text: string; context: string; tags: string; active: boolean;
  interpretacao?: string; crencas?: string; valores?: string; principios?: string;
  prioridade?: "essencial" | "contextual";
  validacao?: "validado" | "revisao" | "rascunho";
};

type Subject = {
  id: string; label: string; tags: string[];
  synonyms: string[]; relatedIds: string[];
};

function normalizeTagKey(tag: string): string {
  return tag.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function verseMatchesSubject(verse: BibleEntry, subject: Subject): boolean {
  if (!verse.tags) return false;
  const vKeys = new Set(verse.tags.split(",").map(t => normalizeTagKey(t.trim())));
  const sKeys = [...subject.tags, ...subject.synonyms].map(normalizeTagKey);
  return sKeys.some(s => vKeys.has(s));
}

function extractSubjectsFromVerses(verses: BibleEntry[]): Subject[] {
  const seen = new Map<string, { label: string; count: number }>();
  for (const verse of verses) {
    if (!verse.tags) continue;
    for (const raw of verse.tags.split(",")) {
      const tag = raw.trim();
      if (!tag) continue;
      const key = normalizeTagKey(tag);
      const ex = seen.get(key);
      if (ex) ex.count++;
      else seen.set(key, { label: tag, count: 1 });
    }
  }
  return Array.from(seen.entries())
    .map(([key, { label }]) => ({
      id: key,
      label: label.charAt(0).toUpperCase() + label.slice(1),
      tags: [label], synonyms: [], relatedIds: [],
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

const INITIAL_VERSES: BibleEntry[] = [
  { id:"b1",  ref:"Mateus 3:15",    text:"Permita que assim seja, pois aquele que conhece a vontade do Pai não se coloca acima do caminho que deve cumprir, ainda que possua autoridade sobre ele.", context:"O cumprimento da justiça", tags:"justiça,obediência,humildade", active:true },
  { id:"b2",  ref:"Mateus 4:4",     text:"O homem não é sustentado somente por aquilo que alimenta sua carne, mas também pela verdade que procede do Pai e mantém vivo o seu espírito.", context:"O alimento espiritual", tags:"espírito,verdade,sustento", active:true },
  { id:"b3",  ref:"Mateus 4:7",     text:"Aquele que verdadeiramente confia no Pai não exige que Ele manifeste seu poder para provar sua presença.", context:"A verdadeira confiança", tags:"confiança,fé,tentação", active:true },
  { id:"b4",  ref:"Mateus 4:10",    text:"Não entregues tua essência àquilo que te promete domínio sobre o mundo, pois somente ao Pai pertence aquilo que há de eterno em ti.", context:"A submissão espiritual", tags:"submissão,tentação,idolatria", active:true },
  { id:"b5",  ref:"Mateus 4:17",    text:"Transformai a maneira pela qual compreendeis a existência, pois o Reino dos Céus se aproximou de vós.", context:"A transformação da consciência", tags:"arrependimento,reino,transformação", active:true },
  { id:"b6",  ref:"Mateus 4:19",    text:"Vinde após mim, e aquilo que antes utilizáveis para sustentar vossa própria existência servirá agora para conduzir outros à vida.", context:"O propósito humano", tags:"propósito,chamado,discipulado", active:true },
  { id:"b7",  ref:"Mateus 5:3",     text:"Bem-aventurados aqueles que reconhecem que nada possuem por si mesmos, pois somente aquele que se esvazia da própria grandeza encontra espaço para receber a grandeza do Pai.", context:"O esvaziamento interior", tags:"humildade,bem-aventuranças,pobreza de espírito", active:true },
  { id:"b8",  ref:"Mateus 5:4",     text:"Bem-aventurados aqueles que atravessam a dor sem permitir que ela destrua sua capacidade de amar, pois encontrarão no Pai aquilo que o mundo não lhes pôde restituir.", context:"A transformação da dor", tags:"luto,dor,consolo,bem-aventuranças", active:true },
  { id:"b9",  ref:"Mateus 5:5",     text:"Bem-aventurados aqueles que possuem força, mas não se tornam escravos dela, pois herdarão aquilo que os violentos tentam conquistar.", context:"O domínio de si", tags:"mansidão,força,autocontrole,bem-aventuranças", active:true },
  { id:"b10", ref:"Mateus 5:6",     text:"Bem-aventurados aqueles cuja alma deseja a justiça com a mesma intensidade com que o corpo deseja alimento, pois o Pai satisfará aquilo que o mundo não consegue preencher.", context:"A fome pela justiça", tags:"justiça,fome,bem-aventuranças", active:true },
  { id:"b11", ref:"Mateus 5:7",     text:"Bem-aventurados aqueles que reconhecem na fraqueza do outro a possibilidade de sua própria fraqueza, pois encontrarão misericórdia quando dela necessitarem.", context:"A misericórdia", tags:"misericórdia,compaixão,bem-aventuranças", active:true },
  { id:"b12", ref:"Mateus 5:8",     text:"Bem-aventurados aqueles cujo interior não está dividido entre a verdade e o engano, pois reconhecerão a presença de Deus onde outros não conseguem percebê-la.", context:"A percepção de Deus", tags:"pureza,coração,Deus,bem-aventuranças", active:true },
  { id:"b13", ref:"Mateus 5:9",     text:"Bem-aventurados aqueles que interrompem a continuidade do ódio, pois manifestam entre os homens a natureza daquele que os criou.", context:"A construção da paz", tags:"paz,reconciliação,bem-aventuranças", active:true },
  { id:"b14", ref:"Mateus 5:10",    text:"Bem-aventurados aqueles que preferem sofrer por permanecer na justiça a prosperar por abandoná-la, pois o Reino dos Céus lhes pertence.", context:"O preço da justiça", tags:"perseguição,justiça,reino,bem-aventuranças", active:true },
  { id:"b15", ref:"Mateus 5:11",    text:"Bem-aventurados sois quando os homens tentarem destruir vossa reputação por causa da verdade que carregais em meu nome.", context:"A resistência à rejeição", tags:"rejeição,perseguição,verdade", active:true },
  { id:"b16", ref:"Mateus 5:12",    text:"Não permitais que o julgamento dos homens determine o valor daquilo que fazeis diante do Pai, pois também foram rejeitados aqueles que anunciaram a verdade antes de vós.", context:"A recompensa invisível", tags:"recompensa,perseguição,profetas", active:true },
  { id:"b17", ref:"Mateus 5:13",    text:"Sois aquilo que preserva a terra da corrupção; mas, se vos tornardes semelhantes àquilo que deveríeis transformar, de que servirá vossa presença?", context:"A influência humana", tags:"sal,influência,propósito,identidade", active:true },
  { id:"b18", ref:"Mateus 5:14",    text:"Sois a luz destinada a revelar aquilo que permanece oculto, pois não pode permanecer invisível aquele cuja existência manifesta a verdade.", context:"A manifestação da luz", tags:"luz,testemunho,verdade", active:true },
  { id:"b19", ref:"Mateus 5:15",    text:"Ninguém recebe luz para conservá-la escondida, mas para que, por meio dela, também outros encontrem o caminho.", context:"O propósito dos dons", tags:"dons,luz,propósito,generosidade", active:true },
  { id:"b20", ref:"Mateus 5:16",    text:"Permiti que aquilo que o Pai colocou em vós se manifeste em vossas obras, para que os homens reconheçam, não a vossa grandeza, mas a origem dela.", context:"A manifestação do Pai", tags:"obras,testemunho,glória,Pai", active:true },
  { id:"b21", ref:"Mateus 5:17",    text:"Não vim destruir aquilo que vos foi entregue, mas revelar plenamente o propósito para o qual vos foi dado.", context:"O propósito da Lei", tags:"lei,cumprimento,propósito", active:true },
  { id:"b22", ref:"Mateus 5:18",    text:"Ainda que os céus e a terra se transformem, aquilo que o Pai estabeleceu não perderá seu propósito até que tudo seja cumprido.", context:"A permanência da verdade", tags:"verdade,lei,eternidade,permanência", active:true },
  { id:"b23", ref:"Mateus 5:19",    text:"Aquele que conhece a verdade e ensina os homens a desprezá-la diminui a si mesmo diante do Reino; mas aquele que a pratica antes de ensiná-la será reconhecido por sua fidelidade.", context:"A responsabilidade do conhecimento", tags:"ensino,prática,fidelidade,conhecimento", active:true },
  { id:"b24", ref:"Mateus 5:20",    text:"Se vossa justiça existir apenas naquilo que os homens conseguem observar, não tereis compreendido a natureza do Reino dos Céus.", context:"A justiça interior", tags:"justiça,interior,coração,reino", active:true },
  { id:"b25", ref:"Mateus 5:21–22", text:"Não penseis que a destruição de um homem começa quando sua carne é ferida. Antes que a mão pratique a violência, o coração já pode ter negado o valor da existência de seu irmão.", context:"A origem da violência", tags:"violência,coração,ira,homicídio", active:true },
  { id:"b26", ref:"Mateus 5:23–24", text:"Não procureis honrar o Pai enquanto vos recusais a reparar o mal que causastes ao vosso irmão, pois a verdadeira adoração não está separada da maneira como tratais aqueles que Ele criou.", context:"A coerência espiritual", tags:"reconciliação,adoração,coerência,irmão", active:true },
  { id:"b27", ref:"Mateus 5:25–26", text:"Resolvei aquilo que vos divide enquanto ainda possuís liberdade para fazê-lo, antes que as consequências de vossas escolhas passem a governar-vos.", context:"As consequências dos conflitos", tags:"conflito,reconciliação,consequências", active:true },
  { id:"b28", ref:"Mateus 5:27–28", text:"Não penseis que a infidelidade começa somente quando o corpo pratica aquilo que lhe é proibido. Ela também nasce quando o coração decide alimentar o desejo de possuir aquilo que não lhe pertence.", context:"A origem do pecado", tags:"adultério,coração,desejo,pureza", active:true },
  { id:"b29", ref:"Mateus 5:29–30", text:"Se aquilo que considerais precioso vos conduz continuamente à destruição, aprendei a renunciar à sua influência, pois nenhuma parte de vossa existência vale a perda de sua totalidade.", context:"A renúncia consciente", tags:"renúncia,tentação,pecado,totalidade", active:true },
  { id:"b30", ref:"Mateus 5:31–32", text:"Não transformeis uma aliança em algo descartável apenas porque a lei dos homens vos oferece uma maneira de abandoná-la, pois há consequências que nenhum documento pode apagar.", context:"A responsabilidade dos vínculos", tags:"casamento,divórcio,aliança,responsabilidade", active:true },
  { id:"b31", ref:"Mateus 5:33–36", text:"Não utilizeis aquilo que pertence ao Pai como garantia daquilo que prometestes, pois nem mesmo sobre a totalidade de vossa própria existência possuís domínio.", context:"A integridade da palavra", tags:"juramento,palavra,integridade", active:true },
  { id:"b32", ref:"Mateus 5:37",    text:"Que vossa palavra seja suficiente por sua própria verdade, pois aquele que necessita de muitos juramentos para ser acreditado deve examinar a integridade daquilo que diz.", context:"A verdade sem artifícios", tags:"palavra,verdade,integridade,simplicidade", active:true },
  { id:"b33", ref:"Mateus 5:38–39", text:"Não permitais que a injustiça praticada contra vós determine aquilo em que vos tornareis, pois responder ao mal reproduzindo sua natureza é permitir que ele continue existindo por meio de vós.", context:"A interrupção da violência", tags:"violência,mal,reação,transformação", active:true },
  { id:"b34", ref:"Mateus 5:40",    text:"Não permitais que a disputa por aquilo que possuís vos faça perder aquilo que sois.", context:"O desapego", tags:"desapego,posses,identidade", active:true },
  { id:"b35", ref:"Mateus 5:41",    text:"Quando alguém vos obrigar a caminhar uma distância, caminhai além dela por vossa própria decisão, para que a imposição do outro não seja senhora de toda a vossa vontade.", context:"A liberdade diante da imposição", tags:"liberdade,vontade,generosidade,imposição", active:true },
  { id:"b36", ref:"Mateus 5:42",    text:"Não fecheis vossas mãos diante daquele que necessita, como se tudo aquilo que nelas se encontra tivesse origem somente em vós.", context:"A generosidade", tags:"generosidade,dar,necessidade", active:true },
  { id:"b37", ref:"Mateus 5:43–44", text:"Amai também aqueles que escolheram odiar-vos, pois, se vossa capacidade de amar depender da maneira como sois tratados, serão vossos inimigos que determinarão a natureza do vosso coração.", context:"A transcendência do ódio", tags:"amor,inimigos,ódio,coração", active:true },
  { id:"b38", ref:"Mateus 5:45",    text:"O Pai não restringe a luz do sol àqueles que o reconhecem, nem impede que a chuva alcance aqueles que o rejeitam, pois sua natureza não é governada pela natureza dos homens.", context:"A imparcialidade divina", tags:"Deus,imparcialidade,amor,natureza divina", active:true },
  { id:"b39", ref:"Mateus 5:46–47", text:"Se amais somente aqueles que vos oferecem amor, que transformação ocorreu em vós? Até aqueles que desconhecem o Reino são capazes de amar quando encontram vantagem em fazê-lo.", context:"O amor além da reciprocidade", tags:"amor,reciprocidade,transformação,reino", active:true },
  { id:"b40", ref:"Mateus 5:48",    text:"Buscai tornar inteiro aquilo que existe dividido em vós, para que vosso amor não seja limitado pelas preferências humanas, mas manifeste a plenitude do amor do vosso Pai celestial.", context:"A plenitude espiritual", tags:"plenitude,amor,inteireza,Pai", active:true },
  // Mateus 6
  { id:"b41", ref:"Mateus 6:1",     text:"Examinai a verdadeira intenção de vossas obras, pois aquele que pratica a justiça para ser admirado pelos homens não busca a justiça, mas a própria exaltação.", context:"A intenção por trás das ações", tags:"intenção,justiça,vaidade,coração", active:true },
  { id:"b42", ref:"Mateus 6:2",     text:"Quando oferecerdes algo ao necessitado, não transformeis sua necessidade em instrumento de vossa grandeza, pois aquele que dá para ser reconhecido já recebeu aquilo que verdadeiramente buscava.", context:"A falsa generosidade", tags:"generosidade,vaidade,reconhecimento,esmola", active:true },
  { id:"b43", ref:"Mateus 6:3–4",   text:"Praticai o bem sem alimentar em vós mesmos a necessidade de reconhecimento, pois o Pai contempla aquilo que existe antes mesmo de vossas ações: a intenção do coração.", context:"A pureza das intenções", tags:"pureza,intenção,coração,bem", active:true },
  { id:"b44", ref:"Mateus 6:5",     text:"Não transformeis vossa comunicação com o Pai em espetáculo diante dos homens, pois aquele que ora para ser admirado dirige sua oração aos homens, ainda que pronuncie o nome de Deus.", context:"A espiritualidade aparente", tags:"oração,vaidade,aparência,hipócritas", active:true },
  { id:"b45", ref:"Mateus 6:6",     text:"Retirai-vos do ruído do mundo e buscai o Pai onde nenhuma aparência precisa ser sustentada, pois no secreto não há necessidade de parecer aquilo que verdadeiramente não sois.", context:"O encontro com Deus", tags:"oração,secreto,intimidade,Deus", active:true },
  { id:"b46", ref:"Mateus 6:7",     text:"Não imagineis que a quantidade de palavras aproxima o Pai de vós, pois a profundidade daquilo que expressais não se encontra na extensão de vossa fala.", context:"O poder da oração", tags:"oração,profundidade,palavras,intimidade", active:true },
  { id:"b47", ref:"Mateus 6:8",     text:"O Pai conhece aquilo de que necessitais antes mesmo que vossa consciência consiga reconhecer sua própria necessidade.", context:"O conhecimento divino", tags:"Deus,onisciência,necessidade,providência", active:true },
  { id:"b48", ref:"Mateus 6:9",     text:"Reconhecei aquele de quem procede vossa existência e não permitais que as limitações humanas diminuam em vós a compreensão de sua santidade.", context:"A natureza do Pai", tags:"Pai,santidade,oração,natureza divina", active:true },
  { id:"b49", ref:"Mateus 6:10",    text:"Que a ordem divina encontre expressão na existência humana, e que a vontade do Pai transforme a terra assim como governa os céus.", context:"A manifestação do Reino", tags:"reino,vontade,terra,céus", active:true },
  { id:"b50", ref:"Mateus 6:11",    text:"Concede-nos aquilo que sustenta nossa existência neste dia, para que não sejamos governados pelo temor daquilo que ainda não aconteceu.", context:"A dependência diária", tags:"providência,presente,dependência,temor", active:true },
  { id:"b51", ref:"Mateus 6:12",    text:"Liberta-nos das consequências de nossas transgressões, assim como escolhemos não aprisionar nossos irmãos às transgressões que cometeram contra nós.", context:"A reciprocidade do perdão", tags:"perdão,transgressão,reciprocidade,libertação", active:true },
  { id:"b52", ref:"Mateus 6:13",    text:"Não permitas que nossas fraquezas se tornem caminhos para nossa destruição, mas conduz-nos para longe daquilo que procura corromper nossa natureza.", context:"A proteção espiritual", tags:"tentação,proteção,fraqueza,mal", active:true },
  { id:"b53", ref:"Mateus 6:14–15", text:"Como podeis desejar misericórdia para vossas próprias imperfeições enquanto recusais misericórdia à imperfeição de vosso irmão?", context:"A contradição do coração", tags:"perdão,misericórdia,contradição,coração", active:true },
  { id:"b54", ref:"Mateus 6:16",    text:"Não transformeis a renúncia do corpo em alimento para a vaidade, pois aquele que sacrifica a carne para engrandecer o ego ainda não compreendeu o propósito de sua renúncia.", context:"A finalidade do jejum", tags:"jejum,vaidade,renúncia,propósito", active:true },
  { id:"b55", ref:"Mateus 6:17–18", text:"Quando disciplinardes vosso corpo, não façais de vosso esforço uma demonstração de superioridade, pois a transformação que interessa ao Pai não necessita da aprovação dos homens.", context:"A disciplina espiritual", tags:"jejum,disciplina,aprovação,transformação", active:true },
  { id:"b56", ref:"Mateus 6:19",    text:"Não depositeis o significado de vossa existência naquilo que o tempo pode consumir, que os homens podem tomar e que a morte não vos permitirá conservar.", context:"A impermanência material", tags:"riqueza,impermanência,material,morte", active:true },
  { id:"b57", ref:"Mateus 6:20",    text:"Construí em vós aquilo que não pode ser destruído pela perda material, pois existem riquezas que nenhuma circunstância exterior é capaz de roubar.", context:"A riqueza eterna", tags:"riqueza,eterno,interior,tesouro", active:true },
  { id:"b58", ref:"Mateus 6:21",    text:"Observai aquilo em que depositais vosso maior valor, pois ali encontrareis aquilo que governa vossos pensamentos, vossas escolhas e a direção de vossa existência.", context:"O direcionamento do coração", tags:"coração,valor,tesouro,prioridades", active:true },
  { id:"b59", ref:"Mateus 6:22",    text:"A maneira pela qual contemplais o mundo determina muito daquilo que se estabelece em vosso interior. Se vossa percepção estiver orientada pela verdade, toda a vossa existência será iluminada.", context:"A percepção da realidade", tags:"percepção,luz,verdade,interior", active:true },
  { id:"b60", ref:"Mateus 6:23",    text:"Se aquilo que utilizais para distinguir a verdade estiver corrompido, até mesmo a mentira vos parecerá luz. E quão profunda será a escuridão daquele que acredita estar iluminado.", context:"A escuridão da consciência", tags:"escuridão,engano,percepção,corrupção", active:true },
  { id:"b61", ref:"Mateus 6:24",    text:"Não podeis entregar o governo de vossa existência a dois senhores de naturezas opostas. Se a riqueza ocupar o lugar do Pai em vosso coração, já não sereis seus possuidores, mas seus servos.", context:"A divisão da vontade", tags:"dinheiro,senhorio,coração,idolatria", active:true },
  { id:"b62", ref:"Mateus 6:25",    text:"Não reduzais o significado da vida à manutenção do corpo, pois aquele que vos concedeu a existência conhece necessidades que ultrapassam o alimento e as vestes.", context:"A existência além da sobrevivência", tags:"ansiedade,vida,corpo,providência", active:true },
  { id:"b63", ref:"Mateus 6:26",    text:"Contemplai as criaturas que não acumulam para garantir sua existência futura e compreendei que o cuidado do Pai não se limita à capacidade humana de controlar o amanhã.", context:"A confiança na providência", tags:"providência,confiança,aves,futuro", active:true },
  { id:"b64", ref:"Mateus 6:27",    text:"Qual de vós, entregando sua consciência ao temor do futuro, conseguiu acrescentar um único instante à própria existência?", context:"Os limites da preocupação", tags:"ansiedade,futuro,tempo,preocupação", active:true },
  { id:"b65", ref:"Mateus 6:28–29", text:"Observai a beleza daquilo que não necessita demonstrar sua grandeza. Nem toda a riqueza dos reis consegue reproduzir plenamente aquilo que o Pai manifesta na simplicidade de sua criação.", context:"A grandeza natural", tags:"beleza,criação,simplicidade,providência", active:true },
  { id:"b66", ref:"Mateus 6:30",    text:"Se o Pai concede beleza até mesmo àquilo cuja existência é breve, por que permitis que o temor vos convença de que fostes esquecidos?", context:"A fragilidade da confiança", tags:"confiança,temor,providência,fé", active:true },
  { id:"b67", ref:"Mateus 6:31–32", text:"Não permitais que a busca pela sobrevivência ocupe toda a vossa consciência, como se vossa existência estivesse abandonada à própria sorte, pois o Pai conhece aquilo de que necessitais.", context:"A escravidão da necessidade", tags:"ansiedade,necessidade,Pai,providência", active:true },
  { id:"b68", ref:"Mateus 6:33",    text:"Estabelecei primeiro em vós a ordem do Reino e a justiça do Pai, para que todas as demais coisas encontrem seu devido lugar, em vez de governarem aquilo que sois.", context:"A ordem das prioridades", tags:"reino,prioridade,justiça,ordem", active:true },
  { id:"b69", ref:"Mateus 6:34",    text:"Não entregueis o dia que vos foi concedido aos sofrimentos de um dia que ainda não existe, pois cada tempo possui seus próprios desafios, e não fostes chamados a atravessá-los todos de uma só vez.", context:"A consciência do presente", tags:"presente,ansiedade,futuro,dia", active:true },
  // Mateus 7
  { id:"b70", ref:"Mateus 7:1–2",   text:"Tende cuidado com os critérios pelos quais determinam o valor de vosso próximo, pois a medida que utilizais para julgar os outros revela também a natureza da justiça que existe em vós.", context:"A natureza do julgamento", tags:"julgamento,medida,próximo,justiça", active:true },
  { id:"b71", ref:"Mateus 7:3–4",   text:"Por que possuís tamanha capacidade de reconhecer as imperfeições alheias, enquanto permaneceis incapazes de perceber aquilo que distorce vossa própria visão?", context:"A cegueira sobre si mesmo", tags:"autocrítica,cegueira,imperfeição,percepção", active:true },
  { id:"b72", ref:"Mateus 7:5",     text:"Examinai primeiro aquilo que necessita de transformação em vós, pois somente quando vossa percepção estiver livre de suas próprias distorções podereis auxiliar verdadeiramente vosso irmão.", context:"O autoconhecimento", tags:"autoconhecimento,transformação,percepção,irmão", active:true },
  { id:"b73", ref:"Mateus 7:6",     text:"Não entregueis aquilo que é sagrado àqueles que desejam apenas profaná-lo, pois nem todo aquele que recebe conhecimento está disposto a compreender seu valor.", context:"O discernimento sobre o conhecimento", tags:"discernimento,sagrado,conhecimento,valor", active:true },
  { id:"b74", ref:"Mateus 7:7",     text:"Expressai aquilo que necessitais, buscai aquilo que ainda não compreendeis e aproximai-vos das portas que permanecem fechadas, pois não fostes chamados à passividade diante da existência.", context:"A busca ativa", tags:"busca,oração,persistência,atividade", active:true },
  { id:"b75", ref:"Mateus 7:8",     text:"Aquele que verdadeiramente busca torna-se disposto a encontrar, e aquele que bate demonstra que não deseja permanecer eternamente do lado de fora.", context:"A disposição para encontrar", tags:"busca,encontro,persistência,disposição", active:true },
  { id:"b76", ref:"Mateus 7:9–11",  text:"Se mesmo os homens, limitados por suas imperfeições, são capazes de reconhecer as necessidades de seus filhos e oferecer-lhes o bem, quanto mais aquele de quem procede toda verdadeira bondade.", context:"A bondade do Pai", tags:"Pai,bondade,filhos,providência", active:true },
  { id:"b77", ref:"Mateus 7:12",    text:"Antes de agir sobre a existência de outro homem, considerai aquilo que desejaríeis receber se ocupásseis o seu lugar, pois a justiça começa quando reconheceis no outro uma existência tão digna quanto a vossa.", context:"A consciência do outro", tags:"regra de ouro,justiça,empatia,dignidade", active:true },
  { id:"b78", ref:"Mateus 7:13",    text:"Não confundais a facilidade de um caminho com a verdade de sua direção, pois muitos escolhem aquilo que exige menos transformação, ainda que os conduza à própria destruição.", context:"O caminho da facilidade", tags:"caminho,facilidade,destruição,escolha", active:true },
  { id:"b79", ref:"Mateus 7:14",    text:"O caminho que conduz à vida exige que abandoneis aquilo que não pode atravessá-lo convosco, e poucos estão dispostos a renunciar ao que os impede de avançar.", context:"O caminho da transformação", tags:"vida,renúncia,transformação,caminho estreito", active:true },
  { id:"b80", ref:"Mateus 7:15",    text:"Guardai-vos daqueles que aprenderam a reproduzir a aparência da bondade sem permitir que ela transforme sua natureza, pois nem toda voz que pronuncia a verdade serve à verdade.", context:"A manipulação espiritual", tags:"falsos profetas,aparência,manipulação,discernimento", active:true },
  { id:"b81", ref:"Mateus 7:16",    text:"Não procureis conhecer a verdadeira natureza de um homem somente por aquilo que ele declara ser, mas observai aquilo que sua existência produz na vida dos outros.", context:"A evidência da natureza", tags:"frutos,natureza,obras,discernimento", active:true },
  { id:"b82", ref:"Mateus 7:17–18", text:"Aquilo que um homem produz continuamente revela aquilo que cultiva em seu interior, pois não se transforma verdadeiramente o fruto sem transformar a raiz que o sustenta.", context:"A origem das ações", tags:"frutos,raiz,interior,transformação", active:true },
  { id:"b83", ref:"Mateus 7:19",    text:"Aquilo que permanece separado de seu verdadeiro propósito caminha para a perda, pois não basta existir quando se recusa continuamente a produzir aquilo para o qual se foi chamado.", context:"A consequência da esterilidade", tags:"propósito,frutos,esterilidade,chamado", active:true },
  { id:"b84", ref:"Mateus 7:20",    text:"Quando as palavras de um homem vos confundirem, observai os frutos de suas escolhas, pois suas obras revelarão aquilo que suas palavras podem esconder.", context:"A verdade observável", tags:"frutos,obras,palavras,verdade", active:true },
  { id:"b85", ref:"Mateus 7:21",    text:"Não é o reconhecimento verbal de minha autoridade que vos introduz no Reino, mas a disposição de permitir que a vontade do Pai governe verdadeiramente vossa existência.", context:"A diferença entre religião e obediência", tags:"obediência,reino,vontade,religião", active:true },
  { id:"b86", ref:"Mateus 7:22",    text:"Muitos apresentarão suas grandes obras como prova de proximidade comigo, sem compreender que a manifestação de poder não constitui, por si mesma, evidência de transformação espiritual.", context:"O engano do poder espiritual", tags:"poder,engano,transformação,obras", active:true },
  { id:"b87", ref:"Mateus 7:23",    text:"Não confundais aquilo que realizastes em meu nome com aquilo que permitistes que eu transformasse em vós, pois utilizar meu nome não significa necessariamente conhecer minha natureza.", context:"A ausência de relacionamento", tags:"relacionamento,conhecimento,nome,transformação", active:true },
  { id:"b88", ref:"Mateus 7:24",    text:"Aquele que transforma o conhecimento em prática estabelece sua existência sobre fundamentos que não dependem da estabilidade das circunstâncias.", context:"A construção sobre fundamentos", tags:"fundamento,prática,conhecimento,estabilidade", active:true },
  { id:"b89", ref:"Mateus 7:25",    text:"As tempestades revelarão a profundidade dos fundamentos sobre os quais construístes vossa vida, pois aquilo que foi estabelecido na verdade não necessita da ausência de dificuldades para permanecer.", context:"A resistência às adversidades", tags:"fundamento,tempestade,adversidade,verdade", active:true },
  { id:"b90", ref:"Mateus 7:26",    text:"Aquele que acumula ensinamentos sem permitir que eles governem suas escolhas constrói uma aparência de sabedoria sobre fundamentos frágeis.", context:"O conhecimento sem transformação", tags:"sabedoria,aparência,fundamento,escolhas", active:true },
  { id:"b91", ref:"Mateus 7:27",    text:"Quando as circunstâncias retirarem aquilo que sustentava sua falsa segurança, ficará evidente que sua construção possuía forma, mas não profundidade; aparência, mas não fundamento.", context:"O colapso da aparência", tags:"aparência,colapso,fundamento,segurança falsa", active:true },
  // Mateus 8
  { id:"b92",  ref:"Mateus 8:3",     text:"Quero que sejas restaurado, pois aquilo que levou os homens a rejeitarem tua presença não diminuiu teu valor diante do Pai.", context:"A vontade de restaurar", tags:"restauração,valor,rejeição,misericórdia", active:true },
  { id:"b93",  ref:"Mateus 8:4",     text:"Não transformes tua restauração em espetáculo. Cumpre aquilo que foi estabelecido e permite que tua própria transformação testemunhe aquilo que recebeste.", context:"A transformação silenciosa", tags:"transformação,humildade,silêncio,testemunho", active:true },
  { id:"b94",  ref:"Mateus 8:7",     text:"Irei ao encontro daquele que necessita, pois a autoridade que me foi concedida não existe para me colocar acima dos homens, mas para manifestar entre eles a misericórdia do Pai.", context:"A disposição para servir", tags:"serviço,autoridade,misericórdia,humildade", active:true },
  { id:"b95",  ref:"Mateus 8:10",    text:"Há entre aqueles que desconhecem nossas tradições uma confiança que ainda não encontrei entre muitos daqueles que dedicaram suas vidas a conhecê-las.", context:"A profundidade da fé", tags:"fé,confiança,tradição,surpresa", active:true },
  { id:"b96",  ref:"Mateus 8:11",    text:"Virão homens de lugares que jamais imaginastes e participarão daquilo que julgáveis pertencer exclusivamente a vós, pois o Reino do Pai não está limitado pelas fronteiras estabelecidas pelos homens.", context:"O Reino além das fronteiras", tags:"reino,fronteiras,inclusão,universalidade", active:true },
  { id:"b97",  ref:"Mateus 8:12",    text:"Aqueles que acreditam possuir o Reino por direito de nascimento poderão descobrir que jamais permitiram que sua verdade habitasse neles.", context:"O engano do pertencimento", tags:"pertencimento,engano,direito,interioridade", active:true },
  { id:"b98",  ref:"Mateus 8:13",    text:"Retorna em paz, pois aquilo que reconheceste pela fé não necessita estar diante de teus olhos para que o poder do Pai se manifeste.", context:"A confiança na autoridade divina", tags:"fé,distância,autoridade,confiança", active:true },
  { id:"b99",  ref:"Mateus 8:20",    text:"Até as criaturas da terra possuem lugares onde repousar, mas aquele que entrega sua existência a uma missão maior nem sempre encontrará no mundo um lugar que possa chamar de seu.", context:"O desapego e a missão", tags:"desapego,missão,repouso,pertencimento", active:true },
  { id:"b100", ref:"Mateus 8:22",    text:"Segue-me, pois não permitas que aquilo que já pertence à morte te impeça de responder ao chamado da vida.", context:"A prioridade da vida espiritual", tags:"chamado,vida,morte,prioridade", active:true },
  { id:"b101", ref:"Mateus 8:26",    text:"Por que entregais ao temor o governo de vosso interior? Ainda não compreendestes que a presença do Pai não desaparece quando as circunstâncias deixam de obedecer à vossa vontade?", context:"O governo do medo", tags:"medo,fé,tempestade,presença divina", active:true },
  { id:"b102", ref:"Mateus 8:32",    text:"Ide, pois não vos pertence governar indefinidamente aquilo que está sob a autoridade do Pai.", context:"A autoridade sobre os espíritos", tags:"autoridade,espíritos,libertação,domínio", active:true },
  // Mateus 9
  { id:"b103", ref:"Mateus 9:2",     text:"Tem coragem, filho. Não permitas que aquilo que pertence ao teu passado determine eternamente aquilo que poderás ser diante do Pai. Teus pecados estão perdoados.", context:"A libertação da culpa", tags:"perdão,culpa,passado,coragem", active:true },
  { id:"b104", ref:"Mateus 9:4",     text:"Por que alimentais em vosso interior pensamentos que não teríeis coragem de revelar diante daqueles que vos consideram justos?", context:"A origem oculta das intenções", tags:"intenção,coração,hipocrisia,pensamentos", active:true },
  { id:"b105", ref:"Mateus 9:5",     text:"Qual transformação considerais maior: aquela que permite ao corpo levantar-se ou aquela que liberta o homem daquilo que aprisionava sua alma?", context:"A dimensão invisível da restauração", tags:"restauração,alma,corpo,dimensão espiritual", active:true },
  { id:"b106", ref:"Mateus 9:6",     text:"Para que compreendais que a autoridade concedida pelo Pai alcança também aquilo que não podeis contemplar, levanta-te, recolhe aquilo sobre o qual permanecías deitado e retorna à tua casa.", context:"A autoridade para restaurar", tags:"autoridade,restauração,cura,demonstração", active:true },
  { id:"b107", ref:"Mateus 9:9",     text:"Segue-me, pois tua existência não precisa permanecer limitada à identidade que construíste até este momento.", context:"O chamado para uma nova existência", tags:"chamado,identidade,transformação,seguir", active:true },
  { id:"b108", ref:"Mateus 9:12",    text:"Aquele que reconhece sua enfermidade está mais próximo de buscar restauração do que aquele que, estando enfermo, permanece convencido de sua própria saúde.", context:"O reconhecimento da própria necessidade", tags:"necessidade,autoconsciência,saúde,restauração", active:true },
  { id:"b109", ref:"Mateus 9:13",    text:"Aprendei que o Pai não deseja sacrifícios que preservem a dureza de vosso coração. Vim ao encontro daqueles que necessitam de restauração, e não daqueles que se consideram superiores por acreditarem não necessitar dela.", context:"A misericórdia acima dos rituais", tags:"misericórdia,sacrifício,coração,superioridade", active:true },
  { id:"b110", ref:"Mateus 9:15",    text:"Há um tempo para a celebração e outro para a renúncia. Não transformeis a disciplina espiritual em uma obrigação incapaz de reconhecer aquilo que o momento verdadeiramente exige.", context:"O discernimento dos tempos", tags:"discernimento,tempo,celebração,renúncia", active:true },
  { id:"b111", ref:"Mateus 9:16",    text:"Não tenteis reparar uma existência antiga utilizando apenas fragmentos de uma nova compreensão, pois aquilo que necessita de transformação completa não será restaurado por mudanças superficiais.", context:"A incompatibilidade entre o antigo e o novo", tags:"transformação,renovação,superficialidade,mudança", active:true },
  { id:"b112", ref:"Mateus 9:17",    text:"Uma nova compreensão exige uma estrutura interior capaz de recebê-la. Se tentardes acomodar aquilo que é novo dentro de formas que se recusam a mudar, perdereis tanto o que recebesteis quanto aquilo que procuráveis preservar.", context:"A expansão da consciência", tags:"renovação,estrutura,consciência,abertura", active:true },
  { id:"b113", ref:"Mateus 9:22",    text:"Tem coragem, filha, pois tua confiança não passou despercebida diante do Pai, ainda que tua presença tenha passado despercebida diante dos homens.", context:"A fé além da aparência", tags:"fé,coragem,invisibilidade,reconhecimento divino", active:true },
  { id:"b114", ref:"Mateus 9:24",    text:"Afastai-vos, pois aquilo que julgais encerrado não está necessariamente encerrado diante daquele que possui autoridade sobre a vida.", context:"Os limites da percepção humana", tags:"percepção,morte,vida,autoridade", active:true },
  { id:"b115", ref:"Mateus 9:28",    text:"Antes que contempleis aquilo que desejais receber, sois capazes de confiar naquele a quem apresentais vossa necessidade?", context:"A confiança antes da manifestação", tags:"confiança,fé,manifestação,necessidade", active:true },
  { id:"b116", ref:"Mateus 9:29",    text:"Que vos seja concedido segundo a confiança que depositastes em mim.", context:"A resposta à fé", tags:"fé,confiança,graça,resposta", active:true },
  { id:"b117", ref:"Mateus 9:30",    text:"Não façais daquilo que vos foi concedido um espetáculo para satisfazer a curiosidade daqueles que ainda não compreendem sua origem.", context:"O silêncio após a transformação", tags:"humildade,silêncio,gratidão,espetáculo", active:true },
  { id:"b118", ref:"Mateus 9:37",    text:"Grande é o número daqueles que necessitam encontrar direção, mas poucos são aqueles dispostos a dedicar sua existência a conduzi-los.", context:"A escassez de pessoas dispostas", tags:"missão,colheita,vocação,escassez", active:true },
  { id:"b119", ref:"Mateus 9:38",    text:"Pedi ao Pai que desperte homens dispostos a trabalhar por aquilo que não pertence exclusivamente a eles, mas à realização de um propósito maior.", context:"O chamado para a missão", tags:"oração,missão,propósito,vocação", active:true },
  // Mateus 10
  { id:"b120", ref:"Mateus 10:5–6",  text:"Não procureis alcançar todos os lugares antes de compreenderdes onde começa vossa responsabilidade. Ide primeiro ao encontro daqueles que, pertencendo à casa de Israel, perderam a direção.", context:"O direcionamento da missão", tags:"missão,responsabilidade,direção,prioridade", active:true },
  { id:"b121", ref:"Mateus 10:7",    text:"Anunciai que o governo do Pai se aproximou dos homens e que já não devem viver como se sua existência estivesse separada de sua autoridade.", context:"A proximidade do Reino", tags:"reino,proximidade,anúncio,autoridade", active:true },
  { id:"b122", ref:"Mateus 10:8",    text:"Restaurai os enfermos, levantai os mortos, purificai os rejeitados e libertai os oprimidos. Não transformeis em instrumento de enriquecimento aquilo que vos foi concedido gratuitamente.", context:"O poder não é propriedade humana", tags:"gratidão,dom,serviço,enriquecimento", active:true },
  { id:"b123", ref:"Mateus 10:9–10", text:"Não façais da acumulação de recursos uma condição para obedecer ao chamado. Aquele que trabalha dignamente também é digno de receber aquilo que sustenta sua existência.", context:"A confiança durante a missão", tags:"confiança,provisão,missão,dignidade", active:true },
  { id:"b124", ref:"Mateus 10:11",   text:"Ao chegardes a um lugar desconhecido, procurai aqueles cuja disposição interior seja compatível com aquilo que carregais e permanecei entre eles enquanto ali estiverdes.", context:"O discernimento das conexões", tags:"discernimento,hospitalidade,conexão,missão", active:true },
  { id:"b125", ref:"Mateus 10:12–13",text:"Oferecei paz àqueles que vos recebem. Se houver espaço para ela, ali permanecerá; caso contrário, não permitais que a ausência de paz dos outros destrua aquela que existe em vós.", context:"A reciprocidade da paz", tags:"paz,reciprocidade,proteção interior,missão", active:true },
  { id:"b126", ref:"Mateus 10:14",   text:"Quando não houver disposição para receber aquilo que anunciais, prossegui. Não carregueis convosco o peso da rejeição daqueles que escolheram não vos ouvir.", context:"A liberdade diante da rejeição", tags:"rejeição,liberdade,prosseguir,desapego", active:true },
  { id:"b127", ref:"Mateus 10:15",   text:"Maior será a responsabilidade daquele que teve oportunidade de conhecer a verdade e conscientemente a rejeitou.", context:"A responsabilidade diante da verdade", tags:"responsabilidade,verdade,rejeição,julgamento", active:true },
  { id:"b128", ref:"Mateus 10:16",   text:"Envio-vos a um mundo no qual nem todos possuem as mesmas intenções que vós. Desenvolvei inteligência suficiente para reconhecer o perigo, sem permitir que essa inteligência corrompa a pureza de vosso coração.", context:"A inteligência espiritual", tags:"sabedoria,perigo,pureza,discernimento", active:true },
  { id:"b129", ref:"Mateus 10:17–18",text:"Não vos surpreendais quando aqueles que governam os homens tentarem silenciar aquilo que ameaça suas convicções, pois até diante das autoridades tereis oportunidade de testemunhar a verdade.", context:"O confronto com as estruturas de poder", tags:"perseguição,autoridade,testemunho,coragem", active:true },
  { id:"b130", ref:"Mateus 10:19–20",text:"Quando chegar o momento de responderdes diante daqueles que vos acusam, não permitais que a ansiedade governe vossa fala, pois o Espírito do Pai poderá manifestar por meio de vós aquilo que vossa própria compreensão não alcança.", context:"A inspiração divina", tags:"Espírito Santo,ansiedade,testemunho,inspiração", active:true },
  { id:"b131", ref:"Mateus 10:21",   text:"Haverá aqueles que, para preservar suas próprias convicções, estarão dispostos a destruir até mesmo os vínculos que deveriam proteger.", context:"A ruptura dos vínculos", tags:"perseguição,vínculos,família,convicção", active:true },
  { id:"b132", ref:"Mateus 10:22",   text:"Não permitais que a rejeição dos homens vos faça abandonar aquilo que reconhecestes como verdadeiro. Aquele que permanecer fiel até o fim encontrará a salvação.", context:"A resistência espiritual", tags:"perseverança,salvação,fidelidade,rejeição", active:true },
  { id:"b133", ref:"Mateus 10:23",   text:"Quando um lugar se tornar instrumento de perseguição, prossegui para outro. Não confundais fidelidade ao propósito com a obrigação de permanecer onde vossa missão está sendo impedida.", context:"O discernimento das batalhas", tags:"discernimento,perseguição,missão,prudência", active:true },
  { id:"b134", ref:"Mateus 10:24–25",text:"Não espereis receber do mundo um tratamento superior àquele que foi concedido ao vosso mestre. Se condenam aquele de quem procede o ensinamento, também poderão condenar aqueles que o carregam.", context:"O preço de seguir a verdade", tags:"sofrimento,identificação,mestre,perseguição", active:true },
  { id:"b135", ref:"Mateus 10:26",   text:"Não temais aqueles que utilizam o segredo para preservar sua autoridade, pois aquilo que permanece oculto aos olhos dos homens não está oculto diante do Pai e chegará o tempo de sua revelação.", context:"A revelação do oculto", tags:"segredo,revelação,autoridade,verdade", active:true },
  { id:"b136", ref:"Mateus 10:27",   text:"Aquilo que vos ensino no silêncio não vos foi entregue para permanecer eternamente escondido. Tornai conhecido aquilo que recebesteis quando chegar o momento de anunciá-lo.", context:"A responsabilidade do conhecimento", tags:"conhecimento,anúncio,responsabilidade,proclamação", active:true },
  { id:"b137", ref:"Mateus 10:28",   text:"Não entregueis vosso espírito ao medo daqueles cuja autoridade termina nos limites do corpo. Reconhecei a grandeza daquele cuja autoridade alcança a totalidade de vossa existência.", context:"A existência além do corpo", tags:"temor,alma,corpo,autoridade divina", active:true },
  { id:"b138", ref:"Mateus 10:29–31",text:"Nada daquilo que o Pai criou é completamente insignificante diante dele. Até os menores detalhes de vossa existência lhe são conhecidos. Não permitais que a indiferença dos homens vos convença de que não possuís valor.", context:"O valor da existência individual", tags:"valor,providência,onisciência,identidade", active:true },
  { id:"b139", ref:"Mateus 10:32–33",text:"Aquele que permanece fiel a mim diante dos homens será reconhecido diante do Pai; mas aquele que me abandona para preservar a aprovação do mundo revela aquilo a que verdadeiramente entregou sua fidelidade.", context:"A coerência diante do mundo", tags:"fidelidade,aprovação,confissão,coerência", active:true },
  { id:"b140", ref:"Mateus 10:34",   text:"Não imagineis que a verdade produzirá imediatamente harmonia entre os homens. Antes de estabelecer a verdadeira paz, ela poderá romper os acordos construídos sobre aquilo que não é verdadeiro.", context:"O conflito provocado pela verdade", tags:"verdade,conflito,paz,ruptura", active:true },
  { id:"b141", ref:"Mateus 10:35–36",text:"A transformação de um homem poderá despertar resistência até mesmo entre aqueles que compartilham sua própria origem, pois nem todos aceitarão aquilo que modifica a ordem à qual estavam acostumados.", context:"O conflito dentro da própria casa", tags:"transformação,família,resistência,conflito", active:true },
  { id:"b142", ref:"Mateus 10:37",   text:"Amai aqueles que fazem parte de vossa existência, mas não coloqueis nenhum vínculo humano acima de vossa fidelidade a mim, pois até o amor pode tornar-se desordenado quando ocupa o lugar que pertence ao Pai.", context:"A hierarquia dos afetos", tags:"amor,fidelidade,hierarquia,vínculos", active:true },
  { id:"b143", ref:"Mateus 10:38",   text:"Aquele que deseja seguir-me, mas se recusa a carregar o custo de sua própria transformação, ainda não compreendeu a profundidade do caminho que escolheu.", context:"O peso da transformação", tags:"cruz,transformação,custo,seguir", active:true },
  { id:"b144", ref:"Mateus 10:39",   text:"Aquele que dedica toda a sua existência a preservar a si mesmo poderá perder aquilo que dá verdadeiro sentido à vida; mas aquele que entrega sua existência por minha causa encontrará uma vida que ultrapassa aquilo que tentou conservar.", context:"O paradoxo da existência", tags:"paradoxo,perda,vida,entrega", active:true },
  { id:"b145", ref:"Mateus 10:40",   text:"Aquele que vos recebe por causa daquilo que anunciais recebe também a mim, e aquele que me recebe aproxima-se daquele de quem procede minha missão.", context:"A representação da autoridade divina", tags:"representação,missão,autoridade,identidade", active:true },
  { id:"b146", ref:"Mateus 10:41",   text:"Aquele que reconhece e sustenta a missão de um homem justo participa também daquilo que sua justiça produz, ainda que não desempenhe a mesma função.", context:"O reconhecimento do propósito alheio", tags:"reconhecimento,missão,participação,justiça", active:true },
  { id:"b147", ref:"Mateus 10:42",   text:"Não considereis insignificante nenhum gesto de verdadeira bondade, pois até aquilo que parece pequeno diante dos homens possui valor diante do Pai quando procede de uma intenção sincera.", context:"A grandeza dos pequenos atos", tags:"bondade,pequenos atos,intenção,valor", active:true },
  // Mateus 11
  { id:"b148", ref:"Mateus 11:4–5",  text:"Retornai e anunciai aquilo que vossos próprios olhos e ouvidos testemunharam: aqueles que não podiam ver recuperam a visão, os que não podiam caminhar levantam-se, os rejeitados são restaurados, os mortos recebem vida e aos pobres é anunciada a esperança. Reconhecei a obra do Pai por aquilo que ela transforma.", context:"A verdade demonstrada pela transformação", tags:"evidência,transformação,obras,esperança", active:true },
  { id:"b149", ref:"Mateus 11:6",    text:"Bem-aventurado aquele que não abandona a verdade simplesmente porque ela se manifesta de maneira diferente daquela que esperava.", context:"A superação das expectativas humanas", tags:"expectativa,verdade,abertura,bem-aventurança", active:true },
  { id:"b150", ref:"Mateus 11:7",    text:"O que fostes procurar no deserto? Um homem cuja verdade se modifica conforme os ventos das opiniões humanas?", context:"A firmeza das convicções", tags:"firmeza,convicção,opinião,integridade", active:true },
  { id:"b151", ref:"Mateus 11:8",    text:"Fostes procurar alguém revestido de grandeza material? Aqueles que fazem do conforto sua condição de existência encontram-se nos palácios dos reis.", context:"A independência da riqueza", tags:"riqueza,conforto,grandeza,independência", active:true },
  { id:"b152", ref:"Mateus 11:9–10", text:"Fostes procurar um profeta? Encontrastes alguém cuja missão ultrapassava o anúncio daquilo que haveria de acontecer, pois lhe foi concedida a responsabilidade de preparar o caminho para sua manifestação.", context:"A preparação para a revelação", tags:"profecia,missão,preparação,revelação", active:true },
  { id:"b153", ref:"Mateus 11:11",   text:"Entre os nascidos de mulher, poucos receberam missão tão elevada quanto João. Contudo, a grandeza no Reino dos Céus não é medida pelos mesmos critérios que determinam a grandeza entre os homens.", context:"A grandeza no Reino", tags:"grandeza,reino,missão,critérios divinos", active:true },
  { id:"b154", ref:"Mateus 11:12",   text:"Desde os dias de João, a manifestação do Reino encontra resistência, e homens violentos procuram apoderar-se daquilo cuja autoridade não lhes pertence.", context:"O confronto entre o Reino e a violência", tags:"reino,violência,resistência,autoridade", active:true },
  { id:"b155", ref:"Mateus 11:13–14",text:"Aquilo que foi anunciado pela Lei e pelos profetas encontrou em João um momento de cumprimento. Se estiverdes dispostos a compreender, reconhecereis nele a missão de Elias que esperáveis.", context:"A continuidade do propósito divino", tags:"cumprimento,profecia,Lei,Elias", active:true },
  { id:"b156", ref:"Mateus 11:15",   text:"Aquele que possui capacidade para ouvir não se limite a receber o som das palavras, mas procure compreender aquilo que lhe está sendo revelado.", context:"A capacidade de compreender", tags:"ouvir,compreensão,revelação,atenção", active:true },
  { id:"b157", ref:"Mateus 11:16–17",text:"A que compararei esta geração? A crianças que desejam determinar a reação de todos ao seu redor e se indignam quando os outros não correspondem às suas expectativas.", context:"A insatisfação humana", tags:"insatisfação,expectativa,geração,imaturidade", active:true },
  { id:"b158", ref:"Mateus 11:18–19",text:"João renunciou aos prazeres e disseram que havia nele um espírito maligno. O Filho do Homem compartilhou a mesa com os homens e o acusaram de excessos. Assim, aquele que deseja condenar sempre encontrará uma justificativa. Contudo, a verdadeira sabedoria será reconhecida por aquilo que produz.", context:"A contradição dos julgamentos", tags:"julgamento,contradição,sabedoria,frutos", active:true },
  { id:"b159", ref:"Mateus 11:21",   text:"Ai daqueles que contemplaram manifestações extraordinárias do poder do Pai e, ainda assim, permaneceram presos à sua antiga maneira de viver. Outros, recebendo aquilo que recebestes, teriam reconhecido a necessidade de transformação.", context:"A responsabilidade diante da revelação", tags:"responsabilidade,revelação,transformação,arrependimento", active:true },
  { id:"b160", ref:"Mateus 11:22",   text:"No dia do julgamento, maior será a responsabilidade daquele que recebeu abundância de revelação e permaneceu indiferente do que daquele a quem pouco foi revelado.", context:"A proporcionalidade da responsabilidade", tags:"julgamento,responsabilidade,proporcionalidade,revelação", active:true },
  { id:"b161", ref:"Mateus 11:23–24",text:"Não imagineis que a proximidade com aquilo que é divino vos torna automaticamente elevados. Aquele que recebe grandes manifestações e permanece inalterado poderá encontrar-se em condição inferior àqueles que jamais receberam as mesmas oportunidades.", context:"A ilusão da superioridade", tags:"superioridade,ilusão,manifestação,condição", active:true },
  { id:"b162", ref:"Mateus 11:25",   text:"Eu te louvo, Pai, Senhor dos céus e da terra, porque aquilo que permanece incompreendido por muitos que se consideram sábios foi revelado àqueles que ainda conservam a disposição humilde de aprender.", context:"A revelação além do intelecto", tags:"humildade,sabedoria,revelação,intelectualismo", active:true },
  { id:"b163", ref:"Mateus 11:26",   text:"Assim foi, Pai, porque tua vontade não está subordinada aos critérios pelos quais os homens determinam quem é digno de compreender teus mistérios.", context:"A liberdade da vontade divina", tags:"vontade divina,mistério,dignidade,soberania", active:true },
  { id:"b164", ref:"Mateus 11:27",   text:"Tudo me foi confiado pelo Pai. Ninguém conhece plenamente a natureza do Filho senão o Pai, e ninguém conhece plenamente o Pai senão o Filho e aqueles a quem o Filho decide revelá-lo.", context:"O conhecimento do Pai", tags:"revelação,conhecimento,Filho,Pai", active:true },
  { id:"b165", ref:"Mateus 11:28",   text:"Vinde a mim, todos aqueles cuja existência se tornou pesada e cujas forças foram consumidas pelos fardos que carregam, e encontrareis em mim repouso.", context:"O descanso da existência", tags:"descanso,fardos,cansaço,repouso", active:true },
  { id:"b166", ref:"Mateus 11:29",   text:"Aceitai minha direção e aprendei comigo, pois minha autoridade não procede da arrogância nem da necessidade de dominar. Sou manso e humilde de coração, e sob meu ensinamento encontrareis descanso para vossa alma.", context:"A verdadeira natureza da autoridade", tags:"mansidão,humildade,autoridade,descanso", active:true },
  { id:"b167", ref:"Mateus 11:30",   text:"Aquilo que vos proponho não foi estabelecido para esmagar vossa existência. Minha direção é bondosa, e o fardo que vos confio não possui a natureza daqueles que vos oprimem.", context:"A liberdade dentro da obediência", tags:"obediência,liberdade,bondade,leveza", active:true },
  // Mateus 12
  { id:"b168", ref:"Mateus 12:3–4",  text:"Não compreendestes aquilo que fez Davi quando ele e seus companheiros tiveram fome? Até aquilo que havia sido reservado ao serviço sagrado foi utilizado diante da necessidade humana. Aprendei a discernir o propósito daquilo que vos foi ordenado.", context:"A finalidade das leis sagradas", tags:"Lei,propósito,necessidade,discernimento", active:true },
  { id:"b169", ref:"Mateus 12:5",    text:"Não percebeis que aqueles que servem no templo realizam, no dia do descanso, obras que em outras circunstâncias seriam consideradas transgressões, sem que por isso sejam culpados?", context:"A compreensão das aparentes contradições", tags:"sábado,templo,contradição,Lei", active:true },
  { id:"b170", ref:"Mateus 12:6",    text:"Digo-vos que está presente entre vós algo maior que o próprio templo, embora muitos estejam tão ocupados em proteger sua estrutura que não reconheçam aquilo para o qual ela existe.", context:"A grandeza além das estruturas religiosas", tags:"templo,grandeza,religiosidade,reconhecimento", active:true },
  { id:"b171", ref:"Mateus 12:7",    text:"Se tivésseis compreendido que o Pai deseja misericórdia e não meramente sacrifícios, não utilizaríeis aquilo que é sagrado para condenar aqueles que não possuem culpa.", context:"A misericórdia como princípio superior", tags:"misericórdia,sacrifício,condenação,Lei", active:true },
  { id:"b172", ref:"Mateus 12:8",    text:"O Filho do Homem possui autoridade sobre o sábado, pois compreende plenamente o propósito daquilo que foi estabelecido.", context:"A autoridade sobre o sábado", tags:"sábado,autoridade,propósito,Lei", active:true },
  { id:"b173", ref:"Mateus 12:11–12",text:"Qual de vós deixaria sua própria ovelha perecer por ser dia de descanso? Se sois capazes de reconhecer a necessidade de preservar a vida de um animal, por que utilizais a Lei para impedir a restauração de um homem? É legítimo praticar o bem também no dia sagrado.", context:"O valor da existência humana", tags:"valor humano,Lei,bem,sábado", active:true },
  { id:"b174", ref:"Mateus 12:13",   text:"Estende tua mão, pois aquilo que se encontra impossibilitado diante dos homens não está necessariamente impossibilitado diante do Pai.", context:"A restauração", tags:"restauração,impossível,fé,cura", active:true },
  { id:"b175", ref:"Mateus 12:25",   text:"Todo reino que desenvolve forças contrárias dentro de si caminha para sua própria destruição. Nenhuma cidade, nenhuma casa e nenhuma estrutura permanece firme quando seus próprios fundamentos lutam uns contra os outros.", context:"A destruição pela divisão interna", tags:"divisão,destruição,unidade,conflito interno", active:true },
  { id:"b176", ref:"Mateus 12:26",   text:"Se aquele que promove a destruição começa a destruir sua própria autoridade, contra si mesmo está lutando. Como poderia permanecer estabelecido um reino que trabalha contra sua própria existência?", context:"A contradição das forças espirituais", tags:"contradição,destruição,autoridade,incoerência", active:true },
  { id:"b177", ref:"Mateus 12:27",   text:"Se atribuís minhas obras ao poder maligno, por qual princípio julgareis aqueles dentre vós que realizam obras semelhantes? Vossos próprios critérios revelarão a incoerência de vosso julgamento.", context:"A incoerência dos critérios humanos", tags:"julgamento,incoerência,critério,farisaísmo", active:true },
  { id:"b178", ref:"Mateus 12:28",   text:"Se é pelo Espírito de Deus que aquilo que aprisiona os homens perde sua autoridade, então compreendei que o Reino do Pai já alcançou vossa realidade.", context:"A manifestação do Reino", tags:"Espírito Santo,reino,libertação,manifestação", active:true },
  { id:"b179", ref:"Mateus 12:29",   text:"Como poderá alguém libertar aquilo que está sob o domínio de um homem forte sem primeiro vencer a autoridade que o mantém aprisionado? É necessário confrontar aquilo que governa antes de recuperar aquilo que foi tomado.", context:"A origem do domínio", tags:"domínio,libertação,autoridade,confronto", active:true },
  { id:"b180", ref:"Mateus 12:30",   text:"Aquele que não coopera comigo trabalha em direção contrária à minha missão, pois aquele que se recusa a reunir aquilo que está disperso contribui para sua dispersão.", context:"A impossibilidade da neutralidade", tags:"neutralidade,missão,cooperação,dispersão", active:true },
  { id:"b181", ref:"Mateus 12:31–32",text:"As transgressões dos homens poderão encontrar perdão, assim como as palavras pronunciadas contra o Filho do Homem. Contudo, aquele que blasfema contra o Espírito Santo rejeita aquilo cuja natureza é divina, e para essa transgressão não encontrará perdão, nem neste tempo nem no que há de vir.", context:"A rejeição consciente do Espírito", tags:"blasfêmia,Espírito Santo,perdão,rejeição", active:true },
  { id:"b182", ref:"Mateus 12:33",   text:"Não procureis separar aquilo que uma árvore produz da natureza que a sustenta. Se sua raiz é saudável, seus frutos revelarão essa condição; se está corrompida, também seus frutos manifestarão aquilo que permanece oculto.", context:"A natureza revelada pelos resultados", tags:"frutos,natureza,raiz,evidência", active:true },
  { id:"b183", ref:"Mateus 12:34",   text:"Como poderia aquele que alimenta a corrupção em seu interior produzir continuamente palavras de verdadeira bondade? Pois a boca manifesta aquilo que transborda do coração.", context:"A palavra como manifestação interior", tags:"coração,palavras,manifestação,interior", active:true },
  { id:"b184", ref:"Mateus 12:35",   text:"O homem exterioriza aquilo que cultivou e acumulou em seu interior. Aquele que guarda o bem encontra dentro de si recursos para produzir o bem; aquele que alimenta o mal manifesta aquilo que escolheu conservar.", context:"O conteúdo acumulado na alma", tags:"interior,alma,acumulação,manifestação", active:true },
  { id:"b185", ref:"Mateus 12:36",   text:"Não considereis insignificante aquilo que pronunciais sem reflexão, pois até as palavras inúteis serão examinadas no dia em que os homens responderem por suas obras.", context:"A responsabilidade das palavras", tags:"palavras,responsabilidade,julgamento,reflexão", active:true },
  { id:"b186", ref:"Mateus 12:37",   text:"Vossas próprias palavras servirão de testemunho a vosso respeito, pois por elas podereis ser reconhecidos como justos ou considerados culpados.", context:"A palavra como testemunho", tags:"palavras,testemunho,justiça,culpa", active:true },
  { id:"b187", ref:"Mateus 12:39",   text:"Uma geração infiel exige continuamente manifestações extraordinárias, mas nenhum sinal lhe será concedido além daquele representado pelo profeta Jonas.", context:"A dependência de manifestações extraordinárias", tags:"sinais,incredulidade,Jonas,geração", active:true },
  { id:"b188", ref:"Mateus 12:40",   text:"Assim como Jonas permaneceu três dias e três noites nas profundezas antes de retornar, também o Filho do Homem permanecerá no coração da terra antes de sua manifestação.", context:"O mistério da morte e do retorno", tags:"morte,ressurreição,Jonas,mistério", active:true },
  { id:"b189", ref:"Mateus 12:41",   text:"Aqueles que reconheceram sua necessidade de transformação ao ouvir Jonas testemunharão contra esta geração, pois está diante de vós alguém maior que Jonas, e ainda assim resistis ao seu ensinamento.", context:"A transformação diante da verdade", tags:"arrependimento,resistência,Jonas,responsabilidade", active:true },
  { id:"b190", ref:"Mateus 12:42",   text:"Aquela que atravessou grandes distâncias para encontrar a sabedoria de Salomão testemunhará contra aqueles que, tendo diante de si uma sabedoria maior, não demonstraram disposição para reconhecê-la.", context:"A busca pela sabedoria", tags:"sabedoria,busca,reconhecimento,Salomão", active:true },
  { id:"b191", ref:"Mateus 12:43",   text:"Quando um espírito impuro abandona um homem, percorre lugares desprovidos de repouso, procurando onde estabelecer novamente sua presença, sem encontrar descanso.", context:"A inquietação do espírito impuro", tags:"espírito impuro,inquietação,repouso,libertação", active:true },
  { id:"b192", ref:"Mateus 12:44",   text:"Então decide retornar à existência que anteriormente ocupava e, encontrando-a desocupada, limpa e organizada, percebe que aquilo que perdeu ainda não foi substituído por uma nova presença.", context:"O perigo do vazio interior", tags:"vazio,interior,espírito,perigo", active:true },
  { id:"b193", ref:"Mateus 12:45",   text:"Retorna acompanhado de forças ainda mais destrutivas, e a condição daquele homem torna-se pior que a primeira. Assim acontecerá também com esta geração, pois remover aquilo que corrompe não é o mesmo que estabelecer aquilo que restaura.", context:"A necessidade de transformação permanente", tags:"transformação,restauração,vazio,espírito", active:true },
  { id:"b194", ref:"Mateus 12:48",   text:"Quem verdadeiramente pertence à minha família? Serão apenas aqueles cuja existência está ligada à minha pelos vínculos do nascimento?", context:"A natureza do pertencimento", tags:"família,pertencimento,vínculos,espiritualidade", active:true },
  { id:"b195", ref:"Mateus 12:49–50",text:"Contemplai aqueles que recebem meu ensinamento. Todo aquele que permite que a vontade de meu Pai governe sua existência torna-se meu irmão, minha irmã e minha mãe. Pois existe um pertencimento que ultrapassa os vínculos estabelecidos pela carne.", context:"O parentesco espiritual", tags:"família espiritual,vontade do Pai,pertencimento,vínculos", active:true },
  // Mateus 13
  { id:"b196", ref:"Mateus 13:3–4",  text:"Um semeador saiu para distribuir suas sementes. Algumas encontraram uma superfície incapaz de recebê-las e permaneceram expostas, até que vieram as aves e as retiraram.", context:"A semente e a receptividade", tags:"semeador,receptividade,coração,parábola", active:true },
  { id:"b197", ref:"Mateus 13:5–6",  text:"Outras encontraram uma terra superficial e cresceram rapidamente, mas, por não possuírem profundidade suficiente para estabelecer suas raízes, não resistiram quando foram expostas ao calor.", context:"O conhecimento sem profundidade", tags:"profundidade,raízes,superficialidade,perseverança", active:true },
  { id:"b198", ref:"Mateus 13:7",    text:"Outras sementes cresceram entre espinhos, mas aquilo que já ocupava o terreno desenvolveu-se juntamente com elas e impediu que alcançassem sua plenitude.", context:"A competição interior", tags:"espinhos,preocupações,riqueza,sufocamento", active:true },
  { id:"b199", ref:"Mateus 13:8",    text:"Outras encontraram uma terra preparada para recebê-las e produziram muito além daquilo que inicialmente lhes foi entregue: umas cem vezes, outras sessenta e outras trinta.", context:"A multiplicação do potencial", tags:"frutos,multiplicação,boa terra,potencial", active:true },
  { id:"b200", ref:"Mateus 13:9",    text:"Aquele que possui ouvidos para ouvir procure compreender aquilo que se encontra além da superfície destas palavras.", context:"A compreensão além da aparência", tags:"ouvir,compreensão,profundidade,parábola", active:true },
  { id:"b201", ref:"Mateus 13:11",   text:"A vós foi concedido conhecer aquilo que permanecia oculto acerca do Reino dos Céus, enquanto outros ainda não receberam essa compreensão.", context:"Os mistérios divinos", tags:"mistério,reino,revelação,discípulos", active:true },
  { id:"b202", ref:"Mateus 13:12",   text:"Aquele que possui compreensão e acolhe aquilo que lhe é revelado receberá ainda mais, até possuir em abundância. Mas aquele que permanece sem acolher a verdade poderá perder até mesmo aquilo que acredita compreender.", context:"A expansão daquilo que se recebe", tags:"abundância,compreensão,perda,revelação", active:true },
  { id:"b203", ref:"Mateus 13:13",   text:"Por isso lhes falo por meio de parábolas, pois seus olhos contemplam os acontecimentos sem reconhecer seu significado, e seus ouvidos recebem as palavras sem alcançar sua compreensão.", context:"A diferença entre observar e compreender", tags:"parábola,compreensão,percepção,cegueira", active:true },
  { id:"b204", ref:"Mateus 13:14–15",text:"Ouvireis continuamente sem compreender e contemplareis sem verdadeiramente perceber, pois o coração deste povo tornou-se insensível. Fecharam-se àquilo que poderia transformar sua existência, para que não compreendessem, não retornassem ao Pai e não fossem restaurados.", context:"O fechamento da consciência", tags:"insensibilidade,coração,fechamento,restauração", active:true },
  { id:"b205", ref:"Mateus 13:16–17",text:"Bem-aventurados vossos olhos e ouvidos, porque vos foi concedido testemunhar aquilo que muitos profetas e homens justos desejaram conhecer durante suas vidas, mas não chegaram a contemplar.", context:"O privilégio da revelação", tags:"privilégio,revelação,profetas,bem-aventurança", active:true },
  { id:"b206", ref:"Mateus 13:18–19",text:"Compreendei o significado da semente. Quando alguém recebe a palavra do Reino sem alcançar sua compreensão, aquilo que lhe foi entregue permanece vulnerável, e o maligno retira o que havia sido semeado em seu coração.", context:"A perda do conhecimento", tags:"palavra,compreensão,vulnerabilidade,maligno", active:true },
  { id:"b207", ref:"Mateus 13:20–21",text:"Há aquele que recebe a verdade com alegria imediata, mas não permite que ela estabeleça raízes profundas em sua existência. Quando surgem dificuldades por causa daquilo em que acreditou, abandona rapidamente sua convicção.", context:"O entusiasmo sem fundamento", tags:"entusiasmo,raízes,perseverança,tribulação", active:true },
  { id:"b208", ref:"Mateus 13:22",   text:"Há aquele que recebe a palavra, mas permite que as preocupações da existência e as promessas enganosas da riqueza ocupem tanto espaço em seu interior que aquilo que recebeu permanece incapaz de produzir frutos.", context:"A sufocação do propósito", tags:"preocupações,riqueza,sufocamento,frutos", active:true },
  { id:"b209", ref:"Mateus 13:23",   text:"Aquele que recebe a palavra, compreende sua natureza e permite que ela transforme sua existência torna-se capaz de produzir muito além daquilo que inicialmente recebeu.", context:"A transformação do conhecimento em resultados", tags:"compreensão,transformação,frutos,multiplicação", active:true },
  { id:"b210", ref:"Mateus 13:24–25",text:"O Reino dos Céus pode ser comparado a um homem que estabeleceu boas sementes em seu campo. Contudo, enquanto os homens repousavam, veio aquele que lhe era contrário e introduziu entre elas sementes de outra natureza.", context:"A coexistência do bem e do mal", tags:"joio,trigo,coexistência,maligno", active:true },
  { id:"b211", ref:"Mateus 13:26–28",text:"Quando aquilo que havia sido semeado começou a crescer e produzir frutos, tornou-se possível reconhecer que nem tudo possuía a mesma origem. Então compreenderam que uma influência contrária havia atuado naquele campo.", context:"A revelação progressiva da natureza", tags:"revelação,natureza,frutos,discernimento", active:true },
  { id:"b212", ref:"Mateus 13:29–30",text:"Não vos precipiteis em destruir aquilo que reconheceis como indesejável, pois, ao arrancá-lo antes do tempo, podereis destruir juntamente aquilo que é bom. Permiti que ambos revelem plenamente sua natureza até que chegue o momento da separação.", context:"O discernimento antes do julgamento", tags:"discernimento,precipitação,julgamento,separação", active:true },
  { id:"b213", ref:"Mateus 13:31–32",text:"O Reino dos Céus assemelha-se a uma pequena semente cujo tamanho inicial não revela a grandeza daquilo em que poderá transformar-se. Quando desenvolve plenamente sua natureza, torna-se suficientemente grande para oferecer abrigo a outras criaturas.", context:"A expansão do que começa pequeno", tags:"semente de mostarda,crescimento,reino,potencial", active:true },
  { id:"b214", ref:"Mateus 13:33",   text:"O Reino dos Céus assemelha-se àquilo que, introduzido silenciosamente em uma grande quantidade de matéria, transforma progressivamente toda a sua estrutura, embora sua atuação inicialmente permaneça invisível.", context:"A transformação invisível", tags:"fermento,transformação,invisível,progressivo", active:true },
  { id:"b215", ref:"Mateus 13:37–39",text:"Aquele que estabelece a boa semente é o Filho do Homem. O campo é o mundo, e nele crescem tanto aqueles que pertencem ao Reino quanto aqueles que se entregaram à influência do maligno. A separação acontecerá no cumprimento deste tempo, e os mensageiros do Pai realizarão essa obra.", context:"A origem das influências espirituais", tags:"semeador,mundo,separação,anjos", active:true },
  { id:"b216", ref:"Mateus 13:40–42",text:"Assim como aquilo que prejudica a colheita é separado no momento determinado, também o Filho do Homem enviará seus mensageiros para retirar de seu Reino aquilo que promove a corrupção e aqueles que persistem na injustiça. Então enfrentarão as consequências de sua condição.", context:"A separação final", tags:"colheita,separação,julgamento,consequências", active:true },
  { id:"b217", ref:"Mateus 13:43",   text:"Então aqueles que permaneceram na justiça manifestarão sua verdadeira natureza, brilhando como o sol no Reino de seu Pai. Aquele que pode compreender, compreenda.", context:"A manifestação da natureza justa", tags:"justiça,brilho,natureza,reino", active:true },
  { id:"b218", ref:"Mateus 13:44",   text:"O Reino dos Céus assemelha-se a um tesouro oculto que, ao ser descoberto, transforma completamente a percepção de valor daquele que o encontrou. Com alegria, ele renuncia ao que anteriormente possuía para alcançar aquilo que agora reconhece como superior.", context:"A descoberta do verdadeiro valor", tags:"tesouro,valor,renúncia,alegria", active:true },
  { id:"b219", ref:"Mateus 13:45–46",text:"O Reino assemelha-se a um homem que dedicou sua existência a procurar coisas preciosas, até encontrar algo cujo valor ultrapassava tudo o que anteriormente havia adquirido. Reconhecendo sua grandeza, entregou o restante para possuí-lo.", context:"A hierarquia das riquezas", tags:"pérola,valor,renúncia,busca", active:true },
  { id:"b220", ref:"Mateus 13:47–50",text:"O Reino assemelha-se a uma rede que recolhe diferentes espécies sem realizar imediatamente distinção entre elas. Somente quando chega o momento determinado aquilo que foi reunido é examinado e separado. Assim acontecerá no cumprimento deste tempo, quando os mensageiros distinguirão os justos daqueles que praticam a injustiça.", context:"A distinção entre reunir e selecionar", tags:"rede,separação,julgamento,justiça", active:true },
  { id:"b221", ref:"Mateus 13:51",   text:"Compreendestes verdadeiramente aquilo que vos revelei, ou apenas recebestes suas palavras?", context:"A verificação da compreensão", tags:"compreensão,revelação,questionamento,discípulos", active:true },
  { id:"b222", ref:"Mateus 13:52",   text:"Todo aquele que conhece as Escrituras e se torna discípulo do Reino assemelha-se a um homem que retira de seu tesouro tanto riquezas antigas quanto novas, pois a compreensão mais profunda não exige necessariamente abandonar aquilo que anteriormente recebeu, mas reconhecer sua relação com aquilo que agora lhe é revelado.", context:"A integração entre o antigo e o novo", tags:"antigo,novo,tesouro,integração", active:true },
  { id:"b223", ref:"Mateus 13:57",   text:"Um profeta poderá ser reconhecido em muitos lugares, exceto entre aqueles que acreditam conhecê-lo tão bem que já não conseguem perceber aquilo que Deus manifesta por meio dele.", context:"A cegueira produzida pela familiaridade", tags:"familiaridade,cegueira,profeta,reconhecimento", active:true },
  // Mateus 14
  { id:"b224", ref:"Mateus 14:16",   text:"Não é necessário que se afastem para encontrar aquilo de que necessitam. Assumi vós mesmos a responsabilidade de alimentá-los, em vez de transferirdes a outros aquilo que podeis realizar.", context:"A responsabilidade diante da necessidade", tags:"responsabilidade,necessidade,serviço,iniciativa", active:true },
  { id:"b225", ref:"Mateus 14:18",   text:"Trazei-me aquilo que possuís, ainda que vos pareça insuficiente diante da grandeza da necessidade.", context:"A multiplicação dos recursos", tags:"recursos,insuficiência,fé,multiplicação", active:true },
  { id:"b226", ref:"Mateus 14:27",   text:"Recobrai a coragem. Sou eu quem se aproxima de vós. Não permitais que o temor vos impeça de reconhecer minha presença em meio àquilo que não compreendeis.", context:"O reconhecimento da presença divina", tags:"presença,temor,coragem,reconhecimento", active:true },
  { id:"b227", ref:"Mateus 14:29",   text:"Vem. Não permaneças limitado à segurança daquilo que conheces quando te é concedida a oportunidade de confiar em mim.", context:"A coragem de responder ao chamado", tags:"confiança,segurança,chamado,coragem", active:true },
  { id:"b228", ref:"Mateus 14:31",   text:"Por que permitiste que a dúvida dividisse aquilo que inicialmente reconheceste pela fé? Por que entregaste às circunstâncias a confiança que havias depositado em mim?", context:"A divisão interior da fé", tags:"dúvida,fé,circunstâncias,confiança", active:true },
  // Mateus 15
  { id:"b229", ref:"Mateus 15:3",    text:"Por que transgredis aquilo que Deus estabeleceu para preservar aquilo que os próprios homens instituíram?", context:"A inversão das prioridades espirituais", tags:"tradição,mandamento,inversão,prioridades", active:true },
  { id:"b230", ref:"Mateus 15:4",    text:"O Pai estabeleceu que honrásseis aqueles por meio dos quais recebestes a vida e que não utilizásseis vossas palavras para desprezar sua existência.", context:"A responsabilidade para com os pais", tags:"honra,pais,família,mandamento", active:true },
  { id:"b231", ref:"Mateus 15:5–6",  text:"Entretanto, utilizais aquilo que declarais consagrado a Deus como justificativa para abandonar vossas responsabilidades humanas. Assim, preservais vossas tradições enquanto anulais o verdadeiro propósito da palavra divina.", context:"A religião utilizada como justificativa", tags:"religião,justificativa,tradição,responsabilidade", active:true },
  { id:"b232", ref:"Mateus 15:7–8",  text:"Bem descreveu o profeta a natureza daqueles que aprenderam a honrar Deus com os lábios, enquanto seus pensamentos, suas intenções e suas vontades permanecem distantes dele.", context:"A distância entre a palavra e o coração", tags:"hipocrisia,coração,lábios,distância", active:true },
  { id:"b233", ref:"Mateus 15:9",    text:"Inútil se torna a adoração quando os homens atribuem autoridade divina às regras que eles próprios estabeleceram.", context:"A substituição da verdade pela tradição", tags:"adoração,tradição,autoridade,inutilidade", active:true },
  { id:"b234", ref:"Mateus 15:10",   text:"Aproximai-vos, ouvi e procurai compreender, pois receber uma palavra não significa necessariamente reconhecer sua verdade.", context:"A necessidade de compreensão", tags:"ouvir,compreensão,verdade,palavra", active:true },
  { id:"b235", ref:"Mateus 15:11",   text:"Não é aquilo que entra pela boca que torna impuro o homem, mas aquilo que procede de seu interior e encontra expressão por meio de suas palavras e ações.", context:"A verdadeira origem da corrupção", tags:"pureza,interior,palavras,ações", active:true },
  { id:"b236", ref:"Mateus 15:13",   text:"Toda planta cuja origem não procede de meu Pai celestial será arrancada, pois nem tudo aquilo que os homens cultivam em nome de Deus foi estabelecido por Ele.", context:"Aquilo que não possui fundamento divino", tags:"fundamento,origem,falso,arrancado", active:true },
  { id:"b237", ref:"Mateus 15:14",   text:"Deixai-os. São homens incapazes de reconhecer sua própria cegueira, mas que assumiram a responsabilidade de conduzir outros. Quando aquele que não enxerga guia outro igualmente cego, ambos caminham para a mesma queda.", context:"A cegueira daqueles que conduzem", tags:"cegueira,liderança,queda,guia", active:true },
  { id:"b238", ref:"Mateus 15:16",   text:"Depois de tudo aquilo que vos foi revelado, ainda permaneceis incapazes de compreender sua natureza?", context:"O conhecimento ainda não assimilado", tags:"compreensão,revelação,incapacidade,discípulos", active:true },
  { id:"b239", ref:"Mateus 15:17",   text:"Não compreendeis que aquilo que o corpo recebe percorre sua estrutura física e posteriormente é eliminado?", context:"A distinção entre o corpo e o interior", tags:"corpo,pureza,físico,distinção", active:true },
  { id:"b240", ref:"Mateus 15:18",   text:"Aquilo que procede da boca possui origem no coração, e é essa origem interior que pode tornar impura a existência do homem.", context:"A manifestação da natureza interior", tags:"coração,boca,interior,impureza", active:true },
  { id:"b241", ref:"Mateus 15:19",   text:"É no interior do homem que se desenvolvem os pensamentos malignos, a violência, a infidelidade, a imoralidade, o desejo de apropriar-se do que pertence ao outro, a mentira e a difamação. Antes de encontrarem expressão nas ações, essas coisas encontram espaço na vontade.", context:"A origem das transgressões", tags:"coração,pensamentos,vontade,transgressão", active:true },
  { id:"b242", ref:"Mateus 15:20",   text:"São essas coisas que corrompem o homem. Não confundais a ausência de uma prática exterior de purificação com a corrupção de sua natureza interior.", context:"A diferença entre aparência e pureza", tags:"pureza,aparência,interior,corrupção", active:true },
  { id:"b243", ref:"Mateus 15:24",   text:"Minha missão foi inicialmente direcionada àqueles da casa de Israel que perderam o caminho, pois há uma ordem no cumprimento daquilo que o Pai estabeleceu.", context:"O direcionamento da missão", tags:"missão,ordem,Israel,propósito", active:true },
  { id:"b244", ref:"Mateus 15:26",   text:"Não é apropriado retirar dos filhos aquilo que lhes foi destinado para entregá-lo a outros antes que se cumpra o propósito para o qual foi concedido.", context:"A ordem do cumprimento", tags:"ordem,filhos,propósito,cumprimento", active:true },
  { id:"b245", ref:"Mateus 15:28",   text:"Mulher, grande é tua fé. Tua confiança demonstrou uma profundidade que ultrapassa as distinções estabelecidas entre os povos. Seja-te concedido aquilo que desejas.", context:"A fé além das fronteiras", tags:"fé,confiança,fronteiras,gentios", active:true },
  { id:"b246", ref:"Mateus 15:32",   text:"Meu interior se move diante da necessidade destas pessoas, pois permaneceram comigo durante dias e já não possuem alimento. Não desejo enviá-las sem sustento, para que suas forças não se esgotem durante o caminho.", context:"A compaixão pelas necessidades humanas", tags:"compaixão,necessidade,cuidado,alimentação", active:true },
  { id:"b247", ref:"Mateus 15:34",   text:"O que possuís neste momento? Antes de considerardes impossível suprir uma necessidade, reconhecei aquilo que já se encontra em vossas mãos.", context:"O reconhecimento dos recursos disponíveis", tags:"recursos,disponível,impossível,providência", active:true },
  // Mateus 16
  { id:"b248", ref:"Mateus 16:2–3",  text:"Aprendestes a interpretar as mudanças do céu para antecipar aquilo que acontecerá na natureza, mas permaneceis incapazes de reconhecer o significado dos acontecimentos espirituais que se manifestam diante de vós.", context:"A interpretação dos sinais", tags:"sinais,discernimento,espiritual,percepção", active:true },
  { id:"b249", ref:"Mateus 16:4",    text:"Uma geração que se afastou da fidelidade exige continuamente sinais para reconhecer aquilo que deveria discernir. Contudo, não lhe será concedido outro sinal além daquele representado por Jonas.", context:"A dependência de provas extraordinárias", tags:"sinais,incredulidade,Jonas,geração", active:true },
  { id:"b250", ref:"Mateus 16:6",    text:"Permanecei atentos à influência dos ensinamentos dos fariseus e dos saduceus, pois uma pequena quantidade de engano pode transformar silenciosamente toda a estrutura de vossa compreensão.", context:"A influência invisível dos ensinamentos", tags:"fermento,engano,ensinamentos,vigilância", active:true },
  { id:"b251", ref:"Mateus 16:8",    text:"Por que vossa preocupação com aquilo que não possuís materialmente vos impede de compreender a natureza daquilo que estou ensinando?", context:"A interpretação limitada pela preocupação material", tags:"preocupação,material,compreensão,ensinamento", active:true },
  { id:"b252", ref:"Mateus 16:9–10", text:"Ainda não compreendestes? Já esquecestes aquilo que testemunhastes quando os recursos pareciam insuficientes e, mesmo assim, todos receberam alimento e ainda houve abundância?", context:"A memória da providência", tags:"memória,providência,abundância,compreensão", active:true },
  { id:"b253", ref:"Mateus 16:11",   text:"Como não percebeis que não vos falava acerca do alimento do corpo, mas daquilo que, introduzido em vossa compreensão, pode modificar a maneira pela qual reconheceis a verdade?", context:"O discernimento da linguagem espiritual", tags:"linguagem espiritual,discernimento,compreensão,ensinamento", active:true },
  { id:"b254", ref:"Mateus 16:13",   text:"Quem dizem os homens que é o Filho do Homem? Que identidade atribuem àquele cuja presença ainda não compreenderam plenamente?", context:"A identidade construída pela percepção alheia", tags:"identidade,percepção,Filho do Homem,reconhecimento", active:true },
  { id:"b255", ref:"Mateus 16:15",   text:"E vós, que caminhastes comigo e testemunhastes minhas obras, quem reconheceis que verdadeiramente sou?", context:"O conhecimento pessoal", tags:"conhecimento pessoal,identidade,testemunho,discípulos", active:true },
  { id:"b256", ref:"Mateus 16:17",   text:"Bem-aventurado és, Simão, pois aquilo que reconheceste não te foi revelado simplesmente pela inteligência humana ou pelos ensinamentos dos homens, mas por meu Pai celestial.", context:"A revelação além do conhecimento humano", tags:"revelação,Pai,bem-aventurado,Pedro", active:true },
  { id:"b257", ref:"Mateus 16:18",   text:"Tu és Pedro, e sobre esta rocha estabelecerei minha comunidade, cuja existência não será vencida nem mesmo pelo poder da morte.", context:"O fundamento da comunidade espiritual", tags:"Pedro,Igreja,fundamento,morte", active:true },
  { id:"b258", ref:"Mateus 16:19",   text:"Confiar-te-ei as chaves do Reino dos Céus. Aquilo que ligares ou desligares na terra estará relacionado à autoridade dos céus, pois grande é a responsabilidade daquele a quem se concede participar das decisões do Reino.", context:"A autoridade e a responsabilidade espiritual", tags:"chaves,reino,autoridade,responsabilidade", active:true },
  { id:"b259", ref:"Mateus 16:23",   text:"Afasta-te de mim, adversário, pois aquilo que apresentas como proteção tornou-se obstáculo ao cumprimento de minha missão. Estás interpretando o propósito divino segundo os interesses humanos, e não segundo a vontade de Deus.", context:"A oposição disfarçada de proteção", tags:"adversário,obstáculo,missão,vontade divina", active:true },
  { id:"b260", ref:"Mateus 16:24",   text:"Aquele que deseja caminhar comigo deverá deixar de colocar a si mesmo como autoridade suprema de sua existência, aceitar o custo dessa decisão e seguir o caminho que lhe apresento.", context:"A renúncia à centralidade do próprio eu", tags:"negação,cruz,seguir,ego", active:true },
  { id:"b261", ref:"Mateus 16:25",   text:"Aquele que transforma a preservação de sua própria existência em seu propósito absoluto poderá perder aquilo que verdadeiramente constitui a vida. Mas aquele que entrega sua existência por minha causa encontrará a vida em sua plenitude.", context:"O paradoxo da preservação da vida", tags:"paradoxo,vida,entrega,preservação", active:true },
  { id:"b262", ref:"Mateus 16:26",   text:"De que servirá ao homem conquistar tudo aquilo que o mundo pode oferecer se, durante essa conquista, perder a própria vida? Que riqueza poderia entregar em troca daquilo que constitui sua existência?", context:"O valor incomparável da existência", tags:"valor,alma,riqueza,existência", active:true },
  { id:"b263", ref:"Mateus 16:27",   text:"O Filho do Homem virá revestido da glória de seu Pai, acompanhado de seus mensageiros, e cada homem receberá segundo aquilo que suas ações verdadeiramente produziram.", context:"A responsabilidade pelas próprias obras", tags:"julgamento,obras,responsabilidade,glória", active:true },
  { id:"b264", ref:"Mateus 16:28",   text:"Entre aqueles que agora me ouvem, alguns não experimentarão a morte antes de testemunharem uma manifestação do Filho do Homem em seu Reino.", context:"A manifestação do Reino", tags:"manifestação,reino,morte,testemunho", active:true },
  // Mateus 17
  { id:"b265", ref:"Mateus 17:7",    text:"Levantai-vos e não temais, pois aquilo que vos foi permitido contemplar não se manifestou para destruir-vos, mas para revelar uma realidade que ainda não compreendeis plenamente.", context:"A superação do temor diante do divino", tags:"temor,revelação,divino,transfiguração", active:true },
  { id:"b266", ref:"Mateus 17:9",    text:"Não anuncieis aquilo que contemplastes antes que o Filho do Homem se levante dentre os mortos, pois há revelações cujo verdadeiro significado somente poderá ser compreendido depois que outros acontecimentos se cumprirem.", context:"O tempo adequado da revelação", tags:"revelação,tempo,ressurreição,silêncio", active:true },
  { id:"b267", ref:"Mateus 17:11",   text:"Certamente Elias vem para restaurar aquilo que necessita ser restabelecido antes do cumprimento do propósito divino.", context:"A restauração", tags:"Elias,restauração,cumprimento,propósito", active:true },
  { id:"b268", ref:"Mateus 17:12",   text:"Elias já veio, mas os homens não reconheceram nele aquilo que esperavam e fizeram-lhe conforme suas próprias vontades. Da mesma maneira, o Filho do Homem sofrerá nas mãos daqueles que não compreenderem sua missão.", context:"A incapacidade de reconhecer o cumprimento", tags:"reconhecimento,João Batista,sofrimento,missão", active:true },
  { id:"b269", ref:"Mateus 17:17",   text:"Ó geração cuja confiança permanece dividida e cuja compreensão se afastou da verdade! Até quando permanecereis incapazes de reconhecer aquilo que vos foi revelado? Trazei-me aquele que necessita de libertação.", context:"A desconexão entre conhecimento e fé", tags:"incredulidade,geração,fé,libertação", active:true },
  { id:"b270", ref:"Mateus 17:20",   text:"Vossa dificuldade procede da insuficiência de vossa fé. Se possuísseis uma confiança verdadeira, ainda que pequena como uma semente de mostarda, poderíeis confrontar aquilo que diante de vós parece intransponível. Pois a grandeza da fé não se encontra em sua aparência, mas na realidade daquele em quem confiais.", context:"A natureza da fé", tags:"fé,mostarda,impossível,confiança", active:true },
  { id:"b271", ref:"Mateus 17:21",   text:"Pois não é o espírito que possui poder sobre o homem, mas aquilo que o homem, em seu interior, ainda não aprendeu a governar.", context:"O governo interior e a autoridade espiritual", tags:"interior,governo,espírito,autoridade", active:true },
  { id:"b272", ref:"Mateus 17:22–23",text:"O Filho do Homem será entregue às mãos dos homens, e eles destruirão sua existência física. Contudo, ao terceiro dia será levantado, pois aquilo que os homens consideram o encerramento de sua missão não será seu verdadeiro fim.", context:"A incompreensão diante da morte", tags:"morte,ressurreição,missão,entrega", active:true },
  { id:"b273", ref:"Mateus 17:25",   text:"Que pensas, Simão? Aqueles que governam os reinos da terra exigem tributos de seus próprios filhos ou daqueles que não pertencem à sua casa?", context:"A natureza da autoridade e do pertencimento", tags:"autoridade,filhos,tributo,pertencimento", active:true },
  { id:"b274", ref:"Mateus 17:26",   text:"Então os filhos estão livres dessa obrigação, pois sua relação com aquele que governa não possui a mesma natureza da relação estabelecida com os demais.", context:"A liberdade dos filhos", tags:"liberdade,filhos,relação,autoridade", active:true },
  { id:"b275", ref:"Mateus 17:27",   text:"Contudo, para que nossa liberdade não se transforme em obstáculo desnecessário à compreensão daqueles que nos observam, cumpre essa obrigação. Vai ao mar, lança o anzol e encontrarás no primeiro peixe aquilo que será suficiente para satisfazer a exigência por mim e por ti.", context:"A liberdade exercida com discernimento", tags:"liberdade,discernimento,obstáculo,providência", active:true },
  // Mateus 18
  { id:"b276", ref:"Mateus 18:3",    text:"Se não modificardes a direção de vossa existência e não recuperardes a disposição daqueles que ainda não construíram sua identidade sobre a própria superioridade, não entrareis no Reino dos Céus.", context:"A transformação da disposição interior", tags:"humildade,criança,reino,transformação", active:true },
  { id:"b277", ref:"Mateus 18:4",    text:"Aquele que voluntariamente abandona a necessidade de colocar-se acima dos outros e se torna humilde como esta criança será considerado grande no Reino dos Céus.", context:"A verdadeira grandeza", tags:"humildade,grandeza,reino,criança", active:true },
  { id:"b278", ref:"Mateus 18:5",    text:"Aquele que acolhe uma existência aparentemente pequena e insignificante por causa de meu nome acolhe também a mim.", context:"O reconhecimento de Cristo no outro", tags:"acolhimento,pequenos,Cristo,nome", active:true },
  { id:"b279", ref:"Mateus 18:6",    text:"Aquele que utiliza sua influência para conduzir à queda um destes pequenos que confiam em mim assume sobre si uma responsabilidade cuja gravidade ultrapassa aquilo que consegue compreender.", context:"A responsabilidade sobre os vulneráveis", tags:"influência,queda,pequenos,responsabilidade", active:true },
  { id:"b280", ref:"Mateus 18:7",    text:"Ai do mundo por causa daquilo que conduz os homens à queda. Embora tais obstáculos estejam presentes na existência humana, isso não elimina a responsabilidade daquele que escolhe tornar-se sua origem.", context:"A existência dos obstáculos", tags:"escândalo,obstáculo,responsabilidade,mundo", active:true },
  { id:"b281", ref:"Mateus 18:8–9",  text:"Se aquilo que utilizas para agir, caminhar ou contemplar o mundo continuamente te conduz à corrupção, renuncia à sua influência. Melhor é perder aquilo que consideras indispensável do que permitir que isso conduza toda a tua existência à destruição.", context:"A renúncia ao que conduz à destruição", tags:"renúncia,corrupção,destruição,escândalo", active:true },
  { id:"b282", ref:"Mateus 18:10",   text:"Não desprezeis nenhum daqueles que considerais pequenos, pois sua aparente insignificância diante dos homens não corresponde ao lugar que ocupam diante do Pai. Seus mensageiros contemplam continuamente sua presença celestial.", context:"O valor espiritual dos pequenos", tags:"pequenos,valor,anjos,desprezo", active:true },
  { id:"b283", ref:"Mateus 18:11",   text:"Pois aquele que se perdeu não deixou de pertencer ao Pai; apenas esqueceu o caminho pelo qual veio.", context:"O reencontro com o Pai", tags:"perdido,pertencimento,Pai,caminho", active:true },
  { id:"b284", ref:"Mateus 18:12",   text:"Que pensais? Se um homem possui cem ovelhas e uma delas perde a direção, não deixará as demais em segurança para procurar aquela cuja existência se encontra ameaçada?", context:"O valor daquele que se perdeu", tags:"ovelha perdida,busca,valor,cuidado", active:true },
  { id:"b285", ref:"Mateus 18:13",   text:"Se conseguir encontrá-la, sua alegria pela recuperação daquela que estava perdida será maior, naquele momento, do que pela segurança daquelas que permaneceram no caminho.", context:"A alegria da restauração", tags:"alegria,restauração,perdido,encontrado", active:true },
  { id:"b286", ref:"Mateus 18:14",   text:"Assim também, não é da vontade de vosso Pai celestial que nenhuma destas pequenas existências caminhe para a destruição.", context:"A vontade restauradora do Pai", tags:"vontade do Pai,restauração,pequenos,destruição", active:true },
  { id:"b287", ref:"Mateus 18:15",   text:"Se teu irmão transgredir contra ti, procura-o primeiro em particular. Não transformes imediatamente sua falha em conhecimento público. Se ele estiver disposto a ouvir-te, tereis recuperado aquilo que a transgressão ameaçava destruir.", context:"A correção sem exposição", tags:"correção,reconciliação,irmão,privado", active:true },
  { id:"b288", ref:"Mateus 18:16",   text:"Se ele se recusar a ouvir-te, procura uma ou duas pessoas que possam testemunhar aquilo que acontece, para que a verdade não dependa exclusivamente da percepção de uma das partes.", context:"A imparcialidade na resolução dos conflitos", tags:"testemunhas,conflito,imparcialidade,reconciliação", active:true },
  { id:"b289", ref:"Mateus 18:17",   text:"Se ainda assim houver resistência, apresentai a questão à comunidade. E, se ele rejeitar também sua orientação, reconhecei que a comunhão não pode ser sustentada unilateralmente quando uma das partes se recusa continuamente à reconciliação.", context:"Os limites da reconciliação", tags:"comunidade,limites,reconciliação,resistência", active:true },
  { id:"b290", ref:"Mateus 18:18",   text:"Aquilo que ligardes ou desligardes na terra estará relacionado à autoridade dos céus. Portanto, compreendei a responsabilidade que acompanha as decisões tomadas em nome do Reino.", context:"A responsabilidade das decisões espirituais", tags:"autoridade,responsabilidade,reino,decisões", active:true },
  { id:"b291", ref:"Mateus 18:19",   text:"Se dois dentre vós estabelecerem verdadeira concordância acerca daquilo que apresentam ao Pai, sua petição encontrará resposta naquele cuja autoridade governa os céus.", context:"A concordância diante do Pai", tags:"concordância,oração,Pai,petição", active:true },
  { id:"b292", ref:"Mateus 18:20",   text:"Onde dois ou três se reunirem verdadeiramente em meu nome, ali estarei entre eles, pois minha presença não depende da grandeza do lugar nem da quantidade daqueles que se encontram reunidos.", context:"A presença além das estruturas físicas", tags:"presença,reunião,nome,comunidade", active:true },
  { id:"b293", ref:"Mateus 18:22",   text:"Não estabeleças um limite numérico para tua disposição de perdoar, como se a misericórdia devesse cessar quando o outro ultrapassasse determinada quantidade de transgressões.", context:"O perdão além da contabilidade", tags:"perdão,limite,misericórdia,setenta vezes", active:true },
  { id:"b294", ref:"Mateus 18:23–24",text:"O Reino dos Céus pode ser comparado a um rei que decidiu examinar as responsabilidades daqueles que estavam sob sua autoridade. Entre eles encontrou um homem cuja dívida era tão grande que ultrapassava sua capacidade de restituição.", context:"A consciência da própria dívida", tags:"dívida,consciência,restituição,parábola", active:true },
  { id:"b295", ref:"Mateus 18:25–26",text:"Diante da impossibilidade de restituir aquilo que devia, aquele homem viu ameaçada toda a sua existência. Então reconheceu sua condição e suplicou que lhe fosse concedido tempo e misericórdia.", context:"A incapacidade de reparar sozinho", tags:"impossibilidade,súplica,misericórdia,reconhecimento", active:true },
  { id:"b296", ref:"Mateus 18:27",   text:"Movido por profunda compaixão, seu senhor não apenas lhe concedeu tempo, mas o libertou inteiramente da dívida que jamais conseguiria pagar.", context:"A misericórdia que ultrapassa a obrigação", tags:"compaixão,perdão,libertação,dívida", active:true },
  { id:"b297", ref:"Mateus 18:28–30",text:"Entretanto, aquele que acabara de receber tamanho perdão encontrou alguém cuja dívida para com ele era pequena. Exigiu-lhe restituição e, mesmo diante da mesma súplica que anteriormente havia pronunciado, recusou-se a oferecer a misericórdia que recebera.", context:"A contradição daquele que recebe misericórdia", tags:"contradição,misericórdia,exigência,ingratidão", active:true },
  { id:"b298", ref:"Mateus 18:31–33",text:"Quando seu senhor soube daquilo que havia acontecido, chamou-o e perguntou: Não te libertei de uma dívida impossível de restituir? Não deverias também ter manifestado ao teu próximo a misericórdia que manifestei para contigo?", context:"A responsabilidade de transmitir aquilo que se recebe", tags:"responsabilidade,transmissão,misericórdia,pergunta", active:true },
  { id:"b299", ref:"Mateus 18:34",   text:"Então aquele que havia sido libertado voltou a responder por sua dívida, pois sua maneira de tratar o próximo revelou que a misericórdia recebida não havia transformado sua natureza.", context:"As consequências da ausência de misericórdia", tags:"consequências,misericórdia,natureza,transformação", active:true },
  { id:"b300", ref:"Mateus 18:35",   text:"Assim também sereis chamados a responder diante de meu Pai celestial se vosso perdão permanecer apenas nas palavras, enquanto em vosso coração continuais a manter vosso irmão aprisionado àquilo que cometeu contra vós.", context:"O perdão que procede do interior", tags:"perdão,coração,interior,palavras", active:true },
  // Mateus 19
  { id:"b301", ref:"Mateus 19:4",    text:"Não compreendestes que aquele que estabeleceu a existência humana, desde o princípio, criou homem e mulher, e que sua relação possui um propósito anterior às convenções estabelecidas pelos homens?", context:"A origem da natureza humana", tags:"criação,homem,mulher,propósito", active:true },
  { id:"b302", ref:"Mateus 19:5",    text:"Por essa razão, o homem deixará a estrutura familiar da qual procede e estabelecerá uma aliança com sua mulher, de modo que suas existências, antes conduzidas separadamente, passarão a constituir uma unidade.", context:"A união das existências", tags:"aliança,matrimônio,unidade,família", active:true },
  { id:"b303", ref:"Mateus 19:6",    text:"Assim, já não são dois conduzindo suas existências de maneira independente, mas uma unidade estabelecida diante de Deus. Não desfaça o homem, segundo sua conveniência, aquilo que Deus uniu.", context:"A responsabilidade da aliança", tags:"aliança,unidade,Deus,divorção", active:true },
  { id:"b304", ref:"Mateus 19:8",    text:"Foi por causa da resistência de vosso coração que Moisés vos permitiu dissolver vossas alianças. Contudo, aquilo que foi permitido em razão das limitações humanas não representa necessariamente o propósito estabelecido desde o princípio.", context:"A dureza da natureza humana", tags:"dureza,coração,Moisés,aliança", active:true },
  { id:"b305", ref:"Mateus 19:9",    text:"Aquele que abandona sua mulher, salvo por imoralidade sexual, e estabelece outra união não elimina, por sua própria decisão, a responsabilidade espiritual da aliança que anteriormente assumiu.", context:"As consequências da ruptura", tags:"divórcio,aliança,responsabilidade,ruptura", active:true },
  { id:"b306", ref:"Mateus 19:11",   text:"Nem todos possuem a mesma capacidade de acolher determinado caminho de existência, mas somente aqueles a quem foi concedida essa disposição.", context:"A individualidade dos chamados", tags:"chamado,capacidade,individualidade,disposição", active:true },
  { id:"b307", ref:"Mateus 19:12",   text:"Há aqueles cuja condição procede de seu nascimento, outros cuja condição foi determinada pela intervenção dos homens e aqueles que voluntariamente renunciam à vida matrimonial por causa do Reino dos Céus. Aquele que possui capacidade para acolher esse caminho, acolha-o.", context:"As diferentes condições da existência", tags:"celibato,reino,vocação,condição", active:true },
  { id:"b308", ref:"Mateus 19:14",   text:"Permiti que os pequenos se aproximem de mim e não estabeleçais obstáculos entre eles e minha presença, pois o Reino dos Céus pertence àqueles cuja disposição se assemelha à deles.", context:"A disposição espiritual das crianças", tags:"crianças,reino,humildade,aproximação", active:true },
  { id:"b309", ref:"Mateus 19:17",   text:"Por que me interrogas acerca daquilo que é bom? A verdadeira bondade possui sua origem em Deus. Se desejas entrar na vida, não te limites a investigar o bem, mas pratica aquilo que Ele estabeleceu.", context:"A origem da bondade", tags:"bondade,Deus,mandamentos,vida", active:true },
  { id:"b310", ref:"Mateus 19:18–19",text:"Não destruas a existência de teu próximo, não traias tuas alianças, não te apropries daquilo que pertence a outro e não utilizes a mentira para prejudicá-lo. Honra aqueles por meio dos quais recebeste a vida e reconhece na existência de teu próximo uma dignidade semelhante à tua.", context:"A justiça nas relações humanas", tags:"mandamentos,próximo,dignidade,justiça", active:true },
  { id:"b311", ref:"Mateus 19:21",   text:"Se desejas alcançar a plenitude, examina aquilo a que entregaste tua segurança. Desfaz-te de tuas riquezas, distribui-as aos necessitados e estabelece teu tesouro naquilo que possui valor eterno. Depois, vem e segue-me.", context:"A liberdade diante das posses", tags:"riqueza,liberdade,segurança,tesouro eterno", active:true },
  { id:"b312", ref:"Mateus 19:23",   text:"Dificilmente aquele cuja segurança está estabelecida nas riquezas permitirá que outra autoridade governe plenamente sua existência no Reino dos Céus.", context:"A dificuldade produzida pelo apego", tags:"riqueza,apego,reino,dificuldade", active:true },
  { id:"b313", ref:"Mateus 19:24",   text:"Mais facilmente atravessaria um camelo a abertura de uma agulha do que aquele que permanece subordinado às suas riquezas entraria no Reino de Deus por seus próprios recursos.", context:"Os limites da capacidade humana", tags:"riqueza,camelo,agulha,reino", active:true },
  { id:"b314", ref:"Mateus 19:26",   text:"Aquilo que ultrapassa a capacidade dos homens não ultrapassa necessariamente a autoridade de Deus. Pois os limites da criatura não determinam os limites daquele que a criou.", context:"A possibilidade além dos limites humanos", tags:"impossível,Deus,limites,autoridade", active:true },
  { id:"b315", ref:"Mateus 19:28",   text:"Quando chegar o tempo da renovação e o Filho do Homem ocupar seu lugar de glória, aqueles que permaneceram comigo participarão da responsabilidade de julgar as doze tribos de Israel.", context:"A renovação de todas as coisas", tags:"renovação,glória,julgamento,Israel", active:true },
  { id:"b316", ref:"Mateus 19:29",   text:"Aquele que renuncia a casas, vínculos familiares ou propriedades por causa de meu nome descobrirá que aquilo que entregou não representa a totalidade do que poderá receber, e herdará a vida eterna.", context:"Aquilo que se perde por um propósito superior", tags:"renúncia,família,vida eterna,herança", active:true },
  { id:"b317", ref:"Mateus 19:30",   text:"Muitos daqueles que hoje ocupam os primeiros lugares descobrirão que sua posição não corresponde à grandeza que possuem diante de Deus, enquanto aqueles considerados últimos poderão ocupar lugares que jamais lhes foram concedidos pelos homens.", context:"A inversão das hierarquias humanas", tags:"inversão,primeiros,últimos,hierarquia", active:true },
  // Mateus 20
  { id:"b318", ref:"Mateus 20:1–2",  text:"O Reino dos Céus assemelha-se a um proprietário que saiu ao início do dia para encontrar trabalhadores dispostos a participar de sua obra. Estabeleceu com eles uma recompensa e os enviou ao campo.", context:"A oportunidade de participar", tags:"reino,trabalhadores,recompensa,obra", active:true },
  { id:"b319", ref:"Mateus 20:3–4",  text:"Ao retornar, encontrou outros cuja capacidade permanecia sem oportunidade de produzir. Convidou-os também para sua obra, prometendo-lhes aquilo que fosse justo.", context:"O potencial ainda não utilizado", tags:"oportunidade,potencial,convite,justiça", active:true },
  { id:"b320", ref:"Mateus 20:5–7",  text:"Em diferentes momentos do dia, encontrou homens que ainda não haviam sido chamados. Não estavam necessariamente recusando-se a trabalhar; alguns simplesmente jamais haviam recebido uma oportunidade. Também a estes concedeu um lugar em sua obra.", context:"A oportunidade em diferentes tempos", tags:"tempo,oportunidade,chamado,obra", active:true },
  { id:"b321", ref:"Mateus 20:8–9",  text:"Quando chegou o momento da recompensa, aqueles que haviam sido chamados por último receberam aquilo que o proprietário decidiu conceder-lhes, ainda que sua participação tivesse começado mais tarde.", context:"A generosidade além da proporcionalidade", tags:"generosidade,recompensa,último,primeiro", active:true },
  { id:"b322", ref:"Mateus 20:10–12",text:"Aqueles que chegaram primeiro imaginaram que receberiam mais ao contemplarem a recompensa dos demais. Entretanto, receberam aquilo que lhes havia sido prometido e tornaram-se insatisfeitos, não porque lhes faltasse justiça, mas porque compararam sua recompensa à generosidade concedida ao outro.", context:"A comparação como origem da insatisfação", tags:"comparação,insatisfação,ciúme,recompensa", active:true },
  { id:"b323", ref:"Mateus 20:13–14",text:"Amigo, não pratiquei injustiça contra ti. Recebeste aquilo que havíamos estabelecido. Por que consideras uma ofensa contra tua existência a bondade que decidi manifestar na existência de outro?", context:"A diferença entre justiça e generosidade", tags:"justiça,generosidade,bondade,inveja", active:true },
  { id:"b324", ref:"Mateus 20:15",   text:"Não possuo liberdade para utilizar aquilo que me pertence segundo minha própria bondade? Ou tornou-se teu olhar maligno simplesmente porque escolhi ser generoso?", context:"A inveja diante da prosperidade alheia", tags:"inveja,generosidade,liberdade,bondade", active:true },
  { id:"b325", ref:"Mateus 20:16",   text:"Assim, aqueles que chegaram por último poderão ocupar os primeiros lugares, pois a generosidade do Reino não está subordinada exclusivamente aos critérios humanos de antiguidade e merecimento.", context:"A inversão dos critérios de mérito", tags:"inversão,generosidade,mérito,reino", active:true },
  { id:"b326", ref:"Mateus 20:18–19",text:"Subimos a Jerusalém, onde o Filho do Homem será entregue às autoridades, condenado, humilhado e morto. Contudo, aquilo que os homens utilizarão para encerrar sua missão não impedirá o cumprimento daquilo que o Pai estabeleceu, pois ao terceiro dia será levantado.", context:"O propósito além do sofrimento", tags:"sofrimento,morte,ressurreição,propósito", active:true },
  { id:"b327", ref:"Mateus 20:21",   text:"Que desejas verdadeiramente receber? Examina aquilo que procuras, pois nem todo desejo apresentado diante do Reino procede da compreensão de sua natureza.", context:"A verdadeira natureza dos desejos", tags:"desejos,exame,reino,natureza", active:true },
  { id:"b328", ref:"Mateus 20:22",   text:"Não compreendeis plenamente aquilo que estais pedindo. Desejais participar da posição, mas conheceis a profundidade da responsabilidade e do sofrimento que a acompanham? Podeis beber do cálice que estou prestes a beber?", context:"O preço daquilo que se deseja", tags:"cálice,sofrimento,responsabilidade,posição", active:true },
  { id:"b329", ref:"Mateus 20:23",   text:"Participareis de meu cálice, mas os lugares que desejais não são distribuídos segundo preferências pessoais. Pertencem àqueles para quem meu Pai os preparou.", context:"A autoridade sobre as posições espirituais", tags:"cálice,posições,Pai,autoridade", active:true },
  { id:"b330", ref:"Mateus 20:25",   text:"Sabeis que aqueles que governam as nações frequentemente utilizam sua posição para exercer domínio sobre os demais, e que os considerados grandes demonstram sua autoridade subordinando outras existências às suas vontades.", context:"A natureza do poder humano", tags:"poder,domínio,autoridade,liderança", active:true },
  { id:"b331", ref:"Mateus 20:26",   text:"Entre vós, porém, a grandeza não deverá possuir essa natureza. Aquele que deseja tornar-se grande deverá desenvolver a capacidade de colocar sua autoridade a serviço dos outros.", context:"A verdadeira grandeza", tags:"grandeza,serviço,autoridade,inversão", active:true },
  { id:"b332", ref:"Mateus 20:27",   text:"Aquele que deseja ocupar o primeiro lugar deverá estar disposto a assumir a responsabilidade de servir, em vez de transformar sua posição em instrumento de superioridade.", context:"A liderança como responsabilidade", tags:"liderança,serviço,primeiro,responsabilidade", active:true },
  { id:"b333", ref:"Mateus 20:28",   text:"O Filho do Homem não veio para transformar os homens em instrumentos de sua própria grandeza, mas para servi-los e entregar sua existência como preço de libertação por muitos.", context:"O propósito da autoridade de Cristo", tags:"serviço,resgate,libertação,autoridade", active:true },
  { id:"b334", ref:"Mateus 20:32",   text:"Que desejais que eu faça por vós? Expressai aquilo que verdadeiramente necessitais receber.", context:"A consciência da própria necessidade", tags:"necessidade,oração,expressão,consciência", active:true },
  // Mateus 21
  { id:"b335", ref:"Mateus 21:2–3",  text:"Ide ao lugar que vos indiquei e encontrareis aquilo de que necessito. Se alguém vos interrogar, anunciai que o Senhor precisa desses recursos, e eles vos serão concedidos.", context:"Os recursos destinados ao propósito", tags:"provisão,propósito,missão,recursos", active:true },
  { id:"b336", ref:"Mateus 21:13",   text:"Aquilo que foi estabelecido como lugar de encontro com Deus não deveria ser transformado em instrumento de exploração humana. Fizestes daquilo que pertence à oração um esconderijo para aqueles que se beneficiam da injustiça.", context:"A corrupção daquilo que é sagrado", tags:"templo,exploração,oração,sagrado", active:true },
  { id:"b337", ref:"Mateus 21:16",   text:"Nunca compreendestes que Deus pode estabelecer verdadeiro louvor na boca daqueles que os homens ainda não consideram capazes de compreender sua grandeza?", context:"A verdade manifestada pelos pequenos", tags:"louvor,crianças,pequenos,compreensão", active:true },
  { id:"b338", ref:"Mateus 21:19",   text:"Que não proceda mais fruto de ti, pois tua aparência anunciava uma abundância que tua natureza não foi capaz de produzir.", context:"A aparência sem propósito", tags:"aparência,frutos,esterilidade,figueira", active:true },
  { id:"b339", ref:"Mateus 21:21",   text:"Se possuirdes verdadeira confiança e não permitirdes que a dúvida governe vossa relação com Deus, não apenas testemunhareis aquilo que aconteceu a esta árvore, mas também podereis confrontar aquilo que diante de vós parece tão intransponível quanto uma montanha.", context:"A fé diante do impossível", tags:"fé,dúvida,montanha,impossível", active:true },
  { id:"b340", ref:"Mateus 21:22",   text:"Aquilo que apresentardes ao Pai em oração, sustentados pela verdadeira fé, recebereis.", context:"A confiança na oração", tags:"oração,fé,confiança,receber", active:true },
  { id:"b341", ref:"Mateus 21:24",   text:"Também vos apresentarei uma questão. Se estiverdes dispostos a responder com verdade, então vos revelarei aquilo que desejais compreender acerca de minha autoridade.", context:"O discernimento antes da resposta", tags:"discernimento,verdade,autoridade,questionamento", active:true },
  { id:"b342", ref:"Mateus 21:25",   text:"A autoridade manifestada no batismo de João procedia dos céus ou havia sido estabelecida pelos homens?", context:"A origem da autoridade espiritual", tags:"autoridade,João Batista,céus,homens", active:true },
  { id:"b343", ref:"Mateus 21:27",   text:"Se não estais dispostos a reconhecer aquilo que compreendeis, também não vos revelarei aquilo que desejais utilizar sem verdadeira disposição para conhecer.", context:"A verdade diante da desonestidade", tags:"desonestidade,reconhecimento,verdade,autoridade", active:true },
  { id:"b344", ref:"Mateus 21:28–29",text:"Um homem possuía dois filhos e chamou o primeiro para trabalhar em sua propriedade. Este inicialmente recusou-se, mas posteriormente modificou sua disposição e realizou aquilo que lhe havia sido pedido.", context:"A transformação acima das declarações", tags:"transformação,obediência,filhos,mudança", active:true },
  { id:"b345", ref:"Mateus 21:30",   text:"Chamou também o segundo, que imediatamente declarou sua disposição de obedecer. Contudo, suas palavras jamais encontraram correspondência em suas ações.", context:"A promessa sem cumprimento", tags:"promessa,obediência,ações,palavras", active:true },
  { id:"b346", ref:"Mateus 21:31",   text:"Qual deles realizou verdadeiramente a vontade do pai? Digo-vos que aqueles cuja reputação é condenada pelos homens poderão entrar no Reino antes daqueles que construíram uma aparência de obediência sem jamais permitir que ela governasse suas ações.", context:"A obediência acima da reputação", tags:"obediência,reputação,reino,aparência", active:true },
  { id:"b347", ref:"Mateus 21:32",   text:"João apresentou-vos o caminho da justiça, e aqueles que desprezáveis reconheceram sua necessidade de transformação. Vós, entretanto, mesmo contemplando a transformação deles, permanecestes resistentes àquilo que vos foi anunciado.", context:"A resistência produzida pela superioridade", tags:"resistência,superioridade,justiça,arrependimento", active:true },
  { id:"b348", ref:"Mateus 21:33",   text:"Um proprietário estabeleceu uma vinha, preparou os recursos necessários para seu desenvolvimento, protegeu-a e confiou sua administração a trabalhadores antes de partir.", context:"A responsabilidade sobre aquilo que se recebe", tags:"vinha,responsabilidade,administração,confiança", active:true },
  { id:"b349", ref:"Mateus 21:34–36",text:"Quando chegou o tempo de receber os frutos de sua propriedade, enviou seus representantes. Contudo, aqueles a quem havia confiado a administração passaram a comportar-se como proprietários absolutos e rejeitaram violentamente aqueles que lhes recordavam suas responsabilidades.", context:"A apropriação daquilo que pertence a outro", tags:"apropriação,violência,rejeição,responsabilidade", active:true },
  { id:"b350", ref:"Mateus 21:37–39",text:"Por fim, enviou seu próprio filho, esperando que reconhecessem sua autoridade. Entretanto, ao perceberem quem ele era, decidiram destruí-lo, imaginando que, eliminando o herdeiro, poderiam apropriar-se definitivamente daquilo que jamais lhes pertenceu.", context:"A corrupção pelo desejo de domínio", tags:"herdeiro,domínio,destruição,rejeição", active:true },
  { id:"b351", ref:"Mateus 21:40",   text:"Quando retornar aquele a quem verdadeiramente pertence a propriedade, que fará com aqueles que transformaram a confiança recebida em instrumento de apropriação?", context:"A responsabilidade pelas escolhas", tags:"julgamento,propriedade,responsabilidade,escolhas", active:true },
  { id:"b352", ref:"Mateus 21:42",   text:"Aquilo que os construtores consideraram inadequado tornou-se o fundamento indispensável da construção. Assim opera o Senhor, cuja percepção de valor não está limitada pelos critérios humanos.", context:"O valor daquilo que foi rejeitado", tags:"pedra angular,rejeição,valor,fundamento", active:true },
  { id:"b353", ref:"Mateus 21:43",   text:"O Reino de Deus será retirado daqueles que receberam sua responsabilidade sem produzir os frutos correspondentes e será confiado a um povo disposto a manifestar sua verdadeira natureza.", context:"A autoridade condicionada à responsabilidade", tags:"reino,frutos,responsabilidade,condição", active:true },
  { id:"b354", ref:"Mateus 21:44",   text:"Aquele que tropeçar nessa pedra será quebrantado, e aquele sobre quem ela cair será esmagado, pois aquilo que Deus estabeleceu não perderá sua autoridade diante da resistência humana.", context:"O confronto com a verdade", tags:"pedra,tropeço,autoridade,resistência", active:true },
  // Mateus 22
  { id:"b355", ref:"Mateus 22:2–3",  text:"O Reino dos Céus assemelha-se a um rei que preparou uma celebração para seu filho e enviou mensageiros para chamar aqueles que haviam recebido o convite. Contudo, eles recusaram-se a participar.", context:"O convite divino", tags:"convite,reino,rejeição,celebração", active:true },
  { id:"b356", ref:"Mateus 22:4",    text:"Anunciai aos convidados que tudo aquilo que era necessário já foi preparado. Não lhes falta provisão, mas disposição para responder ao convite.", context:"A disponibilidade daquilo que foi preparado", tags:"provisão,disposição,convite,preparação", active:true },
  { id:"b357", ref:"Mateus 22:5–6",  text:"Alguns consideraram suas propriedades e seus negócios mais importantes do que aquilo para o qual haviam sido chamados. Outros não apenas rejeitaram o convite, mas voltaram-se violentamente contra aqueles que o anunciaram.", context:"A distração e a resistência humana", tags:"distração,resistência,prioridades,violência", active:true },
  { id:"b358", ref:"Mateus 22:7",    text:"O rei respondeu à violência daqueles que haviam destruído seus mensageiros, e a ordem que eles procuravam preservar tornou-se objeto de julgamento.", context:"As consequências da rejeição", tags:"julgamento,rejeição,violência,consequências", active:true },
  { id:"b359", ref:"Mateus 22:8–10", text:"A celebração está preparada, mas aqueles que inicialmente foram convidados não demonstraram disposição para participar. Ide, portanto, aos caminhos e convidai todos aqueles que encontrardes, sem restringir o chamado àqueles que os homens consideram previamente dignos.", context:"A abertura do Reino", tags:"abertura,convite,dignidade,todos", active:true },
  { id:"b360", ref:"Mateus 22:11–12",text:"Ao entrar, o rei encontrou alguém que havia aceitado o convite sem apresentar-se de maneira correspondente à ocasião. Perguntou-lhe: Amigo, como entraste aqui sem aquilo que seria apropriado para esta celebração? E aquele homem não encontrou resposta.", context:"A responsabilidade de acolher o convite", tags:"responsabilidade,vestimenta,ocasião,resposta", active:true },
  { id:"b361", ref:"Mateus 22:13",   text:"Aquele homem foi retirado da celebração e lançado para fora, onde experimentaria as consequências de não ter correspondido àquilo para o qual havia sido convidado.", context:"As consequências da ausência de preparação", tags:"consequências,preparação,exclusão,convite", active:true },
  { id:"b362", ref:"Mateus 22:14",   text:"Muitos recebem o chamado, mas poucos são escolhidos para participar plenamente daquilo que lhes foi apresentado.", context:"A diferença entre chamado e escolha", tags:"chamado,escolhidos,poucos,muitos", active:true },
  { id:"b363", ref:"Mateus 22:18",   text:"Por que utilizais a aparência de uma investigação sincera para esconder a intenção de encontrar algo com que possais condenar-me?", context:"A intenção oculta por trás das perguntas", tags:"intenção,aparência,condena,hipocrisia", active:true },
  { id:"b364", ref:"Mateus 22:19–20",text:"Mostrai-me aquilo que utilizais para cumprir vossas obrigações diante das autoridades. De quem é a imagem que nele foi estabelecida e a quem pertence o nome que carrega?", context:"A identificação do pertencimento", tags:"imagem,César,pertencimento,autoridade", active:true },
  { id:"b365", ref:"Mateus 22:21",   text:"Entregai às autoridades humanas aquilo que legitimamente lhes pertence, mas não entregueis a elas aquilo que pertence exclusivamente a Deus.", context:"A distinção entre autoridade humana e divina", tags:"César,Deus,autoridade,distinção", active:true },
  { id:"b366", ref:"Mateus 22:29",   text:"Estais equivocados porque procurais compreender a realidade divina utilizando apenas vossas categorias humanas, sem conhecer suficientemente as Escrituras nem a extensão do poder de Deus.", context:"Os limites do conhecimento humano", tags:"equívoco,Escrituras,poder,conhecimento", active:true },
  { id:"b367", ref:"Mateus 22:30",   text:"Na ressurreição, os homens não estabelecerão alianças matrimoniais segundo a ordem atual da existência, pois sua condição será semelhante à dos mensageiros celestiais.", context:"A natureza da existência após a ressurreição", tags:"ressurreição,matrimônio,anjos,existência", active:true },
  { id:"b368", ref:"Mateus 22:31–32",text:"Não compreendestes aquilo que Deus declarou ao identificar-se como o Deus de Abraão, de Isaque e de Jacó? Sua relação com aqueles que lhe pertencem não é anulada pela morte, pois Ele não é Deus de mortos, mas de vivos.", context:"A existência além da morte", tags:"ressurreição,vivos,mortos,Deus", active:true },
  { id:"b369", ref:"Mateus 22:37",   text:"Ama o Senhor teu Deus com a totalidade de teu interior, com toda a tua existência e com toda a capacidade de tua compreensão. Não reserves ao Pai apenas uma dimensão de ti mesmo, enquanto entregas as demais a outras autoridades.", context:"A integração da existência no amor a Deus", tags:"amor,Deus,totalidade,coração", active:true },
  { id:"b370", ref:"Mateus 22:38",   text:"Este é o primeiro e maior mandamento, pois a direção de toda a tua existência será determinada por aquilo a que entregares teu amor supremo.", context:"A centralidade do amor", tags:"amor,mandamento,primeiro,direção", active:true },
  { id:"b371", ref:"Mateus 22:39",   text:"Ama teu próximo reconhecendo nele uma existência digna do mesmo cuidado que desejas para ti. Não estabeleças para o outro uma medida de valor inferior àquela que atribuis à tua própria vida.", context:"O reconhecimento da dignidade do outro", tags:"próximo,amor,dignidade,reciprocidade", active:true },
  { id:"b372", ref:"Mateus 22:40",   text:"Toda a Lei e aquilo que foi anunciado pelos profetas encontram sustentação nesses dois princípios. Sem compreender o amor a Deus e ao próximo, podereis conhecer a estrutura dos mandamentos sem alcançar a natureza daquilo que os sustenta.", context:"O fundamento de toda a Lei", tags:"Lei,profetas,fundamento,amor", active:true },
  { id:"b373", ref:"Mateus 22:42",   text:"Que compreendeis acerca do Messias? Limitais sua identidade à linhagem humana da qual esperais que proceda?", context:"A identidade do Messias", tags:"Messias,identidade,linhagem,compreensão", active:true },
  { id:"b374", ref:"Mateus 22:43–44",text:"Como então Davi, falando sob inspiração do Espírito, reconhece como Senhor aquele que haveria de proceder de sua própria descendência? Pois declarou que o Senhor lhe concederia um lugar de autoridade até que seus inimigos fossem submetidos.", context:"A autoridade além da descendência", tags:"Davi,Messias,autoridade,Espírito", active:true },
  { id:"b375", ref:"Mateus 22:45",   text:"Se o próprio Davi o reconhece como Senhor, como poderia sua identidade ser plenamente explicada apenas pelo fato de ser seu descendente?", context:"Os limites das classificações humanas", tags:"identidade,Davi,classificação,Senhor", active:true },
  // Mateus 23
  { id:"b376", ref:"Mateus 23:2–3",  text:"Aqueles que ocupam o lugar de interpretação da Lei possuem a responsabilidade de ensinar aquilo que foi estabelecido. Contudo, não confundais o conhecimento que transmitem com a natureza de suas próprias ações, pois muitos ensinam aquilo que não estão dispostos a praticar.", context:"A distinção entre conhecimento e conduta", tags:"hipocrisia,ensino,prática,conduta", active:true },
  { id:"b377", ref:"Mateus 23:4",    text:"Estabelecem sobre os outros responsabilidades difíceis de suportar, mas não demonstram disposição para participar do peso que exigem que os demais carreguem.", context:"A imposição de fardos", tags:"fardos,exigência,hipocrisia,liderança", active:true },
  { id:"b378", ref:"Mateus 23:5",    text:"Realizam suas obras para que sejam contemplados pelos homens, ampliando os sinais exteriores de sua devoção como se a grandeza de sua aparência pudesse demonstrar a profundidade de sua relação com Deus.", context:"A espiritualidade como instrumento de exaltação", tags:"vaidade,aparência,devoção,reconhecimento", active:true },
  { id:"b379", ref:"Mateus 23:6–7",  text:"Desejam os lugares de honra, as posições de destaque e o reconhecimento público, pois transformaram aquilo que deveria conduzir os homens a Deus em instrumento para elevar sua própria identidade.", context:"A dependência do reconhecimento", tags:"honra,reconhecimento,vaidade,identidade", active:true },
  { id:"b380", ref:"Mateus 23:8",    text:"Não construais entre vós uma hierarquia de superioridade espiritual fundamentada em títulos, pois possuís um Mestre e, diante dele, sois irmãos.", context:"A igualdade espiritual", tags:"igualdade,títulos,hierarquia,irmãos", active:true },
  { id:"b381", ref:"Mateus 23:9",    text:"Não atribuais a nenhuma autoridade terrena o lugar absoluto daquele de quem procede vossa existência espiritual, pois vosso Pai está nos céus.", context:"A origem da paternidade espiritual", tags:"Pai,autoridade terrena,céus,espiritualidade", active:true },
  { id:"b382", ref:"Mateus 23:10",   text:"Não permitais que os títulos humanos substituam a autoridade daquele que verdadeiramente vos conduz, pois vosso guia é o Cristo.", context:"A autoridade suprema do ensinamento", tags:"Cristo,guia,títulos,autoridade", active:true },
  { id:"b383", ref:"Mateus 23:11",   text:"Aquele que possui verdadeira grandeza entre vós será reconhecido por sua disposição de servir, e não pela quantidade de pessoas que conseguiu colocar a serviço de sua própria vontade.", context:"A grandeza manifestada pelo serviço", tags:"grandeza,serviço,liderança,vontade", active:true },
  { id:"b384", ref:"Mateus 23:12",   text:"Aquele que dedica sua existência a elevar-se acima dos outros será humilhado, enquanto aquele que voluntariamente abandona a necessidade de exaltar-se será elevado.", context:"A inversão da exaltação", tags:"exaltação,humilhação,inversão,humildade", active:true },
  { id:"b385", ref:"Mateus 23:13",   text:"Ai daqueles que utilizam sua autoridade religiosa para estabelecer obstáculos entre os homens e o Reino dos Céus. Não entram naquilo que afirmam conhecer e ainda impedem a passagem daqueles que desejam aproximar-se.", context:"O controle do acesso ao Reino", tags:"obstáculo,reino,autoridade religiosa,hipócritas", active:true },
  { id:"b386", ref:"Mateus 23:14",   text:"Ai daqueles que se colocam entre o homem e Deus, fazendo daquilo que foi dado livremente um caminho que somente eles permitem atravessar.", context:"A apropriação da autoridade espiritual", tags:"apropriação,autoridade,acesso,Deus", active:true },
  { id:"b387", ref:"Mateus 23:15",   text:"Atravessais grandes distâncias para conquistar um único seguidor, mas, depois de conquistá-lo, reproduzis nele vossas próprias distorções, tornando sua condição espiritual ainda mais destrutiva que a vossa.", context:"A reprodução da corrupção espiritual", tags:"proselitismo,distorção,corrupção,seguidor", active:true },
  { id:"b388", ref:"Mateus 23:16–17",text:"Ai de vós, guias cegos, que atribuís maior importância ao ouro do templo do que ao próprio templo. Qual possui maior valor: a riqueza material ou aquilo que lhe confere significado sagrado?", context:"A inversão do valor sagrado", tags:"ouro,templo,valor,sagrado", active:true },
  { id:"b389", ref:"Mateus 23:18–19",text:"Atribuís maior autoridade à oferta colocada sobre o altar do que ao próprio altar. Não compreendeis que aquilo que ofereceis recebe seu significado daquilo a que é consagrado?", context:"A confusão entre o instrumento e sua finalidade", tags:"altar,oferta,significado,consagração", active:true },
  { id:"b390", ref:"Mateus 23:20–22",text:"Aquele que invoca o altar envolve também aquilo que sobre ele se encontra. Aquele que invoca o templo envolve aquele cuja presença lhe confere significado. E aquele que invoca os céus envolve o trono de Deus e aquele que nele possui autoridade.", context:"A unidade daquilo que pertence a Deus", tags:"altar,templo,céus,unidade", active:true },
  { id:"b391", ref:"Mateus 23:23",   text:"Ai daqueles que observam minuciosamente as menores obrigações religiosas, enquanto negligenciam aquilo que possui maior peso diante de Deus: a justiça, a misericórdia e a fidelidade. Deveríeis praticar estas coisas sem abandonar as demais.", context:"A religião sem justiça", tags:"justiça,misericórdia,fidelidade,religiosidade", active:true },
  { id:"b392", ref:"Mateus 23:24",   text:"Desenvolvestes tamanha preocupação em evitar pequenas transgressões que vos tornastes incapazes de reconhecer as grandes injustiças que acolheis em vossa própria existência. Filtrais o mosquito, mas engolis o camelo.", context:"A distorção das prioridades", tags:"mosquito,camelo,prioridades,injustiça", active:true },
  { id:"b393", ref:"Mateus 23:25",   text:"Purificais aquilo que os homens conseguem contemplar, enquanto vosso interior permanece ocupado pela exploração, pela avareza e pela ausência de domínio sobre vossos próprios desejos.", context:"A aparência da pureza", tags:"aparência,pureza,interior,exploração", active:true },
  { id:"b394", ref:"Mateus 23:26",   text:"Purifica primeiro aquilo que permanece oculto em teu interior, para que aquilo que manifestas exteriormente seja consequência de tua verdadeira natureza, e não uma tentativa de escondê-la.", context:"A transformação de dentro para fora", tags:"interior,purificação,exterior,natureza", active:true },
  { id:"b395", ref:"Mateus 23:27",   text:"Assemelhais-vos a sepulcros cuidadosamente ornamentados, cuja beleza exterior impede os homens de reconhecer a decomposição que permanece escondida em seu interior.", context:"A beleza que esconde a corrupção", tags:"sepulcro,aparência,corrupção,interior", active:true },
  { id:"b396", ref:"Mateus 23:28",   text:"Diante dos homens apresentais a aparência da justiça, mas interiormente permaneceis governados pela contradição entre aquilo que declarais ser e aquilo que verdadeiramente praticais.", context:"A identidade religiosa construída", tags:"aparência,justiça,contradição,identidade", active:true },
  { id:"b397", ref:"Mateus 23:29–30",text:"Construís monumentos para aqueles que anunciaram a verdade e foram rejeitados por vossos antepassados. Declarais que jamais teríeis participado de sua destruição, sem perceber que podeis reproduzir a mesma resistência diante daqueles que vos confrontam no presente.", context:"A falsa honra aos profetas", tags:"profetas,monumentos,resistência,antepassados", active:true },
  { id:"b398", ref:"Mateus 23:31–32",text:"Vossas próprias declarações testemunham a ligação que possuís com aqueles que rejeitaram os profetas. Ao reproduzirdes suas ações, completareis aquilo que eles começaram.", context:"A continuidade dos padrões humanos", tags:"continuidade,padrões,profetas,rejeição", active:true },
  { id:"b399", ref:"Mateus 23:33",   text:"Como escapareis do julgamento se utilizais aquilo que deveria conduzir os homens à justiça como instrumento para preservar vossa própria corrupção?", context:"A corrupção disfarçada de autoridade", tags:"julgamento,corrupção,autoridade,justiça", active:true },
  { id:"b400", ref:"Mateus 23:34",   text:"Enviarei entre vós profetas, sábios e homens instruídos. Entretanto, alguns serão mortos, outros perseguidos e outros rejeitados, pois a verdade continuará confrontando aquilo que vos recusais a transformar.", context:"A resistência diante dos mensageiros", tags:"profetas,perseguição,rejeição,verdade", active:true },
  { id:"b401", ref:"Mateus 23:35–36",text:"Sobre esta geração recairá a responsabilidade pelo sangue justo derramado, desde Abel até Zacarias, pois chegastes ao ponto de reproduzir aquilo que afirmáveis condenar na história de vossos antepassados.", context:"A responsabilidade acumulada", tags:"responsabilidade,sangue,geração,julgamento", active:true },
  { id:"b402", ref:"Mateus 23:37",   text:"Jerusalém, quantas vezes desejei reunir teus filhos e protegê-los, assim como uma ave reúne seus pequenos sob suas asas. Contudo, aquilo que desejava oferecer encontrou resistência naquilo que escolhestes recusar.", context:"O amor que não anula a liberdade", tags:"amor,liberdade,resistência,Jerusalém", active:true },
  { id:"b403", ref:"Mateus 23:38",   text:"Eis que aquilo que consideráveis vossa casa permanecerá desolado, pois rejeitastes a presença que desejava reunir-vos.", context:"As consequências da rejeição divina", tags:"desolação,rejeição,presença,casa", active:true },
  { id:"b404", ref:"Mateus 23:39",   text:"Não tornareis a contemplar-me até que reconheçais e acolhais aquele que vem revestido da autoridade do Senhor.", context:"O reconhecimento futuro", tags:"reconhecimento,autoridade,Senhor,futuro", active:true },
];

function parseBulkVerses(raw: string, existing: BibleEntry[]): BibleEntry[] {
  const nums = existing.map(e => parseInt(e.id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
  const startId = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  const results: BibleEntry[] = [];
  const lines = raw.split("\n");
  let ref = "", context = "", idx = 0;
  for (const line of lines) {
    const t = line.trim();
    const h = t.match(/^###\s+\*\*(.+?)(?:\s*[—–]\s*(.+?))?\s*\*\*\s*$/);
    if (h) { ref = h[1].trim(); context = h[2]?.trim() ?? ""; continue; }
    if (ref && t.startsWith(">")) {
      const q = t.match(/^>\s*[“"]([\s\S]+?)[”"]?\s*$/);
      if (q) {
        results.push({ id: `b${startId + idx}`, ref, text: q[1].replace(/[“”"]/g, "").trim(), context, tags: "", active: true });
        idx++; ref = ""; context = "";
      }
    }
  }
  return results;
}

const EMPTY_FORM: Omit<BibleEntry, "id" | "active"> = {
  ref: "", text: "", context: "", tags: "",
  interpretacao: "", crencas: "", valores: "", principios: "",
  prioridade: "contextual", validacao: "rascunho",
};

function VerseCard({ entry, onToggle, onTogglePrioridade, onRemove }: {
  entry: BibleEntry; onToggle: () => void; onTogglePrioridade: () => void; onRemove: () => void;
}) {
  return (
    <div className={`cerebro-entry${!entry.active ? " cerebro-entry--off" : ""}`}
      style={{ borderLeft: `3px solid ${entry.prioridade === "essencial" ? "#F59E0B" : "#C4A882"}` }}>
      <div className="cerebro-entry-top">
        <div className="cerebro-entry-meta" style={{ flexWrap: "wrap", gap: 4 }}>
          <span className="cerebro-tag" style={{ background: "#EBE3D8", color: "#6B5744", fontSize: 13, fontWeight: 800 }}>
            <BookOpen size={12} /> {entry.ref}
          </span>
          <button className={`cerebro-tag ${entry.prioridade === "essencial" ? "cerebro-tag--essential" : "cerebro-tag--contextual"}`}
            style={{ cursor: "pointer", border: "none" }} title="Clique para alternar prioridade"
            onClick={onTogglePrioridade}>
            {entry.prioridade === "essencial" ? "⭐ essencial" : "contextual"}
          </button>
          {entry.validacao && entry.validacao !== "rascunho" && (
            <span className={`cerebro-tag cerebro-tag--${entry.validacao}`}>
              {entry.validacao === "validado" ? "✓ validado" : "em revisão"}
            </span>
          )}
          {entry.tags && entry.tags.split(",").map(t => (
            <span key={t} className="admin-tag-pill">{t.trim()}</span>
          ))}
        </div>
        <div className="cerebro-entry-actions">
          <button className="icon-btn-sm" title={entry.active ? "Desativar" : "Ativar"} onClick={onToggle}>
            {entry.active ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button className="icon-btn-sm icon-btn-sm--danger" onClick={onRemove}><Trash2 size={15} /></button>
        </div>
      </div>
      {entry.text && <p style={{ fontSize: 14, fontStyle: "italic", margin: "8px 0 4px", lineHeight: 1.65 }}>"{entry.text}"</p>}
      {entry.context && <p style={{ fontSize: 12, color: "var(--admin-muted)", lineHeight: 1.5, marginTop: 4 }}>📌 {entry.context}</p>}
      {entry.interpretacao && (
        <p style={{ fontSize: 12, color: "#5A4535", lineHeight: 1.5, marginTop: 4, background: "#F9F5F0", borderRadius: 6, padding: "4px 8px" }}>
          💡 {entry.interpretacao}
        </p>
      )}
    </div>
  );
}

function FundamentosModule() {
  // --- Verse state ---
  const [entries, setEntries] = useState<BibleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<BibleEntry, "id" | "active">>(EMPTY_FORM);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkRaw, setBulkRaw] = useState("");
  const [bulkPreview, setBulkPreview] = useState<BibleEntry[]>([]);

  // --- View state ---
  const [view, setView] = useState<"subjects" | "all">("subjects");
  const [search, setSearch] = useState("");
  const [filterPrioridade, setFilterPrioridade] = useState<"todas" | "essencial" | "contextual">("todas");

  // --- Subject state ---
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [subjectSort, setSubjectSort] = useState<"alpha" | "count">("alpha");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [mergingWith, setMergingWith] = useState("");
  const [showNewSubject, setShowNewSubject] = useState(false);
  const [newSubjectLabel, setNewSubjectLabel] = useState("");
  const [newSubjectSynonyms, setNewSubjectSynonyms] = useState("");

  // Debounce ref para sync de assuntos
  const subjectSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Carrega dados do Supabase na entrada
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: dbEntries }, { data: dbSubjects }] = await Promise.all([
        supabase.from("brain_entries").select("*").order("updated_at", { ascending: true }),
        supabase.from("brain_subjects").select("*").order("label", { ascending: true }),
      ]);
      const loadedEntries = (dbEntries as BibleEntry[] ?? []);
      setEntries(loadedEntries.length > 0 ? loadedEntries : INITIAL_VERSES);
      setSubjects((dbSubjects as Subject[] ?? []).map(s => ({
        ...s,
        tags: (s.tags as unknown as string[]) ?? [],
        synonyms: (s.synonyms as unknown as string[]) ?? [],
        relatedIds: (s.relatedIds as unknown as string[]) ?? [],
      })));
      setLoading(false);
    })();
  }, []);

  // Sync assuntos para o Supabase com debounce (0.8s após última mudança)
  useEffect(() => {
    if (loading || subjects.length === 0) return;
    if (subjectSyncTimer.current) clearTimeout(subjectSyncTimer.current);
    subjectSyncTimer.current = setTimeout(async () => {
      await supabase.from("brain_subjects").upsert(
        subjects.map(s => ({ id: s.id, label: s.label, tags: s.tags, synonyms: s.synonyms, related_ids: s.relatedIds })),
        { onConflict: "id" }
      );
    }, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects]);

  const essential = entries.filter(e => e.prioridade === "essencial" && e.active);
  const totalTokens = estimateTokens(entries.filter(e => e.active).map(e => `${e.ref}: ${e.text}`).join("\n"));
  const essentialTokens = estimateTokens(essential.map(e => `${e.ref}: ${e.text}`).join("\n"));

  function nextId(): string {
    const nums = entries.map(e => parseInt(e.id.replace(/\D/g, ""), 10)).filter(n => !isNaN(n));
    return `b${nums.length > 0 ? Math.max(...nums) + 1 : 1}`;
  }

  async function add() {
    if (!form.ref.trim() || !form.text.trim()) return;
    const id = nextId();
    const newEntry: BibleEntry = { ...form, id, active: true };
    setEntries(e => [...e, newEntry]);
    setForm(EMPTY_FORM); setShowForm(false);
    await supabase.from("brain_entries").upsert(newEntry, { onConflict: "id" });
  }

  function analyzeBulk() { setBulkPreview(parseBulkVerses(bulkRaw, entries)); }

  // --- Subject functions ---
  function countForSubject(s: Subject) {
    return entries.filter(e => e.active && verseMatchesSubject(e, s)).length;
  }
  function versesForSubject(s: Subject) {
    return entries.filter(e => verseMatchesSubject(e, s));
  }
  function createSubject() {
    if (!newSubjectLabel.trim()) return;
    const id = `subj_${normalizeTagKey(newSubjectLabel)}_${Date.now()}`;
    setSubjects(ss => [...ss, {
      id, label: newSubjectLabel.trim(),
      tags: [newSubjectLabel.trim()],
      synonyms: newSubjectSynonyms.split(",").map(s => s.trim()).filter(Boolean),
      relatedIds: [],
    }].sort((a, b) => a.label.localeCompare(b.label, "pt-BR")));
    setNewSubjectLabel(""); setNewSubjectSynonyms(""); setShowNewSubject(false);
  }
  function saveSubjectEdit() {
    if (!editingSubject) return;
    setSubjects(ss => ss.map(s => s.id === editingSubject.id ? editingSubject : s));
    if (selectedSubject?.id === editingSubject.id) setSelectedSubject(editingSubject);
    setEditingSubject(null);
  }
  async function deleteSubject(id: string) {
    if (!confirm("Remover assunto? Os versículos não serão alterados.")) return;
    setSubjects(ss => ss.filter(s => s.id !== id));
    if (selectedSubject?.id === id) setSelectedSubject(null);
    await supabase.from("brain_subjects").delete().eq("id", id);
  }
  function mergeInto() {
    if (!selectedSubject || !mergingWith) return;
    const target = subjects.find(s => s.id === mergingWith);
    if (!target || !confirm(`Mesclar "${selectedSubject.label}" em "${target.label}"? O primeiro será removido.`)) return;
    const merged: Subject = {
      ...target,
      tags: [...new Set([...target.tags, ...selectedSubject.tags])],
      synonyms: [...new Set([...target.synonyms, ...selectedSubject.synonyms, selectedSubject.label])],
    };
    setSubjects(ss => ss.map(s => s.id === target.id ? merged : s).filter(s => s.id !== selectedSubject.id));
    setSelectedSubject(null); setMergingWith(""); setEditingSubject(null);
  }
  async function confirmBulk() {
    if (!bulkPreview.length) return;
    setEntries(e => [...e, ...bulkPreview]);
    setBulkRaw(""); setBulkPreview([]); setShowBulk(false);
    await supabase.from("brain_entries").upsert(bulkPreview, { onConflict: "id" });
  }

  async function toggle(id: string) {
    const entry = entries.find(x => x.id === id);
    if (!entry) return;
    const newActive = !entry.active;
    setEntries(e => e.map(x => x.id === id ? { ...x, active: newActive } : x));
    await supabase.from("brain_entries").update({ active: newActive }).eq("id", id);
  }
  async function togglePrioridade(id: string) {
    const entry = entries.find(x => x.id === id);
    if (!entry) return;
    const newPrio = entry.prioridade === "essencial" ? "contextual" : "essencial";
    setEntries(e => e.map(x => x.id === id ? { ...x, prioridade: newPrio } : x));
    await supabase.from("brain_entries").update({ prioridade: newPrio }).eq("id", id);
  }
  async function remove(id: string) {
    if (!confirm("Remover versículo?")) return;
    setEntries(e => e.filter(x => x.id !== id));
    await supabase.from("brain_entries").delete().eq("id", id);
  }

  const filteredSubjects = subjects
    .filter(s => !subjectSearch || s.label.toLowerCase().includes(subjectSearch.toLowerCase())
      || s.synonyms.some(sy => sy.toLowerCase().includes(subjectSearch.toLowerCase())))
    .sort((a, b) => subjectSort === "count"
      ? countForSubject(b) - countForSubject(a)
      : a.label.localeCompare(b.label, "pt-BR"));

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.ref.toLowerCase().includes(q) || e.text.toLowerCase().includes(q) || e.tags.toLowerCase().includes(q) || (e.context ?? "").toLowerCase().includes(q);
    const matchFilter = filterPrioridade === "todas" || e.prioridade === filterPrioridade || (filterPrioridade === "contextual" && !e.prioridade);
    return matchSearch && matchFilter;
  });

  const tabStyle = (active: boolean) => ({
    padding: "8px 16px", fontSize: 13, fontWeight: active ? 700 : 400,
    border: "none", background: "none", cursor: "pointer" as const,
    borderBottom: active ? "2px solid var(--admin-accent)" : "2px solid transparent",
    color: active ? "var(--admin-accent)" : "var(--admin-muted)",
  });

  const sortBtnStyle = (active: boolean) => ({
    fontSize: 12, padding: "4px 10px", borderRadius: 999,
    border: "1px solid var(--admin-border)", cursor: "pointer" as const,
    background: active ? "var(--admin-accent)" : "none",
    color: active ? "#fff" : "var(--admin-muted)",
  });

  if (loading) return (
    <div className="cerebro-module" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
      <span style={{ color: "var(--admin-muted)", fontSize: 14 }}>Carregando dados...</span>
    </div>
  );

  return (
    <div className="cerebro-module">
      <div className="cerebro-module-header">
        <h3 className="cerebro-module-title">📖 Fundamentos</h3>
        <div style={{ display: "flex", gap: 8 }}>
          {view === "subjects" && !selectedSubject && (
            <button className="admin-btn-ghost" style={{ fontSize: 12 }} onClick={() => setShowNewSubject(s => !s)}>
              <Plus size={13} /> Novo assunto
            </button>
          )}
          <button className="admin-btn-ghost" style={{ fontSize: 12 }} onClick={() => { setShowBulk(s => !s); setShowForm(false); }}>
            <Upload size={13} /> Importar em Massa
          </button>
          <button className="admin-btn-sm" onClick={() => { setShowForm(s => !s); setShowBulk(false); }}>
            <Plus size={14} /> Novo versículo
          </button>
        </div>
      </div>
      <p className="cerebro-pillar-desc">Versículos, crenças e princípios que fundamentam a identidade e o comportamento do Ovelha.</p>

      {/* Stats Brain Engine */}
      <div className="cerebro-fund-stats">
        <span><strong>{entries.filter(e => e.active).length}</strong> versículos</span>
        <span><strong>{essential.length}</strong> essenciais</span>
        <span><strong>{subjects.length}</strong> assuntos</span>
        <span><Zap size={11} style={{ display: "inline", verticalAlign: "middle" }} /> <strong>~{essentialTokens.toLocaleString()}</strong> tokens essenciais</span>
        <span>Total: ~{totalTokens.toLocaleString()} tokens</span>
      </div>

      {/* Bulk import */}
      {showBulk && (
        <div className="cerebro-form" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Importação em Massa</p>
          <p style={{ fontSize: 12, color: "var(--admin-muted)", marginBottom: 10, lineHeight: 1.6 }}>
            Cole o texto no formato padrão. O sistema detecta:<br />
            <code style={{ background: "#EBE3D8", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>### **Referência — Contexto**</code> seguido de <code style={{ background: "#EBE3D8", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>&gt; "Texto do versículo"</code>
          </p>
          <textarea className="afield-textarea" rows={10}
            placeholder={'### **Mateus 1:1 — Título do versículo**\n\n> "Texto do versículo aqui..."\n\n### **Mateus 1:2 — Outro título**\n\n> "Outro texto..."'}
            value={bulkRaw} onChange={e => { setBulkRaw(e.target.value); setBulkPreview([]); }}
            style={{ fontFamily: "monospace", fontSize: 12 }} />
          {bulkPreview.length > 0 && (
            <div style={{ background: "#F4EFE8", border: "1px solid #D4C4B0", borderRadius: 8, padding: 12, marginTop: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "#3A2E28" }}>
                ✓ {bulkPreview.length} versículos identificados — prévia:
              </p>
              <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                {bulkPreview.slice(0, 8).map((v, i) => (
                  <div key={i} style={{ fontSize: 12, padding: "6px 10px", background: "#fff", borderRadius: 6, border: "1px solid #E0D3C4" }}>
                    <span style={{ fontWeight: 700, color: "#7A6552" }}>{v.ref}</span>
                    {v.context && <span style={{ color: "var(--admin-muted)", marginLeft: 6 }}>— {v.context}</span>}
                    <p style={{ marginTop: 3, fontStyle: "italic", lineHeight: 1.5 }}>"{v.text.slice(0, 100)}{v.text.length > 100 ? "…" : ""}"</p>
                  </div>
                ))}
                {bulkPreview.length > 8 && <p style={{ fontSize: 12, color: "var(--admin-muted)", textAlign: "center" }}>… e mais {bulkPreview.length - 8} versículos</p>}
              </div>
            </div>
          )}
          <div className="cerebro-form-actions" style={{ marginTop: 12 }}>
            <button className="admin-btn-ghost" onClick={() => { setShowBulk(false); setBulkRaw(""); setBulkPreview([]); }}>Cancelar</button>
            {bulkPreview.length === 0
              ? <button className="admin-btn-primary" onClick={analyzeBulk} disabled={!bulkRaw.trim()}><Search size={13} /> Analisar texto</button>
              : <button className="admin-btn-primary" onClick={confirmBulk}><Save size={13} /> Adicionar {bulkPreview.length} versículos</button>}
          </div>
        </div>
      )}

      {/* Formulário expandido */}
      {showForm && (
        <div className="cerebro-form" style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="afield">
              <label className="afield-label">Referência bíblica *</label>
              <input className="afield-input" placeholder="ex: João 3:16" value={form.ref}
                onChange={e => setForm(f => ({ ...f, ref: e.target.value }))} />
            </div>
            <div className="afield">
              <label className="afield-label">Prioridade</label>
              <div className="cerebro-prioridade-toggle" style={{ marginTop: 2 }}>
                <button type="button"
                  className={form.prioridade === "essencial" ? "active-essential" : ""}
                  onClick={() => setForm(f => ({ ...f, prioridade: "essencial" }))}>Essencial</button>
                <button type="button"
                  className={form.prioridade === "contextual" ? "active-contextual" : ""}
                  onClick={() => setForm(f => ({ ...f, prioridade: "contextual" }))}>Contextual</button>
              </div>
            </div>
          </div>
          <div className="afield">
            <label className="afield-label">Texto bíblico *</label>
            <textarea className="afield-textarea" rows={3} placeholder="Texto completo do versículo..."
              value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} />
          </div>
          <div className="afield">
            <label className="afield-label">Interpretação</label>
            <textarea className="afield-textarea" rows={2} placeholder="Como o Ovelha interpreta e aplica este versículo..."
              value={form.interpretacao ?? ""} onChange={e => setForm(f => ({ ...f, interpretacao: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="afield">
              <label className="afield-label">Fundamento central</label>
              <input className="afield-input" placeholder="ex: O descanso da existência" value={form.context}
                onChange={e => setForm(f => ({ ...f, context: e.target.value }))} />
            </div>
            <div className="afield">
              <label className="afield-label">Validação</label>
              <select className="afield-select" value={form.validacao ?? "rascunho"}
                onChange={e => setForm(f => ({ ...f, validacao: e.target.value as BibleEntry["validacao"] }))}>
                <option value="rascunho">Rascunho</option>
                <option value="revisao">Em revisão</option>
                <option value="validado">Validado</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="afield">
              <label className="afield-label">Crenças derivadas</label>
              <textarea className="afield-textarea" rows={2} placeholder="Crenças que emergem deste versículo..."
                value={form.crencas ?? ""} onChange={e => setForm(f => ({ ...f, crencas: e.target.value }))} />
            </div>
            <div className="afield">
              <label className="afield-label">Valores vinculados</label>
              <input className="afield-input" placeholder="ex: humildade, cuidado, presença" value={form.valores ?? ""}
                onChange={e => setForm(f => ({ ...f, valores: e.target.value }))} />
            </div>
          </div>
          <div className="afield">
            <label className="afield-label">Princípios</label>
            <textarea className="afield-textarea" rows={2} placeholder="Princípios práticos derivados deste versículo..."
              value={form.principios ?? ""} onChange={e => setForm(f => ({ ...f, principios: e.target.value }))} />
          </div>
          <div className="afield">
            <label className="afield-label">Tags</label>
            <input className="afield-input" placeholder="ex: amor, perdão, fé (separadas por vírgula)" value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          </div>
          <div className="cerebro-form-actions">
            <button className="admin-btn-ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}>Cancelar</button>
            <button className="admin-btn-primary" onClick={add} disabled={!form.ref.trim() || !form.text.trim()}>
              <Save size={14} /> Salvar versículo
            </button>
          </div>
        </div>
      )}

      {/* Formulário novo assunto */}
      {showNewSubject && view === "subjects" && !selectedSubject && (
        <div className="cerebro-form" style={{ marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="afield">
              <label className="afield-label">Nome do assunto *</label>
              <input className="afield-input" placeholder="ex: Fé" value={newSubjectLabel}
                onChange={e => setNewSubjectLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createSubject()} />
            </div>
            <div className="afield">
              <label className="afield-label">Sinônimos (separados por vírgula)</label>
              <input className="afield-input" placeholder="ex: confiança, crença" value={newSubjectSynonyms}
                onChange={e => setNewSubjectSynonyms(e.target.value)} />
            </div>
          </div>
          <div className="cerebro-form-actions">
            <button className="admin-btn-ghost" onClick={() => { setShowNewSubject(false); setNewSubjectLabel(""); setNewSubjectSynonyms(""); }}>Cancelar</button>
            <button className="admin-btn-primary" onClick={createSubject} disabled={!newSubjectLabel.trim()}><Save size={14} /> Criar assunto</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--admin-border)", marginBottom: 20 }}>
        <button style={tabStyle(view === "subjects")} onClick={() => { setView("subjects"); setSelectedSubject(null); }}>
          📂 Por assuntos
        </button>
        <button style={tabStyle(view === "all")} onClick={() => setView("all")}>
          📖 Todos os versículos
        </button>
      </div>

      {/* ═══ VIEW: ASSUNTOS ═══ */}
      {view === "subjects" && !selectedSubject && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <input className="admin-search" style={{ flex: 1 }}
              placeholder="Buscar assunto ou sinônimo..."
              value={subjectSearch} onChange={e => setSubjectSearch(e.target.value)} />
            <div style={{ display: "flex", gap: 4 }}>
              <button style={sortBtnStyle(subjectSort === "alpha")} onClick={() => setSubjectSort("alpha")}>A–Z</button>
              <button style={sortBtnStyle(subjectSort === "count")} onClick={() => setSubjectSort("count")}>Quantidade</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {filteredSubjects.map(subject => {
              const count = countForSubject(subject);
              return (
                <div key={subject.id} onClick={() => setSelectedSubject(subject)}
                  style={{ background: "#fff", border: "1px solid var(--admin-border)", borderRadius: 12,
                    padding: "14px 16px", cursor: "pointer", transition: "box-shadow 0.15s",
                    display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "var(--admin-text)" }}>{subject.label}</div>
                  {subject.synonyms.length > 0 && (
                    <div style={{ fontSize: 11, color: "var(--admin-muted)", lineHeight: 1.3 }}>
                      {subject.synonyms.slice(0, 2).join(", ")}
                    </div>
                  )}
                  <div style={{ marginTop: 10, display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "var(--admin-accent)" }}>{count}</span>
                    <span style={{ fontSize: 11, color: "var(--admin-muted)" }}>versículos</span>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredSubjects.length === 0 && (
            <p className="admin-empty">Nenhum assunto encontrado. {subjects.length === 0 && "Versículos sem tags não geram assuntos automaticamente."}</p>
          )}
        </>
      )}

      {/* ═══ VIEW: DETALHE DO ASSUNTO ═══ */}
      {view === "subjects" && selectedSubject && (
        <>
          {/* Cabeçalho do detalhe */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <button className="admin-btn-ghost" style={{ fontSize: 12 }} onClick={() => { setSelectedSubject(null); setEditingSubject(null); setMergingWith(""); }}>
              ← Assuntos
            </button>
            {editingSubject?.id === selectedSubject.id ? (
              <input className="afield-input" style={{ flex: 1, minWidth: 160, fontSize: 16, fontWeight: 700 }}
                value={editingSubject.label}
                onChange={e => setEditingSubject(s => s ? { ...s, label: e.target.value } : s)} />
            ) : (
              <h4 style={{ flex: 1, fontWeight: 800, fontSize: 16, margin: 0 }}>{selectedSubject.label}</h4>
            )}
            {editingSubject?.id === selectedSubject.id ? (
              <>
                <button className="admin-btn-primary" style={{ fontSize: 12 }} onClick={saveSubjectEdit}><Save size={13} /> Salvar</button>
                <button className="admin-btn-ghost" style={{ fontSize: 12 }} onClick={() => setEditingSubject(null)}>Cancelar</button>
              </>
            ) : (
              <>
                <button className="icon-btn-sm" title="Editar assunto" onClick={() => setEditingSubject({ ...selectedSubject })}>
                  <Zap size={14} />
                </button>
                <button className="icon-btn-sm icon-btn-sm--danger" title="Remover assunto" onClick={() => deleteSubject(selectedSubject.id)}>
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>

          {/* Edição de tags + sinônimos + mesclagem */}
          {editingSubject?.id === selectedSubject.id && (
            <div className="cerebro-form" style={{ marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="afield">
                  <label className="afield-label">Tags vinculadas (vírgula)</label>
                  <input className="afield-input" value={editingSubject.tags.join(", ")}
                    onChange={e => setEditingSubject(s => s ? { ...s, tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) } : s)} />
                </div>
                <div className="afield">
                  <label className="afield-label">Sinônimos (vírgula)</label>
                  <input className="afield-input" value={editingSubject.synonyms.join(", ")}
                    onChange={e => setEditingSubject(s => s ? { ...s, synonyms: e.target.value.split(",").map(t => t.trim()).filter(Boolean) } : s)} />
                </div>
                <div className="afield" style={{ gridColumn: "1 / -1" }}>
                  <label className="afield-label">Mesclar este assunto em outro (este será removido)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select className="afield-select" value={mergingWith} onChange={e => setMergingWith(e.target.value)} style={{ flex: 1 }}>
                      <option value="">— selecione o assunto de destino —</option>
                      {subjects.filter(s => s.id !== selectedSubject.id).map(s => (
                        <option key={s.id} value={s.id}>{s.label} ({countForSubject(s)} vers.)</option>
                      ))}
                    </select>
                    <button className="admin-btn-ghost" onClick={mergeInto} disabled={!mergingWith} style={{ fontSize: 12 }}>
                      Mesclar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sinônimos display */}
          {selectedSubject.synonyms.length > 0 && editingSubject?.id !== selectedSubject.id && (
            <div style={{ marginBottom: 12, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--admin-muted)" }}>Sinônimos:</span>
              {selectedSubject.synonyms.map(s => <span key={s} className="admin-tag-pill">{s}</span>)}
            </div>
          )}

          <p style={{ fontSize: 13, color: "var(--admin-muted)", marginBottom: 14 }}>
            {versesForSubject(selectedSubject).length} versículos vinculados
          </p>

          <div className="cerebro-entries">
            {versesForSubject(selectedSubject).map(entry => (
              <VerseCard key={entry.id} entry={entry}
                onToggle={() => toggle(entry.id)}
                onTogglePrioridade={() => togglePrioridade(entry.id)}
                onRemove={() => remove(entry.id)} />
            ))}
            {versesForSubject(selectedSubject).length === 0 && (
              <p className="admin-empty">Nenhum versículo corresponde às tags deste assunto. Edite as tags do assunto ou adicione sinônimos.</p>
            )}
          </div>
        </>
      )}

      {/* ═══ VIEW: TODOS OS VERSÍCULOS ═══ */}
      {view === "all" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
            <input className="admin-search" style={{ flex: 1 }}
              placeholder="Buscar por referência, texto, contexto ou tag..."
              value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: "flex", gap: 4 }}>
              {(["todas", "essencial", "contextual"] as const).map(f => (
                <button key={f} onClick={() => setFilterPrioridade(f)} style={sortBtnStyle(filterPrioridade === f)}>
                  {f === "todas" ? "Todas" : f === "essencial" ? "Essencial" : "Contextual"}
                </button>
              ))}
            </div>
          </div>
          {entries.length === 0 && !showForm && <p className="admin-empty">Nenhum versículo cadastrado.</p>}
          <div className="cerebro-entries">
            {filtered.map(entry => (
              <VerseCard key={entry.id} entry={entry}
                onToggle={() => toggle(entry.id)}
                onTogglePrioridade={() => togglePrioridade(entry.id)}
                onRemove={() => remove(entry.id)} />
            ))}
            {filtered.length === 0 && entries.length > 0 && (
              <p className="admin-empty">Nenhum resultado para "{search}".</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const PILLAR_PLACEHOLDERS: Record<string, string> = {
  identidade: `# Identidade do Ovelha

## Essência
O Ovelha é...

## Propósito
Existe para...

## Visão de mundo
Acredita que...

## Como se apresenta
Em suas próprias palavras: "Sou o Ovelha..."`,
  personalidade: `# Personalidade do Ovelha

## Como pensa
...

## Como sente
...

## Como age
...

## Como se relaciona
...`,
  comunicacao: `# Comunicação do Ovelha

## Tom de voz
...

## Vocabulário
...

## Dinâmica conversacional
...

## O que evita dizer
...`,
};

function MarkdownDocEditor({ pillarId, title, description }: { pillarId: string; title: string; description: string }) {
  const placeholder = PILLAR_PLACEHOLDERS[pillarId] ?? `# ${title}\n\nDescreva este pilar em Markdown...`;

  const [draft, setDraft] = useState("");
  const [published, setPublished] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLoaded(false);
    supabase.from("brain_pillars").select("draft,published,published_at").eq("id", pillarId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDraft(data.draft ?? "");
          setPublished(data.published ?? null);
          setPublishedAt(data.published_at ?? null);
        }
        setLoaded(true);
      });
  }, [pillarId]);

  const tokens = estimateTokens(draft);
  const publishedTokens = estimateTokens(published ?? "");
  const isDirty = draft !== (published ?? "");

  function handleDraftChange(value: string) {
    setDraft(value);
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      supabase.from("brain_pillars").upsert({ id: pillarId, draft: value }, { onConflict: "id" });
    }, 1000);
  }

  async function publish() {
    if (!draft.trim()) return;
    const now = new Date().toISOString();
    setPublished(draft);
    setPublishedAt(now);
    await supabase.from("brain_pillars").upsert(
      { id: pillarId, draft, published: draft, published_at: now },
      { onConflict: "id" }
    );
  }

  if (!loaded) return (
    <div className="cerebro-module" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
      <span style={{ color: "var(--admin-muted)", fontSize: 14 }}>Carregando...</span>
    </div>
  );

  return (
    <div className="cerebro-module">
      <div className="cerebro-module-header">
        <h3 className="cerebro-module-title">{title}</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="cerebro-token-badge"><Zap size={12} /> ~{tokens.toLocaleString()} tokens</span>
          <span className={`cerebro-tag ${published ? "cerebro-tag--live" : "cerebro-tag--draft"}`}>
            {published ? "Publicado" : "Rascunho"}
          </span>
        </div>
      </div>
      <p className="cerebro-pillar-desc">{description}</p>
      {publishedAt && published && (
        <p style={{ fontSize: 12, color: "var(--admin-muted)", marginBottom: 12 }}>
          Publicado em {new Date(publishedAt).toLocaleString("pt-BR")} ·{" "}
          <strong style={{ color: "#6B5744" }}>~{publishedTokens.toLocaleString()} tokens em produção</strong>
        </p>
      )}
      <textarea
        className="afield-textarea cerebro-doc-editor"
        rows={22}
        placeholder={placeholder}
        value={draft}
        onChange={e => handleDraftChange(e.target.value)}
      />
      <div className="cerebro-form-actions" style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: isDirty ? "#b45309" : "var(--admin-muted)" }}>
          {isDirty ? "⚠ Alterações não publicadas" : "✓ Em sincronia com produção"}
        </div>
        <button className="admin-btn-primary" onClick={publish} disabled={!draft.trim() || !isDirty}>
          <Send size={14} /> Publicar
        </button>
      </div>
      <div className="admin-alert admin-alert--info" style={{ marginTop: 16, fontSize: 12 }}>
        <Zap size={13} /> Brain Engine: após publicar, o contexto permanente será recompilado. Integre o banco de dados para persistência real.
      </div>
    </div>
  );
}

function CerebroPage() {
  const [activePillar, setActivePillar] = useState<string>("identidade");
  const [publishLoading, setPublishLoading] = useState(false);
  const [version] = useState("0.1-rascunho");

  async function publishAll() {
    setPublishLoading(true);
    const now = new Date().toISOString();
    const pillars = ["identidade", "personalidade", "comunicacao"];
    for (const id of pillars) {
      const { data } = await supabase.from("brain_pillars").select("draft").eq("id", id).maybeSingle();
      if (data?.draft?.trim()) {
        await supabase.from("brain_pillars").upsert(
          { id, published: data.draft, published_at: now },
          { onConflict: "id" }
        );
      }
    }
    setPublishLoading(false);
    alert("Versão publicada! Todos os pilares com rascunho foram compilados.");
  }

  const pillar = PILLARS.find(p => p.id === activePillar)!;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-header">
          <div>
            <h1 className="admin-page-title">Cérebro</h1>
            <p className="admin-page-sub">Brain Engine · Versão <strong>{version}</strong></p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="admin-btn-ghost"><Clock size={15} /> Histórico</button>
            <button className="admin-btn-primary" onClick={publishAll} disabled={publishLoading}>
              <Send size={15} /> {publishLoading ? "Compilando…" : "Publicar versão"}
            </button>
          </div>
        </div>

        <div className="cerebro-layout">
          <nav className="cerebro-nav">
            {PILLARS.map(p => (
              <button key={p.id}
                className={`cerebro-nav-item${activePillar === p.id ? " cerebro-nav-item--active" : ""}`}
                onClick={() => setActivePillar(p.id)}>
                <span>{p.icon}</span>
                <span>{p.label}</span>
                <ChevronRight size={14} style={{ marginLeft: "auto", opacity: 0.5 }} />
              </button>
            ))}
          </nav>

          <div className="cerebro-editor">
            {activePillar === "fundamentos" ? (
              <FundamentosModule />
            ) : (
              <MarkdownDocEditor
                pillarId={activePillar}
                title={`${pillar.icon} ${pillar.label}`}
                description={pillar.desc}
              />
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
