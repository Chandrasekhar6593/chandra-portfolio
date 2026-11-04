# Nangili Chandra Sekhar — Portfolio

**Live:** <https://chandrasekhar6593.github.io/chandra-portfolio/>

A single-page portfolio for SDM / telecom-core deployment roles.
No build step, no framework, no dependencies — plain HTML, CSS and a small
amount of vanilla JavaScript.

## Design

Editorial "technical dossier" layout: warm paper background, ink typography,
one deep-green accent, hairline rules and a sticky sidebar. Display type is
Instrument Serif, body is Inter, labels are JetBrains Mono.

- Sticky left rail with section index, availability status and résumé download
- 3D hero: a rotating subscriber-data lattice rendered with Three.js
- Numbered sections: Profile, Capabilities, Experience, Workflow, Background, Contact
- Hairline capability grid, phase-based experience card, four-step deployment workflow
- Dark contact split: links on the left, a live 3D signal globe and availability details on the right,
  plus one-click copy for the email address
- Scroll reveals, active-section highlighting, reduced-motion and print styles
- Mobile: rail collapses to a sticky top bar with a slide-down menu

## Files

```
index.html            markup + content
styles.css            design tokens, layout, components, responsive rules
main.js               both 3D scenes, nav, reveal, scroll-spy, copy-to-clipboard, year
assets/
  Nangili_Chandra_Sekhar_SDM_Deployment_Engineer.pdf   served by every "resume" link
  Nangili_Chandra_Sekhar_Resume.pdf                    previous résumé (unused)
  three.min.js                                         local Three.js build used by the 3D scenes
build_resume.py       regenerates the résumé DOCX/PDF from the same content
options/              four design directions, A–D (gallery at options/index.html)
github-profile/       README for the GitHub profile repo
```

## Preview locally

```powershell
cd "C:\Users\chand\OneDrive\Documents\Default Project"
python -m http.server 8787
```

Then open <http://localhost:8787>. Opening `index.html` directly also works.

## Content source

Everything on the page mirrors `Nangili_Chandra_Sekhar_SDM_Deployment_Engineer.pdf`
— 2.5+ years, Nokia SDM / HSS / UDM / AUSF deployment and validation, Rakuten
Mobile through Tech Mahindra, B.Tech ECE (2019–2023), Indore.

## Deploy

Deployed with **GitHub Pages** from the `main` branch (root). Any push to `main`
republishes the site automatically.

- **Netlify / Vercel** — drag the folder onto <https://app.netlify.com/drop>, or
  import the repo. No build command, publish directory `.`.
- **Custom domain** — add a `CNAME` file and configure DNS.

## Notes

- Fonts load from Google Fonts; the page degrades to system serif/sans/mono offline.
- `assets/three.min.js` is no longer referenced and can be deleted.
- Bump the `?v=` query on `styles.css` / `main.js` in `index.html` after a deploy
  if a browser keeps serving a cached sheet.
