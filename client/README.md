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
