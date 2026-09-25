import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const CODIGO = fs.readFileSync(path.join(AQUI, "..", "origem.js"), "utf8");

function storageEmMemoria(inicial = {}) {
  const dados = new Map(Object.entries(inicial));
  return {
    getItem(chave) {
      return dados.has(chave) ? dados.get(chave) : null;
    },
    setItem(chave, valor) {
      dados.set(chave, String(valor));
    },
    valor(chave) {
      return dados.get(chave);
    },
  };
}

function executar({ search = "", storage = storageEmMemoria(), semStorage = false } = {}) {
  const window = { location: { search } };
  if (semStorage) {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("storage bloqueado");
      },
    });
  } else {
    window.localStorage = storage;
  }
  vm.runInNewContext(CODIGO, { window, URLSearchParams, Date, JSON });
  return { window, storage };
}

test("URL com UTM grava fb_origem por 60 dias", () => {
  const antes = Date.now();
  const { storage, window } = executar({
    search: "?utm_source=eldorado&utm_campaign=rank&utm_medium=post",
  });
  const origem = JSON.parse(storage.valor("fb_origem"));

  assert.equal(origem.utm_source, "eldorado");
  assert.equal(origem.utm_campaign, "rank");
  assert.equal(origem.utm_medium, "post");
  assert.equal(origem.utm_content, null);
  assert.ok(origem.expira >= antes + 60 * 24 * 60 * 60 * 1000);
  assert.equal(window.fbOrigem().utm_source, "eldorado");
});

test("URL sem UTM renova sa_attribution por 30 minutos", () => {
  const storage = storageEmMemoria({
    fb_origem: JSON.stringify({
      utm_source: "eldorado",
      utm_medium: null,
      utm_campaign: "custom",
      utm_content: null,
      em: new Date().toISOString(),
      expira: Date.now() + 60_000,
    }),
  });
  const antes = Date.now();
  executar({ storage });
  const atribuicao = JSON.parse(storage.valor("sa_attribution"));

  assert.deepEqual(Object.keys(atribuicao), [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "expires",
  ]);
  assert.equal(atribuicao.utm_source, "eldorado");
  assert.equal(atribuicao.utm_campaign, "custom");
  assert.ok(atribuicao.expires >= antes + 30 * 60 * 1000);
});

test("origem expirada e ignorada", () => {
  const storage = storageEmMemoria({
    fb_origem: JSON.stringify({ utm_source: "eldorado", expira: Date.now() - 1 }),
  });
  const { window } = executar({ storage });

  assert.equal(window.fbOrigem(), null);
  assert.equal(storage.valor("sa_attribution"), undefined);
});

test("site continua funcionando sem localStorage", () => {
  let resultado;
  assert.doesNotThrow(() => {
    resultado = executar({ search: "?utm_source=discord", semStorage: true });
  });
  assert.equal(resultado.window.fbOrigem(), null);
});
