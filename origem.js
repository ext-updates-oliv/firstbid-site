(function () {
  "use strict";

  const CHAVE = "fb_origem";
  const CHAVE_SELLAUTH = "sa_attribution";
  const SESSENTA_DIAS_MS = 60 * 24 * 60 * 60 * 1000;
  const TRINTA_MINUTOS_MS = 30 * 60 * 1000;
  const CAMPOS_UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];

  function lerOrigemValida() {
    try {
      const origem = JSON.parse(window.localStorage.getItem(CHAVE));
      if (!origem || typeof origem !== "object" || Array.isArray(origem)) return null;
      if (!Number.isFinite(origem.expira) || origem.expira <= Date.now()) return null;
      return origem;
    } catch {
      return null;
    }
  }

  function utmsDaUrl() {
    const busca = new URLSearchParams(window.location.search || "");
    if (![...busca.keys()].some((chave) => chave.startsWith("utm_"))) return null;
    return Object.fromEntries(CAMPOS_UTM.map((campo) => [campo, busca.get(campo)]));
  }

  const agora = Date.now();
  const utms = utmsDaUrl();
  if (utms) {
    try {
      window.localStorage.setItem(
        CHAVE,
        JSON.stringify({
          ...utms,
          em: new Date(agora).toISOString(),
          expira: agora + SESSENTA_DIAS_MS,
        })
      );
    } catch {
      // Storage bloqueado nao pode impedir a pagina de carregar.
    }
  } else {
    const origem = lerOrigemValida();
    if (origem) {
      try {
        window.localStorage.setItem(
          CHAVE_SELLAUTH,
          JSON.stringify({
            ...Object.fromEntries(CAMPOS_UTM.map((campo) => [campo, origem[campo] ?? null])),
            expires: agora + TRINTA_MINUTOS_MS,
          })
        );
      } catch {
        // O checkout continua funcionando sem atribuicao quando nao ha storage.
      }
    }
  }

  window.fbOrigem = lerOrigemValida;
})();
