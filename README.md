# Pixeldorp

A mobile-first Dutch web app for kids in groep 3 (age ~6) to practise reading and math. Short practice rounds earn bricks and stars, which the kid spends in a small pixel-art village builder. Parents see the learning progress.

The whole app is one static file, [`index.html`](index.html). There is no build step.

## Run locally

```sh
python3 -m http.server   # or: npx serve .
```

Then open http://localhost:8000. Opening `index.html` straight from disk also works, but recording words with the microphone needs `https://` or `localhost`.

## Test

```sh
node tools/check-generators.js
```

## Hosting

The site is hosted with GitHub Pages straight from the `main` branch root (`.nojekyll` makes Pages serve the files as-is). See [AGENTS.md](AGENTS.md#hosting) for the setup.

## More

- [AGENTS.md](AGENTS.md): full project context, owner decisions, architecture and open items.
- [docs/curriculum-groep3.md](docs/curriculum-groep3.md): the curriculum (VLL kernen, WIG blokken) the exercises follow.
