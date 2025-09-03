# E2E Integration Tests for Profile App

This directory contains **integration-focused** end-to-end tests for the profile application using Playwright.

## Test Philosophy: "Test Businness Logic, Trust the Framework"

These tests are designed following the **"simplify-first"** philosophy and focus exclusively on **integration scenarios** that could break in production.

### What We Test (Integration Points)

- **Service Integration**: React App ↔ Clerk Auth ↔ Jazz Backend ↔ Profile Worker
- **Data Persistence**: Profile data synchronization across all services
- **Complete Workflows**: End-to-end user journeys spanning multiple systems
- **Error Handling**: Service failure scenarios and fallback behavior
- **Business Logic**: Nickname registration, profile management, authentication flows

### What We DON'T Test (Framework Behavior)

- Form input validation (framework behavior)
- Button states and UI interactions (framework behavior)
- Modal appearances and animations (framework behavior)
- Individual component rendering (covered by unit tests)
- Authentication UI details (Clerk framework behavior)
- Basic page loading and routing (framework behavior)

## Test Structure

### 3 Core Integration Test Files

1. **`new-user-onboarding.spec.ts`** - Complete User Journey Integration
   - **Business Logic**: New user registration → profile creation → editing → public view
   - **Integration**: Tests Clerk auth + Jazz account creation + Profile Worker registration

2. **`existing-user-profile.spec.ts`** - Existing User Workflow Integration
   - **Business Logic**: Login → profile editing → data persistence verification
   - **Integration**: Tests authentication state + data updates + service synchronization

3. **`nickname-conflict-resolution.spec.ts`** - Service Integration Failure Handling
   - **Business Logic**: Error handling when Profile Worker is unavailable
   - **Integration**: Tests error boundaries + fallback behavior + service resilience

## Test Helpers: Business-Focused Operations

### `IntegrationTestHelpers` Class

The test helpers focus on **business operations** rather than UI manipulation:

```typescript
// Business-focused helpers
await helpers.completeUserRegistration(testData);
await helpers.updateProfileData({ displayName: 'New Name' });
await helpers.verifyProfileDataPersistence(nickname, expectedData);
await helpers.simulateServiceFailure();

// Avoid UI-focused helpers (removed)
// await helpers.fillNickname(nickname);
// await helpers.checkNicknameAvailability(nickname);
// await helpers.waitForPageReady();
```

### Key Helper Methods

- **`completeUserRegistration()`** - Tests full integration workflow
- **`updateProfileData()`** - Tests data persistence across services
- **`verifyProfileDataPersistence()`** - Verifies cross-service synchronization
- **`simulateServiceFailure()`** - Tests error handling and resilience
- **`loginExistingUser()`** - Tests authentication integration

## Running the Tests

### Prerequisites

1. **Build the frontend:**
   ```bash
   cd packages/profile-app
   pnpm build
   ```

2. **Ensure profile-worker is ready:**
   ```bash
   cd packages/profile-worker
   pnpm install
   ```

3. **Environment setup:**
   - Jazz API keys configured
   - Clerk test environment ready
   - Profile Worker accessible on port 3000

### Execute Tests

```bash
# Run all integration tests (recommended)
cd packages/profile-app
pnpm test:e2e

# Run with visual feedback
pnpm test:e2e:ui

# Run specific integration test
pnpm test:e2e tests/new-user-onboarding.spec.ts

# Debug integration issues
npx playwright test --headed --slowMo=1000
```

### Automatic Service Management

Tests automatically start required services:
- **Frontend**: `http://localhost:5173` (built preview)
- **Profile Worker**: `http://localhost:3000` (development mode)
- **Proper startup sequencing** and health checks

## Integration Test Patterns

### Test Data Generation

Tests use unique, timestamped data to avoid conflicts:

```typescript
const testData = IntegrationTestHelpers.generateTestData();
// Generates: { nickname: 'e2etest1234567890', email: 'e2etest1234567890@example.com', ... }
```

### Complete Workflow Testing

```typescript
test('complete user journey integration', async ({ page }) => {
  const helpers = new IntegrationTestHelpers(page);
  const testData = IntegrationTestHelpers.generateTestData();

  // Test full integration workflow
  await helpers.verifyCompleteWorkflow(testData);
});
```

### Service Integration Verification

```typescript
// Verify Profile Worker API integration
const response = await page.request.get(`http://localhost:3000/users?nickname=${nickname}`);
expect(response.ok()).toBeTruthy();
expect(userData.exists).toBe(true);

// Verify data persistence across services
await helpers.verifyProfileDataPersistence(nickname, expectedData);
```

### Error Handling Testing

```typescript
// Simulate service failures
await helpers.simulateServiceFailure();
await helpers.verifyErrorHandling(nickname);
```

## Self-Contained Test Design

- **No manual cleanup required** - each test uses unique identifiers
- **Independent test execution** - tests don't depend on each other
- **Automatic service management** - services start/stop automatically
- **Isolated test data** - no shared state between tests

## Debugging Integration Issues

### Visual Debugging

```bash
# See browser interactions
npx playwright test --headed --slowMo=1000

# Step-by-step debugging
npx playwright test --debug

# Debug specific integration test
npx playwright test tests/new-user-onboarding.spec.ts --debug
```

### Service Debugging

```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:5173

# Monitor service logs during tests
# (Services start automatically with detailed logging)
```

### Test Artifacts

- **Screenshots**: `test-results/` (on failures)
- **Videos**: `test-results/` (full test recordings)
- **Traces**: `test-results/` (detailed execution traces)
- **Network logs**: Available in Playwright trace viewer

## Extending Integration Tests

### Adding New Integration Scenarios

**Good additions** (follow these patterns):
```typescript
// Test new service integration
test('new service integration workflow', async ({ page }) => {
  // Test complete business workflow involving new service
});

// Test new error scenario
test('handle new service failure mode', async ({ page }) => {
  // Test specific integration failure and recovery
});
```

**Avoid these additions**:
```typescript
// Don't test UI components
test('button click behavior', async ({ page }) => { /* ... */ });

// Don't test framework behavior
test('form validation messages', async ({ page }) => { /* ... */ });
```

### Adding Helper Methods

Focus on **business operations**:

```typescript
// Good helper additions
async verifyNewServiceIntegration(): Promise<void> {
  // Test business logic across services
}

async simulateSpecificFailureMode(): Promise<void> {
  // Test specific integration failure
}

// Avoid UI-focused helpers
async clickButton(): Promise<void> { /* Don't add these */ }
```

## Performance and Reliability

### Target Metrics
- **Individual test**: 2-3 minutes maximum
- **Full suite**: Under 10 minutes total
- **Success rate**: >95% in CI environment
- **Flakiness**: <5% failure rate due to timing

### CI/CD Optimization
- **Retry strategy**: 2 retries on CI for network issues
- **Parallel execution**: Disabled on CI for stability
- **Resource management**: Single worker to avoid conflicts
- **Artifact collection**: Screenshots and traces on failures

## Troubleshooting Guide

### Integration Failures

1. **Service startup issues:**
   ```bash
   # Check port availability
   lsof -i :3000 -i :5173

   # Verify build success
   cd packages/profile-app && pnpm build
   ```

2. **Authentication integration:**
   - Verify Clerk test environment configuration
   - Check Jazz API key validity
   - Ensure test user creation succeeds

3. **Data persistence issues:**
   - Verify Profile Worker database connectivity
   - Check Jazz sync server connection
   - Monitor network requests in test traces

### Test Philosophy Violations

**If tests become flaky**, check for these anti-patterns:
- Testing UI animations instead of business outcomes
- Relying on specific timing instead of business state
- Testing framework behavior instead of integration logic

**Solution**: Refactor to focus on business operations and service integration points.

## Defending the Testing Philosophy

This testing approach is designed to:

1. **Catch real production issues** - Integration failures between services
2. **Provide fast feedback** - 3 focused tests vs 20+ granular tests
3. **Reduce maintenance** - Business logic changes less than UI implementation
4. **Guide architecture** - Forces thinking about service boundaries

**When pressured to add more tests**, refer back to: **"Test Business logic, trust the framework"**
