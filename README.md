# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Performance note (Privy bundle)

If `dist/assets/privy-*.js` (or similar) takes many seconds to load in production, it's usually because your static server is sending it **uncompressed** and without long-term caching.

This repo generates precompressed assets on build (`.gz` + `.br`) via `scripts/precompress-assets.mjs` (runs automatically via `postbuild`).

To benefit from this on an Nginx server, enable `gzip_static` (and optionally `brotli_static`) and cache hashed assets:

```nginx
# HTTPS: enable HTTP/2 if possible
listen 443 ssl http2;

location ^~ /assets/ {
  gzip_static on;
  # If you have nginx brotli module enabled:
  # brotli_static on;

  add_header Vary "Accept-Encoding";
  add_header Cache-Control "public, max-age=31536000, immutable";
  expires 1y;

  try_files $uri =404;
}

# Fallback dynamic gzip
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_types application/javascript text/css application/json image/svg+xml;
```
# Guess-The-AI

<!-- https://api.guesstheai.xyz/ -->