# Editable Node.js Portfolio

This is a responsive portfolio website with a small Node.js backend and an admin panel for editing the site content.

## Run

```bash
npm start
```

Open:

- Website: `http://localhost:3000`
- Login: `http://localhost:3000/login.html`
- Admin: `http://localhost:3000/admin.html`

First-login admin profile:

- Username: `admin`
- Password: `admin12345`

Change the password from the Profile section after your first login. After that, use your new password.

## Edit Content

Use the admin page to edit hero text, about content, projects, work experience, education, services, testimonials, contact details, social links, and footer text.

The backend stores content in `data/portfolio.json`.

## Admin Profiles

Admin users are stored in `data/users.json`. Passwords are hashed with PBKDF2 before saving.

The admin portal uses a session cookie after login. If you are logged out, `/admin.html` redirects to `/login.html`.

The optional `ADMIN_TOKEN` environment variable is still supported for direct API saves, but the browser admin now uses profile login.

The current browser admin page is best for local editing or a private deployment. Use HTTPS and stronger deployment-level protections before exposing it publicly.

## Deploy to Vercel

This project includes Vercel serverless API routes in `api/` and shared backend helpers in `lib/`.

For admin edits to persist after deployment, create/connect a Vercel Blob store and add these environment variables in Vercel:

- `BLOB_READ_WRITE_TOKEN`
- `SESSION_SECRET`

Then deploy:

```bash
npx vercel
```

For production:

```bash
npx vercel --prod
```

The first deployed login is:

- Username: `admin`
- Password: `admin12345`

Change it from the admin Profile section after the first login.
