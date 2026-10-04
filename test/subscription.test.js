import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("pagina de assinatura explica renovacao, cancelamento e gerenciamento sem metricas", () => {
  const html = read("subscription.html");
  assert.match(html, /Card and\s+PayPal renew automatically/i);
  assert.match(html, /renewal invoice\s+by email/i);
  assert.match(html, /keep access until the paid period ends/i);
  assert.match(html, /firstbid\.mysellauth\.com\/customer\/subscriptions/g);
  assert.match(html, />Manage my subscription</);
  assert.doesNotMatch(html, /\b\d+\s*(users|customers|sellers|clients)\b/i);
  assert.doesNotMatch(html, /testimonial|review/i);
});

test("pricing declara recorrencia e cancelamento em todos os planos", () => {
  const html = read("pricing.html");
  for (const days of [3, 7, 30]) {
    assert.ok((html.match(new RegExp(`Billed every ${days} days`, "g")) || []).length >= 2, `${days} dias no jogo e passe`);
  }
  assert.ok((html.match(/Cancel anytime/g) || []).length >= 6);
});

test("menus e rewrite expoem Subscription sem publicar nada", () => {
  for (const file of ["index.html", "pricing.html", "install.html"]) {
    assert.match(read(file), /href="\/subscription"[^>]*>Subscription</, file);
  }
  const config = JSON.parse(read("vercel.json"));
  assert.ok(config.rewrites.some((item) => item.source === "/subscription" && item.destination === "/subscription.html"));
});
