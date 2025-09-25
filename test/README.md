# Teslo Shop E2E Testing Suite

This directory contains comprehensive end-to-end (e2e) tests for the Teslo Shop NestJS application. The tests are designed to mock the database and all external dependencies, ensuring that the test flow only reaches the service layer.

## 📋 Overview

The e2e test suite includes:

- **App Integration Tests** (`app.e2e-spec.ts`) - General application health and configuration tests
- **Authentication Tests** (`auth.e2e-spec.ts`) - User registration, login, and JWT authentication
- **Products Tests** (`products.e2e-spec.ts`) - CRUD operations for products with authorization
- **Files Tests** (`files.e2e-spec.ts`) - File upload and static file serving
- **Seed Tests** (`seed.e2e-spec.ts`) - Database seeding functionality
- **Test Utilities** (`test-utils.ts`) - Shared mocks, factories, and helpers

## 🎯 Testing Philosophy

### Mocked Dependencies

All tests use mocked dependencies to ensure isolation and fast execution:

- **Database**: TypeORM repositories are fully mocked
- **File System**: File operations are mocked using Jest
- **External APIs**: All external services are mocked
- **JWT**: Authentication tokens are mocked
- **Bcrypt**: Password hashing is mocked

### Service Layer Focus

The tests are designed so that the flow stops at the service layer:

- Controllers receive HTTP requests
- Services process business logic
- Repository calls are intercepted by mocks
- No real database operations occur

## 🚀 Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
# Authentication tests
npm run test:e2e -- --testPathPattern=auth.e2e-spec.ts

# Products tests
npm run test:e2e -- --testPathPattern=products.e2e-spec.ts

# Files tests
npm run test:e2e -- --testPathPattern=files.e2e-spec.ts

# Seed tests
npm run test:e2e -- --testPathPattern=seed.e2e-spec.ts

# App integration tests
npm run test:e2e -- --testPathPattern=app.e2e-spec.ts
```

### Watch Mode

```bash
npm run test:e2e:watch
```

### With Coverage

```bash
npm run test:e2e -- --coverage
```

### Using Test Runner Script

```bash
# Run all tests with detailed output
node test-runner.js

# Run with coverage
node test-runner.js --coverage

# Run in watch mode
node test-runner.js --watch

# Show help
node test-runner.js --help
```

## 📁 File Structure

```
test/
├── test-utils.ts          # Shared utilities, mocks, and factories
├── app.e2e-spec.ts        # Application integration tests
├── auth.e2e-spec.ts       # Authentication endpoint tests
├── products.e2e-spec.ts   # Products CRUD operation tests
├── files.e2e-spec.ts      # File upload and serving tests
├── seed.e2e-spec.ts       # Database seeding tests
└── test-runner.js         # Custom test runner script
```

## 🛠 Test Utilities

### Mock Repositories

Each entity has a fully mocked repository with common TypeORM methods:

```typescript
const mockRepository = createMockRepository();
// Provides mocked versions of: find, findOne, save, create, update, delete, etc.
```

### Mock Services

Common services are mocked:

```typescript
const mockConfigService = createMockConfigService();
const mockJwtService = createMockJwtService();
```

### Mock Data

Pre-defined mock objects for testing:

```typescript
import { mockUser, mockProduct, mockProductImage } from './test-utils';
```

## 📝 Test Coverage

### Authentication Module

- ✅ User registration with validation
- ✅ User login with credentials
- ✅ JWT token generation and validation
- ✅ Protected route access
- ✅ Role-based authorization
- ✅ Password strength validation
- ✅ Email format validation

### Products Module

- ✅ Product creation (authenticated)
- ✅ Product listing with pagination
- ✅ Product search by ID/slug
- ✅ Product updates (authenticated)
- ✅ Product deletion (admin only)
- ✅ Input validation
- ✅ Authorization checks

### Files Module

- ✅ Static file serving
- ✅ File upload validation
- ✅ Security checks (path traversal)
- ✅ File type validation
- ✅ Error handling

### Seed Module

- ✅ Database seeding
- ✅ Data cleanup
- ✅ Transaction handling
- ✅ Error recovery

### App Integration

- ✅ Application startup
- ✅ Global validation pipes
- ✅ Static file configuration
- ✅ CORS handling
- ✅ Environment configuration

## 🔧 Configuration

### Environment Variables

Tests use the following environment variables:

```env
NODE_ENV=test
JWT_SECRET=test_jwt_secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=test_db
DB_USERNAME=test_user
DB_PASSWORD=test_password
HOST_API=http://localhost:3000/api
STAGE=test
```

### Jest Configuration

E2E tests use the configuration in `jest-e2e.json`:

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "coverageDirectory": "../coverage-e2e"
}
```

## 🧪 Testing Patterns

### Setup Pattern

Each test file follows this pattern:

```typescript
describe('Module (e2e)', () => {
  let app: INestApplication;
  let mockRepository: MockRepository;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ModuleToTest],
      providers: [...getRepositoryProviders(), ...getCommonProviders()],
    })
      .overrideProvider(getRepositoryToken(Entity))
      .useValue(createMockRepository())
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });
});
```

### Test Structure

```typescript
describe('Endpoint', () => {
  it('should handle success case', async () => {
    // Arrange
    mockRepository.method.mockResolvedValue(expectedData);

    // Act
    const response = await request(app.getHttpServer())
      .get('/endpoint')
      .expect(200);

    // Assert
    expect(response.body).toHaveProperty('expectedProperty');
  });

  it('should handle error case', async () => {
    // Arrange
    mockRepository.method.mockRejectedValue(new Error('Test error'));

    // Act & Assert
    await request(app.getHttpServer()).get('/endpoint').expect(500);
  });
});
```

## 🚦 Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Mocking**: All external dependencies are mocked
3. **Clear Naming**: Test names describe the expected behavior
4. **AAA Pattern**: Arrange, Act, Assert structure
5. **Error Cases**: Both success and failure scenarios are tested
6. **Security**: Security vulnerabilities are tested (path traversal, injection, etc.)
7. **Validation**: Input validation is thoroughly tested
8. **Authorization**: Access control is verified

## 🐛 Troubleshooting

### Common Issues

1. **Module Import Errors**: Ensure all required modules are imported in test setup
2. **Mock Not Working**: Verify that providers are properly overridden
3. **Timeout Issues**: Increase Jest timeout for slow tests
4. **Memory Leaks**: Ensure `app.close()` is called in `afterEach`

### Debug Mode

Run tests with debug output:

```bash
npm run test:e2e -- --verbose --no-cache
```

### Coverage Issues

Generate detailed coverage report:

```bash
npm run test:e2e -- --coverage --coverageReporters=html
```

## 📚 References

- [NestJS Testing Documentation](https://docs.nestjs.com/fundamentals/testing)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeORM Testing](https://typeorm.io/testing)

## 🤝 Contributing

When adding new features:

1. Add corresponding e2e tests
2. Update mock data if needed
3. Ensure all test suites pass
4. Update this README if necessary

---

**Note**: These tests are designed for development and CI/CD environments. They use mocked dependencies to ensure fast, reliable, and isolated testing without requiring actual database connections or external services.
