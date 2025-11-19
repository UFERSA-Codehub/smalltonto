from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser
import json
import sys

lexer = MyLexer()
lexer.build()

parser = MyParser(lexer)
parser.build(debug=True)

def test_parser(filepath, truncate=False):

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    #source_code = "package projectMecJhonsons"

    print("Parsing...")
    ast = parser.parse(code, filename=filepath)

    if parser.errors:
        print("\nSyntax Errors:")
        for error in parser.errors:
            print(f" - {error}")
        return

    print("\nParsing Finished")
    print("\nAST Output:")
    print(json.dumps(ast, indent=2))

    return ast

def main():
    if len(sys.argv) < 2:
        print("Usage: python tokenize.py <file.tonto> [--truncate]")
        print("\nTokenizes a Tonto source file and displays all tokens.")
        sys.exit(1)

    filepath = sys.argv[1]
    truncate = "--truncate" in sys.argv

    test_parser(filepath, truncate)

if __name__ == "__main__":
    main()
