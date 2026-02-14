import type { Express } from 'express';

import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.MONGO_DB_URI = process.env.MONGO_DB_URI ?? 'mongodb://127.0.0.1:27017/test';

let app: Express;

beforeAll(async () => {
  ({ app } = await import('../app.js'));
});

describe('app', () => {
  it('returns health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });

  it('returns json for unknown routes', async () => {
    const response = await request(app).get('/missing-route');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ statusCode: 404 });
  });
});
