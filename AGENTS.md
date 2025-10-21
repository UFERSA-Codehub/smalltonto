# SmallTonto - Agent Guidelines

## Build/Test Commands
- **Tests**: `cd apps/core && python -m pytest` (run all tests)
- **Single test**: `cd apps/core && python -m pytest tests/test_lexer.py::test_function_name`
- **Linting**: `cd apps/core && ruff check .`
- **Formatting**: `cd apps/core && ruff format .`

## Code Style
- **Python**: Line length 150 chars, double quotes, spaces (4), LF line endings
- **Imports**: Use relative imports within packages (`.TokenType`), absolute for external (`ply.lex`)
- **Naming**: Classes use PascalCase (e.g., `TokenType`), functions/variables use snake_case
- **Comments**: Portuguese comments allowed for domain-specific explanations
- **Error handling**: Use global error collections (`lexer_errors = []`)

## Project Structure
- Main Python code in `apps/core/`
- Lexer components in `apps/core/lexer/`
- Tests in `apps/core/tests/`
- Examples excluded from linting

## Commit Guidelines
- Use conventional commits format (commitlint enforced)
- Husky pre-commit hooks run ruff formatting/linting