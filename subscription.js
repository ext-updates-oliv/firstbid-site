(() => {
  "use strict";
  const API = "https://pay.firstbid.xyz/subscription/site";
  const TOKEN_KEY = "firstbid.subscription.session";
  const emailForm = document.getElementById("emailForm");
  const codeForm = document.getElementById("codeForm");
  const emailInput = document.getElementById("subscriptionEmail");
  const codeInput = document.getElementById("subscriptionCode");
  const codeEmail = document.getElementById("codeEmail");
  const alertBox = document.getElementById("subscriptionAlert");
  const account = document.getElementById("subscriptionAccount");
  const accountEmail = document.getElementById("accountEmail");
  const list = document.getElementById("subscriptionList");
  let pendingEmail = "";

  const token = () => sessionStorage.getItem(TOKEN_KEY) || "";
  function showMessage(message, error = false) {
    alertBox.textContent = message || "";
    alertBox.hidden = !message;
    alertBox.dataset.state = error ? "error" : "ok";
  }
  function busy(form, value) {
    form.querySelectorAll("input, button").forEach((element) => { element.disabled = value; });
  }
  async function call(path, { method = "GET", body, authenticated = false } = {}) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(authenticated ? { Authorization: `Bearer ${token()}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error || "Subscription service unavailable");
      error.status = response.status;
      throw error;
    }
    return payload;
  }
  function date(value) {
    if (!value) return "date unavailable";
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "date unavailable" : parsed.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }
  function money(item) {
    if (item.price == null) return "Price unavailable";
    return `${item.currency || "USD"} ${item.price} every ${item.intervalCount || item.durationDays || "?"} ${item.interval || "days"}`;
  }
  function amount(value, currency = "USD") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? new Intl.NumberFormat(undefined, {
      style: "currency", currency, minimumFractionDigits: 2,
    }).format(parsed) : `${currency} ${value}`;
  }
  function statusText(item) {
    if (item.cancelAtPeriodEnd) return `Cancels at the end of the paid period · ${date(item.currentPeriodEnd || item.nextRenewalAt)}`;
    if (item.status === "past_due") return "Payment pending";
    if (item.status === "active" || item.status === "trialing") return `Active · renews ${date(item.nextRenewalAt)}`;
    if (item.status === "cancelled") return `Cancelled · access through ${date(item.currentPeriodEnd)}`;
    if (item.status === "expired") return "Expired";
    return String(item.status || "Pending").replace(/_/g, " ");
  }
  function button(label) {
    const element = document.createElement("button");
    element.type = "button";
    element.className = "btn btn-ghost btn-small";
    element.textContent = label;
    return element;
  }
  function subscriptionCard(item) {
    const card = document.createElement("article");
    card.className = "subscription-account-item";
    const heading = document.createElement("h3");
    heading.textContent = item.game || item.variantName || "FirstBid subscription";
    const state = document.createElement("p");
    state.className = "subscription-account-state";
    state.textContent = statusText(item);
    const details = document.createElement("p");
    details.className = "subscription-account-details";
    details.textContent = `${item.variantName || `${item.durationDays || "?"} days`} · ${money(item)} · ${item.renewalMethod === "automatic" ? "automatic renewal" : "renewal invoice by email"}`;
    card.append(heading, state, details);
    const actions = document.createElement("div");
    actions.className = "subscription-account-actions";
    if (item.aiActive && item.aiUntil) {
      const entitlement = document.createElement("p");
      entitlement.className = "subscription-account-details";
      entitlement.textContent = `AI paid through ${date(item.aiUntil)}.`;
      card.append(entitlement);
    }
    if (item.aiActive && item.aiPlan !== true) {
      const renewal = document.createElement("p");
      renewal.className = "subscription-account-details";
      renewal.textContent = `Your current renewal returns to without AI on ${date(item.aiRenewalReturnsToBaseAt)}.`;
      const changeRenewal = document.createElement("a");
      changeRenewal.className = "btn btn-ghost btn-small";
      changeRenewal.href = "/pricing";
      changeRenewal.textContent = "Change the next renewal to an AI plan";
      actions.append(changeRenewal);
      card.append(renewal);
    }
    if (item.upgrade) {
      const renewal = document.createElement("p");
      renewal.className = "subscription-account-details";
      renewal.textContent = `This upgrade covers the current remaining days. Your renewal stays without AI from ${date(item.aiRenewalReturnsToBaseAt)}; subscribing to the AI plan cancels the plan without AI at the end of its period.`;
      card.append(renewal);
      const upgrade = button(`Add AI to ${item.upgrade.days} remaining days — ${amount(item.upgrade.amount, item.upgrade.currency)}`);
      upgrade.addEventListener("click", async () => {
        upgrade.disabled = true;
        showMessage("Creating your exact AI upgrade checkout…");
        try {
          const payload = await call("/upgrade-ai", {
            method: "POST", body: { gamePrefix: item.gamePrefix }, authenticated: true,
          });
          window.location.assign(payload.checkoutUrl);
        } catch (error) {
          upgrade.disabled = false;
          showMessage(error.message, true);
        }
      });
      actions.append(upgrade);
    }
    if (["active", "trialing"].includes(item.status) && !item.cancelAtPeriodEnd) {
      const cancel = button("Cancel at period end");
      cancel.addEventListener("click", async () => {
        if (!window.confirm(`Cancel ${heading.textContent} at the end of the paid period? You keep access until then.`)) return;
        cancel.disabled = true;
        showMessage("Scheduling cancellation…");
        try {
          render(await call("/cancel", { method: "POST", body: { subscriptionId: item.id }, authenticated: true }));
          showMessage("Cancellation scheduled. Your paid access remains active until the period ends.");
        } catch (error) {
          cancel.disabled = false;
          showMessage(error.message, true);
        }
      });
      actions.append(cancel);
    }
    if (item.paymentUrl) {
      const payment = document.createElement("a");
      payment.className = "btn btn-primary btn-small";
      payment.href = item.paymentUrl;
      payment.target = "_blank";
      payment.rel = "noopener";
      payment.textContent = "Pay renewal invoice";
      actions.append(payment);
    }
    if (item.canDowngradeAi) {
      const downgrade = button("Go back to without AI");
      downgrade.addEventListener("click", async () => {
        if (!window.confirm("Open the checkout for the plan without AI? Once it is paid, the AI renewal is cancelled at the end of its period. Your already-paid AI stays active until its paid date.")) return;
        downgrade.disabled = true;
        showMessage("Preparing the without-AI subscription…");
        try {
          const payload = await call("/downgrade-ai", {
            method: "POST", body: { subscriptionId: item.id }, authenticated: true,
          });
          window.location.assign(payload.checkoutUrl);
        } catch (error) {
          downgrade.disabled = false;
          showMessage(error.message, true);
        }
      });
      actions.append(downgrade);
      const explanation = document.createElement("p");
      explanation.className = "subscription-account-details";
      explanation.textContent = `Your paid AI remains available through ${date(item.aiUntil)}. The without-AI period is added after it.`;
      card.append(explanation);
    }
    if (actions.children.length) card.append(actions);
    return card;
  }
  function legacyCard(item) {
    const card = document.createElement("article");
    card.className = "subscription-account-item subscription-account-item-legacy";
    const heading = document.createElement("h3");
    heading.textContent = item.game || item.gamePrefix || "Older license";
    const state = document.createElement("p");
    state.className = "subscription-account-state";
    state.textContent = item.active ? `Older one-time access · ends ${date(item.expiresAt)}` : "Older access · expired";
    const note = document.createElement("p");
    note.className = "subscription-account-details";
    note.textContent = "This is not recurring. Your next purchase for this game uses the subscription plans.";
    card.append(heading, state, note);
    return card;
  }
  function render(payload) {
    emailForm.hidden = true;
    codeForm.hidden = true;
    account.hidden = false;
    accountEmail.textContent = payload.email;
    list.replaceChildren();
    const covered = new Set((payload.subscriptions || []).map((item) => item.gamePrefix).filter(Boolean));
    for (const item of payload.subscriptions || []) list.append(subscriptionCard(item));
    for (const license of payload.licenses || []) if (!covered.has(license.gamePrefix)) list.append(legacyCard(license));
    if (!list.children.length) {
      const empty = document.createElement("p");
      empty.className = "subscription-empty";
      empty.textContent = "No subscriptions were found for this email.";
      list.append(empty);
    }
  }
  function signOut(message = "") {
    sessionStorage.removeItem(TOKEN_KEY);
    account.hidden = true;
    codeForm.hidden = true;
    emailForm.hidden = false;
    codeInput.value = "";
    if (message) showMessage(message, true);
  }

  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    pendingEmail = emailInput.value.trim().toLowerCase();
    busy(emailForm, true);
    showMessage("Sending your code…");
    try {
      await call("/request-code", { method: "POST", body: { email: pendingEmail } });
      emailForm.hidden = true;
      codeForm.hidden = false;
      codeEmail.textContent = pendingEmail;
      codeInput.focus();
      showMessage("Code sent. It expires shortly.");
    } catch (error) { showMessage(error.message, true); }
    finally { busy(emailForm, false); }
  });
  codeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    busy(codeForm, true);
    showMessage("Signing in…");
    try {
      const payload = await call("/verify-code", {
        method: "POST", body: { email: pendingEmail, code: codeInput.value.trim() },
      });
      sessionStorage.setItem(TOKEN_KEY, payload.token);
      render(payload);
      showMessage("");
    } catch (error) { showMessage(error.message, true); }
    finally { busy(codeForm, false); }
  });
  document.getElementById("changeEmail").addEventListener("click", () => signOut());
  document.getElementById("signOut").addEventListener("click", () => signOut());
  if (token()) {
    call("/status", { authenticated: true })
      .then(render)
      .catch((error) => signOut(error.status === 401 ? "Your session expired. Sign in again." : error.message));
  }
})();
