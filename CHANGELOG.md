# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of approval-guard CLI
- ERC-20 token approval scanning using viem
- Risk scoring system for approvals
  - Unlimited approval detection
  - Dormant approval identification
  - Contract verification status checks
- JSON and console report generation
- Revocation recommendations
- Approval history tracking
- In-memory caching system
- Batch processing for large wallets
- Token metadata resolution
- Comprehensive documentation
  - API reference
  - CLI usage guide
  - Architecture overview
  - Risk scoring methodology
  - Security best practices
  - FAQ and troubleshooting guides

### Security
- Input validation for all user inputs
- Rate limiting support
- Secure error handling (no sensitive data exposure)

## [0.1.0] - 2024-01-15

### Added
- Project initialization
- Basic project structure
- TypeScript configuration
- ESLint and Prettier setup
- Jest testing framework
- Husky pre-commit hooks

### Core Features
- `ApprovalScanner` class for blockchain queries
- `RiskScorer` for approval risk assessment
- `Reporter` for output generation
- CLI interface with Commander.js

### Services
- `ApprovalService` - Main approval scanning logic
- `RiskAnalysisService` - Risk calculation and analysis
- `RevocationService` - Revocation transaction generation
- `TokenMetadataService` - Token information resolution
- `ReportGenerator` - Multiple output formats

### Utilities
- Address validation and formatting
- Batch processing for API calls
- Approval filtering utilities
- Console spinner for CLI feedback

### Documentation
- README with quick start guide
- API documentation
- CLI reference
- Architecture overview
- Contributing guidelines

---

## Version History

### Versioning Scheme

We use [SemVer](https://semver.org/) for versioning:

- **MAJOR** version for incompatible API changes
- **MINOR** version for new functionality (backwards compatible)
- **PATCH** version for bug fixes (backwards compatible)

### Release Process

1. Update CHANGELOG.md with release notes
2. Bump version in package.json
3. Create git tag
4. Push to main branch
5. Publish to npm

### Support Policy

- Latest major version: Full support
- Previous major version: Security fixes only
- Older versions: No support

[Unreleased]: https://github.com/example/approval-guard/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/example/approval-guard/releases/tag/v0.1.0
