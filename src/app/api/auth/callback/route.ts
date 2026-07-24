import { NextRequest, NextResponse } from "next/server";
import { exchangeAuthorizationCode } from "@/lib/spotify/token";

function htmlPage(body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pulsar setup</title>
    <style>
      body{background:#05060a;color:#eef1f8;font-family:ui-monospace,monospace;
        max-width:640px;margin:60px auto;padding:0 24px;line-height:1.6;}
      code,pre{background:#12141c;padding:2px 6px;border-radius:4px;word-break:break-all;}
      pre{padding:16px;overflow-x:auto;}
      h1{color:#00f0ff;}
    </style></head><body>${body}</body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

/**
 * One-time setup route: Spotify redirects here after the owner approves
 * access. Exchanges the code for a refresh token and displays it once so
 * it can be copied into SPOTIFY_REFRESH_TOKEN. Nothing is persisted here —
 * this route holds no state between requests.
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (!process.env.SPOTIFY_SETUP_KEY || state !== process.env.SPOTIFY_SETUP_KEY) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (error) {
    return htmlPage(`<h1>Autorisation refusée</h1><p>Spotify a renvoyé : <code>${error}</code></p>`, 400);
  }
  if (!code) {
    return htmlPage(`<h1>Code manquant</h1><p>Aucun paramètre <code>code</code> dans la redirection Spotify.</p>`, 400);
  }

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  if (!redirectUri) {
    return htmlPage(`<h1>Config manquante</h1><p>SPOTIFY_REDIRECT_URI n'est pas défini.</p>`, 500);
  }

  try {
    const tokens = await exchangeAuthorizationCode(code, redirectUri);
    return htmlPage(`
      <h1>✅ Autorisation réussie</h1>
      <p>Copie cette valeur dans <code>SPOTIFY_REFRESH_TOKEN</code> (fichier <code>.env.local</code> en dev, variables d'environnement du projet sur Vercel/VPS), puis redémarre l'app :</p>
      <pre>${tokens.refresh_token}</pre>
      <p>Scopes accordés : <code>${tokens.scope}</code></p>
      <p>Cette page n'enregistre rien nulle part — copie le token maintenant.</p>
    `);
  } catch (err) {
    console.error("[auth/callback]", err);
    return htmlPage(`<h1>Échec de l'échange du code</h1><pre>${String(err)}</pre>`, 500);
  }
}
