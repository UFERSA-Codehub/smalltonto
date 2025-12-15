from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser
from parser.ParserSemantic import ParserSemantic
import json
import sys
import os

def main():
    '''
    Docstring for main
    '''
    if len(sys.argv) < 2:
        print("Usage: python main.py <source_file>")
        print("\nRuns full compiler pipeline: Lexer -> Syntax Analysis -> Semantic Analysis")
        sys.exit(1)

    filepath = sys.argv[1]

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)

    lexer = MyLexer()
    lexer.build()

    parser = MyParser(lexer)
    parser.build(debug=False)

    print(f"Analyzing file: {filepath}")
    print("=" * 60)

    ast = parser.parse(code, filename=os.path.abspath(filepath))

    if lexer.errors:
        print("\n❌ Lexical Errors:")
        for error in lexer.errors:
            print(f"  Line {error['line']}: {error['message']}")
        sys.exit(1)

    if parser.errors:
        print("\n❌ Syntax Errors:")
        for error in parser.errors:
            print(f"  Line {error['line']}: {error['message']}")
        sys.exit(1)

    print("✓ Lexical analysis: OK")
    print("✓ Syntax analysis: OK")

    semantic = ParserSemantic()
    result = semantic.analyze(ast, filename=filepath)

    print("✓ Semantic analysis: OK")
    print()

    print("=" * 60)
    print("SEMANTIC ANALYSIS RESULTS")
    print("=" * 60)

    summary = result.get("summary", {})
    print(f"\nPatterns Detected: {summary.get('total_patterns', 0)}")
    print(f"  Complete: {summary.get('complete_patterns', 0)}")
    print(f"  Incomplete: {summary.get('incomplete_patterns', 0)}")

    counts = summary.get("pattern_counts", {})
    print("\nBy Type:")
    for pattern_type, count in counts.items():
        if count > 0:
            print(f"  {pattern_type}: {count}")

    file_result = result.get("files", [{}])[0]
    complete = file_result.get("patterns", [])
    incomplete = file_result.get("incomplete_patterns", [])

    if complete:
        print("\n" + "-" * 40)
        print("COMPLETE PATTERNS")
        print("-" * 40)
        for pattern in complete:
            print(f"\n✓ {pattern['pattern_type']}")
            print(f"  Anchor: {pattern['anchor_class']} ({pattern['anchor_stereotype']})")
            print(f"  Elements: {pattern['elements']}")
            print(f"  Constraints: {pattern['constraints']}")

    if incomplete:
        print("\n" + "-" * 40)
        print("INCOMPLETE PATTERNS")
        print("-" * 40)
        for pattern in incomplete:
            print(f"\n⚠ {pattern['pattern_type']}")
            print(f"  Anchor: {pattern['anchor_class']} ({pattern['anchor_stereotype']})")
            print(f"  Elements: {pattern['elements']}")
            print(f"  Constraints: {pattern['constraints']}")
            print(f"  Violations:")
            for v in pattern.get("violations", []):
                print(f"    - [{v['severity'].upper()}] {v['message']}")
            print(f"  Suggestions:")
            for s in pattern.get("suggestions", []):
                print(f"    - {s['message']}")
                print(f"      Code: {s['code_suggestion'][:50]}..." if len(s.get('code_suggestion', '')) > 50 else f"      Code: {s.get('code_suggestion', '')}")

    if "--json" in sys.argv:
        print("\n" + "=" * 60)
        print("FULL JSON OUTPUT")
        print("=" * 60)
        print(json.dumps(result, indent=2))

# Recomendação pra teste:
# examples/professor/Pizzaria_Model/src/Monobloco/Pizzaria_MONO.tonto
# examples/example2.tonto
# examples/professor/Hospital_Model/src/Pessoa.tonto
# examples/professor/Pizzaria_Model/src/Pessoa.tonto
# examples/professor/FoodAllergyExample/src/alergiaalimentar.tonto
if __name__ == "__main__":
    main()