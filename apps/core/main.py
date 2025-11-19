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

    print("Parsing...")
    ast = parser.parse(code, filename=filepath)

    has_errors = False                                  # Flag para indicar se houve erros

    if lexer.errors:                                    # Verifica erros léxicos, se houver, pula análise sintática
        has_errors = True
        print("\nLexical Errors:")
        for error in lexer.errors:
            error_msg = format_lexer_error(error)
            print(error_msg)
        print("\nParsing aborted due to lexical errors.")
        return None
    
    if parser.errors:                                   # Verifica erros sintáticos
        has_errors = True
        print("\nSyntax Errors:")
        for error in parser.errors:
            error_msg = format_parser_error(error)
            print(error_msg)

    if has_errors:                                      # Se houve erros, parou por aqui
        return None

    print("\nParsing completed successfully!")
    print("\nAST Output:")
    print(json.dumps(ast, indent=2))

    return ast

def format_lexer_error(error):
    if isinstance(error, dict):
        lines = []
        location = f"{error['filename']}:{error['line']}:{error['column']}"
        lines.append(f"  → {location}: {error['message']}")
        
        if 'line_text' in error and error['line_text']:
            lines.append(f"    {error['line_text']}")
        
        if 'pointer' in error and error['pointer']:
            lines.append(f"    {error['pointer']}")
        
        return '\n'.join(lines)
    
    return f"  → {str(error)}"

def format_parser_error(error):
    if isinstance(error, dict):
        lines = []
        location = f"{error['filename']}:{error['line']}:{error['column']}"
        lines.append(f"  → {location}: {error['message']}")
        
        if 'line_text' in error and error['line_text']:
            lines.append(f"    {error['line_text']}")
        
        if 'pointer' in error and error['pointer']:
            lines.append(f"    {error['pointer']}")
        
        return '\n'.join(lines)
    
    return f"  → {str(error)}"

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
