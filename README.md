# Secure Notes Frontend

Frontend for the Secure Notes API (backend repo: `backend_interview`). It covers register/login, notes CRUD, and admin user management (users table plus everyone's notes).

It's plain HTML, CSS and JavaScript (`index.html`, `styles.css`, `app.js`, `config.js`), written by hand with no framework or UI template. There's no build step and no dependencies.

## Run locally

Start the backend first (it runs on `http://localhost:3000`), then serve this folder on port 5173:

```bash
python3 -m http.server 5173
# or: npx serve -l 5173 .
```

Open http://localhost:5173. On localhost the page talks to `http://localhost:3000` automatically.

Opening `index.html` directly as a file won't work, because the browser blocks the API calls. It has to be served over http.

## Backend URL

`config.js` picks the API URL. After deploying the backend, replace `https://YOUR-BACKEND.onrender.com` there with the real Render URL.

## Deploy (Vercel)

1. Push this repo to GitHub.
2. On Vercel, go to Add New > Project and import the repo.
   - Framework preset: Other
   - No build command or output directory, since it's just static files.
3. Deploy, then copy the URL (e.g. `https://notes-frontend.vercel.app`).
4. On Render, set the backend's `CORS_ORIGIN` to that URL (no trailing slash). Otherwise the browser will block the requests.

Netlify works the same way: add a new site from Git, leave the build command empty, and set the publish directory to `.`.
