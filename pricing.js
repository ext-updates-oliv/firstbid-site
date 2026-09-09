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
// Os 33 ids são reais e conferidos contra a API da loja em 2026-08-23:
// todos com preço certo, URL de entrega preenchida, quantidade travada em
// 1 e estoque infinito. Cada um também está no `productMap` do webhook na
// VM com a duração correspondente — sem isso o comprador pagaria e não
// receberia key. Se acrescentar um plano aqui, acrescente lá TAMBÉM.
//
// `rank` e `escopo` são o que cada jogo tem de DIFERENTE. Os outros dois
// pontos que a home mostrava por jogo ("Solo and Duo, priced separately" e
// "Custom messages, even per target rank") eram idênticos nos 11 — repetir
// 11 vezes é o que fazia a seção inchar. Agora aparecem uma vez só.
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

const CATALOGO = [
  { nome: "Fortnite", emoji: "🔫", logo: true,
    rank: "Battle Royale &amp; Reload rank boost", escopo: "Full price matrix by rank pair",
    variants: { 3: 1514852, 7: 1515755, 30: 1436014 } },
  { nome: "Valorant", emoji: "🎯", logo: true,
    rank: "Rank boost, Iron to Radiant", escopo: "Priced per server (EU, NA, AP, LATAM, BR, KR)",
    variants: { 3: 1515772, 7: 1515773, 30: 1436093 } },
  { nome: "Rocket League", emoji: "🚗", logo: true,
    rank: "Rank boost, Bronze to Supersonic Legend", escopo: "1v1, 2v2 and 3v3, priced separately",
    variants: { 3: 1515774, 7: 1515775, 30: 1436094 } },
  { nome: "Brawl Stars", emoji: "⭐", logo: true,
    rank: "Rank boost, Bronze to Pro", escopo: "No boost mode on this one — just rank pairs",
    variants: { 3: 1515776, 7: 1515777, 30: 1436095 } },
  { nome: "Rainbow Six Siege X", emoji: "🛡", logo: true,
    rank: "Rank boost, Copper to Champion", escopo: "Priced per region (NA, LATAM, EU, Oceania, APAC)",
    variants: { 3: 1515778, 7: 1515779, 30: 1436096 } },
  { nome: "Marvel Rivals", emoji: "🦸", logo: true,
    rank: "Rank boost, Bronze to One Above All", escopo: "Priced per platform (PC, PlayStation, Xbox)",
    variants: { 3: 1515780, 7: 1515781, 30: 1436097 } },
  { nome: "League of Legends", emoji: "⚔", logo: true,
    rank: "Rank boost, Iron to Challenger", escopo: "Priced per region — 11 regions supported",
    variants: { 3: 1515782, 7: 1515783, 30: 1436098 } },
  { nome: "EA Sports FC", emoji: "⚽", logo: true,
    rank: "Division Rivals boost, Division 10 to Elite", escopo: "Priced per platform (PC, PlayStation, Xbox)",
    variants: { 3: 1515784, 7: 1515785, 30: 1436099 } },
  { nome: "Apex Legends", emoji: "🏹", logo: true,
    rank: "Rank boost, Rookie to Apex Predator", escopo: "Priced per region (Americas, Europe, Oceania &amp; Asia)",
    variants: { 3: 1515786, 7: 1515787, 30: 1436100 } },
  { nome: "Call of Duty", emoji: "💥", logo: true,
    rank: "Rank boost, Bronze to Top 250", escopo: "Priced per title (Warzone, MW3, Black Ops 6, Black Ops 7)",
    variants: { 3: 1515788, 7: 1515789, 30: 1436101 } },
  { nome: "Overwatch", emoji: "🦾", logo: true,
    rank: "Rank boost, Bronze V to Top 500", escopo: "Priced per platform (PC, PlayStation, Xbox)",
    variants: { 3: 1515790, 7: 1515791, 30: 1473358 } },
];

const slugDoJogo = (nome) => nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function linkDeCheckout(variantId) {
  const params = new URLSearchParams();
  params.set("cart[0][productId]", String(SELLAUTH.productId));
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
    const AREAS = { "plan-tab-logo": 950, "jogo-logo-grande": 4200 };
    const TETOS = { "plan-tab-logo": 22, "jogo-logo-grande": 56 };
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
