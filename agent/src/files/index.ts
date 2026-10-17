import fs from 'node:fs';
import path from 'node:path';
import { PathValidator } from '../security/path-validator.js';
import { FileItem } from '@remotedesk/shared';

export class FileOperations {
  static browseDirectory(targetPath?: string): { currentPath: string; parentPath: string | null; items: FileItem[] } {
    const roots = PathValidator.getPermittedRoots();

    // If no path is specified, return listing of permitted roots
    if (!targetPath || targetPath.trim() === '') {
      const rootItems: FileItem[] = roots.map(r => ({
        name: r,
        path: r,
        isDirectory: true,
        sizeBytes: 0,
        modifiedAt: new Date().toISOString(),
      }));
      return { currentPath: '', parentPath: null, items: rootItems };
    }

    const check = PathValidator.validatePath(targetPath);
    if (!check.isValid) {
      throw new Error(check.error || 'Access to requested path denied');
    }

    const resolved = check.normalizedPath;
    if (!fs.existsSync(resolved)) {
      throw new Error(`Directory does not exist: ${targetPath}`);
    }

    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      throw new Error(`Path is a file, not a directory: ${targetPath}`);
    }

    const parent = path.dirname(resolved);
    const parentValid = PathValidator.validatePath(parent).isValid;

    const entries = fs.readdirSync(resolved, { withFileTypes: true });
    const items: FileItem[] = [];

    for (const entry of entries) {
      try {
        const fullPath = path.join(resolved, entry.name);
        const entryStat = fs.statSync(fullPath);

        items.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          sizeBytes: entry.isDirectory() ? 0 : entryStat.size,
          modifiedAt: entryStat.mtime.toISOString(),
          extension: entry.isDirectory() ? undefined : path.extname(entry.name).toLowerCase(),
        });
      } catch {
        // Skip unreadable system/locked items
      }
    }

    // Sort: directories first, then files alphabetically
    items.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      currentPath: resolved,
      parentPath: parentValid ? parent : null,
      items,
    };
  }

  static createFolder(parentPath: string, name: string): { success: boolean; createdPath: string } {
    const check = PathValidator.validatePath(parentPath);
    if (!check.isValid) {
      throw new Error(check.error || 'Parent directory access denied');
    }

    // Sanitize folder name
    const sanitizedName = name.replace(/[<>:"/\\|?*]/g, '').trim();
    if (!sanitizedName) {
      throw new Error('Invalid folder name');
    }

    const newFolderPath = path.join(check.normalizedPath, sanitizedName);
    const targetCheck = PathValidator.validatePath(newFolderPath);
    if (!targetCheck.isValid) {
      throw new Error('Target folder escapes permitted roots');
    }

    if (fs.existsSync(newFolderPath)) {
      throw new Error('A file or folder with that name already exists');
    }

    fs.mkdirSync(newFolderPath, { recursive: true });
    return { success: true, createdPath: newFolderPath };
  }

  static renameItem(currentPath: string, newName: string): { success: boolean; newPath: string } {
    const check = PathValidator.validatePath(currentPath);
    if (!check.isValid) {
      throw new Error(check.error || 'Access to target path denied');
    }

    const sanitizedName = newName.replace(/[<>:"/\\|?*]/g, '').trim();
    if (!sanitizedName) {
      throw new Error('Invalid new name');
    }

    const parentDir = path.dirname(check.normalizedPath);
    const destinationPath = path.join(parentDir, sanitizedName);

    const destCheck = PathValidator.validatePath(destinationPath);
    if (!destCheck.isValid) {
      throw new Error('Destination path escapes permitted roots');
    }

    if (fs.existsSync(destinationPath)) {
      throw new Error('A file or folder with that name already exists at destination');
    }

    fs.renameSync(check.normalizedPath, destinationPath);
    return { success: true, newPath: destinationPath };
  }

  static deleteItem(targetPath: string): { success: boolean; deletedPath: string } {
    const check = PathValidator.validatePath(targetPath);
    if (!check.isValid) {
      throw new Error(check.error || 'Access to target path denied');
    }

    if (!fs.existsSync(check.normalizedPath)) {
      throw new Error('Target file or folder does not exist');
    }

    const stat = fs.statSync(check.normalizedPath);
    if (stat.isDirectory()) {
      fs.rmSync(check.normalizedPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(check.normalizedPath);
    }

    return { success: true, deletedPath: check.normalizedPath };
  }

  static writeFile(targetDir: string, fileName: string, base64Content: string): { success: boolean; writtenPath: string; sizeBytes: number } {
    const dirCheck = PathValidator.validatePath(targetDir);
    if (!dirCheck.isValid) {
      throw new Error(dirCheck.error || 'Target directory access denied');
    }

    const sanitizedName = path.basename(fileName).replace(/[<>:"/\\|?*]/g, '').trim();
    const destinationPath = path.join(dirCheck.normalizedPath, sanitizedName);

    const destCheck = PathValidator.validatePath(destinationPath);
    if (!destCheck.isValid) {
      throw new Error('Target file path escapes permitted roots');
    }

    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(destinationPath, buffer);

    return {
      success: true,
      writtenPath: destinationPath,
      sizeBytes: buffer.length,
    };
  }

  static readFile(targetPath: string, maxSizeBytes: number = 25 * 1024 * 1024): { fileName: string; sizeBytes: number; base64Content: string } {
    const check = PathValidator.validatePath(targetPath);
    if (!check.isValid) {
      throw new Error(check.error || 'Access to target file denied');
    }

    if (!fs.existsSync(check.normalizedPath)) {
      throw new Error('File not found');
    }

    const stat = fs.statSync(check.normalizedPath);
    if (stat.isDirectory()) {
      throw new Error('Cannot download a directory directly');
    }

    if (stat.size > maxSizeBytes) {
      throw new Error(`File size (${Math.round(stat.size / 1024 / 1024)}MB) exceeds maximum download limit (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
    }

    const buffer = fs.readFileSync(check.normalizedPath);
    return {
      fileName: path.basename(check.normalizedPath),
      sizeBytes: buffer.length,
      base64Content: buffer.toString('base64'),
    };
  }
}
