import { describe, it, expect } from 'vitest';
import { LoginSchema, EnrollDeviceSchema, PowerActionSchema } from '@remotedesk/shared';

describe('Frontend Form & Validation Tests', () => {
  it('Login validation accepts valid email and 8+ char password', () => {
    const valid = LoginSchema.safeParse({
      email: 'admin@remotedesk.local',
      password: 'RemoteDesk@Admin2025!',
    });
    expect(valid.success).toBe(true);
  });

  it('Login validation rejects malformed email address', () => {
    const invalid = LoginSchema.safeParse({
      email: 'not-an-email',
      password: 'RemoteDesk@Admin2025!',
    });
    expect(invalid.success).toBe(false);
  });

  it('EnrollDeviceSchema requires display name and hostname', () => {
    const invalid = EnrollDeviceSchema.safeParse({
      displayName: '',
      hostname: '',
      osName: 'Windows 11',
      osVersion: '10.0.26100',
      arch: 'x64',
      agentVersion: '1.0.0',
    });
    expect(invalid.success).toBe(false);
  });

  it('PowerActionSchema requires explicit confirm: true for safety', () => {
    const withoutConfirm = PowerActionSchema.safeParse({
      action: 'RESTART',
      confirm: false,
    });
    expect(withoutConfirm.success).toBe(false);

    const withConfirm = PowerActionSchema.safeParse({
      action: 'RESTART',
      confirm: true,
    });
    expect(withConfirm.success).toBe(true);
  });
});
