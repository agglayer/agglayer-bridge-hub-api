# Consumer Package Tests

This directory contains comprehensive unit tests for the consumer package, following the same folder structure as the source code.

## Structure

```
tests/
├── test-utils/              # Mock functions and test fixtures
│   ├── mocks/              # Mock implementations
│   │   ├── database.mock.ts
│   │   └── servercore.mock.ts
│   └── fixtures/           # Test data fixtures
│       ├── bridge-tx.fixture.ts
│       ├── mapping.fixture.ts
│       ├── metadata.fixture.ts
│       └── consumer-config.fixture.ts
├── mappers/                # Tests for mapper classes
│   ├── transaction.test.ts
│   ├── mapping.test.ts
│   └── metadata.test.ts
├── services/               # Tests for service classes
│   ├── transaction.test.ts
│   ├── mapping.test.ts
│   └── metadata.test.ts
├── bridge_api_consumer.test.ts    # Tests for BridgeAPIConsumer
├── claim_readiness_consumer.test.ts # Tests for ClaimReadinessConsumer
├── setup.ts                # Global test setup
└── README.md               # This file
```

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/mappers/transaction.test.ts

# Run tests with coverage
bun test --coverage
```

## Test Utils

The `test-utils` directory contains:

- **Mocks**: Mock implementations of external dependencies
    - `database.mock.ts`: Mock for DatabaseClient with all required methods
    - `servercore.mock.ts`: Mocks for servercore components

- **Fixtures**: Predefined test data
    - `bridge-tx.fixture.ts`: Mock bridge and claim transaction data
    - `mapping.fixture.ts`: Mock token mapping transaction data
    - `metadata.fixture.ts`: Mock metadata transaction data
    - `consumer-config.fixture.ts`: Mock consumer configuration objects

## Best Practices

1. **Isolation**: Each test is isolated and doesn't depend on external services
2. **Mocking**: All external dependencies are properly mocked
3. **Coverage**: Tests cover both happy paths and error scenarios
4. **Consistency**: Test structure mirrors the source code structure
5. **Reusability**: Common mock data and functions are centralized in test-utils
