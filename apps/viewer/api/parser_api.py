import sys
import os

core_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../core"))
if core_path not in sys.path:
    sys.path.insert(0, core_path)

from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser


class ParserAPI:
    def __init__(self):
        self.lexer = MyLexer()
        self.lexer.build()
        self.parser = MyParser(self.lexer)
        self.parser.build(debug=False, write_tables=False)

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
            return {"tokens": tokens, "ast": None, "errors": errors}

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

        return {"tokens": tokens, "ast": ast, "errors": errors}

    def parse_file(self, path: str) -> dict:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            return self.parse_content(content, path)
        except (FileNotFoundError, PermissionError, IOError) as e:
            return {
                "tokens": [],
                "ast": None,
                "errors": [{"type": "FileError", "message": str(e), "line": 0, "column": 0}],
            }
