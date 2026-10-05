import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("pagina de assinatura gerencia a conta no FirstBid e limita o portal externo", () => {
  const html = read("subscription.html");
  assert.match(html, /Card and\s+PayPal Checkout charge automatically/i);
  assert.match(html, /renewal invoice\s+by email/i);
  assert.match(html, /id="emailForm"/);
  assert.match(html, /id="codeForm"/);
  assert.match(html, /id="subscriptionList"/);
  assert.match(html, /Resume or change card/);
  assert.equal((html.match(/firstbid\.mysellauth\.com\/customer\/subscriptions/g) || []).length, 1);
  assert.match(html, /src="subscription\.js"/);
  assert.doesNotMatch(html, /\b\d+\s*(users|customers|sellers|clients)\b/i);
  assert.doesNotMatch(html, /testimonial|review/i);
});

test("cliente do site usa a sessao autenticada, sem enviar email nas rotas de status e cancelamento", () => {
  const script = read("subscription.js");
  assert.match(script, /https:\/\/pay\.firstbid\.xyz\/subscription\/site/);
  assert.match(script, /call\("\/request-code"/);
  assert.match(script, /call\("\/verify-code"/);
  assert.match(script, /call\("\/status"/);
  assert.match(script, /call\("\/cancel"/);
  assert.match(script, /Authorization:\s*`Bearer \$\{token\(\)\}`/);
  assert.doesNotMatch(script, /status[^\n]+email/i);
  assert.match(script, /body:\s*\{ subscriptionId: item\.id \}/);
  assert.match(script, /call\("\/upgrade-ai"/);
  assert.match(script, /body:\s*\{ gamePrefix: item\.gamePrefix \}/);
  assert.match(script, /call\("\/downgrade-ai"/);
  assert.doesNotMatch(script, /body:\s*\{[^}]*price/i);
  assert.match(script, /item\.aiActive && item\.aiPlan !== true/);
  assert.match(script, /Change the next renewal to an AI plan/);
});

test("pricing declara recorrencia e cancelamento em todos os planos", () => {
  const html = read("pricing.html");
  for (const days of [3, 7, 30]) {
    assert.ok((html.match(new RegExp(`Billed every ${days} days`, "g")) || []).length >= 2, `${days} dias no jogo e passe`);
  }
  assert.ok((html.match(/Cancel anytime/g) || []).length >= 6);
});

test("pricing separa os tres planos com IA e deixa o passe sem IA", () => {
  const html = read("pricing.html");
  for (const price of ["3.50", "7", "24"]) {
    assert.match(html, new RegExp(`plan-amount">${price.replace(".", "\\.")}<`));
  }
  assert.equal((html.match(/<a[^>]+data-ai-plan-cta/g) || []).length, 3);
  assert.match(html, /only after the buyer's first reply/i);
  assert.match(html, /maximum discount/i);
  assert.match(html, /agreed price, image, bot question or keyword/i);
  assert.match(html, /all-games pass below does not include AI negotiation/i);
  assert.match(html, /paying only the per-day difference/i);
  assert.match(html, /AI time already paid stays active/i);
  assert.match(read("index.html"), /Adding AI charges only the per-day price difference/i);
});

test("termos declaram retencao das conversas de IA por ate 90 dias", () => {
  const html = read("terms.html");
  assert.match(html, /Messages from conversations handled by the AI are stored for up to 90 days and may be used to improve the AI\./);
  assert.match(html, /#ffc950|styles\.css/);
});

test("menus e rewrites expoem Subscription e Terms sem publicar nada", () => {
  for (const file of ["index.html", "pricing.html", "install.html"]) {
    assert.match(read(file), /href="\/subscription"[^>]*>Subscription</, file);
  }
  const config = JSON.parse(read("vercel.json"));
  assert.ok(config.rewrites.some((item) => item.source === "/subscription" && item.destination === "/subscription.html"));
  assert.ok(config.rewrites.some((item) => item.source === "/terms" && item.destination === "/terms.html"));
});
