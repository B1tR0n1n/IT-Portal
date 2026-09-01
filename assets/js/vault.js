/* Shared site behaviour: build-secret vault, nav state, toast.
   The vault ships as AES-GCM ciphertext. Nothing here can reveal the
   plaintext without the passphrase — the key is derived at unlock time
   and held in memory only, never written to storage. */

const Vault = (() => {
  let plain = null;                       // decrypted payload, memory only
  const listeners = [];

  const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

  async function deriveKey(passphrase, salt, iterations) {
    const material = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      material, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  }

  async function unlock(passphrase) {
    const res = await fetch(window.SITE_ROOT + "assets/vault.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No vault published yet.");
    const v = await res.json();
    if (!v.ct) throw new Error("Vault is empty. Build one with the vault builder.");
    const key = await deriveKey(passphrase, b64(v.kdf.salt), v.kdf.iterations);
    let clear;
    try {
      clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(v.iv) }, key, b64(v.ct));
    } catch (e) {
      throw new Error("Passphrase rejected.");
    }
    plain = JSON.parse(new TextDecoder().decode(clear));
    listeners.forEach((fn) => fn(plain));
    paintChrome();
    return plain;
  }

  function lock() {
    plain = null;
    listeners.forEach((fn) => fn(null));
    paintChrome();
    document.querySelectorAll("[data-secret]").forEach(paintSecret);
  }

  const isOpen = () => plain !== null;
  const get = (k) => (plain ? plain[k] : null);
  const onChange = (fn) => { listeners.push(fn); fn(plain); };

  /* ---------------------------------------------------------- chrome */
  function paintChrome() {
    const btn = document.getElementById("lockbtn");
    if (!btn) return;
    btn.textContent = isOpen() ? "Build secrets unlocked" : "Locked";
    btn.classList.toggle("open", isOpen());
  }

  function paintSecret(el) {
    const key = el.dataset.secret;
    if (isOpen()) {
      el.textContent = get(key) || "—";
      el.classList.remove("locked");
      el.title = "";
    } else {
      el.textContent = el.dataset.mask || "•••••• locked";
      el.classList.add("locked");
      el.title = "Unlock to reveal";
    }
  }

  function bindSecrets() {
    document.querySelectorAll("[data-secret]").forEach((el) => {
      paintSecret(el);
      el.addEventListener("click", () => { if (!isOpen()) openModal(); });
    });
    onChange(() => document.querySelectorAll("[data-secret]").forEach(paintSecret));
  }

  /* ----------------------------------------------------------- modal */
  function openModal() {
    const m = document.getElementById("vaultmodal");
    if (!m) return;
    m.classList.add("show");
    const f = document.getElementById("vaultpass");
    f.value = "";
    document.getElementById("vaulterr").textContent = "";
    setTimeout(() => f.focus(), 30);
  }

  function closeModal() {
    const m = document.getElementById("vaultmodal");
    if (m) m.classList.remove("show");
  }

  function mountModal() {
    if (document.getElementById("vaultmodal")) return;
    const div = document.createElement("div");
    div.className = "modal";
    div.id = "vaultmodal";
    div.innerHTML = `
      <div class="box">
        <h4>Unlock build secrets</h4>
        <p>The standard build password and security answer are stored encrypted. They decrypt in this browser only, for this tab.</p>
        <input type="password" id="vaultpass" placeholder="Passphrase" autocomplete="off" spellcheck="false">
        <div class="err" id="vaulterr"></div>
        <div class="row">
          <button class="primary" id="vaultgo">Unlock</button>
          <button class="ghost" id="vaultcancel">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(div);

    const go = async () => {
      const err = document.getElementById("vaulterr");
      err.textContent = "Deriving key…";
      try {
        await unlock(document.getElementById("vaultpass").value);
        closeModal();
        toast("Build secrets unlocked");
      } catch (e) {
        err.textContent = e.message;
      }
    };

    document.getElementById("vaultgo").onclick = go;
    document.getElementById("vaultcancel").onclick = closeModal;
    document.getElementById("vaultpass").addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); go(); }
    });
    div.addEventListener("click", (e) => { if (e.target === div) closeModal(); });
  }

  function init() {
    mountModal();
    const btn = document.getElementById("lockbtn");
    if (btn) btn.onclick = () => (isOpen() ? lock() : openModal());
    paintChrome();
    bindSecrets();
  }

  return { init, unlock, lock, isOpen, get, onChange, openModal };
})();

function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.id = "toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2400);
}

document.addEventListener("DOMContentLoaded", () => Vault.init());
