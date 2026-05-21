import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { api, ApiError } from '@/lib/api';

describe('api()', () => {
  it('fait un GET avec credentials: include', async () => {
    let capturedCredentials: RequestCredentials | undefined;
    server.use(
      http.get('/api/foo', ({ request }) => {
        capturedCredentials = request.credentials;
        return HttpResponse.json({ ok: true });
      }),
    );
    await api('/api/foo');
    expect(capturedCredentials).toBe('include');
  });

  it('POST avec body JSON ajoute Content-Type application/json', async () => {
    let capturedContentType: string | null = null;
    let capturedBody: unknown;
    server.use(
      http.post('/api/foo', async ({ request }) => {
        capturedContentType = request.headers.get('Content-Type');
        capturedBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await api('/api/foo', { method: 'POST', body: { x: 1 } });
    expect(capturedContentType).toBe('application/json');
    expect(capturedBody).toEqual({ x: 1 });
  });

  it('POST avec FormData ne fixe pas Content-Type manuellement', async () => {
    let capturedContentType: string | null = null;
    server.use(
      http.post('/api/upload', async ({ request }) => {
        capturedContentType = request.headers.get('Content-Type');
        return HttpResponse.json({ ok: true });
      }),
    );
    const fd = new FormData();
    fd.append('field', 'value');
    await api('/api/upload', { method: 'POST', body: fd });
    // Le navigateur/fetch fixe multipart/form-data avec boundary automatiquement
    // On vérifie seulement qu'on n'a PAS forcé application/json
    expect(capturedContentType).not.toBe('application/json');
  });

  it('retourne le JSON parsé sur réponse 200', async () => {
    server.use(
      http.get('/api/data', () => HttpResponse.json({ value: 42 })),
    );
    const result = await api<{ value: number }>('/api/data');
    expect(result).toEqual({ value: 42 });
  });

  it('retourne undefined sur réponse 204', async () => {
    server.use(
      http.delete('/api/item', () => new HttpResponse(null, { status: 204 })),
    );
    const result = await api('/api/item', { method: 'DELETE' });
    expect(result).toBeUndefined();
  });

  it('throw ApiError avec status 401 sur réponse 401', async () => {
    server.use(
      http.get('/api/protected', () =>
        HttpResponse.json({ error: 'Unauthorized' }, { status: 401 }),
      ),
    );
    await expect(api('/api/protected')).rejects.toThrow(ApiError);
    await expect(api('/api/protected')).rejects.toMatchObject({ status: 401 });
  });

  it('throw ApiError avec le message du body sur réponse 500', async () => {
    server.use(
      http.get('/api/broken', () =>
        HttpResponse.json({ error: 'oops' }, { status: 500 }),
      ),
    );
    await expect(api('/api/broken')).rejects.toMatchObject({
      status: 500,
      message: 'oops',
    });
  });
});
