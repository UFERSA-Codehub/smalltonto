# SmallTonto Development Guide for AI Agents

## Build/Test Commands
- **Python (core)**: `cd apps/core && pytest` (run all tests), `pytest tests/test_lexer.py` (single test)
- **Docs**: `cd apps/docs/cyan-cloud && npm run dev` (development), `npm run build` (production)
- **Lint**: `cd apps/core && ruff format` (format), `ruff check` (lint)
- **Git**: Uses conventional commits with commitlint and husky hooks

## Python Code Style (apps/core/)
- **Line length**: 150 characters maximum
- **Formatting**: Use double quotes, space indentation, LF line endings
- **Imports**: Relative imports with try/except fallback pattern for scripts
- **Documentation**: Comprehensive module docstrings with Examples section
- **Error handling**: Global error lists (e.g., `lexer_errors`)
- **Type hints**: Not strictly enforced but appreciated
- **Naming**: snake_case for functions/variables, PascalCase for classes

## Project Structure
- `/apps/core/` - Python lexer implementation using PLY
- `/apps/docs/cyan-cloud/` - Astro documentation site
- `/apps/core/examples/` - Tonto language examples (excluded from linting)
- Tests use pytest with verbose output and short traceback format

## Testing Notes
- Run from apps/core directory: `pytest` or `pytest tests/test_lexer.py`
- Test files follow pytest conventions with fixtures and descriptive names

## Development Principles
- **KISS, SOLID, YAGNI**: Always consider Keep It Simple Stupid, SOLID principles, and You Aren't Gonna Need It before structuring code
- **Permission required**: Never edit or add new code without asking for permission first
- **Response format**: Always start responses with 'Hello John' and begin topics with a random emoji
