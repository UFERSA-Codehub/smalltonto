import sys
import os

core_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../core"))
if core_path not in sys.path:
    sys.path.insert(0, core_path)

from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser
from parser.ParserSemantic import ParserSemantic


class ParserAPI:
    def __init__(self):
        self.lexer = MyLexer()
        self.lexer.build()
        self.parser = MyParser(self.lexer)
        self.parser.build(debug=False, write_tables=False)
        self.semantic = ParserSemantic()

    def parse_content(self, content: str, filename: str = "<unknown>") -> dict:
        self.lexer.reset()
        self.parser.errors = []

        tokens = []
        self.lexer.input(content, filename)

        while True:
            tok = self.lexer.token()
            if not tok:
                break
            tokens.append(
                {
                    "type": tok.type,
                    "value": str(tok.value),
                    "line": tok.lineno,
                    "column": self.lexer.find_column(tok),
                }
            )

        errors = []
        for err in self.lexer.errors:
            errors.append(
                {
                    "type": "LexerError",
                    "message": err.get("message", str(err)),
                    "line": err.get("line", 0),
                    "column": err.get("column", 0),
                }
            )

        if errors:
            return {"tokens": tokens, "ast": None, "semantic": None, "errors": errors, "warnings": []}

        self.lexer.reset()
        ast = self.parser.parse(content, filename)

        for err in self.parser.errors:
            errors.append(
                {
                    "type": "ParserError",
                    "message": err.get("message", str(err)),
                    "line": err.get("line", 0),
                    "column": err.get("column", 0),
                }
            )

        # Fase 3: Análise Semântica (apenas se a análise sintática foi bem-sucedida)
        semantic_result = None
        warnings = []

        if ast is not None:
            sem_result = self.semantic.analyze(ast, filename)

            # Extrair dados do resultado semântico
            file_data = sem_result.get("files", [{}])[0]
            semantic_result = {
                "symbols": file_data.get("symbols", {}),
                "patterns": file_data.get("patterns", []),
                "incomplete_patterns": file_data.get("incomplete_patterns", []),
                "summary": sem_result.get("summary", {}),
            }

            # Agregar erros e warnings semânticos
            for err in file_data.get("errors", []):
                errors.append({
                    "type": "SemanticError",
                    "message": err.get("message", str(err)),
                    "line": err.get("line", 0),
                    "column": err.get("column", 0),
                })

            for warn in file_data.get("warnings", []):
                warning_obj = {
                    "type": "SemanticWarning",
                    "code": warn.get("code"),
                    "message": warn.get("message", str(warn)),
                    "line": warn.get("line", 0),
                    "column": warn.get("column", 0),
                    "pattern_type": warn.get("pattern_type"),
                    "anchor_class": warn.get("anchor_class"),
                }
                # Include suggestion if present
                if warn.get("suggestion"):
                    warning_obj["suggestion"] = warn.get("suggestion")
                warnings.append(warning_obj)

        return {
            "tokens": tokens,
            "ast": ast,
            "semantic": semantic_result,
            "errors": errors,
            "warnings": warnings,
        }

    def parse_file(self, path: str) -> dict:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            return self.parse_content(content, path)
        except (FileNotFoundError, PermissionError, IOError) as e:
            return {
                "tokens": [],
                "ast": None,
                "semantic": None,
                "errors": [{"type": "FileError", "message": str(e), "line": 0, "column": 0}],
                "warnings": [],
            }
