/**
 * CORS utility for handling multiple origins in development and production
 */

const allowedOrigins = [
  'http://localhost:5173',     // Development Vite server
  'https://app.sycamore.church', // Production mobile app
  'http://localhost:3000',     // Development Next.js server (if needed)
];

export function getCorsHeaders(request?: Request): Record<string, string> {
  // Allow all origins for now - TODO: restrict in production if needed
  const origin = request?.headers.get('origin') || '*';
  
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'false', // Must be false when using '*'
  };
}

export function corsResponse(data: any, request?: Request, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(request),
    },
  });
}

export function handlePreflight(request?: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
