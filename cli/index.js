#!/usr/bin/env node
import updateNotifier from 'update-notifier';
import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import prompts from 'prompts';
import kleur from 'kleur';
import ora from 'ora';
import { argv } from 'process';

const CONFIRM_OVERWRITE_TOKEN = 'DELETE_CURRENT_DIR';
const CANCEL_MESSAGE = kleur.yellow('\n⚠️  Project setup canceled.\n');
const VALID_PACKAGE_MANAGERS = new Set(['bun', 'npm']);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENT_INSTRUCTIONS_DIR = path.resolve(
  __dirname,
  '..',
  'templates/agent-instructions',
);
const pkg = JSON.parse(
  readFileSync(path.join(__dirname, '..', 'package.json')),
);
const isTestMode = process.env.NODE_ENV === 'test';
const isCI = process.env.CI === 'true' || process.env.CI === '1';
const shouldCheckUpdates = !isTestMode && !isCI && process.stdout.isTTY;
const notifier = shouldCheckUpdates ? updateNotifier({ pkg }) : null;

const promptOptions = {
  onCancel: () => {
    console.log(CANCEL_MESSAGE);
    process.exit(130);
  },
};

const ask = async (questions) => prompts(questions, promptOptions);

if (notifier?.update) {
  console.log(
    kleur.yellow(
      `Update available ${notifier.update.current} -> ${notifier.update.latest} | npm i -g ${notifier.update.name} | bun add -g ${notifier.update.name}`,
    ),
  );
}

const args = argv.slice(2);

/**
 * Reads a CLI flag value from either `--flag value` or `--flag=value`.
 *
 * Usage: used by startup parsing before prompt mode is selected.
 * Expects a raw argv slice and a flag key such as `--pm`; returns `null` when
 * the flag is absent, `''` when present without a value, otherwise a string.
 */
const getFlagValue = (allArgs, flagName) => {
  const equalsPrefix = `${flagName}=`;
  const inline = allArgs.find((arg) => arg.startsWith(equalsPrefix));
  if (inline) {
    return inline.slice(equalsPrefix.length);
  }

  const flagIndex = allArgs.indexOf(flagName);
  if (flagIndex === -1) {
    return null;
  }

  const nextValue = allArgs[flagIndex + 1];
  if (!nextValue || nextValue.startsWith('--')) {
    return '';
  }
  return nextValue;
};

/**
 * Collects positional args while skipping known flag payloads.
 *
 * Usage: used to determine project-name arguments before interactive prompts.
 * Expects a raw argv slice and returns only positional tokens in original order.
 */
const getPositionalArgs = (allArgs) => {
  const positionalArgs = [];
  for (let index = 0; index < allArgs.length; index += 1) {
    const arg = allArgs[index];
    if (arg === '--pm') {
      index += 1;
      continue;
    }
    if (arg.startsWith('--pm=')) {
      continue;
    }
    if (arg.startsWith('--')) {
      continue;
    }
    positionalArgs.push(arg);
  }
  return positionalArgs;
};

/**
 * Exits the process with a consistent package-manager validation error.
 *
 * Usage: called by package-manager parsing when values are unsupported.
 * Expects the source label and raw value; does not return because it exits.
 */
const exitWithInvalidPm = (source, receivedValue) => {
  const printableValue =
    receivedValue === undefined || receivedValue === null || receivedValue === ''
      ? '(empty)'
      : receivedValue;
  console.error(
    kleur.red(
      `Invalid package manager from ${source}: ${printableValue}. Use --pm bun|npm or BUBBLES_PM=bun|npm.`,
    ),
  );
  process.exit(1);
};

/**
 * Resolves and validates package manager input from env/flags.
 *
 * Usage: called for both `--pm` and `BUBBLES_PM` sources during bootstrap.
 * Expects a raw package-manager value and source label; returns normalized
 * `bun`/`npm`, `null` when omitted, or exits for invalid input.
 */
const resolvePackageManager = (rawValue, source) => {
  if (rawValue === null || rawValue === undefined) {
    return null;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    if (source === '--pm') {
      exitWithInvalidPm(source, rawValue);
    }
    return null;
  }

  if (!VALID_PACKAGE_MANAGERS.has(normalized)) {
    exitWithInvalidPm(source, rawValue);
  }

  return normalized;
};

const nonFlagArgs = getPositionalArgs(args);
const firstNonFlagArg = nonFlagArgs[0] ?? null;
const packageManagerFlagValue = getFlagValue(args, '--pm');
const packageManagerEnvValue = process.env.BUBBLES_PM;
const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY);

if (args.includes('-h') || args.includes('--help')) {
  console.log(
    [
      kleur.magenta().bold("Bubbles' Express Generator"),
      '',
      kleur.white().bold('Usage'),
      '  npx bubbles-express [project-name|.] [flags]',
      '  bunx --bun bubbles-express [project-name|.] [flags]',
      '',
      kleur.white().bold('Flags'),
      '  --ts                 Use TypeScript',
      '  --js                 Use JavaScript',
      '  --mongo              Use MongoDB (Mongoose)',
      '  --pg                 Use PostgreSQL (Supabase + Drizzle)',
      '  --pm <bun|npm>       Choose package manager',
      '  --skip-install       Skip dependency installation',
      '  -h, --help           Show this help message',
      '',
      kleur.white().bold('Examples'),
      '  npx bubbles-express my-api --ts --mongo',
      '  npx bubbles-express . --js --pg --pm npm',
      '  bunx --bun bubbles-express my-api --ts --pg --pm bun --skip-install',
    ].join('\n'),
  );
  process.exit(0);
}

const packageManagerFromFlag = resolvePackageManager(packageManagerFlagValue, '--pm');
const packageManagerFromEnv = resolvePackageManager(
  packageManagerEnvValue,
  'BUBBLES_PM',
);

if (!isTestMode && !isInteractive && !packageManagerFromFlag && !packageManagerFromEnv) {
  console.error(
    kleur.red(
      'Non-interactive mode requires a package manager. Use --pm bun|npm or BUBBLES_PM=bun|npm.',
    ),
  );
  process.exit(1);
}

if (isTestMode && process.env.MOCK_CANCEL === '1') {
  console.log(CANCEL_MESSAGE);
  process.exit(130);
}

const isDot = firstNonFlagArg === '.';

const flags = {
  useCurrentDir: isDot,
  projectName: isDot ? '.' : firstNonFlagArg,
  language: args.includes('--ts') ? 'ts' : args.includes('--js') ? 'js' : null,
  db: args.includes('--mongo') ? 'mongo' : args.includes('--pg') ? 'pg' : null,
  packageManager: packageManagerFromFlag ?? packageManagerFromEnv,
  skipInstall: args.includes('--skip-install'),
};

if (!isTestMode) {
  const hasFlags = flags.language && flags.db;
  const introLines = hasFlags
    ? [
        kleur.green().bold('Scaffolding with your selected flags.'),
        kleur.gray(
          `project: ${flags.projectName} | language: ${flags.language} | database: ${flags.db} | pm: ${flags.packageManager ?? 'prompt'}`,
        ),
        ...(flags.skipInstall ? [kleur.gray('install: skipped (--skip-install)')] : []),
      ]
    : [
        kleur.magenta().bold("Bubbles' Express Generator"),
        'Answer a few prompts to scaffold your API.',
        kleur.gray('Need help? Run: npx bubbles-express -h'),
      ];

  console.log(`\n${introLines.join('\n')}\n`);
}

const mockResponses = isTestMode
  ? {
      projectName: flags.projectName ?? process.env.MOCK_PROJECT_NAME ?? 'test-app',
      language: flags.language ?? process.env.MOCK_LANGUAGE ?? 'js',
      db: flags.db ?? process.env.MOCK_DB ?? 'mongo',
      packageManager:
        flags.packageManager ?? process.env.MOCK_PM ?? process.env.BUBBLES_PM ?? 'npm',
      addAgents: process.env.MOCK_ADD_AGENTS === '1',
      addClaude: process.env.MOCK_ADD_CLAUDE === '1',
    }
  : null;

const promptQuestions = [];

if (!flags.projectName || flags.projectName.trim() === '') {
  promptQuestions.push({
    type: 'text',
    name: 'projectName',
    message: 'What is the name of your project?',
    initial: 'backend',
  });
}

if (!flags.language) {
  promptQuestions.push({
    type: 'select',
    name: 'language',
    message: 'What language do you want to use?',
    choices: [
      { title: 'JavaScript', value: 'js' },
      { title: 'TypeScript', value: 'ts' },
    ],
  });
}

if (!flags.db) {
  promptQuestions.push({
    type: 'select',
    name: 'db',
    message: 'What database do you want to use?',
    choices: [
      { title: 'MongoDB (Atlas) with Mongoose ODM', value: 'mongo' },
      { title: 'Supabase PostgreSQL with Drizzle ORM', value: 'pg' },
    ],
  });
}

if (!flags.packageManager) {
  promptQuestions.push({
    type: 'select',
    name: 'packageManager',
    message: 'Which package manager do you want to use?',
    choices: [
      { title: 'Bun', value: 'bun' },
      { title: 'npm', value: 'npm' },
    ],
  });
}

if (!isTestMode && isInteractive) {
  promptQuestions.push({
    type: 'confirm',
    name: 'addAgents',
    message: 'Do you want to add an AGENTS.md file to your project root?',
    initial: false,
  });

  promptQuestions.push({
    type: 'confirm',
    name: 'addClaude',
    message: 'Do you want to add a CLAUDE.md file to your project root?',
    initial: false,
  });
}

let response;

if (isTestMode) {
  response = mockResponses;
} else {
  response = await ask(promptQuestions);
}

response.projectName = flags.projectName ?? response.projectName;
response.language = flags.language ?? response.language;
response.db = flags.db ?? response.db;
response.packageManager = flags.packageManager ?? response.packageManager;
response.addAgents = Boolean(response.addAgents ?? false);
response.addClaude = Boolean(response.addClaude ?? false);

const skipInstallFromEnv = process.env.BUBBLES_SKIP_INSTALL;
const shouldSkipInstall =
  flags.skipInstall ||
  skipInstallFromEnv === '1' ||
  (skipInstallFromEnv !== '0' && isTestMode);

/**
 * Removes a file or directory with retries for transient `ENOTEMPTY` races.
 *
 * Usage: used by overwrite flows before scaffolding into an existing target.
 * Expects an absolute/relative path and returns after the path is removed or
 * confirmed missing; throws on non-retryable failures.
 */
const removePath = async (targetPath) => {
  try {
    await fs.rm(targetPath, {
      recursive: true,
      force: true,
      maxRetries: 6,
      retryDelay: 120,
    });
    return;
  } catch (error) {
    if (error?.code !== 'ENOTEMPTY') {
      throw error;
    }
  }

  // If a directory changes while being removed, retry after deleting children.
  const stats = await fs.lstat(targetPath).catch(() => null);
  if (!stats) {
    return;
  }

  if (stats.isDirectory()) {
    const childEntries = await fs.readdir(targetPath).catch(() => []);
    for (const child of childEntries) {
      await removePath(path.join(targetPath, child));
    }
    await fs.rmdir(targetPath).catch(() => undefined);
    return;
  }

  await fs.rm(targetPath, { force: true }).catch(() => undefined);
};

/**
 * Removes every entry inside a directory while preserving the directory itself.
 *
 * Usage: used when overwriting the current working directory (`.`).
 * Expects an existing directory path and returns when all child paths are gone.
 */
const removeDirectoryContents = async (directory) => {
  const entries = await fs.readdir(directory);
  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    await removePath(fullPath);
  }
};

/**
 * Prompts for a replacement project name when overwrite is declined.
 *
 * Usage: called in rename branches for dot-directory and named-directory flows.
 * Expects the current project name and returns a trimmed replacement or empty.
 */
const askForProjectName = async (currentName) => {
  if (isTestMode && process.env.MOCK_RENAME) {
    return process.env.MOCK_RENAME;
  }

  const { newName } = await ask({
    type: 'text',
    name: 'newName',
    message: 'Choose a new name for your project:',
    initial: `${currentName}-new`,
  });
  return newName?.trim();
};

/**
 * Prompts for the action to take when scaffolding into a non-empty `.` target.
 *
 * Usage: called only for current-directory conflicts.
 * Expects the resolved target directory path and returns `rename`, `overwrite`,
 * or `cancel` (including test-mode mock behavior).
 */
const askForDotDirectoryAction = async (targetDir) => {
  if (isTestMode) {
    if (process.env.MOCK_DOT_ACTION) {
      return process.env.MOCK_DOT_ACTION;
    }
    if (process.env.MOCK_OVERWRITE !== undefined) {
      return process.env.MOCK_OVERWRITE === '1' ? 'overwrite' : 'rename';
    }
    return 'cancel';
  }

  const warning = [
    kleur.red().bold(`Danger: overwrite files in ${targetDir}`),
    kleur.red('This action is irreversible.'),
  ].join('\n');

  console.log(`\n${warning}\n`);

  const { dotAction } = await ask({
    type: 'select',
    name: 'dotAction',
    message: 'This directory is not empty. What do you want to do?',
    choices: [
      { title: 'Use new project name', value: 'rename' },
      { title: 'Overwrite current directory', value: 'overwrite' },
      { title: 'Cancel', value: 'cancel' },
    ],
  });

  return dotAction;
};

/**
 * Confirms destructive overwrite of the current directory with a typed token.
 *
 * Usage: called after selecting the `overwrite` action for `.` targets.
 * Expects the target directory path and returns `true` only when confirmation
 * exactly matches `DELETE_CURRENT_DIR` (or test-mode mocks).
 */
const confirmDotOverwrite = async (targetDir) => {
  if (isTestMode) {
    if (process.env.MOCK_DOT_CONFIRM !== undefined) {
      return process.env.MOCK_DOT_CONFIRM === CONFIRM_OVERWRITE_TOKEN;
    }
    return process.env.MOCK_OVERWRITE === '1';
  }

  const { confirmation } = await ask({
    type: 'text',
    name: 'confirmation',
    message: `Type ${CONFIRM_OVERWRITE_TOKEN} to permanently overwrite files in ${targetDir}:`,
  });

  return confirmation === CONFIRM_OVERWRITE_TOKEN;
};

/**
 * Prompts whether to overwrite a non-empty named target directory.
 *
 * Usage: called for non-`.` targets that already contain files.
 * Expects the target directory path and returns a boolean overwrite decision.
 */
const shouldOverwriteNamedDirectory = async (targetDir) => {
  if (isTestMode && process.env.MOCK_OVERWRITE !== undefined) {
    return process.env.MOCK_OVERWRITE === '1';
  }

  const { overwrite } = await ask({
    type: 'confirm',
    name: 'overwrite',
    message: `The directory "${path.basename(targetDir)}" is not empty. Overwrite?`,
    initial: false,
  });

  return overwrite;
};

/**
 * Installs scaffolded project dependencies with the selected package manager.
 *
 * Usage: invoked after template copy unless installation is explicitly skipped.
 * Expects the target directory and `bun`/`npm`; returns when install succeeds
 * and rejects with actionable errors for missing tooling or install failures.
 */
const installDependencies = async (targetDir, packageManager) => {
  const command = packageManager === 'bun' ? 'bun' : 'npm';
  const installArgs = ['install'];
  const spinner = ora(`Installing dependencies (${command} install)...`).start();

  await new Promise((resolve, reject) => {
    const child = spawn(command, installArgs, {
      cwd: targetDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', (error) => {
      if (error?.code === 'ENOENT') {
        reject(
          new Error(
            command === 'bun'
              ? 'Bun is not installed. Install Bun from https://bun.sh or rerun with --pm npm.'
              : 'npm is not installed or not in PATH. Please install Node.js/npm and try again.',
          ),
        );
        return;
      }
      reject(error);
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(
            `${command} install failed with exit code ${code ?? 'unknown'}.`,
          ),
        );
      }
    });
  });

  spinner.succeed(kleur.green(`Dependencies installed (${command} install)`));
};

/**
 * Applies Bun-specific script and dependency profile adjustments.
 *
 * Usage: runs after scaffolding only when `choices.packageManager === 'bun'`.
 * Expects the generated project path and scaffold choices; returns after
 * persisting updated `package.json` scripts and dev dependency cleanup.
 */
const applyPackageManagerProfile = async (targetDir, choices) => {
  if (choices.packageManager !== 'bun') {
    return;
  }

  const packageJsonPath = path.join(targetDir, 'package.json');
  const packageJsonRaw = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonRaw);
  const isTypeScriptTemplate = choices.language === 'ts';
  const appEntry = isTypeScriptTemplate ? 'src/app.ts' : 'src/app.js';

  packageJson.scripts = {
    ...packageJson.scripts,
    dev: `bun --watch ${appEntry}`,
    start: `bun ${appEntry}`,
    lint: 'bunx eslint .',
    test: 'bunx vitest run',
    'test:watch': 'bunx vitest',
  };

  if (isTypeScriptTemplate) {
    packageJson.scripts.typecheck = 'bunx tsc --noEmit';
  }

  if (packageJson.scripts?.fullclean) {
    const lockfiles = ['bun.lock', 'bun.lockb'];
    let fullcleanScript = packageJson.scripts.fullclean;
    for (const lockfile of lockfiles) {
      if (!fullcleanScript.includes(lockfile)) {
        fullcleanScript = `${fullcleanScript} ${lockfile}`;
      }
    }
    packageJson.scripts.fullclean = fullcleanScript;
  }

  if (packageJson.devDependencies) {
    delete packageJson.devDependencies.nodemon;
    if (isTypeScriptTemplate) {
      delete packageJson.devDependencies.tsx;
    }
  }

  await fs.writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
};

/**
 * Copies optional AGENTS/CLAUDE instruction files into the generated project.
 *
 * Usage: called after template copy when users opt into instruction files.
 * Expects target directory + scaffold choices and returns after copy attempts,
 * warning (without failing) when optional templates are missing.
 */
const copyOptionalInstructionFiles = async (targetDir, choices) => {
  const filesToCopy = [];
  if (choices.addAgents) {
    filesToCopy.push('AGENTS.md');
  }
  if (choices.addClaude) {
    filesToCopy.push('CLAUDE.md');
  }

  const languageInstructionsDir = path.join(
    AGENT_INSTRUCTIONS_DIR,
    choices.language,
  );

  for (const filename of filesToCopy) {
    const sourceCandidates = [
      path.join(languageInstructionsDir, filename),
      path.join(AGENT_INSTRUCTIONS_DIR, filename),
    ];
    const sourcePath =
      sourceCandidates.find((candidate) => existsSync(candidate)) ?? null;
    const destinationPath = path.join(targetDir, filename);

    if (!sourcePath) {
      console.log(
        kleur.yellow(
          `⚠️  Skipped ${filename}: template not found at templates/agent-instructions/${choices.language}/${filename}.`,
        ),
      );
      continue;
    }

    await fs.copyFile(sourcePath, destinationPath);
  }
};

/**
 * Executes the full scaffold workflow from target resolution to setup summary.
 *
 * Usage: entrypoint for non-canceled prompt/flag responses.
 * Expects validated scaffold choices and returns after project creation flow,
 * including overwrite handling, template copy, optional file copy, and install.
 */
const createProject = async (choices) => {
  try {
    if (
      !choices.projectName ||
      !choices.language ||
      !choices.db ||
      !choices.packageManager
    ) {
      console.log(kleur.yellow('\n⚠️  Project setup was canceled or incomplete.\n'));
      return;
    }

    let projectName = choices.projectName;
    let targetDir = path.resolve(
      process.cwd(),
      projectName === '.' ? '.' : projectName,
    );

    while (true) {
      const existingFiles = await fs.readdir(targetDir).catch(() => []);

      if (existingFiles.length === 0) {
        break;
      }

      const isCurrentDirectory =
        path.resolve(targetDir) === path.resolve(process.cwd());

      if (isCurrentDirectory) {
        const action = await askForDotDirectoryAction(targetDir);

        if (action === 'cancel') {
          console.log(CANCEL_MESSAGE);
          return;
        }

        if (action === 'rename') {
          const newName = await askForProjectName(projectName);
          if (!newName) {
            console.log(CANCEL_MESSAGE);
            return;
          }
          projectName = newName;
          targetDir = path.resolve(process.cwd(), projectName);
          continue;
        }

        const hasConfirmed = await confirmDotOverwrite(targetDir);
        if (!hasConfirmed) {
          console.log(
            kleur.yellow('\n⚠️  Overwrite confirmation failed. Setup canceled.\n'),
          );
          return;
        }
        await removeDirectoryContents(targetDir);
        break;
      }

      const overwrite = await shouldOverwriteNamedDirectory(targetDir);
      if (!overwrite) {
        const newName = await askForProjectName(projectName);
        if (!newName) {
          console.log(CANCEL_MESSAGE);
          return;
        }
        projectName = newName;
        targetDir = path.resolve(process.cwd(), projectName);
        continue;
      }

      await removePath(targetDir);
      break;
    }

    choices.projectName = projectName;

    const templateDir = path.resolve(
      __dirname,
      '..',
      `templates/${choices.language}-${choices.db}`,
    );

    try {
      await fs.access(templateDir);
    } catch {
      throw new Error(`Template not found: ${choices.language}-${choices.db}`);
    }

    await fs.mkdir(targetDir, { recursive: true });
    await fs.cp(templateDir, targetDir, { recursive: true });

    const placeholders = {
      '{{__PROJECT_NAME__}}': path.basename(targetDir),
    };

    const replacePlaceholders = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await replacePlaceholders(fullPath);
        } else {
          let content = await fs.readFile(fullPath, 'utf-8');
          let updated = content;
          for (const [placeholder, value] of Object.entries(placeholders)) {
            updated = updated.replace(new RegExp(placeholder, 'g'), value);
          }
          if (updated !== content) {
            await fs.writeFile(fullPath, updated, 'utf-8');
          }
        }
      }
    };

    await replacePlaceholders(targetDir);
    await copyOptionalInstructionFiles(targetDir, choices);
    await applyPackageManagerProfile(targetDir, choices);

    if (shouldSkipInstall) {
      const installCommand = `${choices.packageManager} install`;
      console.log(
        kleur.yellow(
          `\n⏭️  Skipping dependency installation (--skip-install, BUBBLES_SKIP_INSTALL=1, or test mode). Run "${installCommand}" when you're ready.\n`,
        ),
      );
    } else {
      await installDependencies(targetDir, choices.packageManager);
    }

    const isCurrentDirectory =
      path.resolve(targetDir) === path.resolve(process.cwd());
    const runDevCommand = `${choices.packageManager} run dev`;
    const installCommand = `${choices.packageManager} install`;
    const nextSteps = isCurrentDirectory
      ? [`  ${kleur.dim(runDevCommand)}`]
      : [
          `  ${kleur.dim(`cd ${path.basename(targetDir)}`)}`,
          `  ${kleur.dim(runDevCommand)}`,
        ];
    const installHint = shouldSkipInstall
      ? `  ${kleur.dim(installCommand)}\n`
      : '';

    const summaryLines = [
      kleur.green().bold('Project created successfully.'),
      kleur.gray(
        `> npx bubbles-express ${choices.projectName} --${choices.language} --${choices.db} --pm ${choices.packageManager}`,
      ),
      `Project folder: ${kleur.green(path.basename(targetDir))}`,
      `Language: ${kleur.yellow(choices.language)}`,
      `Database: ${kleur.cyan(choices.db)}`,
      `Package manager: ${kleur.magenta(choices.packageManager)}`,
      kleur.italic('Small scaffold. Big momentum.'),
      'Next steps:',
      ...(installHint ? [installHint.trimEnd()] : []),
      ...nextSteps,
    ];

    console.log(`\n${summaryLines.join('\n')}\n`);
  } catch (error) {
    console.error('Error creating project:', error);
    return;
  }
};

if (response.projectName && response.language && response.db && response.packageManager) {
  await createProject(response);
} else {
  console.log(kleur.yellow('\n⚠️  Project setup was canceled or incomplete.\n'));
  process.exit(0);
}
