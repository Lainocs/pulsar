# Pulsar

Dashboard personnel de stats Spotify — now playing en direct, top artistes
en cartes immersives, top titres, et un vrai historique d'écoute façon
stats.fm. Next.js 16 (App Router) + TypeScript, une seule identité Spotify
(la tienne), pas de login visiteur : le profil est public en lecture seule.

## Comment ça marche

- Toutes les données viennent de la **Spotify Web API**, appelée côté
  serveur (routes `app/api/*`) avec un refresh token que **toi seul**
  obtiens une fois via un mini flow OAuth (`/api/auth/login`).
- `/api/now-playing` n'est jamais caché (`cache-control: no-store`) — le
  widget "now playing" poll cette route toutes les 7s côté client.
- `/api/top-artists`, `/api/top-tracks` et les stats agrégées sont mis en
  cache 1h côté serveur (Next Data Cache), pour rester large sous les
  limites de rate-limit de Spotify.
- Les stats "Vue d'ensemble" (genre dominant, playlists, titres likés,
  artistes suivis) sont des **vrais nombres** renvoyés par l'API.
- La section "Historique d'écoute" (minutes réelles par artiste/titre/
  album, streak, heatmap façon GitHub) n'existe pas nativement dans l'API
  Spotify — comme stats.fm, on la construit nous-mêmes avec une petite
  base de données (voir section dédiée plus bas).

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

## 5. Historique d'écoute façon stats.fm (optionnel)

L'API Spotify ne donne ni minutes totales par artiste/titre, ni historique
au-delà des 50 derniers titres joués. On reconstruit ça nous-mêmes avec une
petite base **Turso (libSQL)**, alimentée de deux façons complémentaires :

- **Suivi continu** : `/api/cron/poll-history` interroge "recently played"
  et enregistre les nouvelles écoutes. À appeler toutes les ~10 min pour ne
  rien perdre (la fenêtre de 50 titres se remplit vite).
- **Import ponctuel** : ton export Spotify **"Extended streaming history"**
  (des années d'historique avec le vrai temps écouté par écoute, pas juste
  la durée du titre) pour avoir des stats profondes immédiatement au lieu
  d'attendre que le suivi continu s'accumule.

### 5.1 Créer la base Turso

```bash
# https://docs.turso.tech/cli/installation
turso db create pulsar
turso db show pulsar --url          # -> TURSO_DATABASE_URL
turso db tokens create pulsar       # -> TURSO_AUTH_TOKEN
```

Ajoute les deux valeurs dans `.env.local` (et dans les variables d'env de
prod). En dev, si tu laisses ces deux variables vides, l'app utilise
automatiquement un fichier SQLite local (`./data/pulsar.db`) — pratique
pour tester sans compte Turso, mais **ne marche pas sur Vercel** (pas de
disque persistant) : Turso est obligatoire en prod sur Vercel.

### 5.2 Activer le suivi continu

1. Ajoute `CRON_SECRET` dans `.env.local` (encore un `openssl rand -hex 32`).
2. Une fois déployé, configure deux secrets sur le repo GitHub (Settings →
   Secrets and variables → Actions) :
   - `CRON_SECRET` : la même valeur que `.env.local`/prod.
   - `PULSAR_BASE_URL` : l'URL publique du site (ex. `https://pulsar.ton-domaine.com`).
3. Le workflow `.github/workflows/poll-history.yml` (déjà dans le repo)
   tourne alors automatiquement toutes les 10 minutes, peu importe où le
   site est hébergé (Vercel ou VPS).
4. Sur un VPS, tu peux préférer un crontab classique plutôt que GitHub
   Actions :
   ```cron
   */10 * * * * curl -s -H "Authorization: Bearer <CRON_SECRET>" https://ton-domaine/api/cron/poll-history
   ```

### 5.3 Importer ton historique existant

1. Sur Spotify : Compte → Confidentialité → "Demander mes données" → coche
   spécifiquement **Extended streaming history** (l'export basique ne
   contient pas le détail par écoute). Spotify met souvent plusieurs jours
   à envoyer le lien de téléchargement — lance la demande le plus tôt
   possible.
2. Une fois le zip reçu et dézippé :
   ```bash
   npm run import:history -- ./chemin/vers/le/dossier/dézippé
   ```
3. Le script trouve tous les `Streaming_History_Audio_*.json`, ignore les
   podcasts/vidéos, et insère les écoutes musicales (déduplication
   automatique si tu le relances). Sûr à relancer si Spotify t'envoie un
   nouvel export plus tard.

## Déploiement

### Vercel (le plus simple)

1. Importe le repo GitHub sur Vercel.
2. Ajoute les variables d'environnement (`SPOTIFY_CLIENT_ID`,
   `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REDIRECT_URI` avec ton domaine final,
   `SPOTIFY_SETUP_KEY`, `SPOTIFY_REFRESH_TOKEN`, et si tu utilises
   l'historique : `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `CRON_SECRET`).
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
- Turso (libSQL) pour l'historique d'écoute ; tout le reste est recalculé
  à la volée depuis l'API Spotify avec du cache HTTP côté serveur
