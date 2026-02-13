#!/usr/bin/env node
import updateNotifier from 'update-notifier';
import { readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import prompts from 'prompts';
import kleur from 'kleur';
import boxen from 'boxen';
import ora from 'ora';
import { argv } from 'process';

const CONFIRM_OVERWRITE_TOKEN = 'DELETE_CURRENT_DIR';
const CANCEL_MESSAGE = kleur.yellow('\n⚠️  Project setup canceled.\n');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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
    boxen(
      [
        `🔔 Update available: ${kleur.dim(notifier.update.current)} ${kleur
          .green()
          .bold('→')} ${kleur.green().bold(notifier.update.latest)}`,
        '',
        `📦 Run ${kleur
          .green()
          .bold(`npm i -g ${notifier.update.name}`)} to update`,
      ].join('\n'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'red',
        title: '!! Update available !!',
        titleAlignment: 'center',
      },
    ),
  );
}

const args = argv.slice(2);
const nonFlagArgs = args.filter((arg) => !arg.startsWith('--'));
const firstNonFlagArg = nonFlagArgs[0] ?? null;

if (args.includes('-h') || args.includes('--help')) {
  console.log(
    boxen(
      [
        kleur.magenta().bold("🧰 Bubbles' Express Generator — Help"),
        '',
        kleur.white('Usage:'),
        '  npx bubbles-express [project-name|.] [flags]',
        '',
        kleur.white('Flags:'),
        '  --ts       Use TypeScript',
        '  --js       Use JavaScript',
        '  --mongo    Use MongoDB (Mongoose)',
        '  --pg       Use PostgreSQL (Supabase + Drizzle)',
        '  --skip-install Skip npm install after scaffolding',
        '  -h, --help Show this help message',
        '',
        kleur.gray('Example:'),
        '  npx bubbles-express my-api --ts --mongo',
        '  npx bubbles-express . --js --pg',
        '  npx bubbles-express my-api --ts --pg --skip-install',
      ].join('\n'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'magenta',
        title: 'Help',
        titleAlignment: 'center',
      },
    ),
  );
  process.exit(0);
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
  skipInstall: args.includes('--skip-install'),
};

if (!isTestMode) {
  const hasFlags = flags.language && flags.db;
  const skipInstallInfo = flags.skipInstall
    ? kleur.gray('\ninstall: skipped (--skip-install)')
    : '';
  const introMessage = hasFlags
    ? `${kleur
        .green()
        .bold('🚀 Oh, I see you know what you want — let’s get started!')}

${kleur.dim(
  `> npx bubbles-express ${flags.projectName} --${flags.language} --${flags.db}`,
)}

${kleur.gray(
  `project: ${flags.projectName} | language: ${flags.language} | database: ${flags.db}`,
)}${skipInstallInfo}`
    : `👋 Welcome to ${kleur.magenta().bold("Bubbles' Express Generator")}!

${kleur.white("Answer a few questions and we'll get you set up quickly.")}

💡 ${kleur.italic('Need help? Stop and run')} ${kleur.bold(
        'npx bubbles-express -h',
      )}
`;

  console.log(
    boxen(introMessage, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: hasFlags ? 'green' : 'magenta',
      title: hasFlags ? 'Auto Setup' : "Let's get started",
      titleAlignment: 'center',
      textAlignment: 'left',
    }),
  );
}

const mockResponses = isTestMode
  ? {
      projectName: flags.projectName ?? process.env.MOCK_PROJECT_NAME ?? 'test-app',
      language: flags.language ?? process.env.MOCK_LANGUAGE ?? 'js',
      db: flags.db ?? process.env.MOCK_DB ?? 'mongo',
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

let response;

if (isTestMode) {
  response = mockResponses;
} else {
  response = await ask(promptQuestions);
}

response.projectName = flags.projectName ?? response.projectName;
response.language = flags.language ?? response.language;
response.db = flags.db ?? response.db;

const skipInstallFromEnv = process.env.BUBBLES_SKIP_INSTALL;
const shouldSkipInstall =
  flags.skipInstall ||
  skipInstallFromEnv === '1' ||
  (skipInstallFromEnv !== '0' && isTestMode);

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

const removeDirectoryContents = async (directory) => {
  const entries = await fs.readdir(directory);
  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    await removePath(fullPath);
  }
};

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
    `You are about to overwrite files in ${kleur.bold(targetDir)}.`,
    kleur.red().bold('This action is NOT reversible.'),
  ].join('\n');

  console.log(
    boxen(warning, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'red',
      title: 'Danger Zone',
      titleAlignment: 'center',
    }),
  );

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

const installDependencies = async (targetDir) => {
  const spinner = ora('📦 Installing dependencies...').start();

  await new Promise((resolve, reject) => {
    const child = spawn('npm', ['install'], {
      cwd: targetDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(
          new Error(`npm install failed with exit code ${code ?? 'unknown'}`),
        );
      }
    });
  });

  spinner.succeed(kleur.green('✅ Dependencies installed'));
};

const createProject = async (choices) => {
  try {
    if (!choices.projectName || !choices.language || !choices.db) {
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

    if (shouldSkipInstall) {
      console.log(
        kleur.yellow(
          '\n⏭️  Skipping dependency installation (--skip-install, BUBBLES_SKIP_INSTALL=1, or test mode).\n',
        ),
      );
    } else {
      await installDependencies(targetDir);
    }

    const isCurrentDirectory =
      path.resolve(targetDir) === path.resolve(process.cwd());
    const nextSteps = isCurrentDirectory
      ? [`  ${kleur.dim('npm run dev')}`]
      : [
          `  ${kleur.dim(`cd ${path.basename(targetDir)}`)}`,
          `  ${kleur.dim('npm run dev')}`,
        ];
    const installHint = shouldSkipInstall
      ? `  ${kleur.dim('npm install')}\n`
      : '';

    const summaryBox = boxen(
      [
        `🎉 ${kleur.bold('Project created successfully!')}`,
        `${kleur.gray(
          `> npx bubbles-express ${choices.projectName} --${choices.language} --${choices.db}`,
        )}`,
        '',
        `${kleur.bold('📂 Project Folder:')} ${kleur.green(
          path.basename(targetDir),
        )}`,
        `${kleur.bold('🛠️  Language:')}       ${kleur.yellow(
          choices.language,
        )}`,
        `${kleur.bold('🗃️  Database:')}       ${kleur.cyan(choices.db)}`,
        '',
        kleur.italic('Happy coding! 🚀'),
        '',
        kleur.bold('👉 Next steps:'),
        ...(installHint ? [installHint.trimEnd()] : []),
        ...nextSteps,
      ].join('\n'),
      {
        padding: { top: 1, bottom: 1, left: 2, right: 2 },
        margin: 1,
        borderStyle: 'double',
        borderColor: 'green',
        title: 'Setup Complete',
        titleAlignment: 'center',
        textAlignment: 'left',
        align: 'left',
      },
    );

    console.log(summaryBox);
  } catch (error) {
    console.error('Error creating project:', error);
    return;
  }
};

if (response.projectName && response.language && response.db) {
  await createProject(response);
} else {
  console.log(kleur.yellow('\n⚠️  Project setup was canceled or incomplete.\n'));
  process.exit(0);
}
