# Chat ao vivo — guia do admin

## Comentários simulados (IA)

1. Envie o vídeo na aba **Vídeo** ou clique em **Gerar do vídeo (IA)** na aba **Chat**.
2. Abre um diálogo: escolha **quantos comentários** (8–50) e, se quiser, um **webinar antigo como base** de tom e temas.
3. A IA gera perguntas, comentários, reações e **respostas da equipe** logo depois de cada pergunta (para parecer conversa real, não só o visitante falando).
4. Revise na lista, ajuste textos e clique em **Salvar alterações**.

## Mensagens de dias anteriores

Comentários que participantes enviam na live ficam gravados com a **data da sessão (Brasília)**. Em uma nova live no dia seguinte, o chat **não mostra** mensagens de ontem — só as do dia atual e as simuladas configuradas no admin.

> Requer a migration `20260601100000_webinar_live_enhancements.sql` no Supabase.

## Reutilizar chat de outro webinar

**Opção A — importar mensagens prontas**

1. Aba **Chat** → bloco *Reutilizar chat de outro webinar*.
2. Escolha o webinar fonte → **Importar mensagens**.
3. **Salvar alterações**.

**Opção B — IA com base em outro webinar**

1. **Gerar do vídeo (IA)** → no diálogo, selecione o webinar em *Usar chat de outro webinar como base*.
2. A IA usa as mensagens antigas como referência e cria novas alinhadas à transcrição atual.

**Snapshot (backup neste webinar)**

1. Com o chat configurado, digite um nome (ex: `Live março`) → **Salvar snapshot**.
2. Snapshots ficam no banco (`webinar_chat_snapshots`) para histórico deste webinar.

## Moderação do chat

Na aba **Chat**, seção *Moderação do chat*:

- **Chat liberado para participantes** — desligue para bloquear envios (útil se alguém está perturbando). Mensagens simuladas e respostas da equipe continuam.
- **Palavras bloqueadas** — se a mensagem contiver o termo, ela **não é publicada** (nem no chat nem no banco).

Salve o webinar após mudar. Para liberar de novo na hora da live, volte ao admin, ligue o switch e salve.

## Depois que o vídeo acaba

- **Manter tela final (minutos)**: padrão 60 (1 h). O player fica no último frame com overlay *Webinar encerrado* e botão de checkout (gatilho tipo carrinho).
- Ajuste título e texto explicativo na mesma aba **Chat**.

## Público “assistindo”

Informe **início**, **meio** e **fim** da live. O número no player varia entre esses valores ao longo do vídeo (não fica fixo o tempo todo).
