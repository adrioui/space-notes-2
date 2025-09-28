# Testing Documentation

This directory contains all documentation related to testing the Space Notes application.

## 📋 Available Guides

### [Testing README](./TESTING_README.md)
Overview of the testing infrastructure, including:
- Test setup and configuration
- Running different test suites
- Coverage reporting
- Testing best practices

### [Authentication Testing Guide](./AUTHENTICATION_TESTING_GUIDE.md)
Comprehensive guide for testing authentication flows:
- OTP authentication testing
- Session management testing
- User profile testing
- Integration test scenarios

## 🧪 Quick Testing

### Run All Tests
```bash
npm run test
```

### Run Specific Test Suites
```bash
# Authentication tests
npm run test:auth-unit

# API endpoint tests
npm run test:api-unit

# React hooks tests
npm run test:hooks-unit

# All unit tests
npm run test:unit
```

### Coverage Reports
```bash
npm run test:coverage
```

## 🔧 Test Structure

```
src/
├── __tests__/           # Integration tests
├── components/
│   └── __tests__/       # Component tests
├── hooks/
│   └── __tests__/       # Hook tests
├── lib/
│   └── __tests__/       # Utility tests
└── test/
    ├── setup.ts         # Test configuration
    └── utils.tsx        # Test utilities
```

## 📊 Testing Tools

- **Vitest** - Test runner and framework
- **Testing Library** - React component testing
- **MSW** - API mocking
- **jsdom** - DOM environment for tests

## 📞 Support

For testing issues, refer to the specific testing guides in this directory.
