# @william2047/server-api-contract

TypeScript library scaffold with dual ESM/CJS output powered by tsup.

## Scripts

- `npm run build` - build `src` into `dist`
- `npm run dev` - watch source files and rebuild on change
- `npm run clean:dist` - remove generated build output
- `npm run clean:modules` - remove installed dependencies

## Usage

Add your shared API contract types and runtime helpers under `src/`, then publish the generated `dist/` output through npm.