import { describe, it, expect } from 'vitest';
import { PathValidator } from '../src/security/path-validator.js';
import { collectSystemMetrics } from '../src/system/index.js';
import { FileOperations } from '../src/files/index.js';

describe('Windows Agent Security & System Tests', () => {
  it('PathValidator permits legitimate subpath inside permitted root', () => {
    const roots = PathValidator.getPermittedRoots();
    expect(roots.length).toBeGreaterThan(0);

    const firstRoot = roots[0];
    const result = PathValidator.validatePath(firstRoot);
    expect(result.isValid).toBe(true);
  });

  it('PathValidator blocks directory traversal attempts (e.g. ..\\..\\Windows)', () => {
    const maliciousPath = 'C:\\Users\\..\\..\\Windows\\System32\\cmd.exe';
    const result = PathValidator.validatePath(maliciousPath);
    // Since C:\Windows is not in permitted roots (only C:\Users, D:\), it must be rejected!
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('outside authorized permitted roots');
  });

  it('PathValidator rejects empty or invalid paths', () => {
    const result = PathValidator.validatePath('');
    expect(result.isValid).toBe(false);
  });

  it('collectSystemMetrics returns valid system structure without throwing', async () => {
    const metrics = await collectSystemMetrics('test-device-uuid');
    expect(metrics).toBeDefined();
    expect(metrics.deviceId).toBe('test-device-uuid');
    expect(metrics.cpu).toBeDefined();
    expect(metrics.cpu.cores).toBeGreaterThan(0);
    expect(metrics.memory.totalBytes).toBeGreaterThan(0);
    expect(metrics.uptimeSeconds).toBeGreaterThan(0);
  }, 10000);

  it('FileOperations.browseDirectory returns permitted root drives when path is empty', () => {
    const res = FileOperations.browseDirectory('');
    expect(res).toBeDefined();
    expect(res.items.length).toBeGreaterThan(0);
    expect(res.items[0].isDirectory).toBe(true);
  });
});
