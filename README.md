# Secure Notes Frontend

Next.js frontend for the Secure Notes API (backend repo: [secure-notes-backend](https://github.com/Tafsimul-Tanzid/secure-notes-backend)).

It covers login/register, creating and editing notes, and for admins, everyone's notes plus a users page to add, edit and delete accounts. The styling is plain CSS in `app/globals.css`, written by hand with no UI library or template.

Stack: Next.js 16 (App Router), React 19, JavaScript.

## Run locally

Start the backend first. It runs on `http://localhost:3000`. Then:

```bash
npm install
npm run dev        # http://localhost:5173
```

The frontend runs on port 5173 because the backend already uses 3000. The backend's default `CORS_ORIGIN` allows `http://localhost:5173`.

The API URL comes from `NEXT_PUBLIC_API_URL`. In dev it defaults to `http://localhost:3000`, and production builds read it from `.env.production`. To point it somewhere else locally, copy `.env.example` to `.env.local` and change the URL.

## How it's put together

```
app/
  layout.js              wraps everything in the auth + toast providers
  page.js                redirects to /notes or /login
  login/page.js          login and register tabs
  (dashboard)/layout.js  requires a logged in user, shows the navbar
  (dashboard)/notes      notes grid, create/edit/delete
  (dashboard)/users      admin only, users table and form
components/              Navbar, Pager
lib/
  api.js                 fetch wrapper (adds the bearer token, handles errors)
  auth.js                current user, login/register/logout
  toast.js               popup messages
  usePagedList.js        loads a paginated endpoint (?page=&limit=)
```

The JWT is kept in localStorage and sent as `Authorization: Bearer <token>`. Logging out just drops the token, since JWTs are stateless. The route guards only decide what the UI shows. The API enforces the real permissions on every request.

## Deploy (Vercel)

1. On Vercel, go to Add New > Project and import this repo. It detects Next.js by itself.
2. The backend URL for production builds is in `.env.production` (`NEXT_PUBLIC_API_URL`). Change it there if your Render URL is different. You can also override it with an environment variable in the Vercel project settings.
3. Deploy, then copy the site URL.
4. On Render, set the backend's `CORS_ORIGIN` to that URL. Otherwise the browser blocks the requests.

`NEXT_PUBLIC_*` variables are baked in at build time. If you change the API URL later, redeploy on Vercel.
