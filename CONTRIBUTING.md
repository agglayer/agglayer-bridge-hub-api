# Contributing to Agglayer Bridge Hub

Thank you for your interest in contributing to the Agglayer Bridge Hub! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Package Management](#package-management)
- [Documentation](#documentation)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or personal attacks
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Bun](https://bun.sh) >= 1.0.0
- [Git](https://git-scm.com/)
- MongoDB >= 4.4 (for local testing)
- A code editor (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/agglayer-bridge-hub-api.git
cd agglayer-bridge-hub-api
```

3. Add upstream remote:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/agglayer-bridge-hub-api.git
```

## Development Setup

### Install Dependencies

```bash
# Install all dependencies
bun install

# Bootstrap monorepo (if needed)
bun run bootstrap
```

### Environment Configuration

Each package requires environment variables. See `.env.example` files in each package:

```bash
# Copy example env files
cp packages/api/.env.example packages/api/.env
cp packages/consumer/.env.example packages/consumer/.env
cp packages/auto-claim/.env.example packages/auto-claim/.env
```

### Start Development Servers

```bash
# Start all packages in development mode
bun run dev

# Or start individual packages
cd packages/api && bun run dev
cd packages/consumer && bun run dev
cd packages/auto-claim && bun run dev
```

## Development Workflow

### Branch Strategy

We follow a simplified Git flow:

- `main` - Production-ready code
- `rc/*` - Release candidate branches
- `feat/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates
- `refactor/*` - Code refactoring
- `test/*` - Test improvements

### Creating a Branch

```bash
# Update main
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feat/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### Making Changes

1. Make your changes in focused, logical commits
2. Write or update tests as needed
3. Ensure all tests pass
4. Update documentation if needed
5. Run linting and formatting

```bash
# Run tests
bun run test

# Format code
bun run format

# Lint code
bun run lint

# Type check
bun run type-check

# Run all checks
bun run style:check
```

### Keeping Your Branch Updated

```bash
# Fetch upstream changes
git fetch upstream

# Rebase your branch
git rebase upstream/main

# If conflicts occur, resolve them and continue
git add .
git rebase --continue
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Always define types, avoid `any`
- Use interfaces for object shapes
- Use type aliases for unions/intersections
- Prefer `const` over `let`, avoid `var`

**Good:**

```typescript
interface Transaction {
	id: string;
	amount: bigint;
	status: "pending" | "completed";
}

const processTransaction = (tx: Transaction): Promise<void> => {
	// Implementation
};
```

**Bad:**

```typescript
const processTransaction = (tx: any) => {
	// Implementation
};
```

### File Naming

- Use snake_case for files: `transaction_service.ts`
- Use PascalCase for classes: `TransactionService`
- Use camelCase for functions and variables: `getTransaction`
- Use UPPER_CASE for constants: `MAX_RETRIES`

### Code Organization

```typescript
// 1. Imports (external, then internal)
import { Logger } from "@polygonlabs/servercore";
import type { IHubTransaction } from "@agglayer/bridge-hub-commons";

// 2. Constants
const DEFAULT_TIMEOUT = 5000;

// 3. Types/Interfaces
interface ServiceConfig {
	apiUrl: string;
	timeout: number;
}

// 4. Class/Function definitions
export class TransactionService {
	// Implementation
}

// 5. Exports (if not inline)
export { TransactionService };
```

### Error Handling

Always use structured error handling:

```typescript
// Good
try {
	const result = await fetchData();
	return result;
} catch (error) {
	Logger.error({
		location: "TransactionService.fetchData",
		error: error instanceof Error ? error.message : "Unknown error",
		context: {
			/* relevant data */
		},
	});
	throw error; // or handle appropriately
}

// Bad
try {
	const result = await fetchData();
	return result;
} catch (error) {
	console.log("Error:", error);
}
```

### Logging

Use structured logging with context:

```typescript
// Good
Logger.info({
	location: "TransactionService.processTransaction",
	transactionId: tx.id,
	status: tx.status,
	duration: 150,
});

// Bad
console.log("Processing transaction", tx.id);
```

## Testing Guidelines

### Test Structure

- One test file per source file: `service.ts` → `service.test.ts`
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Group related tests with `describe`

### Test Example

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { TransactionService } from "../src/services/transaction";

describe("TransactionService", () => {
	let service: TransactionService;

	beforeEach(() => {
		service = new TransactionService(/* deps */);
	});

	describe("getTransaction", () => {
		test("should return transaction when found", async () => {
			// Arrange
			const txId = "test-123";

			// Act
			const result = await service.getTransaction(txId);

			// Assert
			expect(result).toBeDefined();
			expect(result.id).toBe(txId);
		});

		test("should return null when not found", async () => {
			// Arrange
			const txId = "non-existent";

			// Act
			const result = await service.getTransaction(txId);

			// Assert
			expect(result).toBeNull();
		});
	});
});
```

### Test Coverage

- Aim for >80% code coverage
- Test happy paths and error cases
- Test edge cases and boundary conditions
- Mock external dependencies (APIs, databases, blockchain)

### Running Tests

```bash
# All tests
bun run test

# Specific package
cd packages/api && bun test

# Watch mode
bun test --watch

# With coverage
bun test --coverage
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
# Feature
feat(api): add pagination to transactions endpoint

# Bug fix
fix(consumer): prevent infinite loop on malformed API response

# Documentation
docs: update README with deployment instructions

# Refactor
refactor(auto-claim): extract proof fetching into separate method

# Test
test(api): add integration tests for proof endpoint

# Multiple scopes
feat(api,commons): add new transaction status field
```

### Scope

The scope should be the package name:

- `api` - Bridge Hub API
- `consumer` - Consumer package
- `auto-claim` - Auto-claim service
- `commons` - Commons package
- `root` - Root-level changes

### Subject

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Keep under 72 characters

### Body (Optional)

- Explain what and why, not how
- Separate from subject with blank line
- Wrap at 72 characters

### Footer (Optional)

- Reference issues: `Closes #123` or `Fixes #456`
- Breaking changes: `BREAKING CHANGE: description`

## Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code is formatted and linted
3. ✅ Documentation is updated
4. ✅ Commit messages follow convention
5. ✅ Branch is up to date with main

### Checklist

```bash
# Run all checks
bun run test
bun run style:check
bun run type-check
bun run build
```

### Creating a Pull Request

1. Push your branch to your fork:

```bash
git push origin feat/your-feature-name
```

2. Go to the repository on GitHub and click "New Pull Request"

3. Fill out the PR template:

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Tests added/updated
- [ ] All tests passing
- [ ] Manual testing performed

## Checklist

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
```

### PR Title

Follow commit message format:

```
feat(api): add transaction filtering by date range
```

### Review Process

- Maintainers will review your PR
- Address feedback and push updates
- Once approved, maintainers will merge

### After Merge

```bash
# Update your local main
git checkout main
git pull upstream main

# Delete your feature branch
git branch -d feat/your-feature-name
git push origin --delete feat/your-feature-name
```

## Package Management

### Adding Dependencies

```bash
# Root-level dependency (affects all packages)
bun add -D <package-name>

# Package-specific dependency
cd packages/api
bun add <package-name>

# Workspace dependency (link local package)
# In package.json:
{
  "dependencies": {
    "@agglayer/bridge-hub-commons": "workspace:*"
  }
}
```

### Updating Dependencies

```bash
# Update all dependencies
bun update

# Update specific package
bun update <package-name>
```

### Bootstrap After Dependency Changes

```bash
bun run bootstrap
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Explain complex logic with inline comments
- Keep comments up to date with code changes

```typescript
/**
 * Fetches transactions from the database with optional filtering.
 *
 * @param filters - Query filters to apply
 * @param options - Pagination and sorting options
 * @returns Array of transactions matching the filters
 * @throws {ApiError} If database query fails
 */
async getTransactions(
  filters: TransactionFilters,
  options: QueryOptions
): Promise<IHubTransaction[]> {
  // Implementation
}
```

### README Updates

- Update relevant README files when changing functionality
- Add examples for new features
- Update configuration sections for new environment variables

### API Documentation

API endpoints are documented via OpenAPI in code. When adding/modifying endpoints:

1. Update the route schema
2. Add request/response examples
3. Document query parameters
4. Add error responses

## Questions?

- Open an issue for bugs or feature requests
- Join our community chat (if available)
- Check existing issues and PRs for similar discussions

## License

By contributing, you agree that your contributions will be licensed under the Source Available License (Copyright 2026 PT Services DMCC). This license allows free non-production use but requires commercial licensing for certain production uses. See the [LICENSE](./LICENSE) file for complete terms and restrictions.

---

Thank you for contributing to Agglayer Bridge Hub! 🎉
