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

    symbols = file_result.get("symbols", {})
    relations = symbols.get("relations", [])
    
    #TODO mudar esse print de lugar/jogar fora pra matixinha n brigar
    if relations:
        print("\n" + "=" * 60)
        print("RELATIONS DETECTED")
        print("=" * 60)
        
        # Separar relações internas e externas
        internal_rels = [r for r in relations if r.get('node_type') == 'internal_relation']
        external_rels = [r for r in relations if r.get('node_type') == 'external_relation']
        
        if internal_rels:
            print("\n" + "-" * 40)
            print("INTERNAL RELATIONS (within class bodies)")
            print("-" * 40)
            for rel in internal_rels:
                source = rel.get('source_class', '?')
                target = rel.get('second_end', '?')
                stereotype = rel.get('relation_stereotype', 'none')
                card1 = rel.get('first_cardinality', '*')
                card2 = rel.get('second_cardinality', '*')
                
                print(f"\n  Source: {source}")
                print(f"  Target: {target}")
                print(f"  Stereotype: @{stereotype}" if stereotype != 'none' else "  Stereotype: (none)")
                print(f"  Cardinality: [{card1}] -> [{card2}]")
        
        if external_rels:
            print("\n" + "-" * 40)
            print("EXTERNAL RELATIONS (between classes)")
            print("-" * 40)
            for rel in external_rels:
                first = rel.get('first_end', '?')
                second = rel.get('second_end', '?')
                stereotype = rel.get('relation_stereotype', 'none')
                card1 = rel.get('first_cardinality', '*')
                card2 = rel.get('second_cardinality', '*')
                
                print(f"\n  {first} <-> {second}")
                print(f"  Stereotype: @{stereotype}" if stereotype != 'none' else "  Stereotype: (none)")
                print(f"  Cardinality: [{card1}] <-> [{card2}]")

    # NOVA SEÇÃO: DETALHAMENTO DE ROLES
    classes = symbols.get("classes", [])
    role_classes = [c for c in classes if c.get('class_stereotype') == 'role']
    
    if role_classes:
        print("\n" + "=" * 60)
        print("ROLES DETECTED")
        print("=" * 60)
        
        for role_class in role_classes:
            role_name = role_class.get('class_name')
            specialization = role_class.get('specialization', {})
            parents = specialization.get('parents', [])
            body = role_class.get('body')
            
            print(f"\n {role_name}")
            
            if parents:
                print(f"  Specializes: {', '.join(parents)}")
            else:
                print(f"  Specializes: (none)")
            
            # Verificar se tem corpo com conteúdo
            if body and len(body) > 0:
                print(f"  Declaration: with body")
                
                # Extrair atributos
                attributes = [item for item in body if item.get('node_type') == 'attribute']
                if attributes:
                    print(f"  Attributes:")
                    for attr in attributes:
                        attr_name = attr.get('attribute_name')
                        attr_type = attr.get('attribute_type')
                        cardinality = attr.get('cardinality')
                        
                        if cardinality:
                            card_value = cardinality.get('value', '*')
                            print(f"    • {attr_name} : {attr_type} [{card_value}]")
                        else:
                            print(f"    • {attr_name} : {attr_type}")
                
                # Extrair relações internas
                internal_relations = [item for item in body if item.get('node_type') == 'internal_relation']
                if internal_relations:
                    print(f"  Internal Relations:")
                    for rel in internal_relations:
                        stereotype = rel.get('relation_stereotype', 'none')
                        target = rel.get('second_end')
                        cardinality = rel.get('second_cardinality', '*')
                        
                        if stereotype != 'none':
                            print(f"    • @{stereotype} -> {target} [{cardinality}]")
                        else:
                            print(f"    • (no stereotype) -> {target} [{cardinality}]")
            else:
                print(f"  Declaration: inline (no body)")

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