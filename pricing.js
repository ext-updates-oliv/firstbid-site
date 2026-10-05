// ==========================================================
// PRICING — jogo × duração, checkout direto na SellAuth
// ----------------------------------------------------------
// Vive em arquivo próprio porque duas páginas precisam dele: a de preço
// (que o usa inteiro) e a home (que usa só a lista de jogos pra montar a
// grade de marcas). Duplicar os 33 ids em dois HTMLs seria a receita pra
// eles divergirem em silêncio.
//
// FONTE ÚNICA dos ids. `variants` é {dias: variantId da SellAuth}.
//
// Os 42 ids são reais e conferidos contra a API da loja (33 em 2026-08-23,
// mais 9 em 2026-09-19):
// todos com preço certo, URL de entrega preenchida, quantidade travada em
// 1 e estoque infinito. Cada um também está no `productMap` do webhook na
// VM com a duração correspondente — sem isso o comprador pagaria e não
// receberia key. Se acrescentar um plano aqui, acrescente lá TAMBÉM.
//
// `rank` e `escopo` são o que cada jogo tem de DIFERENTE. Os outros dois
// pontos que a home mostrava por jogo ("Solo and Duo, priced separately" e
// "Custom messages, even per target rank") eram idênticos em todos — repetir
// por jogo é o que fazia a seção inchar. Agora aparecem uma vez só.
//
// O formato do link é o MESMO que `checkoutLink()` monta em
// FirstBid-Discord/lib.js — se um dia mudar lá, muda aqui também.
// ==========================================================
// `shopId` é o id NUMÉRICO da loja (260587), diferente do subdomínio em `base`.
// O embed exige os dois: o id pra saber de quem é o carrinho, a url pra saber
// onde ele mora. Confirmado no painel da SellAuth.
const SELLAUTH = {
  base: "https://firstbid.mysellauth.com",
  shopId: 260587,
  productId: 832908,
  currency: "USD",
};

// Passe de todos os jogos (25/09): produto proprio na SellAuth, porque o 884775
// ja esta com 9 das 10 variantes que o plano gratis permite. A VM entrega a key
// `ALL-` (productMap 892913:1749928 -> ALL, 7 dias), que o app trata como
// prefixo desconhecido e por isso destrava todos os jogos.
// 3 e 30 dias entraram na mesma noite (productMap 892913:1749990 -> ALL 3d e
// 892913:1749991 -> ALL 30d).
const PASSE = { productId: 892913, variants: { 3: 1749990, 7: 1749928, 30: 1749991 } };

// Preenchido somente DEPOIS de `scripts/iaSellauth.mjs --aplicar` criar as
// variantes e imprimir os ids conferidos. Enquanto estiver vazio, os tres
// botoes com IA aparecem como Coming soon e nunca montam um carrinho errado.
// Formato: { "fortnite": { 3: ID, 7: ID, 30: ID }, ... }.
// Desde 05/10 cada jogo tem PRODUTO proprio na SellAuth, com a arte do jogo
// (produtosPorJogo.mjs na VM). Os produtos antigos 832908/884775 so continuam
// para renovar as assinaturas que ja existiam.
const AI_VARIANTS = Object.freeze({
  "fortnite": { 3: 1769158, 7: 1769159, 30: 1769160 },
  "valorant": { 3: 1769164, 7: 1769165, 30: 1769166 },
  "rocket-league": { 3: 1769152, 7: 1769153, 30: 1769151 },
  "brawl-stars": { 3: 1769170, 7: 1769171, 30: 1769172 },
  "rainbow-six-siege-x": { 3: 1769176, 7: 1769177, 30: 1769178 },
  "marvel-rivals": { 3: 1769182, 7: 1769183, 30: 1769184 },
  "league-of-legends": { 3: 1769188, 7: 1769189, 30: 1769190 },
  "ea-sports-fc": { 3: 1769194, 7: 1769195, 30: 1769196 },
  "apex-legends": { 3: 1769200, 7: 1769201, 30: 1769202 },
  "call-of-duty": { 3: 1769206, 7: 1769207, 30: 1769208 },
  "overwatch": { 3: 1769212, 7: 1769213, 30: 1769214 },
  "counter-strike-2": { 3: 1769218, 7: 1769219, 30: 1769220 },
  "dota-2": { 3: 1769224, 7: 1769225, 30: 1769226 },
  "dead-by-daylight": { 3: 1769230, 7: 1769231, 30: 1769232 },
});

const CATALOGO = [
  { nome: "Fortnite", emoji: "🔫", logo: true, productId: 903532,
    rank: "Battle Royale &amp; Reload rank boost", escopo: "Full price matrix by rank pair",
    variants: { 3: 1769155, 7: 1769156, 30: 1769157 } },
  { nome: "Valorant", emoji: "🎯", logo: true, productId: 903533,
    rank: "Rank boost, Iron to Radiant", escopo: "Priced per server (EU, NA, AP, LATAM, BR, KR)",
    variants: { 3: 1769161, 7: 1769162, 30: 1769163 } },
  { nome: "Rocket League", emoji: "🚗", logo: true, productId: 903530,
    rank: "Rank boost, Bronze to Supersonic Legend", escopo: "1v1, 2v2 and 3v3, priced separately",
    variants: { 3: 1769149, 7: 1769150, 30: 1769148 } },
  { nome: "Brawl Stars", emoji: "⭐", logo: true, productId: 903534,
    rank: "Rank boost, Bronze to Pro", escopo: "No boost mode on this one — just rank pairs",
    variants: { 3: 1769167, 7: 1769168, 30: 1769169 } },
  { nome: "Rainbow Six Siege X", emoji: "🛡", logo: true, productId: 903535,
    rank: "Rank boost, Copper to Champion", escopo: "Priced per region (NA, LATAM, EU, Oceania, APAC)",
    variants: { 3: 1769173, 7: 1769174, 30: 1769175 } },
  { nome: "Marvel Rivals", emoji: "🦸", logo: true, productId: 903536,
    rank: "Rank boost, Bronze to One Above All", escopo: "Priced per platform (PC, PlayStation, Xbox)",
    variants: { 3: 1769179, 7: 1769180, 30: 1769181 } },
  { nome: "League of Legends", emoji: "⚔", logo: true, productId: 903537,
    rank: "Rank boost, Iron to Challenger", escopo: "Priced per region — 11 regions supported",
    variants: { 3: 1769185, 7: 1769186, 30: 1769187 } },
  { nome: "EA Sports FC", emoji: "⚽", logo: true, productId: 903538,
    rank: "Division Rivals boost, Division 10 to Elite", escopo: "Priced per platform (PC, PlayStation, Xbox)",
    variants: { 3: 1769191, 7: 1769192, 30: 1769193 } },
  { nome: "Apex Legends", emoji: "🏹", logo: true, productId: 903539,
    rank: "Rank boost, Rookie to Apex Predator", escopo: "Priced per region (Americas, Europe, Oceania &amp; Asia)",
    variants: { 3: 1769197, 7: 1769198, 30: 1769199 } },
  { nome: "Call of Duty", emoji: "💥", logo: true, productId: 903540,
    rank: "Rank boost, Bronze to Top 250", escopo: "Priced per title (Warzone, MW3, Black Ops 6, Black Ops 7)",
    variants: { 3: 1769203, 7: 1769204, 30: 1769205 } },
  { nome: "Overwatch", emoji: "🦾", logo: true, productId: 903541,
    rank: "Rank boost, Bronze V to Top 500", escopo: "Priced per platform (PC, PlayStation, Xbox)",
    variants: { 3: 1769209, 7: 1769210, 30: 1769211 } },
  // Os três de 19/09 vivem em OUTRO produto da SellAuth (884775). O plano
  // gratuito trava em 10 variantes por produto e o 832908 já tem 33 — não é
  // escolha de organização, é teto de terceiro. Por isso eles carregam
  // `productId` próprio; quem não carrega segue no `SELLAUTH.productId`.
  // Logos adicionados em 19/09, todos de DOMÍNIO PÚBLICO na Wikimedia Commons
  // (Valve, Behaviour Interactive, Valve Wiki Network) e gerados por
  // `FirstBid app/scripts/gerarIconeDeJogo.mjs`. Saem transparentes de
  // propósito: é o que o `brightness(0) invert(1)` do styles.css exige para
  // virar silhueta — um PNG com fundo sólido viraria um retângulo branco.
  { nome: "Counter-Strike 2", emoji: "🔪", logo: true, productId: 903542,
    rank: "Premier rating boost", escopo: "Priced per region — 7 regions supported",
    variants: { 3: 1769215, 7: 1769216, 30: 1769217 } },
  { nome: "Dota 2", emoji: "🛡", logo: true, productId: 903543,
    rank: "Rank boost, Herald I to Immortal", escopo: "Priced per region (NA, EU, SA, SEA)",
    variants: { 3: 1769221, 7: 1769222, 30: 1769223 } },
  { nome: "Dead by Daylight", emoji: "🔦", logo: true, productId: 903544,
    rank: "Rank boost, killer or survivor", escopo: "Priced per platform (PC, PlayStation, Xbox)",
    variants: { 3: 1769227, 7: 1769228, 30: 1769229 } },
];

const slugDoJogo = (nome) => nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function linkDeCheckout(variantId, productId = SELLAUTH.productId) {
  const params = new URLSearchParams();
  params.set("cart[0][productId]", String(productId));
  params.set("cart[0][variantId]", String(variantId));
  params.set("cart[0][quantity]", "1");
  params.set("currency", SELLAUTH.currency);
  // Mesma troca de %5B/%5D do lib.js: a SellAuth aceita os dois, mas o link
  // legível ajuda a depurar quando um pedido vier errado.
  return `${SELLAUTH.base}/checkout-link?${params.toString().replace(/%5B/g, "[").replace(/%5D/g, "]")}`;
}

/**
 * Monta a marca de um jogo (imagem com reserva de emoji).
 * Usada pelas abas da página de preço E pela grade da home — mesmo desenho
 * nos dois lugares, sem duplicar a regra do `onerror`.
 */
function marcaDoJogo(jogo, classe) {
  if (!jogo.logo) {
    const span = document.createElement("span");
    span.className = "plan-tab-marca";
    span.setAttribute("aria-hidden", "true");
    span.textContent = jogo.emoji;
    return span;
  }
  const img = document.createElement("img");
  img.className = classe;
  img.alt = "";
  img.decoding = "async";
  // Altura fixa NÃO funciona: as marcas vão de 1,5:1 (Apex) a 7:1 (Valorant),
  // e com a mesma altura o wordmark largo ocupa 4,5x a área do quadrado — o
  // olho lê isso como "uns jogos são mais importantes". Normalizar por ÁREA
  // resolve: altura = raiz(A/proporcao), tirada da proporção real do arquivo.
  img.addEventListener("load", () => {
    const r = img.naturalWidth / img.naturalHeight;
    if (!r || !isFinite(r)) return;
    // A normalizacao por AREA e a mesma nos tres contextos; muda so a area
    // disponivel. `jogo-logo-grande` e a grade da home, que ficou bem maior
    // no redesenho — sem uma area propria os logos boiavam na celula.
    const AREAS = { "plan-tab-logo": 950, "jogo-logo-grande": 4200, "passe-logo": 1100 };
    const TETOS = { "plan-tab-logo": 22, "jogo-logo-grande": 56, "passe-logo": 26 };
    const AREA = AREAS[classe] ?? 2600;
    const teto = TETOS[classe] ?? 40;
    img.style.height = `${Math.min(teto, Math.max(12, Math.sqrt(AREA / r)))}px`;
  });
  img.addEventListener("error", () => {
    img.replaceWith(document.createTextNode(jogo.emoji));
  });
  // SEM `loading="lazy"` e src DEPOIS dos listeners: imagem preguiçosa dentro
  // de container escondido pelo `[data-reveal]` não chega a carregar, e com a
  // imagem em cache o `load` dispara antes de existir quem escute.
  img.src = `logos/${slugDoJogo(jogo.nome)}.png`;
  return img;
}
