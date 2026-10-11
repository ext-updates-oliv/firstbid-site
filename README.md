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

## Deploy (VPS, desde 10/10)

O site saiu da Vercel (o plano grátis bateu 100% de 1M de requisições). Agora fica na
VPS, servido pela borda (`../vps/firstbid-borda`). **Push não publica mais nada**:

```bash
git commit ...                                   # aqui, no FirstBid-Site
../vps/firstbid-borda/publicar-site.sh           # sobe o HEAD, sem o que está no .vercelignore
```

O `vercel.json` continua aqui como referência: os mesmos redirects e rewrites estão no
`Caddyfile` da borda. Mudou um, mude o outro.

## Deploy antigo no Vercel (histórico)

1. Suba este repo pro GitHub (já feito, se você seguiu o fluxo com o Claude).
2. Em https://vercel.com, entre com sua conta GitHub.
3. "Add New… → Project" → selecione este repositório.
4. Framework preset: **Other** (site estático, sem build step). Não precisa mexer em
   mais nada — clique em Deploy.
5. Depois de comprar o domínio: no projeto no Vercel, vá em **Settings → Domains**,
   adicione o domínio, e siga as instruções de DNS que o Vercel mostrar (geralmente
   um registro `A` ou `CNAME` no seu provedor de domínio).

Todo `git push` na branch principal gera um deploy novo automaticamente.

## Imagens

- `logo.png` — a marca inteira: emblema dourado dentro do círculo, com bastante
  margem escura em volta. É a que o site e o Discord usam.
- `logo-loja.png` — **só pra SellAuth**, não é usada por nenhuma página daqui.
  É `logo.png` recortada em volta da lanterna (janela de 185px centrada em
  255,243 do original de 512, reescalada pra 512). A imagem do produto aparece
  no carrinho do checkout num thumbnail de ~36px: com a margem da `logo.png`
  original o emblema virava um borrão de 8px. O recorte existe só por isso.
- `logos/<slug>.png` — a marca de cada jogo, com o slug de `slugDoJogo()` em
  `pricing.js`. Mudar o slug de um jogo quebra a imagem dele em silêncio.
