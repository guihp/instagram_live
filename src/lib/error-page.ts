export function renderErrorPage(options?: { setup?: boolean }): string {
  const setupBlock = options?.setup
    ? `<a class="primary" href="/setup">Configurar ambiente</a>`
    : "";
  const secondaryHref = options?.setup ? "/setup" : "/";
  const secondaryLabel = options?.setup ? "Configurar ambiente" : "Go home";

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${options?.setup ? "Configure o ambiente" : "This page didn't load"}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #0f1114; color: #fff; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; font-weight: 400; }
      p { color: rgba(255,255,255,0.45); margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #73a5b6; color: #000; font-weight: 600; }
      .secondary { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.08); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${options?.setup ? "Ambiente não configurado" : "This page didn't load"}</h1>
      <p>${options?.setup ? "Adicione os secrets no Lovable Cloud e rode as migrations do Supabase. Esta página só aparece para quem está configurando o projeto." : "Something went wrong on our end. You can try refreshing or head back home."}</p>
      <div class="actions">
        ${setupBlock || `<button class="primary" onclick="location.reload()">Try again</button>`}
        <a class="secondary" href="${secondaryHref}">${secondaryLabel}</a>
      </div>
    </div>
  </body>
</html>`;
}
