# bubbles-express-generator [![npm version](https://badge.fury.io/js/bubbles-express-generator.svg)](https://www.npmjs.com/package/bubbles-express-generator)

## A simple CLI to scaffold Express.js starter projects.

[🔧 Usage](#🔧-usage-🔝) | [🧪 Variants](#🧪-variants-🔝) | [📁 Output](#📁-output-🔝) | [🏁 Flags](#🏁-flags-🔝) | [⚙️ Environment Variables](#⚙️-environment-variables-🔝) | [📖 Help](#📖-help-🔝) | [🤝 Contributions](#🤝-contributions-🔝) | [🔗 Links](#🔗-links-🔝)

![bubbles-express](bubbles-express.png)

### 🔧 Usage [🔝](#bubbles-express-generator)

You can use the CLI via `npx` (no installation needed):

```bash
npx bubbles-express
```

Or if you prefer to, install it globally:

```bash
npm install -g bubbles-express-generator
```

Then you can run it with:

```bash
bubbles-express
```

### 🧪 Variants [🔝](#bubbles-express-generator)

The generator supports different project types:

- **(Supabase) PostgreSQL + Drizzle ORM + TypeScript**
- **MongoDB (Atlas) + Mongoose ODM + TypeScript**
- **(Supabase) PostgreSQL + Drizzle ORM + JavaScript**
- **MongoDB (Atlas) + Mongoose ODM + JavaScript**

### 📁 Output [🔝](#bubbles-express-generator)

A new folder will be created with the generated code based on your selections.  
If the target directory is not empty, you'll be prompted whether to overwrite it or choose a new name.  
If you target `.` and it is non-empty, the CLI shows a clear danger warning and requires a typed confirmation (`DELETE_CURRENT_DIR`) before anything is deleted.  
After that, dependencies will be installed automatically.

Once it's done, you can start your project with:

```bash
cd your-project-name
npm run dev
```

You're ready to go!

### 🏁 Flags [🔝](#bubbles-express-generator)

You can skip the interactive prompts by providing flags directly:

- `--ts` or `--js`: Set the language (TypeScript or JavaScript)
- `--pg` or `--mongo`: Choose your database (PostgreSQL or MongoDB)
- `--skip-install`: Scaffold the project without running `npm install`

Example:

```bash
npx bubbles-express my-api --ts --pg
npx bubbles-express my-api --ts --pg --skip-install
```

If all necessary flags are provided, the generator will auto-run without any questions.

### ⚙️ Environment Variables [🔝](#bubbles-express-generator)

- `BUBBLES_SKIP_INSTALL=1`: Skip dependency installation after scaffolding
- `CORS_ORIGIN`: Comma-separated CORS allowlist in generated projects (defaults to `http://localhost:3000` in development)
- `TRUST_PROXY=1`: Enables `app.set('trust proxy', 1)` in generated projects

### 📖 Help [🔝](#bubbles-express-generator)

To display the help menu, you can run:

```bash
npx bubbles-express --help
```

This will show a list of available flags and usage examples.

### 🤝 Contributions [🔝](#bubbles-express-generator)

This is my very first npm package — so it's likely to have more quirks than I realized 😅  
Feel free to open an issue for improvements or bug fixes, or submit a pull request directly.

### 🔗 Links [🔝](#bubbles-express-generator)

- 📄 [Documentation](https://github.com/mrbubbles-src/bubbles-express-generator)
- 🌐 [Website](https://github.com/mrbubbles-src/bubbles-express-generator)
