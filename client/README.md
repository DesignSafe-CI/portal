# Client

This repository is a pnpm workspace containing the client application and the
packages in `modules/`.

## Install

```sh
pnpm install
```

## Common commands

```sh
pnpm start             # Start the Vite development server on port 4200
pnpm build             # Build the client application
pnpm test              # Run application tests
pnpm test:workspaces   # Run tests in every module package
pnpm typecheck         # Type-check the application and module projects
pnpm lint              # Lint the workspace
pnpm e2e               # Run Playwright end-to-end tests
```

Run a command for one module with pnpm's workspace filter:

```sh
pnpm --filter @client/workspace test
```

## TypeScript configuration

The `@client/tsconfig` workspace package in `modules/tsconfig` shares compiler
settings through `@client/tsconfig/base.json`, `@client/tsconfig/lib.json`, and
`@client/tsconfig/spec.json`. Every consumer declares it as a `workspace:*`
devDependency; run `pnpm install` after adding a consumer.

The production and test presets use `${configDir}` patterns so source paths
resolve relative to the consuming project's config. The test preset also selects
test files across the workspace. TypeScript only checks types
(`noEmit: true`); Vite generates the build artifacts. Incremental typecheck caches
live under each project's `node_modules/.cache/typescript`, with separate cache
files for the root production and test projects. All module imports resolve
through their workspace dependencies.

Each module has one `tsconfig.json`, extending `@client/tsconfig/lib.json` with
its package-specific options. It checks production sources and excludes tests.
The root `tsconfig.spec.json` checks tests, declaration files, and Vite/Vitest
configs across the application and all modules, using the shared test preset.
Tests therefore share the root test project's JavaScript and JSON-module settings;
production projects retain their package-specific settings.

The root `tsconfig.json` is a solution file with references to `tsconfig.app.json`
and `tsconfig.spec.json`. The application config extends `@client/tsconfig/base.json`
and checks production sources throughout the client directory. Its include does
not enumerate modules, so new modules are checked automatically. Dependencies,
generated output, temporary files, coverage, `e2e`, tests, and test setup/config
files are excluded. The test config retains the shared test preset and includes.

`pnpm typecheck` runs `tsc --build` to check both projects. `pnpm tsc -b` at the
root does the same. The application check uses its own compiler options;
per-module configs remain available for editor production checks and optional
standalone typechecking. `pnpm build` runs both root typechecks before Vite.
