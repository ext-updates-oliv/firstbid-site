# FirstBid — landing page

Site estático (HTML/CSS puro, sem build) da FirstBid.

## Rodar localmente

Abra `index.html` num servidor local (não em `file://`, alguns navegadores bloqueiam
recursos locais). Exemplos:

```bash
npx serve .
# ou
python -m http.server 8080
```

## Deploy no Vercel

1. Suba este repo pro GitHub (já feito, se você seguiu o fluxo com o Claude).
2. Em https://vercel.com, entre com sua conta GitHub.
3. "Add New… → Project" → selecione este repositório.
4. Framework preset: **Other** (site estático, sem build step). Não precisa mexer em
   mais nada — clique em Deploy.
5. Depois de comprar o domínio: no projeto no Vercel, vá em **Settings → Domains**,
   adicione o domínio, e siga as instruções de DNS que o Vercel mostrar (geralmente
   um registro `A` ou `CNAME` no seu provedor de domínio).

Todo `git push` na branch principal gera um deploy novo automaticamente.
