from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser
import json

lexer = MyLexer()
lexer.build()

parser = MyParser(lexer)
parser.build(debug=True)

def test_parser():
    source_code = "package projectMecJhonsons"

    print("Parsing...")
    ast = parser.parse(source_code)

    if parser.errors:
        print("\nSyntax Errors:")
        for error in parser.errors:
            print(f" - {error}")
        return

    print("\nParsing Finished")
    print("\nAST Output:")
    print(json.dumps(ast, indent=2))

    return ast

if __name__ == "__main__":
    test_parser()
