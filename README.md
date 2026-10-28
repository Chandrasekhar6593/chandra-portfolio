# Nangili Chandra Sekhar — 3D Portfolio

A single-page, 3D portfolio built for SDM / telecom deployment roles.
No build step, no framework — plain HTML, CSS and Three.js.

## Files

```
index.html            markup + content
styles.css            design system, layout, responsive rules
main.js               Three.js hero scene + interactions
assets/
  Nangili_Chandra_Sekhar_Resume.pdf   served by the "Download resume" buttons
frame-test.html       (temporary dev harness — safe to delete)
```

## Preview locally

```powershell
cd "C:\Users\chand\OneDrive\Documents\Default Project"
python -m http.server 8787
```

Then open <http://localhost:8787>. Opening `index.html` directly also works.

## What's in the page

- **3D hero** — a telecom-core visualisation: a central node with 21 orbiting
  network functions, inter-node links, orbital rings and a particle field.
  Reacts to the pointer, pauses when off-screen or the tab is hidden.
- **Scroll reveals**, animated counters, typing role titles, scroll progress bar.
- **3D tilt cards** for expertise and "how I work" sections.
- Sections: About, Expertise (SDM / deployment / cloud-native / signalling),
  Experience timeline, Highlights, Education, Contact.
- Fully responsive, keyboard accessible, respects `prefers-reduced-motion`,
  Lighthouse: Accessibility 100 · Best Practices 100 · SEO 100.

## Before you publish — 2 things to check

1. **LinkedIn URL** — linked to
   `https://www.linkedin.com/in/nangili-chandra-sekhar-169219246`.
2. **Location line** — "Based in India · open to relocation" and the contact
   footer line; adjust to your actual city / preference.
3. **Resume file** — if you update your CV, replace
   `assets/Nangili_Chandra_Sekhar_Resume.pdf` (keep the filename so the buttons
   keep working, or update both `href`s in `index.html`).

Everything else (summary, skills, timeline bullets, education, languages) comes
from your current resume.

## Deploy it free

**GitHub Pages** (works with the `gh` CLI you already have):

```powershell
cd "C:\Users\chand\OneDrive\Documents\Default Project"
git init -b main
git add .
git commit -m "Add portfolio site"
gh repo create chandra-portfolio --public --source=. --push
gh api -X POST repos/:owner/chandra-portfolio/pages -f "source[branch]=main" -f "source[path]=/"
```

Site URL: `https://<your-username>.github.io/chandra-portfolio/`

**Netlify / Vercel** — drag the folder onto <https://app.netlify.com/drop>, or
import the repo. No build command, publish directory `.`.

## Notes

- Three.js loads from jsDelivr; the page needs internet access for the 3D scene
  and Google Fonts. If the CDN is blocked, the rest of the page still works.
- To trim the scene for low-end phones, lower `NODES` and `particleCount` in
  `main.js`.
