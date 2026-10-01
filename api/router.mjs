import { routes } from '../lib/routes.mjs';


export async function dispatch(request) {
  const url = new URL(request.url);
  const endpoint = url.searchParams.get('endpoint') || url.pathname.split('/').pop();
  const handler = routes[endpoint];
  if (!handler) return Response.json({ error: 'Ruta desconocida' }, { status: 404 });
  try {
    const response = await handler(request);
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Fallo en endpoint', endpoint, error.name);
    return Response.json({ error: 'No se pudo completar la operación. Revisá la configuración del servidor.' }, { status: 500 });
  }
}

export default { fetch: dispatch };
