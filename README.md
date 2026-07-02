# Happy Birthday Sou 🎉

A cinematic, single-page React celebration screen. Particles drift in from the edges of
space and assemble into "Happy Birthday Sou", then settle into a glass/chrome text
treatment that catches the light as you move your cursor (or finger).

## Features
- ✨ Cinematic particle-assembly text reveal
- 🌌 Animated starfield with parallax
- 💫 Aurora gradient background
- 🖱️ Mouse-reactive lighting and specular text shine
- ☄️ Randomly spawning shooting stars
- 💎 Glass/chrome text with a shifting metallic gradient
- 📱 Fully responsive, respects `prefers-reduced-motion`

## Run it

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

The production build outputs static files to `dist/` which can be hosted anywhere
(Netlify, Vercel, GitHub Pages, etc.).

## Tech
- React 18 + Vite
- Plain CSS (no framework) + HTML5 Canvas for the starfield and particle reveal
