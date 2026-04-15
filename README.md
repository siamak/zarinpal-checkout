# zarinpal-checkout

A modern, type-safe ZarinPal checkout client for Node.js. This `1.0.0` release keeps backward-compatible method names while upgrading internals, tooling, and tests.

## Features

- ✅ TypeScript-first with bundled type definitions
- ✅ Backward-compatible APIs (`create`, `PaymentRequest`, `PaymentVerification`, `UnverifiedTransactions`, `RefreshAuthority`, `TokenBeautifier`)
- ✅ Fast built-in Node.js test runner (no Vite dependency)
- ✅ Strict linting + type-checking workflows
- ✅ Rollup build output (ESM + CJS) with declaration bundling

## Installation

```bash
# npm
npm install zarinpal-checkout

# yarn
yarn add zarinpal-checkout

# pnpm
pnpm add zarinpal-checkout
```

## Usage

### Backward-compatible API (recommended for existing users)

```ts
import ZarinpalCheckout from 'zarinpal-checkout';

const zarinpal = ZarinpalCheckout.create(
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  false,
  'IRT'
);

const request = await zarinpal.PaymentRequest({
  Amount: 1000,
  CallbackURL: 'https://example.com/payment/callback',
  Description: 'Order #123',
  Email: 'user@example.com',
  Mobile: '09120000000'
});

console.log(request.url);
```

### Options-based API

```ts
import { createWithOptions } from 'zarinpal-checkout';

const zarinpal = createWithOptions('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', {
  sandbox: true,
  currency: 'IRR',
  timeoutMs: 8000
});
```


## Examples

The `examples/` directory includes runnable examples for every public method:

- `examples/create-client.ts`
- `examples/payment-request.ts`
- `examples/payment-verification.ts`
- `examples/unverified-transactions.ts`
- `examples/refresh-authority.ts`
- `examples/token-beautifier.ts`

Run with your preferred TypeScript runtime (for example `tsx` or `ts-node`) after replacing the merchant ID and callback URLs.

## API Reference

### `PaymentRequest(input)`
Creates a payment authority.

### `PaymentVerification(input)`
Verifies a completed payment authority.

### `UnverifiedTransactions()`
Fetches unverified authorities.

### `RefreshAuthority(input)`
Refreshes an existing authority expiration.

### `TokenBeautifier(token)`
Preserves previous token beautifier behavior.


## Releases & npm Publish

This repository includes automated release and publish workflows:

- `.github/workflows/release-please.yml`: creates/updates release PRs and GitHub releases from conventional commits.
- `.github/workflows/publish.yml`: publishes to npm automatically when a GitHub Release is published.

### Required GitHub Secrets

- `NPM_TOKEN`: npm automation token with publish access for `zarinpal-checkout`.

## Development

```bash
# npm
npm install && npm run lint && npm run typecheck && npm test && npm run build

# yarn
yarn install && yarn lint && yarn typecheck && yarn test && yarn build

# pnpm
pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

## License

MIT
