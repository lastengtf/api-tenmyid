import { renderDashboardHtml } from './ui.js';

// Helper: Response JSON
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      ...extraHeaders
    }
  });
}

// Helper: Extract Auth Bearer or Token from headers
function getBearerToken(request) {
  const authHeader = request.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

// Verify Dashboard Admin Session
async function verifySession(request, env) {
  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const sessionData = await env.API_KV.get(`session:${token}`, 'json');
    return sessionData;
  } catch (e) {
    return null;
  }
}

// Hop-by-hop headers to filter out when proxying
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'cf-connecting-ip',
  'cf-ray',
  'cf-ipcountry',
  'cf-visitor'
]);

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // Handle global CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // -------------------------------------------------------------
    // 1. DASHBOARD UI & STATIC ASSETS
    // -------------------------------------------------------------
    if (url.pathname === '/' || url.pathname === '/admin' || url.pathname === '/dashboard') {
      return new Response(renderDashboardHtml(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }

    if (url.pathname === '/favicon.ico') {
      return new Response(null, { status: 204 });
    }

    // -------------------------------------------------------------
    // 2. AUTHENTICATION API (Cloudflare Dashboard Variables)
    // -------------------------------------------------------------
    if (url.pathname === '/api/auth/login' && method === 'POST') {
      try {
        const body = await request.json();
        const email = (body.email || '').trim();
        const password = (body.password || '').trim();

        const configEmail = (env.ADMIN_EMAIL || '').trim();
        const configPassword = (env.ADMIN_PASSWORD || '').trim();

        if (!configEmail || !configPassword) {
          return jsonResponse({
            error: 'ADMIN_EMAIL atau ADMIN_PASSWORD belum dikonfigurasi di dashboard Cloudflare.'
          }, 500);
        }

        if (email === configEmail && password === configPassword) {
          const sessionToken = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
          const sessionData = {
            email,
            createdAt: new Date().toISOString()
          };

          // Simpan session di KV dengan TTL 7 hari (604800 detik)
          await env.API_KV.put(`session:${sessionToken}`, JSON.stringify(sessionData), {
            expirationTtl: 604800
          });

          return jsonResponse({
            token: sessionToken,
            email
          });
        }

        return jsonResponse({ error: 'Email atau password salah.' }, 401);
      } catch (err) {
        return jsonResponse({ error: 'Format login tidak valid: ' + err.message }, 400);
      }
    }

    if (url.pathname === '/api/auth/me' && method === 'GET') {
      const session = await verifySession(request, env);
      if (session) {
        return jsonResponse({ authenticated: true, email: session.email });
      }
      return jsonResponse({ authenticated: false }, 401);
    }

    if (url.pathname === '/api/auth/logout' && method === 'POST') {
      const token = getBearerToken(request);
      if (token) {
        await env.API_KV.delete(`session:${token}`);
      }
      return jsonResponse({ success: true });
    }

    // -------------------------------------------------------------
    // 3. GATEWAY MANAGEMENT API (Protected by Admin Session)
    // -------------------------------------------------------------
    if (url.pathname.startsWith('/api/manage/')) {
      const session = await verifySession(request, env);
      if (!session) {
        return jsonResponse({ error: 'Unauthorized: Harap login terlebih dahulu' }, 401);
      }

      // ROUTES MANAGEMENT
      if (url.pathname === '/api/manage/routes') {
        if (method === 'GET') {
          const routes = (await env.API_KV.get('gateway:routes', 'json')) || [];
          return jsonResponse({ routes });
        }

        if (method === 'POST') {
          const body = await request.json();
          let prefix = (body.prefix || '').trim();
          if (!prefix.startsWith('/')) prefix = '/' + prefix;
          if (prefix.length > 1 && prefix.endsWith('/')) prefix = prefix.slice(0, -1);

          const target = (body.target || '').trim();
          if (!target || !target.startsWith('http')) {
            return jsonResponse({ error: 'Target URL harus berupa URL valid (http/https)' }, 400);
          }

          const routes = (await env.API_KV.get('gateway:routes', 'json')) || [];
          const newRoute = {
            id: 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: (body.name || 'API Route').trim(),
            prefix,
            target,
            methods: (body.methods || 'ALL').toUpperCase().trim(),
            headers: body.headers || null,
            authRequired: !!body.authRequired,
            stripPrefix: body.stripPrefix !== false,
            isActive: body.isActive !== false,
            createdAt: new Date().toISOString()
          };

          routes.push(newRoute);
          await env.API_KV.put('gateway:routes', JSON.stringify(routes));
          return jsonResponse({ success: true, route: newRoute }, 201);
        }
      }

      const routeIdMatch = url.pathname.match(/^\/api\/manage\/routes\/([a-zA-Z0-9_-]+)$/);
      if (routeIdMatch) {
        const routeId = routeIdMatch[1];
        let routes = (await env.API_KV.get('gateway:routes', 'json')) || [];

        if (method === 'PUT') {
          const body = await request.json();
          const index = routes.findIndex(r => r.id === routeId);
          if (index === -1) {
            return jsonResponse({ error: 'Route tidak ditemukan' }, 404);
          }

          let prefix = (body.prefix || routes[index].prefix).trim();
          if (!prefix.startsWith('/')) prefix = '/' + prefix;
          if (prefix.length > 1 && prefix.endsWith('/')) prefix = prefix.slice(0, -1);

          routes[index] = {
            ...routes[index],
            name: (body.name || routes[index].name).trim(),
            prefix,
            target: (body.target || routes[index].target).trim(),
            methods: (body.methods || routes[index].methods).toUpperCase().trim(),
            headers: body.headers !== undefined ? body.headers : routes[index].headers,
            authRequired: body.authRequired !== undefined ? !!body.authRequired : routes[index].authRequired,
            stripPrefix: body.stripPrefix !== undefined ? !!body.stripPrefix : routes[index].stripPrefix,
            isActive: body.isActive !== undefined ? !!body.isActive : routes[index].isActive,
            updatedAt: new Date().toISOString()
          };

          await env.API_KV.put('gateway:routes', JSON.stringify(routes));
          return jsonResponse({ success: true, route: routes[index] });
        }

        if (method === 'DELETE') {
          routes = routes.filter(r => r.id !== routeId);
          await env.API_KV.put('gateway:routes', JSON.stringify(routes));
          return jsonResponse({ success: true });
        }
      }

      // API KEYS MANAGEMENT
      if (url.pathname === '/api/manage/keys') {
        if (method === 'GET') {
          const keys = (await env.API_KV.get('gateway:keys', 'json')) || [];
          return jsonResponse({ keys });
        }

        if (method === 'POST') {
          const body = await request.json();
          const name = (body.name || 'Client Key').trim();
          const generatedKey = 'ten_' + crypto.randomUUID().replace(/-/g, '');

          const newKeyObj = {
            id: 'k_' + Date.now(),
            name,
            key: generatedKey,
            isActive: true,
            createdAt: new Date().toISOString()
          };

          const keys = (await env.API_KV.get('gateway:keys', 'json')) || [];
          keys.push(newKeyObj);

          await env.API_KV.put('gateway:keys', JSON.stringify(keys));
          // Fast lookup index
          await env.API_KV.put(`apikey:${generatedKey}`, JSON.stringify(newKeyObj));

          return jsonResponse({ success: true, key: newKeyObj }, 201);
        }
      }

      const keyIdMatch = url.pathname.match(/^\/api\/manage\/keys\/([a-zA-Z0-9_-]+)$/);
      if (keyIdMatch) {
        const keyId = keyIdMatch[1];
        let keys = (await env.API_KV.get('gateway:keys', 'json')) || [];
        const existingKey = keys.find(k => k.id === keyId);

        if (method === 'DELETE') {
          if (existingKey) {
            await env.API_KV.delete(`apikey:${existingKey.key}`);
          }
          keys = keys.filter(k => k.id !== keyId);
          await env.API_KV.put('gateway:keys', JSON.stringify(keys));
          return jsonResponse({ success: true });
        }
      }

      return jsonResponse({ error: 'Endpoint tidak ditemukan' }, 404);
    }

    // -------------------------------------------------------------
    // 4. API GATEWAY REVERSE PROXY DISPATCHER
    // -------------------------------------------------------------
    // Load registered routes from KV
    let routes = [];
    try {
      routes = (await env.API_KV.get('gateway:routes', 'json')) || [];
    } catch (e) {
      routes = [];
    }

    // Sort routes by prefix length descending for most specific matching
    routes.sort((a, b) => (b.prefix || '').length - (a.prefix || '').length);

    // Find matched route
    const currentPath = url.pathname;
    const matchedRoute = routes.find(r => {
      const p = r.prefix;
      return currentPath === p || currentPath.startsWith(p + '/');
    });

    if (!matchedRoute) {
      return jsonResponse({
        error: 'Route not found in TEN API Gateway',
        path: currentPath,
        domain: 'api.ten.my.id'
      }, 404);
    }

    // Check if route is active
    if (matchedRoute.isActive === false) {
      return jsonResponse({
        error: 'Service temporarily disabled (route inactive)',
        route: matchedRoute.name
      }, 503);
    }

    // Check allowed methods
    if (matchedRoute.methods && matchedRoute.methods !== 'ALL') {
      const allowedMethods = matchedRoute.methods.split(',').map(m => m.trim().toUpperCase());
      if (!allowedMethods.includes(method)) {
        return jsonResponse({
          error: `Method ${method} is not allowed for this route`,
          allowedMethods
        }, 405);
      }
    }

    // Check Authentication (API Key)
    if (matchedRoute.authRequired) {
      let clientApiKey = request.headers.get('x-api-key') || getBearerToken(request);
      if (!clientApiKey && url.searchParams.has('api_key')) {
        clientApiKey = url.searchParams.get('api_key');
      }

      if (!clientApiKey) {
        return jsonResponse({
          error: 'Unauthorized: Missing API Key. Provide via "x-api-key" header or Bearer token.'
        }, 401);
      }

      // Check key validity from KV
      const keyData = await env.API_KV.get(`apikey:${clientApiKey}`, 'json');
      if (!keyData || !keyData.isActive) {
        return jsonResponse({
          error: 'Forbidden: Invalid or revoked API Key'
        }, 403);
      }
    }

    // Construct Upstream Target URL
    let upstreamSubPath = currentPath;
    if (matchedRoute.stripPrefix) {
      upstreamSubPath = currentPath.substring(matchedRoute.prefix.length);
      if (!upstreamSubPath.startsWith('/')) {
        upstreamSubPath = '/' + upstreamSubPath;
      }
      if (upstreamSubPath === '/' && !currentPath.endsWith('/')) {
        upstreamSubPath = '';
      }
    }

    // Clean target base
    let targetBase = matchedRoute.target;
    if (targetBase.endsWith('/')) {
      targetBase = targetBase.slice(0, -1);
    }

    const upstreamUrlStr = targetBase + upstreamSubPath + url.search;
    let upstreamUrl;
    try {
      upstreamUrl = new URL(upstreamUrlStr);
    } catch (e) {
      return jsonResponse({
        error: 'Bad Gateway: Upstream target URL is malformed',
        target: upstreamUrlStr
      }, 502);
    }

    // Construct Forwarding Headers
    const forwardHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    }

    // Upstream Host header must match target host
    forwardHeaders.set('Host', upstreamUrl.host);

    // Standard proxy forwarding headers
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '';
    if (clientIp) {
      forwardHeaders.set('X-Forwarded-For', clientIp);
    }
    forwardHeaders.set('X-Forwarded-Proto', 'https');
    forwardHeaders.set('X-Forwarded-Host', url.host || 'api.ten.my.id');

    // Inject custom headers defined for this route
    if (matchedRoute.headers && typeof matchedRoute.headers === 'object') {
      for (const [hk, hv] of Object.entries(matchedRoute.headers)) {
        forwardHeaders.set(hk, String(hv));
      }
    }

    // Execute Proxy Request to Upstream
    try {
      const fetchOptions = {
        method,
        headers: forwardHeaders,
        redirect: 'follow'
      };

      if (!['GET', 'HEAD'].includes(method)) {
        fetchOptions.body = request.body;
      }

      const upstreamResponse = await fetch(upstreamUrl.toString(), fetchOptions);

      // Prepare Response Headers
      const responseHeaders = new Headers(upstreamResponse.headers);

      // Ensure CORS headers are open for gateway clients
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

      // Gateway identification header
      responseHeaders.set('X-Gateway-By', 'TEN API Gateway');

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders
      });

    } catch (err) {
      return jsonResponse({
        error: 'Bad Gateway: Failed to forward request to upstream service',
        message: err.message,
        target: upstreamUrlStr
      }, 502);
    }
  }
};
