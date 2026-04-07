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

- **Included file:** `Facundo_Leis_Pou_Resume_FullStack.pdf` — attach or upload this for job applications (and keep the Markdown source in sync when you update your CV).
- **Regenerate:** open `index.html`, use **Print / Save as PDF**, or from this folder run:  
  `powershell -ExecutionPolicy Bypass -File .\scripts\export-pdf.ps1`  
  (requires Microsoft Edge).

## Push to GitHub (no GitHub CLI on this machine)

From this folder, create an empty repo on [GitHub](https://github.com/new) (no README/license if you are pushing an existing project), then:

```bash
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USER` and `YOUR_REPO` with your account and repository name.

## Replace placeholder

In `index.html`, update the footer GitHub link to your real repository URL after you publish.
