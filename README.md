# Facundo Leis Pou — Résumé (GitHub Pages)

Static résumé site and PDF for job applications.

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
npx --yes serve .
```

## GitHub Pages

1. Create a new repository on GitHub (e.g. `resume` or `facundo-leis-resume`).
2. Push this folder’s contents as the default branch (`main`).
3. In the repo on GitHub: **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Choose branch **main** and folder **/ (root)**, then save.

The site will be available at `https://<username>.github.io/<repo>/`.

## PDF for applications

- **Included file:** `Facundo_Leis_Pou_Resume_FullStack.pdf` — use this for email/ATS uploads when present.
- **Regenerate:** open `index.html`, use **Print / Save as PDF**, or run `.\scripts\export-pdf.ps1` if Edge is installed.

## Replace placeholder

In `index.html`, update the footer GitHub link to your real repository URL after you publish.
