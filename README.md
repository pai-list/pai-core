# @pai/core

**Shared packages for the PAI Universe — crypto, sdk, identity, verify, wallet, validators.**

[![npm](https://img.shields.io/npm/v/@pai/crypto?label=@pai/crypto)](https://www.npmjs.com/package/@pai/crypto)
[![npm](https://img.shields.io/npm/v/@pai/sdk?label=@pai/sdk)](https://www.npmjs.com/package/@pai/sdk)
[![npm](httpsimg.shields.io/npm/v/@pai/identity?label=@pai/identity)](https://www.npmjs.com/package/@pai/identity)
[![npm](https://img.shields.io/npm/v/@pai/verify?label=@pai/verify)](https://www.npmjs.com/package/@pai/verify)
[![npm](https://img.shields.io/npm/v/@pai/wallet?label=@pai/wallet)](https://www.npmjs.com/package/@pai/wallet)
[![npm](https://img.shields.io/npm/v/@pai/validators?label=@pai/validators)](https://www.npmjs.com/package/@pai/validators)

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| `@pai/crypto` | Cryptographic primitives: keypairs, signing, canonical serialization | [![npm](https://img.shields.io/npm/v/@pai/crypto)](https://www.npmjs.com/package/@pai/crypto) |
| `@pai/sdk` | Core SDK utilities: HTTP client, configuration, error handling | [![npm](https://img.shields.io/npm/v/@pai/sdk)](https://www.npmjs.com/package/@pai/sdk) |
| `@pai/identity` | DID (did:pai), TrustChain, Verifiable Credentials, Pi Network integration | [![npm](https://img.shields.io/npm/v/@pai/identity)](https://www.npmjs.com/package/@pai/identity) |
| `@pai/verify` | KYA (Know Your Agent) verification, Pi Network verification | [![npm](https://img.shields.io/npm/v/@pai/verify)](https://www.npmjs.com/package/@pai/verify) |
| `@pai/wallet` | Wallet integration, key management, signing operations | [![npm](https://img.shields.io/npm/v/@pai/wallet)](https://www.npmjs.com/package/@pai/wallet) |
| `@pai/validators` | Multi-platform validation with risk scoring (Cloudflare, Vercel, Pi, AgentApp) | [![npm](https://img.shields.io/npm/v/@pai/validators)](https://www.npmjs.com/package/@pai/validators) |

---

## Installation

```bash
# Install all packages
pnpm add @pai/crypto @pai/sdk @pai/identity @pai/verify @pai/wallet @pai/validators

# Or install individually
pnpm add @pai/crypto
pnpm add @pai/validators
```

---

## Quick Start

### Using Validators

```typescript
import { 
  AgentAppValidator, 
  CloudflareValidator, 
  VercelValidator, 
  PiAppValidator 
} from '@pai/validators';

async function validateProject() {
  const validators = [
    new AgentAppValidator(),  // Always runs - manifest validation
  ];

  // Platform-specific validators run based on detected config
  if (existsSync('wrangler.jsonc')) {
    validators.push(new CloudflareValidator());
  }
  if (existsSync('vercel.json')) {
    validators.push(new VercelValidator());
  }
  if (packageJsonHasDependency('@pi-network/sdk')) {
    validators.push(new PiAppValidator());
  }

  for (const validator of validators) {
    const result = await validator.validate(process.cwd());
    if (!result.passed) {
      console.error(`${validator.constructor.name} failed:`, result.errors);
      process.exit(1);
    }
    if (result.riskScore >= 80) {
      console.error(`Risk score ${result.riskScore} exceeds threshold`);
      process.exit(1);
    }
  }
}
```

### Using Crypto

```typescript
import { generateKeypair, sign, verify } from '@pai/crypto';

const keypair = await generateKeypair();
const message = new TextEncoder().encode('Hello PAI');
const signature = await sign(keypair.privateKey, message);
const valid = await verify(keypair.publicKey, message, signature);
```

### Using Identity (TrustChain)

```typescript
import { createDID, issueVC, verifyVC } from '@pai/identity';

const did = await createDID({ method: 'pai' });
const vc = await issueVC({
  issuer: did,
  subject: 'did:pai:user123',
  claims: { role: 'developer' }
});
const verified = await verifyVC(vc);
```

---

## Development

### Prerequisites
- Node.js 22+
- pnpm 9+

### Commands
```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build all packages
pnpm run build

# Run tests
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck
```

### Workspace Structure
```
pai-core/
├── packages/
│   ├── crypto/       # Cryptographic primitives
│   ├── sdk/          # Core SDK utilities
│   ├── identity/     # DID, TrustChain, Pi Network
│   ├── verify/       # KYA, Pi verification
│   ├── wallet/       # Wallet integration
│   └── validators/   # Multi-platform validators
├── turbo.json        # Turborepo config
└── package.json      # Workspace root
```

---

## Publishing

Packages are published to npm via GitHub Actions on release:

```bash
# Trigger a patch release
gh workflow run publish.yml -f version=patch

# Or create a release on GitHub
```

---

## Architecture

This monorepo follows the PAI Universe architecture principles:

- **Muraqabah**: Every package has audit trail via TrustChain
- **Tawbah**: Errors are logged, not hidden
- **Sidq**: No mocks in production code, honest about limitations
- **Rahma**: Packages designed for human developers, not just machines

---

## Related Repos

- **pai-skills**: Self-improving skill registry (uses @pai/*)
- **pai-agent-kit**: Agent runtime (uses @pai/*)
- **PAI-Memory**: L2/L3 memory implementation
- **pai-list/.github**: Reusable CI/CD workflows

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Contributing

1. Fork the repository
2. Create feature branch
3. Run `pnpm test` and `pnpm lint`
4. Submit PR - PAI Deploy-Review Pipeline will validate
5. Risk Gate must pass (score < 80)

---

*Part of the PAI Universe — Building infrastructure for self-evolving, verifiable, production-grade AI agents.*
