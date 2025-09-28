# Testing Guide

This project uses **Vitest** for unit testing with comprehensive coverage of the unified Next.js architecture after migration from the Express.js + Next.js hybrid setup.

## 🧪 Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast unit test framework
- **Testing Library**: [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) - React component testing
- **Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/) - API mocking
- **Coverage**: Built-in Vitest coverage reporting

## 📁 Test Structure

```
├── app/api/                          # API routes
│   └── **/__tests__/                 # API route tests
│       ├── *.test.ts                 # Individual route tests
│       └── test-utils.ts             # API testing utilities
├── src/
│   ├── lib/__tests__/                # Library function tests
│   │   ├── auth.test.ts              # Auth helper tests
│   │   └── otp-service.test.ts       # OTP service tests
│   └── hooks/__tests__/              # React hook tests
│       └── use-auth.test.ts          # Authentication hook tests
├── client/src/
│   ├── components/__tests__/         # Component tests
│   │   └── *.test.tsx                # React component tests
│   └── test/                         # Test configuration
│       ├── setup.ts                  # Test setup
│       └── mocks/                    # MSW mocks
│           ├── server.ts             # Mock server setup
│           └── handlers.ts           # API mock handlers
└── vitest.config.ts                 # Vitest configuration
```

## 🚀 Running Tests

### All Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Specific Test Suites
```bash
# Authentication-related tests
npm run test:auth-unit

# API route tests
npm run test:api-unit

# React hook tests
npm run test:hooks-unit

# All unit tests
npm run test:unit
```

### Individual Test Files
```bash
# Run specific test file
npx vitest run src/lib/__tests__/auth.test.ts

# Run tests matching pattern
npx vitest run --grep "authentication"

# Run tests in specific directory
npx vitest run app/api/auth/__tests__/
```

## 📝 Test Categories

### 1. API Route Tests
**Location**: `app/api/**/__tests__/`

Tests for Next.js API routes including:
- ✅ Authentication endpoints (`/api/auth/*`)
- ✅ User management (`/api/users/*`)
- ✅ Space operations (`/api/spaces/*`)
- ✅ Request validation
- ✅ Error handling
- ✅ Session management

**Example**:
```typescript
// app/api/auth/__tests__/send-otp.test.ts
import { describe, test, expect, vi } from 'vitest'
import { POST } from '../send-otp/route'

describe('/api/auth/send-otp', () => {
  test('should send OTP for valid email', async () => {
    // Test implementation
  })
})
```

### 2. Library Function Tests
**Location**: `src/lib/__tests__/`

Tests for utility functions and services:
- ✅ Authentication helpers
- ✅ OTP service functionality
- ✅ Database operations
- ✅ Validation functions

**Example**:
```typescript
// src/lib/__tests__/otp-service.test.ts
import { describe, test, expect } from 'vitest'
import { NextOTPService } from '../otp-service'

describe('NextOTPService', () => {
  test('should generate valid OTP', () => {
    // Test implementation
  })
})
```

### 3. React Hook Tests
**Location**: `src/hooks/__tests__/`

Tests for custom React hooks:
- ✅ Authentication hook (`useAuth`)
- ✅ State management
- ✅ Side effects
- ✅ Error handling

**Example**:
```typescript
// src/hooks/__tests__/use-auth.test.ts
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../use-auth'

describe('useAuth', () => {
  test('should handle OTP flow', async () => {
    // Test implementation
  })
})
```

### 4. Component Tests
**Location**: `client/src/components/__tests__/`

Tests for React components:
- ✅ Rendering behavior
- ✅ User interactions
- ✅ Props handling
- ✅ Accessibility

**Example**:
```typescript
// client/src/components/__tests__/auth-form.test.tsx
import { render, screen } from '@testing-library/react'
import { AuthForm } from '../auth-form'

describe('AuthForm', () => {
  test('should render contact form', () => {
    // Test implementation
  })
})
```

## 🔧 Test Utilities

### API Testing Utilities
**File**: `app/api/__tests__/test-utils.ts`

Provides helpers for API route testing:
- `createMockRequest()` - Create mock NextRequest
- `mockAuthenticatedUser()` - Mock authenticated session
- `mockDatabase()` - Mock database operations
- `assertResponse()` - Assert response structure

### MSW Mock Handlers
**File**: `client/src/test/mocks/handlers.ts`

Defines API mocks for:
- Authentication endpoints
- User operations
- Space management
- Error scenarios

## 📊 Coverage

The test suite aims for high coverage across:
- **API Routes**: All endpoints tested
- **Business Logic**: Core functions covered
- **React Hooks**: State and effects tested
- **Components**: User interactions verified

View coverage report:
```bash
npm run test:coverage
```

## 🎯 Testing Best Practices

### 1. Test Structure
```typescript
describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup before each test
  })

  test('should do something specific', () => {
    // Arrange
    // Act
    // Assert
  })
})
```

### 2. Mocking
```typescript
// Mock external dependencies
vi.mock('@/lib/external-service', () => ({
  externalFunction: vi.fn(),
}))

// Mock with implementation
vi.mocked(externalFunction).mockResolvedValue(mockData)
```

### 3. Async Testing
```typescript
test('should handle async operation', async () => {
  // Use async/await for promises
  const result = await asyncFunction()
  expect(result).toBe(expected)
})
```

### 4. Component Testing
```typescript
test('should handle user interaction', async () => {
  const user = userEvent.setup()
  render(<Component />)
  
  await user.click(screen.getByRole('button'))
  expect(screen.getByText('Expected')).toBeInTheDocument()
})
```

## 🚨 Common Issues

### 1. Mock Not Working
```typescript
// Ensure mocks are hoisted
vi.mock('module', () => ({
  export: vi.fn(),
}))
```

### 2. Async Test Timeout
```typescript
// Increase timeout for slow operations
test('slow test', async () => {
  // Test implementation
}, 10000) // 10 second timeout
```

### 3. Environment Variables
```typescript
// Mock environment variables
beforeEach(() => {
  process.env.TEST_VAR = 'test-value'
})
```

## 🔄 Migration Testing

The test suite specifically validates the Express → Next.js migration:

### Authentication Migration
- ✅ NextAuth.js integration
- ✅ OTP service functionality
- ✅ Session management
- ✅ User creation/lookup

### API Migration
- ✅ All routes respond correctly
- ✅ Authentication middleware works
- ✅ Error handling preserved
- ✅ Data validation maintained

### Integration Points
- ✅ Database operations
- ✅ Real-time features
- ✅ File uploads
- ✅ Cross-feature workflows

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎉 Success Criteria

Tests are passing when:
- ✅ All unit tests pass (`npm run test`)
- ✅ Coverage meets targets (`npm run test:coverage`)
- ✅ No console errors during test runs
- ✅ Mocks properly isolate dependencies
- ✅ Tests run quickly (< 30 seconds total)

The comprehensive test suite ensures that the migration from Express.js + Next.js hybrid to unified Next.js architecture preserves all functionality while maintaining code quality and reliability.
