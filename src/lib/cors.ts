/**
 * CORS utility for handling multiple origins in development and production
 */

const allowedOrigins = [
  'http://localhost:5173',     // Development Vite server
  'https://app.sycamore.church', // Production mobile app
  'http://localhost:3000',     // Development Next.js server (if needed)
];

export function getCorsHeaders(request?: Request): Record<string, string> {
  const origin = request?.headers.get('origin') || '';
  
  // Check if the origin is in our allowed list
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
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
