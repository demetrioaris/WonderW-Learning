// /functions/api/animals.js  (Cloudflare Pages Functions)
// Proxy a API Ninjas con la key oculta en Environment Variables.

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get("name") || "";

  // Respuestas rápidas si falta 'name'
  if (!name) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  // --- Caché en Cloudflare (opcional pero recomendado) ---
  const cacheKey = new Request(request.url, request);
  const cache = caches.default;
  let cached = await cache.match(cacheKey);
  if (cached) {
    return new Response(cached.body, cached);
  }

  // --- Llamada a API Ninjas con la key oculta ---
  const upstream = `https://api.api-ninjas.com/v1/animals?name=${encodeURIComponent(name)}`;
  const res = await fetch(upstream, {
    headers: { "X-Api-Key": env.API_NINJAS_KEY }
  });

  const body = await res.text();
  const resp = new Response(body, {
    status: res.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600" // 1h
    }
  });

  // Guarda en caché sin bloquear la respuesta
  context.waitUntil(cache.put(cacheKey, resp.clone()));

  return resp;
}
