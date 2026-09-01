# Schneider Geomatics — IT Portal

Static site. No build step, no server, no dependencies to install. Every page is
plain HTML, CSS and JavaScript; the PDF work happens in the browser.

    index.html            Home
    provision.html        Intake wizard -> filled SG-IT-014, spreadsheet row, prefilled checklist
    checklist.html        The 20-step build, on screen
    forms.html            Blank SG-IT-014 and blank checklist, decrypted on demand
    assets/vault.json     Encrypted build secrets
    assets/docs/*.enc.json  The blank form and the printable checklist, encrypted
    .nojekyll             Stops GitHub Pages running the files through Jekyll

The two builder utilities live on the **`tools` branch**, not here. Everything on
`main` is published by Pages, and those are meant to be run locally:

    git show tools:docs-builder.html > docs-builder.html

## Nothing readable is published

Both blank documents ship as AES-GCM ciphertext. Requesting one by URL returns
an encrypted blob; `forms.html` decrypts it in the browser after unlock and
hands it over as an object URL. The same is true of the wizard — it fills the
same encrypted template, so **provisioning requires unlock**.

The plaintext originals are not in this repository and not in its history. To
get one back, use *Recover an original* in `docs-builder.html`.

## Deploying to GitHub Pages

1. Push this folder to the repository root on `main`.
2. Settings -> Pages -> Source: `main` / `/ (root)`.
3. Private repository requires GitHub Pro (personal) or Team (organisation).
   The repo stays private; **the published site does not.** Anyone with the URL
   can read every file. Private Pages requires Enterprise Cloud.

## Before the first real use

Take `vault-builder.html` from the `tools` branch and run it locally (open the
file directly, it needs no server), enter the build password, security answer
and admin account name, choose a passphrase, and replace `assets/vault.json`
with the output. Until you do, the checklist shows `ask IT` wherever a
credential would appear.

Then run `docs-builder.html` to encrypt the blank documents under that same
passphrase. It refuses any phrase that does not open the vault, so a typo
cannot produce files that look fine and fail later.

Rotating the build password later means running the builder again and replacing
that one file.

## What the encryption does and does not do

The vault is AES-GCM, 256-bit, key derived with PBKDF2-SHA256 at 310,000
iterations over a random salt. Decryption happens in the browser and the
plaintext is held in memory for that tab only — never in localStorage, never in
a cookie, never sent anywhere.

That keeps the credentials out of a world-readable page. It does not make the
site private, and it does not survive a weak passphrase: anyone can download
`vault.json` and attack it offline for as long as they like. Pick a long phrase.

## Local development

Fetch calls mean `file://` will not work for the wizard. Serve it:

    python3 -m http.server 8080

Then open http://localhost:8080. The single-file offline build
(`SG_IT_Portal.html`) remains the right choice for bench machines with no
network.
