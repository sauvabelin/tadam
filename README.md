# Tadam Website

## Local Development

Start the full stack with Docker:

```bash
docker-compose up
```

This starts:
- Frontend at http://localhost:5173
- API at http://localhost:8080/api
- MySQL database

Or run frontend only:

```bash
npm install
npm run dev
```

## Production Deployment

1. Set up `.env` on server with database credentials and admin password

2. Push to `master` branch - GitHub Actions deploys automatically via FTP

3. Migrations run automatically on first API request

## Project Structure

```
├── src/           # React frontend
├── api/           # PHP backend API
├── dist/          # Built frontend (generated)
└── index.php      # SPA entry point
```
