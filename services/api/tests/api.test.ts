import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { runMigrations } from '../src/database/migrate.js';
import { runSeeds } from '../src/database/seed.js';
import { closeDatabase } from '../src/database/db.js';

describe('RemoteDesk API Tests', () => {
  let app: any;
  let authToken: string;
  let enrolledDeviceId: string;

  beforeAll(() => {
    runMigrations();
    runSeeds();
    app = createApp();
  });

  afterAll(() => {
    closeDatabase();
  });

  it('GET /health returns healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('POST /api/v1/auth/login succeeds with seeded admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@remotedesk.local',
        password: 'RemoteDesk@Admin2025!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('admin@remotedesk.local');
    authToken = res.body.data.token;
  });

  it('POST /api/v1/auth/login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@remotedesk.local',
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/auth/session returns authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('admin@remotedesk.local');
  });

  it('POST /api/v1/devices/enroll successfully enrolls a new device', async () => {
    const res = await request(app)
      .post('/api/v1/devices/enroll')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        displayName: 'Test Windows Laptop',
        hostname: 'WIN-TESTLAPTOP',
        osName: 'Windows 11 Pro',
        osVersion: '10.0.26100',
        arch: 'x64',
        agentVersion: '1.0.0',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.device.id).toBeDefined();
    expect(res.body.data.credentials.secretKey).toBeDefined();

    enrolledDeviceId = res.body.data.device.id;
  });

  it('GET /api/v1/devices lists the enrolled device', async () => {
    const res = await request(app)
      .get('/api/v1/devices')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const found = res.body.data.find((d: any) => d.id === enrolledDeviceId);
    expect(found).toBeDefined();
  });

  it('GET /api/v1/settings returns configuration and allowlists', async () => {
    const res = await request(app)
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.applications.length).toBeGreaterThan(0);
    expect(res.body.data.operations.length).toBeGreaterThan(0);
  });
});
