import { renderDashboardHtml } from './ui.js';

// Helper: JSON Response
function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
      ...extraHeaders
    }
  });
}

// Helper: Extract Bearer Token
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

// Helper: Log Request into KV without blocking response
async function recordLog(env, ctx, logEntry) {
  ctx.waitUntil((async () => {
    try {
      let logs = (await env.API_KV.get('gateway:logs', 'json')) || [];
      logs.unshift(logEntry);
      if (logs.length > 100) {
        logs = logs.slice(0, 100);
      }
      await env.API_KV.put('gateway:logs', JSON.stringify(logs));
    } catch (e) {
      // Ignore logging write failures to prevent impacting main flow
    }
  })());
}

// Helper: Check Rate Limit (Sliding Window in KV)
async function checkRateLimit(env, keyIdentifier, limit = 60) {
  if (!limit || limit <= 0) return { allowed: true };
  const currentMinute = Math.floor(Date.now() / 60000);
  const rlKey = `rl:${keyIdentifier}:${currentMinute}`;

  try {
    const currentCount = parseInt((await env.API_KV.get(rlKey)) || '0', 10);
    if (currentCount >= limit) {
      return { allowed: false, current: currentCount, limit };
    }
    // Increment counter (expire after 2 minutes)
    await env.API_KV.put(rlKey, String(currentCount + 1), { expirationTtl: 120 });
    return { allowed: true, current: currentCount + 1, limit };
  } catch (e) {
    return { allowed: true };
  }
}

// Helper: Proxy request to Google Apps Script with robust redirect & body handling
async function handleAppsScriptProxy(request, targetUrlStr, customHeaders = {}) {
  const method = request.method.toUpperCase();
  const forwardHeaders = new Headers();

  for (const [key, value] of request.headers.entries()) {
    if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
      forwardHeaders.set(key, value);
    }
  }

  const targetUrl = new URL(targetUrlStr);
  forwardHeaders.set('Host', targetUrl.host);

  if (customHeaders && typeof customHeaders === 'object') {
    for (const [k, v] of Object.entries(customHeaders)) {
      forwardHeaders.set(k, String(v));
    }
  }

  const fetchOptions = {
    method,
    headers: forwardHeaders,
    redirect: 'follow'
  };

  if (!['GET', 'HEAD'].includes(method)) {
    // Clone body for Apps Script POST/PUT
    fetchOptions.body = await request.clone().arrayBuffer();
  }

  const upstreamRes = await fetch(targetUrl.toString(), fetchOptions);

  const resHeaders = new Headers(upstreamRes.headers);
  resHeaders.set('Access-Control-Allow-Origin', '*');
  resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  resHeaders.set('X-Gateway-By', 'TEN API Gateway (Apps Script Proxy)');

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    statusText: upstreamRes.statusText,
    headers: resHeaders
  });
}

export default {
  async fetch(request, env, ctx) {
    const startTime = performance.now();
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';

    // Global CORS preflight
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
    // 2. AUTHENTICATION API
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
          const sessionData = { email, createdAt: new Date().toISOString() };

          await env.API_KV.put(`session:${sessionToken}`, JSON.stringify(sessionData), {
            expirationTtl: 604800 // 7 hari
          });

          return jsonResponse({ token: sessionToken, email });
        }

        return jsonResponse({ error: 'Email atau password salah.' }, 401);
      } catch (err) {
        return jsonResponse({ error: 'Format data login tidak valid: ' + err.message }, 400);
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

          let target = (body.target || '').trim();
          // Auto-format Google Apps Script Deployment ID if provided directly
          if (body.isAppsScript || (!target.startsWith('http') && target.length > 20)) {
            if (!target.startsWith('http')) {
              target = `https://script.google.com/macros/s/${target}/exec`;
            }
          }

          if (!target || !target.startsWith('http')) {
            return jsonResponse({ error: 'Target URL harus berupa URL valid (http/https)' }, 400);
          }

          const routes = (await env.API_KV.get('gateway:routes', 'json')) || [];
          const newRoute = {
            id: 'r_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            name: (body.name || 'API Route').trim(),
            prefix,
            target,
            isAppsScript: !!body.isAppsScript || target.includes('script.google.com'),
            methods: (body.methods || 'ALL').toUpperCase().trim(),
            headers: body.headers || null,
            authRequired: !!body.authRequired,
            stripPrefix: body.stripPrefix !== false,
            rateLimit: body.rateLimit ? parseInt(body.rateLimit, 10) : 0, // 0 = default/off
            cacheTtl: body.cacheTtl ? parseInt(body.cacheTtl, 10) : 0, // seconds
            isActive: body.isActive !== false,
            createdAt: new Date().toISOString()
          };

          routes.push(newRoute);
          await env.API_KV.put('gateway:routes', JSON.stringify(routes));
          return jsonResponse({ success: true, route: newRoute }, 201);
        }
      }

      // ROUTE PING / HEALTH CHECK
      const routePingMatch = url.pathname.match(/^\/api\/manage\/routes\/([a-zA-Z0-9_-]+)\/ping$/);
      if (routePingMatch && method === 'POST') {
        const routeId = routePingMatch[1];
        const routes = (await env.API_KV.get('gateway:routes', 'json')) || [];
        const r = routes.find(item => item.id === routeId);
        if (!r) return jsonResponse({ error: 'Route tidak ditemukan' }, 404);

        const pingStart = performance.now();
        try {
          const testRes = await fetch(r.target, { method: 'GET', redirect: 'follow' });
          const pingDuration = Math.round(performance.now() - pingStart);
          return jsonResponse({
            success: true,
            status: testRes.status,
            latencyMs: pingDuration,
            target: r.target
          });
        } catch (err) {
          return jsonResponse({
            success: false,
            error: err.message,
            latencyMs: Math.round(performance.now() - pingStart),
            target: r.target
          }, 502);
        }
      }

      // ROUTE UPDATE / DELETE
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

          let target = (body.target || routes[index].target).trim();
          if (body.isAppsScript && !target.startsWith('http')) {
            target = `https://script.google.com/macros/s/${target}/exec`;
          }

          routes[index] = {
            ...routes[index],
            name: (body.name || routes[index].name).trim(),
            prefix,
            target,
            isAppsScript: body.isAppsScript !== undefined ? !!body.isAppsScript : routes[index].isAppsScript,
            methods: (body.methods || routes[index].methods).toUpperCase().trim(),
            headers: body.headers !== undefined ? body.headers : routes[index].headers,
            authRequired: body.authRequired !== undefined ? !!body.authRequired : routes[index].authRequired,
            stripPrefix: body.stripPrefix !== undefined ? !!body.stripPrefix : routes[index].stripPrefix,
            rateLimit: body.rateLimit !== undefined ? parseInt(body.rateLimit, 10) : (routes[index].rateLimit || 0),
            cacheTtl: body.cacheTtl !== undefined ? parseInt(body.cacheTtl, 10) : (routes[index].cacheTtl || 0),
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

      // API KEYS MANAGEMENT (With Scoping)
      if (url.pathname === '/api/manage/keys') {
        if (method === 'GET') {
          const keys = (await env.API_KV.get('gateway:keys', 'json')) || [];
          return jsonResponse({ keys });
        }

        if (method === 'POST') {
          const body = await request.json();
          const name = (body.name || 'Client Key').trim();
          const generatedKey = 'ten_' + crypto.randomUUID().replace(/-/g, '');
          const allowedRoutes = Array.isArray(body.allowedRoutes) && body.allowedRoutes.length > 0
            ? body.allowedRoutes
            : ['*'];

          const newKeyObj = {
            id: 'k_' + Date.now(),
            name,
            key: generatedKey,
            allowedRoutes,
            rateLimit: body.rateLimit ? parseInt(body.rateLimit, 10) : 100, // max req/min
            isActive: true,
            createdAt: new Date().toISOString()
          };

          const keys = (await env.API_KV.get('gateway:keys', 'json')) || [];
          keys.push(newKeyObj);

          await env.API_KV.put('gateway:keys', JSON.stringify(keys));
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

      // LIVE REQUEST LOGS
      if (url.pathname === '/api/manage/logs') {
        if (method === 'GET') {
          const logs = (await env.API_KV.get('gateway:logs', 'json')) || [];
          return jsonResponse({ logs });
        }
        if (method === 'DELETE') {
          await env.API_KV.put('gateway:logs', JSON.stringify([]));
          return jsonResponse({ success: true, message: 'Logs berhasil dibersihkan' });
        }
      }

      return jsonResponse({ error: 'Endpoint tidak ditemukan' }, 404);
    }

    // -------------------------------------------------------------
    // 4. GOOGLE APPS SCRIPT INSTANT SHORTENER ROUTER
    // Format: /gas/:deploymentId or /gas/:deploymentId/exec
    // -------------------------------------------------------------
    const gasMatch = url.pathname.match(/^\/gas\/([a-zA-Z0-9_-]+)(\/exec)?(\/.*)?$/);
    if (gasMatch) {
      const deploymentId = gasMatch[1];
      const extraSubPath = gasMatch[3] || '';
      const targetGasUrl = `https://script.google.com/macros/s/${deploymentId}/exec${extraSubPath}${url.search}`;

      try {
        const gasResponse = await handleAppsScriptProxy(request, targetGasUrl);
        const duration = Math.round(performance.now() - startTime);

        recordLog(env, ctx, {
          timestamp: new Date().toISOString(),
          method,
          path: url.pathname,
          target: targetGasUrl,
          status: gasResponse.status,
          durationMs: duration,
          clientIp,
          type: 'Google Apps Script'
        });

        return gasResponse;
      } catch (err) {
        return jsonResponse({
          error: 'Gagal menghubungkan ke Google Apps Script',
          deploymentId,
          details: err.message
        }, 502);
      }
    }

    // -------------------------------------------------------------
    // 5. GENERAL API GATEWAY REVERSE PROXY DISPATCHER
    // -------------------------------------------------------------
    let routes = [];
    try {
      routes = (await env.API_KV.get('gateway:routes', 'json')) || [];
    } catch (e) {
      routes = [];
    }

    // Sort routes by prefix length descending
    routes.sort((a, b) => (b.prefix || '').length - (a.prefix || '').length);

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

    // 5.1 Route Active Check
    if (matchedRoute.isActive === false) {
      return jsonResponse({
        error: 'Service temporarily disabled (route inactive)',
        route: matchedRoute.name
      }, 503);
    }

    // 5.2 Method Check
    if (matchedRoute.methods && matchedRoute.methods !== 'ALL') {
      const allowedMethods = matchedRoute.methods.split(',').map(m => m.trim().toUpperCase());
      if (!allowedMethods.includes(method)) {
        return jsonResponse({
          error: `Method ${method} is not allowed for this route`,
          allowedMethods
        }, 405);
      }
    }

    // 5.3 Authentication & Scoping Check
    let authenticatedKeyData = null;
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

      authenticatedKeyData = await env.API_KV.get(`apikey:${clientApiKey}`, 'json');
      if (!authenticatedKeyData || !authenticatedKeyData.isActive) {
        return jsonResponse({
          error: 'Forbidden: Invalid or revoked API Key'
        }, 403);
      }

      // Check Key Route Scoping
      if (authenticatedKeyData.allowedRoutes && !authenticatedKeyData.allowedRoutes.includes('*')) {
        if (!authenticatedKeyData.allowedRoutes.includes(matchedRoute.id)) {
          return jsonResponse({
            error: 'Forbidden: This API Key is not authorized to access this route'
          }, 403);
        }
      }
    }

    // 5.4 Rate Limiting Check (Per API Key or Client IP)
    const rateLimitCap = matchedRoute.rateLimit || (authenticatedKeyData ? authenticatedKeyData.rateLimit : 120);
    const rlIdentifier = authenticatedKeyData ? authenticatedKeyData.id : clientIp;
    const rlCheck = await checkRateLimit(env, rlIdentifier, rateLimitCap);
    if (!rlCheck.allowed) {
      return jsonResponse({
        error: 'Too Many Requests: Rate limit exceeded. Silakan coba sesaat lagi.',
        retryAfter: 60
      }, 429, { 'Retry-After': '60' });
    }

    // 5.5 Edge Caching Check (For GET requests with cacheTtl > 0)
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    if (method === 'GET' && matchedRoute.cacheTtl && matchedRoute.cacheTtl > 0) {
      const cachedResponse = await cache.match(cacheKey);
      if (cachedResponse) {
        const cachedResHeaders = new Headers(cachedResponse.headers);
        cachedResHeaders.set('X-Gateway-Cache', 'HIT');
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          headers: cachedResHeaders
        });
      }
    }

    // 5.6 Determine Upstream Target URL
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

    let targetBase = matchedRoute.target;
    if (targetBase.endsWith('/')) {
      targetBase = targetBase.slice(0, -1);
    }

    const upstreamUrlStr = targetBase + upstreamSubPath + url.search;

    // Special handler if target is Google Apps Script
    if (matchedRoute.isAppsScript || upstreamUrlStr.includes('script.google.com')) {
      try {
        const gasRes = await handleAppsScriptProxy(request, upstreamUrlStr, matchedRoute.headers);
        const duration = Math.round(performance.now() - startTime);

        recordLog(env, ctx, {
          timestamp: new Date().toISOString(),
          method,
          path: currentPath,
          target: upstreamUrlStr,
          status: gasRes.status,
          durationMs: duration,
          clientIp,
          route: matchedRoute.name
        });

        return gasRes;
      } catch (err) {
        return jsonResponse({
          error: 'Gateway: Gagal memproses request ke Google Apps Script',
          message: err.message
        }, 502);
      }
    }

    // Standard HTTP Proxying
    let upstreamUrl;
    try {
      upstreamUrl = new URL(upstreamUrlStr);
    } catch (e) {
      return jsonResponse({
        error: 'Bad Gateway: Format upstream URL tidak valid',
        target: upstreamUrlStr
      }, 502);
    }

    // Forward Headers
    const forwardHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
      if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
        forwardHeaders.set(key, value);
      }
    }

    forwardHeaders.set('Host', upstreamUrl.host);
    forwardHeaders.set('X-Forwarded-For', clientIp);
    forwardHeaders.set('X-Forwarded-Proto', 'https');
    forwardHeaders.set('X-Forwarded-Host', url.host || 'api.ten.my.id');

    if (matchedRoute.headers && typeof matchedRoute.headers === 'object') {
      for (const [hk, hv] of Object.entries(matchedRoute.headers)) {
        forwardHeaders.set(hk, String(hv));
      }
    }

    // Fetch Upstream with Timeout (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const fetchOptions = {
        method,
        headers: forwardHeaders,
        redirect: 'follow',
        signal: controller.signal
      };

      if (!['GET', 'HEAD'].includes(method)) {
        fetchOptions.body = request.body;
      }

      const upstreamResponse = await fetch(upstreamUrl.toString(), fetchOptions);
      clearTimeout(timeoutId);

      const responseHeaders = new Headers(upstreamResponse.headers);
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
      responseHeaders.set('X-Gateway-By', 'TEN API Gateway');

      const duration = Math.round(performance.now() - startTime);

      // Record Activity Log
      recordLog(env, ctx, {
        timestamp: new Date().toISOString(),
        method,
        path: currentPath,
        target: upstreamUrlStr,
        status: upstreamResponse.status,
        durationMs: duration,
        clientIp,
        route: matchedRoute.name
      });

      // Save to Edge Cache if enabled
      if (method === 'GET' && matchedRoute.cacheTtl && matchedRoute.cacheTtl > 0 && upstreamResponse.status === 200) {
        responseHeaders.set('Cache-Control', `public, max-age=${matchedRoute.cacheTtl}`);
        responseHeaders.set('X-Gateway-Cache', 'MISS');
        const resToCache = new Response(upstreamResponse.clone().body, {
          status: upstreamResponse.status,
          headers: responseHeaders
        });
        ctx.waitUntil(cache.put(cacheKey, resToCache));
      }

      return new Response(upstreamResponse.body, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders
      });

    } catch (err) {
      clearTimeout(timeoutId);
      const duration = Math.round(performance.now() - startTime);

      recordLog(env, ctx, {
        timestamp: new Date().toISOString(),
        method,
        path: currentPath,
        target: upstreamUrlStr,
        status: 502,
        durationMs: duration,
        clientIp,
        route: matchedRoute.name,
        error: err.message
      });

      return jsonResponse({
        error: 'Bad Gateway: Gagal menghubungi server backend upstream',
        message: err.name === 'AbortError' ? 'Koneksi timeout ke upstream (>15s)' : err.message,
        target: upstreamUrlStr
      }, 502);
    }
  }
};
