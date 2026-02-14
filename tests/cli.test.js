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
const AGENT_TEMPLATES_ROOT = path.resolve(
  __dirname,
  '../templates/agent-instructions',
);

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
      BUBBLES_PM: 'npm',
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

const readProjectPackageJson = async (projectDir) => {
  return fs.readJson(path.join(TEST_PROJECTS_DIR, projectDir, 'package.json'));
};

const withInstructionTemplates = async (language, files, run) => {
  const languageTemplateDir = path.join(AGENT_TEMPLATES_ROOT, language);
  const directoryExisted = await fs.pathExists(languageTemplateDir);
  const backups = new Map();

  await fs.ensureDir(languageTemplateDir);

  for (const [filename, content] of Object.entries(files)) {
    const filePath = path.join(languageTemplateDir, filename);
    const existed = await fs.pathExists(filePath);
    backups.set(filename, existed ? await fs.readFile(filePath, 'utf-8') : null);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  try {
    await run();
  } finally {
    for (const [filename, original] of backups.entries()) {
      const filePath = path.join(languageTemplateDir, filename);
      if (original === null) {
        await fs.rm(filePath, { force: true });
      } else {
        await fs.writeFile(filePath, original, 'utf-8');
      }
    }

    if (!directoryExisted) {
      const remainingFiles = await fs.readdir(languageTemplateDir).catch(() => []);
      if (remainingFiles.length === 0) {
        await fs.rm(languageTemplateDir, { recursive: true, force: true });
      }
    }
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
    .filter(
      (combo) =>
        combo &&
        ['js', 'ts'].includes(combo.language) &&
        ['mongo', 'pg'].includes(combo.db),
    );

  combos.forEach(({ language, db }) => {
    const langFlag = `--${language}`;
    const dbFlag = db === 'mongo' ? '--mongo' : '--pg';
    const appEntry = language === 'ts' ? 'src/app.ts' : 'src/app.js';

    it(`creates project with name and flags [${language}-${db}]`, async () => {
      const customName = `${language}-${db}-flags`;
      const result = await runCLI([customName, langFlag, dbFlag]);
      const exists = await projectExists(customName);
      const projectPackage = await readProjectPackageJson(customName);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/Project created successfully/i);
      expect(result.stdout).toMatch(/Small scaffold\. Big momentum\./i);
      expect(result.stdout).toMatch(/Skipping dependency installation/i);
      expect(result.stdout).toMatch(/Package manager:\s+npm/i);
      expect(exists).toBe(true);
      expect(await fileExists(path.join(TEST_PROJECTS_DIR, customName, appEntry))).toBe(
        true,
      );
      expect(projectPackage.scripts.lint).toBe('eslint .');
      if (language === 'js') {
        expect(projectPackage.scripts.dev).toContain('nodemon');
        expect(projectPackage.devDependencies.nodemon).toBeTruthy();
      } else {
        expect(projectPackage.scripts.dev).toContain('tsx watch src/app.ts');
        expect(projectPackage.scripts.typecheck).toBe('tsc --noEmit');
        expect(projectPackage.devDependencies.tsx).toBeTruthy();
      }
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

  it('prints minimal help output without boxed formatting', async () => {
    const result = await runCLI(['--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Bubbles' Express Generator/i);
    expect(result.stdout).toMatch(/Usage/i);
    expect(result.stdout).toMatch(/Flags/i);
    expect(result.stdout).toMatch(/Examples/i);
    expect(result.stdout).not.toMatch(/╔|╗|╚|╝|═|║/);
  });

  it('supports --skip-install in non-test mode', async () => {
    const result = await runCLI(
      ['prod-skip-install', '--ts', '--mongo', '--skip-install', '--pm', 'npm'],
      TEST_PROJECTS_DIR,
      { NODE_ENV: 'production', BUBBLES_SKIP_INSTALL: '0', BUBBLES_PM: '' },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Skipping dependency installation/i);
    expect(result.stdout).toMatch(/Run "npm install" when you're ready/i);
    expect(await projectExists('prod-skip-install')).toBe(true);
  });

  it('supports BUBBLES_SKIP_INSTALL=1 in non-test mode', async () => {
    const result = await runCLI(
      ['prod-skip-install-env', '--js', '--pg', '--pm', 'npm'],
      TEST_PROJECTS_DIR,
      { NODE_ENV: 'production', BUBBLES_SKIP_INSTALL: '1', BUBBLES_PM: '' },
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

  it('uses Bun scripts/dependencies when --pm bun is provided (JS)', async () => {
    const projectName = 'bun-js-project';
    const result = await runCLI([projectName, '--js', '--mongo', '--pm', 'bun']);
    const projectPackage = await readProjectPackageJson(projectName);

    expect(result.exitCode).toBe(0);
    expect(projectPackage.scripts.dev).toBe('bun --watch src/app.js');
    expect(projectPackage.scripts.start).toBe('bun src/app.js');
    expect(projectPackage.scripts.lint).toBe('bunx eslint .');
    expect(projectPackage.scripts.test).toBe('bun test');
    expect(projectPackage.scripts['test:watch']).toBe('bun test --watch');
    expect(projectPackage.devDependencies.nodemon).toBeUndefined();
    expect(projectPackage.scripts.fullclean).toContain('bun.lock');
    expect(projectPackage.scripts.fullclean).toContain('bun.lockb');
  });

  it('uses Bun scripts/dependencies when --pm bun is provided (TS)', async () => {
    const projectName = 'bun-ts-project';
    const result = await runCLI([projectName, '--ts', '--pg', '--pm', 'bun']);
    const projectPackage = await readProjectPackageJson(projectName);

    expect(result.exitCode).toBe(0);
    expect(projectPackage.scripts.dev).toBe('bun --watch src/app.ts');
    expect(projectPackage.scripts.start).toBe('bun src/app.ts');
    expect(projectPackage.scripts.lint).toBe('bunx eslint .');
    expect(projectPackage.scripts.typecheck).toBe('bunx tsc --noEmit');
    expect(projectPackage.scripts.test).toBe('bun test');
    expect(projectPackage.scripts['test:watch']).toBe('bun test --watch');
    expect(projectPackage.devDependencies.tsx).toBeUndefined();
    expect(projectPackage.devDependencies.typescript).toBeTruthy();
    expect(projectPackage.scripts.fullclean).toContain('bun.lock');
    expect(projectPackage.scripts.fullclean).toContain('bun.lockb');
  });

  it('uses mocked package manager prompt selection in test mode', async () => {
    const projectName = 'prompt-bun-selection';
    const result = await runCLI([projectName, '--js', '--pg'], TEST_PROJECTS_DIR, {
      BUBBLES_PM: '',
      MOCK_PM: 'bun',
    });
    const projectPackage = await readProjectPackageJson(projectName);

    expect(result.exitCode).toBe(0);
    expect(projectPackage.scripts.dev).toBe('bun --watch src/app.js');
    expect(projectPackage.devDependencies.nodemon).toBeUndefined();
  });

  it('fails fast on invalid --pm values', async () => {
    const result = await runCLI(['bad-pm', '--js', '--mongo', '--pm', 'pnpm']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Invalid package manager/i);
    expect(await projectExists('bad-pm')).toBe(false);
  });

  it('fails in non-interactive mode when package manager is missing', async () => {
    const result = await runCLI(
      ['non-interactive-no-pm', '--js', '--mongo'],
      TEST_PROJECTS_DIR,
      { NODE_ENV: 'production', BUBBLES_PM: '' },
    );

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toMatch(/Non-interactive mode requires a package manager/i);
    expect(await projectExists('non-interactive-no-pm')).toBe(false);
  });

  it('shows Bun install hint when Bun project skips install', async () => {
    const result = await runCLI(
      ['bun-skip-install', '--js', '--mongo', '--pm', 'bun', '--skip-install'],
      TEST_PROJECTS_DIR,
      { NODE_ENV: 'production', BUBBLES_PM: '' },
    );

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/Run "bun install" when you're ready/i);
    expect(result.stdout).toMatch(/bun run dev/i);
  });

  it('copies only AGENTS.md when selected', async () => {
    await withInstructionTemplates(
      'js',
      {
        'AGENTS.md': '# AGENTS\nBe concise.\n',
        'CLAUDE.md': '# CLAUDE\nBe safe.\n',
      },
      async () => {
        const projectName = 'with-agents-only';
        const result = await runCLI(
          [projectName, '--js', '--mongo', '--pm', 'npm'],
          TEST_PROJECTS_DIR,
          { MOCK_ADD_AGENTS: '1', MOCK_ADD_CLAUDE: '0' },
        );

        const agentsPath = path.join(TEST_PROJECTS_DIR, projectName, 'AGENTS.md');
        const claudePath = path.join(TEST_PROJECTS_DIR, projectName, 'CLAUDE.md');

        expect(result.exitCode).toBe(0);
        expect(await fileExists(agentsPath)).toBe(true);
        expect(await fileExists(claudePath)).toBe(false);
      },
    );
  });

  it('copies AGENTS.md and CLAUDE.md when both are selected', async () => {
    await withInstructionTemplates(
      'ts',
      {
        'AGENTS.md': '# AGENTS\nFollow repo standards.\n',
        'CLAUDE.md': '# CLAUDE\nPlan before edits.\n',
      },
      async () => {
        const projectName = 'with-agents-and-claude';
        const result = await runCLI(
          [projectName, '--ts', '--pg', '--pm', 'npm'],
          TEST_PROJECTS_DIR,
          { MOCK_ADD_AGENTS: '1', MOCK_ADD_CLAUDE: '1' },
        );

        const agentsPath = path.join(TEST_PROJECTS_DIR, projectName, 'AGENTS.md');
        const claudePath = path.join(TEST_PROJECTS_DIR, projectName, 'CLAUDE.md');

        expect(result.exitCode).toBe(0);
        expect(await fileExists(agentsPath)).toBe(true);
        expect(await fileExists(claudePath)).toBe(true);
        expect(await fs.readFile(agentsPath, 'utf-8')).toContain('Follow repo standards');
        expect(await fs.readFile(claudePath, 'utf-8')).toContain('Plan before edits');
      },
    );
  });
});
