# ControlPointAI Phase 2 Website

Static marketing website for ControlPointAI, built from the Phase 2 PRD, ControlPointAI profile materials, case studies, and newsletter archive.

## Pages

- `index.html` - homepage / landing page
- `mission/` - method, mission, and vision
- `insights/` - readable newsletter archive and individual article view
- `case-studies/` - case-study index
- `case-studies/runtime-authority-enforcement/`
- `case-studies/unauthorized-concept-drift/`
- `case-studies/context-disruption-ui-intervention/`
- `demo/` - legacy redirect to services
- `contact/` - direct contact page for ControlPointAI

## Assets

- `assets/styles/site.css` - shared responsive styling
- `assets/scripts/site.js` - newsletter archive rendering, article routing, sorting, contact email generation, and active navigation

## Preview

Open `index.html` directly in a browser, or run a local static server from this folder:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:4173/`.
