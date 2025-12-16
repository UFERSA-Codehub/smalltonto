# AGENTS.md

## Build/Test/Lint Commands
- **Python tests**: `pytest` (from `apps/core/`), single test: `pytest tests/test_lexer.py::test_name -v`
- **Python lint**: `ruff check .` and `ruff format .` (from `apps/core/`)
- **Frontend lint**: `npm run lint` (from `apps/viewer/frontend/`)
- **Frontend build**: `npm run build` (from `apps/viewer/frontend/`)
- **Run parser**: `python main.py <file.tonto>` (from `apps/core/`)

## Code Style
- **Python**: 150 char line limit, double quotes, space indent, LF endings (ruff)
- **JS/React**: ESLint with react-hooks plugin, ignore unused vars matching `^[A-Z_]` (uppercase or underscore prefix)
- **Commits**: Conventional commits enforced via commitlint/husky

## Naming Conventions
- **Python**: `PascalCase` classes, `snake_case` functions, `UPPER_SNAKE_CASE` constants
- **JS/React**: `PascalCase` components, `camelCase` functions/hooks, `use` prefix for hooks

## Imports
- **Python**: stdlib, third-party, local (use try/except for relative imports with fallback)
- **JS**: React hooks first, then utilities, components, CSS last

## Error Handling
- **Python**: Specific exceptions, not bare `except`; use type hints (Python 3.11+)
- **JS**: try/catch with `console.error`, early returns on failure

## btca

Trigger: user says "use btca" (for codebase/docs questions).

Run:
- btca ask -t <tech> -q "<question>"

Available <tech>: svelte, tailwindcss, react-flow