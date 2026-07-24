# Pulsar

Dashboard personnel de stats Spotify — now playing en direct, top artistes
avec cartes 3D "pop-out", top titres, et quelques stats réelles tirées de
l'API. Next.js 16 (App Router) + TypeScript, une seule identité Spotify (la
tienne), pas de login visiteur : le profil est public en lecture seule.

## Comment ça marche

- Toutes les données viennent de la **Spotify Web API**, appelée côté
  serveur (routes `app/api/*`) avec un refresh token que **toi seul**
  obtiens une fois via un mini flow OAuth (`/api/auth/login`).
- `/api/now-playing` n'est jamais caché (`cache-control: no-store`) — le
  widget "now playing" poll cette route toutes les 7s côté client.
- `/api/top-artists`, `/api/top-tracks` et les stats agrégées sont mis en
  cache 1h côté serveur (Next Data Cache), pour rester large sous les
  limites de rate-limit de Spotify.
- Les stats affichées (genre dominant, playlists, titres likés, artistes
  suivis, minutes sur les 50 derniers titres écoutés) sont toutes des
  **vrais nombres** renvoyés par l'API — Spotify n'expose pas de "minutes
  totales écoutées" ni de "streak" historique (ça, c'est propriétaire à
  Spotify Wrapped), donc on ne fabrique rien.
- Les photos d'artistes viennent de Spotify (rectangulaires). Un script
  hors-ligne (`npm run generate:cutouts`) leur retire le fond avec un
  modèle IA local pour produire de vrais PNG détourés pour l'effet
  "pop-out" 3D. Tant qu'un artiste n'a pas de PNG généré, sa carte retombe
  automatiquement sur sa photo Spotify masquée en cercle.

## Prérequis

- Node.js 20+
- Un compte Spotify (le tien)
- Une app créée sur le [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

## 1. Créer l'app Spotify

1. Va sur https://developer.spotify.com/dashboard → **Create app**.
2. Nom/description libres. **Redirect URI** : ajoute
   `http://127.0.0.1:3000/api/auth/callback` (dev) — tu ajouteras l'URL de
   prod plus tard, une fois déployé.
3. API utilisées : coche **Web API**.
4. Une fois créée, note le **Client ID** et le **Client Secret** (Settings).

## 2. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Remplis `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, et génère un
`SPOTIFY_SETUP_KEY` (ex. `openssl rand -hex 32`) — c'est une clé maison qui
protège le flow d'auth pour que personne d'autre ne puisse le déclencher
sur le site public.

## 3. Installer et lancer en dev

```bash
npm install
npm run dev
```

## 4. Obtenir ton refresh token (une seule fois)

1. Ouvre `http://127.0.0.1:3000/api/auth/login?key=<ton SPOTIFY_SETUP_KEY>`
2. Connecte-toi et autorise l'app sur l'écran de consentement Spotify.
3. Tu es redirigé vers `/api/auth/callback`, qui affiche ton
   `refresh_token`. Colle-le dans `SPOTIFY_REFRESH_TOKEN` (`.env.local`, et
   plus tard dans les variables d'env de ton hébergeur).
4. Redémarre `npm run dev`. Le site affiche désormais tes vraies données.

Le token n'expire pas tant que tu ne révoques pas l'accès depuis ton compte
Spotify (Apps connectées).

## 5. Générer les cutouts d'artistes (optionnel mais recommandé)

```bash
npm run generate:cutouts
```

Ça télécharge les photos de tes top artistes (les 3 périodes confondues),
retire le fond localement, et écrit les PNG dans `public/artists/` +
`public/artists/manifest.json`. À relancer de temps en temps quand ton top
artistes change (le script skip automatiquement ce qui n'a pas changé).
Committe les fichiers générés comme n'importe quel asset statique.

> Le script utilise `@imgly/background-removal-node`, sous licence **AGPL**.
> Il ne tourne qu'en local/CI, jamais dans l'app déployée — seuls les PNG
> qu'il produit sont servis par le site. `npm audit` remonte des CVE sur
> ses dépendances internes (sharp/lodash/zod embarqués, non maintenues) ;
> comme le script ne traite que des images téléchargées depuis le CDN
> Spotify et ne tourne jamais en prod, le risque réel est faible, mais bon
> à savoir si tu regardes `npm audit`.

## Déploiement

### Vercel (le plus simple)

1. Importe le repo GitHub sur Vercel.
2. Ajoute les variables d'environnement (`SPOTIFY_CLIENT_ID`,
   `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI` avec ton domaine final,
   `SPOTIFY_SETUP_KEY`, `SPOTIFY_REFRESH_TOKEN`).
3. Ajoute l'URL de prod (`https://ton-domaine/api/auth/callback`) comme
   Redirect URI supplémentaire dans les settings de l'app Spotify.
4. Si le refresh token n'a pas encore été généré en prod, refais l'étape 4
   ci-dessus avec le domaine de prod.

### VPS

```bash
npm install
npm run build
npm run start   # sert sur le port 3000 par défaut
```

Mets nginx (ou Caddy) en reverse proxy devant, avec HTTPS. `next start`
gère très bien l'optimisation d'images (`next/image`) en self-hosted grâce
à `sharp`, déjà présent dans les dépendances.

## Stack

- Next.js 16 (App Router, TypeScript, Route Handlers)
- Tailwind CSS v4 pour la mise en page, CSS custom pour les effets néon/3D
- Aucune base de données — tout est recalculé à la volée depuis l'API
  Spotify avec du cache HTTP côté serveur
