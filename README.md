# ndxiscracked

Gated video-model console. Catalog of the board, free lanes from the LcDNSynsi bot stack, and a prompt console. Hosted on GitHub Pages from this repo.

## Live

- Static build (GitHub Pages): https://robloxgamee1231-ctrl.github.io/Free-magi-2/
- Server-side mode (gate enforced on the server): `python3 server/server.py`, then open http://localhost:8000

## The board

| Model | Maker | Lane |
| --- | --- | --- |
| MAGI-2 | Sand AI | Open weights — Apache-2.0 on HuggingFace |
| Seedance 2.5 / Flash | ByteDance | API |
| Seedance 2.0 | ByteDance | API (inference.sh) |
| Seedance 1.0 Pro | ByteDance | Free lane — Dropshot bot |
| Kling V4.0 | Kuaishou | API |
| Kling O3 | Kuaishou | API |
| Vidu Q4 | Shengshu | API |
| Happy Horse 1.1 | Alibaba | API (fal) |
| MiniMax H3 | MiniMax | Open weights + free lane — MagicHour bot |
| Wan 3.0 | Alibaba | API (Wan 2.2 stays free on MagicHour) |

Free lanes point at real bots in [LcDNSynsi](https://github.com/robloxgamee1231-ctrl/LcDNSynsi): `magichour_bot.py` (LTX-2.3, MiniMax H3, Wan 2.2), `dropshot_bot.py` (Grok Imagine Video, Seedance 1.0 Pro), `yolly_api.py` (Grok Imagine).

## The gate

The password is not in this repository — only a salt and hashes:

- Static build: SHA-256(salt + password) checked in `assets/app.js`. Pages is static hosting, so enforcement there is best-effort by design — the plaintext is still nowhere in the repo.
- Server mode: PBKDF2-HMAC-SHA256 (200k iterations) in `server/server.py`, HttpOnly signed session cookie. This one is enforced server-side.

To rotate the password:

```bash
node -e "const c=require('crypto');const s='<new salt>';const p='<new password>';console.log('client',c.createHash('sha256').update(s+p).digest('hex'));console.log('server',c.pbkdf2Sync(p,s,200000,32,'sha256').toString('hex'))"
```

Replace the values in `assets/app.js` (GATE) and `server/server.py` (SERVER_HASH), commit, done.

## Hosting

GitHub Pages serves this repo from `main` / root. Enable once: Settings → Pages → Deploy from branch → `main` → Save.
