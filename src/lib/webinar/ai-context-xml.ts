/** Schema XML do ai_context — chat ao vivo (participante já está assistindo). */

export const AI_CONTEXT_XML_TEMPLATE = `<webinar_context lang="pt-BR" audience="participantes_ja_inscritos">
  <overview>Resumo do que a aula aborda (2-3 frases, factual)</overview>

  <topics>
    <topic timestamp="00:00">
      <title>Nome do tópico</title>
      <summary>O que o apresentador explica neste trecho</summary>
      <terms>termos, ferramentas ou conceitos citados</terms>
    </topic>
  </topics>

  <content_clarifications>
    <clarification topic="nome do conceito">
      <question_typical>Como funciona X? / O que é Y?</question_typical>
      <answer>Explicação curta com base no que foi dito na aula</answer>
    </clarification>
  </content_clarifications>

  <recording>
    <available>true ou false — só se mencionado na transcrição</available>
    <details>Como/com quando a gravação fica disponível, se citado</details>
    <not_mentioned_use>Se não foi mencionado, deixe available vazio e details vazio</not_mentioned_use>
  </recording>

  <materials>
    <item>Slides, PDF, link de material — só se mencionado na aula</item>
  </materials>

  <offers>
    <!-- Apenas ofertas/botões citados DURANTE a aula (para gatilhos). NÃO use para explicar inscrição no chat. -->
    <offer timestamp="12:30" trigger_type="cart">
      <name>Nome da oferta</name>
      <description>O que é, em 1 frase</description>
      <mentioned_deadline>12:30 — só se o apresentador disser</mentioned_deadline>
    </offer>
  </offers>

  <live_chat_faqs>
    <!-- Dúvidas que participantes fazem ENQUANTO assistem — NÃO incluir inscrição/acesso/horário do evento -->
    <faq category="gravacao">
      <question>Fica gravado?</question>
      <answer>Resposta baseada só no que foi dito na transcrição</answer>
    </faq>
    <faq category="conteudo">
      <question>Dúvida sobre algo explicado na aula</question>
      <answer>Esclarecimento objetivo usando o conteúdo da transcrição</answer>
    </faq>
  </live_chat_faqs>

  <chat_persona>
    <role>Moderador/atendente presente no chat ao vivo</role>
    <tone>humanizado, calmo, objetivo — como colega ajudando</tone>
    <max_sentences>2</max_sentences>
    <style>frases curtas; responde a dúvida pontual; sem tom de vendedor</style>
    <never_mention>inscrição, cadastro, formulário, link de acesso, horário de início do evento, vagas limitadas</never_mention>
    <when_unknown>Diga que o apresentador pode abordar isso em instantes ou que a equipe confirma depois</when_unknown>
  </chat_persona>
</webinar_context>`;

export const AI_CONTEXT_XML_INSTRUCTIONS = `O campo "ai_context" DEVE ser XML válido seguindo o schema abaixo.

CONTEXTO IMPORTANTE: este XML alimenta o chat AO VIVO. Quem escreve no chat JÁ está assistindo ao webinar — já passou pela inscrição. NÃO gere conteúdo sobre como se inscrever, carrinho, formulário, link de acesso ou horário de começo.

${AI_CONTEXT_XML_TEMPLATE}

Regras de extração da transcrição:
- <topics>: mapa do conteúdo da aula com timestamps (MM:SS)
- <content_clarifications>: pontos que participantes costumam pedir para repetir ou esclarecer
- <recording>: preencha SOMENTE se a gravação for mencionada; senão deixe available e details vazios
- <materials>: só itens explicitamente citados na aula
- <offers>: ofertas/botões do vídeo (para gatilhos visuais) — sem linguagem de venda para o chat
- <live_chat_faqs>: 4-8 FAQs realistas DURANTE a live — categorias: gravacao, conteudo, materiais, ferramentas, termos. PROIBIDO: inscrição, cadastro, acesso, horário do evento, urgência de compra
- NÃO inclua <sample_replies> nem exemplos de resposta sobre inscrição
- <chat_persona>: tom de quem ajuda quem já está na sala
- Escape XML: & → &amp;, < → &lt;, > → &gt;`;

export const CHAT_REPLY_SYSTEM_PREFIX = `Você modera o chat ao vivo de um webinar em português do Brasil.

Quem pergunta JÁ ESTÁ ASSISTINDO — já se inscreveu antes. Nunca fale sobre inscrição, cadastro, formulário, link de acesso, horário de início ou "garantir vaga".

O contexto está em XML (<webinar_context>). Priorize:
- <live_chat_faqs> e <content_clarifications> para dúvidas similares
- <topics> para explicar conteúdo da aula
- <recording> APENAS se perguntarem sobre gravação
- <materials> se perguntarem sobre material de apoio
- <chat_persona> para tom e limites

Regras:
- Máximo 2 frases curtas (ideal: 1 frase + complemento)
- Tom humanizado, direto, sem exagero emocional ou tom de vendedor
- Esclareça conteúdo da aula com base no que foi dito — não invente
- Se a gravação não estiver no XML, diga que a equipe confirma em breve
- Se não souber, diga brevemente que o apresentador pode abordar isso
- Sem markdown, listas ou emojis em excesso`;

/** Indica se o conteúdo parece XML estruturado (vs. texto legado). */
export function isAiContextXml(value: string): boolean {
  return value.trimStart().startsWith("<webinar_context");
}
