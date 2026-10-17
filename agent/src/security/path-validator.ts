import path from 'node:path';
import fs from 'node:fs';
import { agentConfig } from '../config/index.js';

export class PathValidator {
  /**
   * Validates that a requested path lies strictly inside one of the configured permitted roots.
   * Resolves symlinks and normalizes case/slashes to prevent traversal attacks.
   */
  static validatePath(requestedPath: string): { isValid: boolean; normalizedPath: string; error?: string } {
    if (!requestedPath || typeof requestedPath !== 'string') {
      return { isValid: false, normalizedPath: '', error: 'Path is empty or invalid' };
    }

    try {
      // 1. Resolve normalized absolute path
      const absolutePath = path.resolve(requestedPath);

      // Check whether target exists; if it exists, check realpath (resolving symlinks)
      let resolvedTarget = absolutePath;
      if (fs.existsSync(absolutePath)) {
        try {
          resolvedTarget = fs.realpathSync.native(absolutePath);
        } catch {
          resolvedTarget = fs.realpathSync(absolutePath);
        }
      } else {
        // If file doesn't exist yet (e.g. upload target), resolve parent directory
        const parentDir = path.dirname(absolutePath);
        if (fs.existsSync(parentDir)) {
          const resolvedParent = fs.realpathSync(parentDir);
          resolvedTarget = path.join(resolvedParent, path.basename(absolutePath));
        }
      }

      const targetLower = resolvedTarget.toLowerCase();

      // 2. Check against permitted roots
      for (const root of agentConfig.permittedRootsList) {
        let normalizedRoot = path.resolve(root);
        if (fs.existsSync(normalizedRoot)) {
          try {
            normalizedRoot = fs.realpathSync.native(normalizedRoot);
          } catch {
            normalizedRoot = fs.realpathSync(normalizedRoot);
          }
        }
        const rootLower = normalizedRoot.toLowerCase();

        // Exact match or subpath check
        if (targetLower === rootLower || targetLower.startsWith(rootLower.endsWith(path.sep) ? rootLower : rootLower + path.sep)) {
          return { isValid: true, normalizedPath: resolvedTarget };
        }
      }

      return {
        isValid: false,
        normalizedPath: resolvedTarget,
        error: `Access denied. Target path '${requestedPath}' is outside authorized permitted roots.`,
      };
    } catch (err: any) {
      return { isValid: false, normalizedPath: '', error: `Path validation failed: ${err.message}` };
    }
  }

  static getPermittedRoots(): string[] {
    return agentConfig.permittedRootsList;
  }
}
