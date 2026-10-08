import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("download apresenta o FirstBid Web e a primeira conexao, sem instalador legado", () => {
  const html = read("install.html");

  assert.match(html, /https:\/\/app\.firstbid\.xyz/i);
  assert.match(html, /FirstBid Connector/i);
  assert.match(html, /Google Chrome/i);
  assert.match(html, /purchase email/i);
  assert.match(html, /6-digit code/i);
  assert.match(html, /Eldorado/i);
  assert.match(html, /Connect/i);
  assert.match(html, /phone|mobile/i);
  assert.match(html, /24\/7/i);
  assert.match(html, /3\.1\.4/i);
  assert.match(html, /Move my bot to FirstBid Web/i);
  assert.doesNotMatch(html, /\.exe|SmartScreen|run the installer/i);
});

test("home descreve conta e execucao hospedada, nao licenca por maquina", () => {
  const html = read("index.html");

  assert.match(html, /https:\/\/app\.firstbid\.xyz/i);
  assert.match(html, /24\/7/i);
  assert.doesNotMatch(html, /License-locked|tied to your machine|updates install/i);
});

test("pricing e termos nao orientam novos clientes por key ou maquina", () => {
  const pricing = read("pricing.html");
  const terms = read("terms.html");

  assert.doesNotMatch(pricing, /one machine|your machine/i);
  assert.doesNotMatch(terms, /license keys?|machine rules/i);
  assert.match(terms, /purchase email/i);
});
