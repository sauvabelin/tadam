# Tadam Website

## Run locally

```bash
npm install
npm run dev
```

## Build for production

```bash
npm run build
```

## Deploy with PHP

1. Build the project: `npm run build`
2. Upload `dist/` and `index.php` to your PHP server
3. Point your web server to `index.php`

## Test PHP locally

```bash
npm run build
php -S localhost:8000 index.php
```
