import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';

const mockNotify = vi.fn();

vi.mock('update-notifier', () => {
  return () => ({
    notify: mockNotify,
  });
});

const CLI_PATH = path.resolve(__dirname, '../cli/index.js');
const TEST_PROJECTS_DIR = path.resolve(__dirname, 'test-projects');

const runCLI = async (
  args = [],
  cwd = TEST_PROJECTS_DIR,
  envOverrides = {},
) => {
  return await execa('node', [CLI_PATH, ...args], {
    cwd,
    env: {
      FORCE_COLOR: '0',
      CI: '1',
      NODE_ENV: 'test',
      BUBBLES_SKIP_INSTALL: '1',
      ...envOverrides,
    },
    stdin: 'ignore',
    reject: false,
  });
};

const projectExists = async (dir) => {
  const fullPath = path.join(TEST_PROJECTS_DIR, dir);
  try {
    const stat = await fs.stat(fullPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
};

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

describe('bubbles-express CLI', () => {
  beforeEach(async () => {
    await fs.ensureDir(TEST_PROJECTS_DIR);
  });

  afterEach(async () => {
    const files = await fs.readdir(TEST_PROJECTS_DIR);
    await Promise.all(
      files.map(async (file) => {
        if (file !== '.gitkeep') {
          const fullPath = path.join(TEST_PROJECTS_DIR, file);
          await fs.rm(fullPath, { recursive: true, force: true });
        }
      }),
    );
  });

  const templatesRoot = path.resolve(__dirname, '../templates');
  const templateDirs = fs
    .readdirSync(templatesRoot)
    .filter((dir) => fs.statSync(path.join(templatesRoot, dir)).isDirectory());

  const combos = templateDirs
    .map((dir) => {
      const match = /^([a-z]+)-([a-z]+)/.exec(dir);
      return match ? { language: match[1], db: match[2] } : null;
    })
    .filter(Boolean);

  combos.forEach(({ language, db }) => {
    const langFlag = `--${language}`;
    const dbFlag = db === 'mongo' ? '--mongo' : '--pg';
    const appEntry = language === 'ts' ? 'src/app.ts' : 'src/app.js';

    it(`creates project with name and flags [${language}-${db}]`, async () => {
      const customName = `${language}-${db}-flags`;
      const result = await runCLI([customName, langFlag, dbFlag]);
      const exists = await projectExists(customName);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created successfully/i);
      expect(result.stdout).toMatch(/Skipping dependency installation/i);
      expect(exists).toBe(true);
      expect(await fileExists(path.join(TEST_PROJECTS_DIR, customName, appEntry))).toBe(
        true,
      );
    });

    it(`renames when "." target is non-empty and user chooses new name [${language}-${db}]`, async () => {
      const testDirName = `${language}-${db}-dot-rename`;
      const testDir = path.join(TEST_PROJECTS_DIR, testDirName);
      const renameDir = `${language}-${db}-renamed`;

      await fs.ensureDir(testDir);
      await fs.writeFile(path.join(testDir, 'dummy.txt'), 'placeholder');

      const result = await runCLI(['.', langFlag, dbFlag], testDir, {
        MOCK_DOT_ACTION: 'rename',
        MOCK_RENAME: renameDir,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created successfully/i);
      expect(await fileExists(path.join(testDir, 'dummy.txt'))).toBe(true);
      expect(await fileExists(path.join(testDir, renameDir, appEntry))).toBe(true);
    });

    it(`cancels "." overwrite when typed token is wrong [${language}-${db}]`, async () => {
      const testDirName = `${language}-${db}-dot-wrong-token`;
      const testDir = path.join(TEST_PROJECTS_DIR, testDirName);
      const markerPath = path.join(testDir, 'do-not-delete.txt');

      await fs.ensureDir(testDir);
      await fs.writeFile(markerPath, 'placeholder');

      const result = await runCLI(['.', langFlag, dbFlag], testDir, {
        MOCK_DOT_ACTION: 'overwrite',
        MOCK_DOT_CONFIRM: 'WRONG_TOKEN',
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Overwrite confirmation failed/i);
      expect(await fileExists(markerPath)).toBe(true);
      expect(await fileExists(path.join(testDir, appEntry))).toBe(false);
    });

    it(`overwrites "." when typed token is correct [${language}-${db}]`, async () => {
      const testDirName = `${language}-${db}-dot-confirmed`;
      const testDir = path.join(TEST_PROJECTS_DIR, testDirName);
      const markerPath = path.join(testDir, 'delete-me.txt');

      await fs.ensureDir(testDir);
      await fs.writeFile(markerPath, 'placeholder');

      const result = await runCLI(['.', langFlag, dbFlag], testDir, {
        MOCK_DOT_ACTION: 'overwrite',
        MOCK_DOT_CONFIRM: 'DELETE_CURRENT_DIR',
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created successfully/i);
      expect(await fileExists(markerPath)).toBe(false);
      expect(await fileExists(path.join(testDir, appEntry))).toBe(true);
    });

    it(`overwrites "." with nested directories [${language}-${db}]`, async () => {
      const testDirName = `${language}-${db}-dot-nested`;
      const testDir = path.join(TEST_PROJECTS_DIR, testDirName);
      const nestedFile = path.join(testDir, 'src', 'nested', 'old-file.txt');

      await fs.ensureDir(path.dirname(nestedFile));
      await fs.writeFile(nestedFile, 'placeholder');

      const result = await runCLI(['.', langFlag, dbFlag], testDir, {
        MOCK_DOT_ACTION: 'overwrite',
        MOCK_DOT_CONFIRM: 'DELETE_CURRENT_DIR',
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created successfully/i);
      expect(await fileExists(nestedFile)).toBe(false);
      expect(await fileExists(path.join(testDir, appEntry))).toBe(true);
    });
  });

  it('supports --skip-install in non-test mode', async () => {
    const result = await runCLI(
      ['prod-skip-install', '--ts', '--mongo', '--skip-install'],
      TEST_PROJECTS_DIR,
      { NODE_ENV: 'production', BUBBLES_SKIP_INSTALL: '0' },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Skipping dependency installation/i);
    expect(await projectExists('prod-skip-install')).toBe(true);
  });

  it('supports BUBBLES_SKIP_INSTALL=1 in non-test mode', async () => {
    const result = await runCLI(
      ['prod-skip-install-env', '--js', '--pg'],
      TEST_PROJECTS_DIR,
      { NODE_ENV: 'production', BUBBLES_SKIP_INSTALL: '1' },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Skipping dependency installation/i);
    expect(await projectExists('prod-skip-install-env')).toBe(true);
  });

  it('exits with code 130 when setup is canceled', async () => {
    const result = await runCLI([], TEST_PROJECTS_DIR, { MOCK_CANCEL: '1' });

    expect(result.exitCode).toBe(130);
    expect(result.stdout).toMatch(/Project setup canceled/i);
  });
});
