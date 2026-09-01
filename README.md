# IT Portal — local utilities

These pages are deliberately **not** on `main`, because GitHub Pages serves
everything on `main` and these are meant to be run locally, not published.

    vault-builder.html   Encrypts the build secrets into assets/vault.json
    docs-builder.html    Encrypts the blank forms into assets/docs/*.enc.json,
                         and decrypts them back to the originals

Download the file and open it directly — both work from `file://` and neither
makes a network call. Nothing you type into them leaves the browser.

## Rotating the passphrase

The plaintext documents are no longer stored anywhere in the repository, so
recover them before you rotate:

1. `docs-builder.html` → *Recover an original*, once per `.enc.json`, using the
   **current** passphrase.
2. `vault-builder.html` → build a new `assets/vault.json` under the new phrase.
3. `docs-builder.html` → load that new vault, pick the recovered originals, and
   re-encrypt. A document left on the old passphrase stops opening: the site
   checks the salt and says so rather than failing silently.
