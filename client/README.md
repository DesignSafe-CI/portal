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
files for the root application and test projects. All module imports resolve
through their workspace dependencies.

Each module has one `tsconfig.json`, extending `@client/tsconfig/lib.json` with
its package-specific options. It checks production sources and excludes tests.
The root `tsconfig.spec.json` checks tests, declaration files, and Vite/Vitest
configs across the application and all modules, using the shared test preset.
Tests therefore share the root test project's JavaScript and JSON-module settings;
production projects retain their package-specific settings.

The root `tsconfig.json` references only the application production and shared test
projects. `pnpm typecheck` uses pnpm's workspace discovery to run `tsc --build` in
the root and every module, excluding the config-only `@client/tsconfig` package.
New module packages are checked automatically without adding root project
references. `pnpm build` runs this workspace typecheck before Vite. Running
`tsc --build` directly at the root checks only the application and shared test
projects, including their imported module sources.
