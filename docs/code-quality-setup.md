# Code Quality Setup

This document describes the code quality tools configured for the Arduino Trader project.

## Python Code Quality

### Pre-commit Hooks (Local)
The following Python linters run automatically on commit via pre-commit:

- **black** - Code formatter (PEP 8 compliant)
- **isort** - Import statement organizer
- **flake8** - Style guide enforcement
- **mypy** - Static type checker
- **bandit** - Security vulnerability scanner

### GitHub Actions (CI)
Python code quality is verified on every push and PR via `.github/workflows/python-checks.yml`:

- Runs on Python 3.9 and 3.11
- Executes all pre-commit checks
- Runs pytest with coverage reporting

## Go Code Quality

### Pre-commit Hooks (Local)
The following Go tools run automatically on commit:

- **go-fmt** - Standard Go code formatter
- **go-imports** - Manages imports and formats code
- **go-vet** - Examines code for suspicious constructs
- **go-build** - Verifies code compiles
- **go-test** - Runs all tests
- **go-mod-tidy** - Ensures go.mod and go.sum are clean
- **golangci-lint** - Comprehensive meta-linter running 20+ linters

### golangci-lint Configuration
Located in `.golangci.yml`, it enables:

**Security & Correctness:**
- `gosec` - Security vulnerabilities (like bandit for Python)
- `errcheck` - Unchecked errors
- `staticcheck` - Advanced static analysis
- `govet` - Suspicious constructs

**Code Quality:**
- `gofmt`, `goimports` - Formatting and imports
- `revive` - Fast, configurable linter
- `gocritic` - Opinionated checks
- `ineffassign` - Ineffectual assignments
- `unused` - Unused code detection

**Best Practices:**
- `errname` - Error naming conventions
- `errorlint` - Error wrapping (Go 1.13+)
- `nilerr` - Nil error returns
- `bodyclose` - HTTP response body closing
- `misspell` - Spelling errors

### GitHub Actions (CI)
Go code quality is verified on every push and PR via `.github/workflows/go-checks.yml`:

- Runs on Go 1.24
- Executes format checks, go vet, staticcheck
- Runs golangci-lint with full configuration
- Builds and tests with race detection
- Uploads coverage to Codecov

## Unified Pre-commit Workflow
`.github/workflows/pre-commit.yml` runs all pre-commit hooks (Python + Go) in CI.

## Setup

### First Time Setup
```bash
# Install pre-commit
pip install pre-commit

# Install Go linting tools
go install honnef.co/go/tools/cmd/staticcheck@latest
go install github.com/go-critic/go-critic/cmd/gocritic@latest

# Install hooks
pre-commit install
```

### Running Checks Manually
```bash
# Run on all files
pre-commit run --all-files

# Run on specific files
pre-commit run --files app/main.py pkg/formulas/bollinger.go

# Run specific hook
pre-commit run black --all-files
pre-commit run golangci-lint --all-files
```

### Updating Hooks
```bash
# Update to latest versions
pre-commit autoupdate

# Clean cache if needed
pre-commit clean
```

## Bypassing Checks (Use Sparingly)

```bash
# Skip all pre-commit hooks
git commit --no-verify

# Skip specific linters (add to file)
# Python: # noqa: E501
# Go: //nolint:errcheck
```

## Philosophy

All code must pass quality checks before merging. This ensures:
- **Consistency** - Code follows project style guide
- **Safety** - Security vulnerabilities are caught early
- **Reliability** - Type errors and bugs are detected before runtime
- **Maintainability** - Code is clean, well-formatted, and easy to understand

These tools enforce our philosophy: **Clean and Lean** code with proper solutions.
