# Contributing to Approval Guard

Thank you for your interest in contributing to Approval Guard! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct: be respectful, inclusive, and constructive.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/approval-guard.git
   cd approval-guard
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Copy environment file:
   ```bash
   cp .env.example .env
   ```
5. Run tests to ensure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/add-erc721-support`
- `fix/risk-score-calculation`
- `docs/update-api-reference`

### Making Changes

1. Create a new branch from `main`
2. Make your changes
3. Write/update tests
4. Run the test suite: `npm test`
5. Run linting: `npm run lint`
6. Commit your changes (see commit guidelines below)
7. Push and create a pull request

### Commit Guidelines

We use conventional commits:

```
type(scope): description

[optional body]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(scanner): add support for ERC-721 approvals
fix(risk-scorer): correct unlimited allowance detection
docs(api): add examples for batch processing
```

### Code Style

- Use TypeScript for all source files
- Follow the existing ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and small

### Testing

- Write tests for all new features
- Update tests when modifying existing functionality
- Aim for high coverage on critical paths
- Use descriptive test names

```typescript
describe('RiskScorer', () => {
  describe('calculateScore', () => {
    it('should return critical risk for unlimited dormant approvals', () => {
      // test implementation
    });
  });
});
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update the CHANGELOG if applicable
5. Request review from maintainers

### PR Checklist

- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] PR description explains the change

## Reporting Issues

### Bug Reports

Include:
- Node.js version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages/logs

### Feature Requests

Include:
- Use case description
- Proposed solution (optional)
- Alternatives considered

## Project Structure

```
src/
├── cli.ts              # CLI entry point
├── index.ts            # Library entry point
├── types.ts            # Type definitions
├── config.ts           # Configuration
├── constants.ts        # Constants
├── scanner.ts          # Blockchain scanner
├── reporter.ts         # Report formatting
├── risk-scorer.ts      # Risk calculation
├── cache/              # Caching utilities
├── errors/             # Error classes
├── history/            # History tracking
├── risk/               # Risk analysis
├── services/           # Business logic
└── utils/              # Utility functions

tests/                  # Test files
docs/                   # Documentation
```

## Questions?

Feel free to open an issue for questions or join our discussions.

Thank you for contributing! 🎉
