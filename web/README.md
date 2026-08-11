# LeetCode Gym Web

Static browser-based drill runner for the existing Python template gym.

## What it does

- Reuses the Python drills under `../gym/drills`
- Keeps separate `normal` and `advanced` buckets
- Lets each visitor reorder or re-bucket templates by drag and drop
- Runs drills fully in the browser with `Pyodide`
- Uses `Monaco` for editing and `xterm.js` for terminal output
- Captures local solve analytics like time, keystrokes, runs, deletes, pastes, and print-call count

## Local development

Requirements:

- Node.js 20+
- npm 10+

Commands:

```bash
cd web
npm install
npm run dev
```

The drill manifest is regenerated from `../gym/drills` before `dev` and `build`.

## Production build

```bash
cd web
npm install
npm run build
```

The static site is written to `web/dist/`.

## Deployment on a VPS

1. Build the frontend:

```bash
cd /path/to/leetcode-template-gym/web
npm install
npm run build
```

2. Copy `web/dist/` to the Nginx web root, for example `/var/www/leetcode-gym-web`.

3. Use an Nginx server block like this:

```nginx
server {
    listen 80;
    server_name gym.example.com;

    root /var/www/leetcode-gym-web;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.wasm$ {
        default_type application/wasm;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

4. Put the DNS record behind Cloudflare.

5. Enable Cloudflare proxying and use `Full (strict)` TLS once the origin has a valid certificate.

## Notes

- The runtime is loaded from the official Pyodide CDN at request time.
- User state is local-only in v1. Ordering, drafts, and attempt history are stored in browser storage.
- There is no backend, auth, or shared leaderboard in this version.
