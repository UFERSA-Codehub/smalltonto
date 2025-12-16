from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser
from parser.ParserSemantic import ParserSemantic
import json
import sys
import os


def format_cardinality(card):
    """
    Formata cardinalidade de dict para string legível.
    Exemplo: {'min': 1, 'max': '*'} -> '[1..*]'
    """
    if card is None:
        return '[*]'
    if isinstance(card, str):
        return f'[{card}]'
    if isinstance(card, dict):
        min_val = card.get('min', '*')
        max_val = card.get('max', '*')
        if min_val == max_val:
            return f'[{min_val}]'
        return f'[{min_val}..{max_val}]'
    return f'[{card}]'


def print_pattern(pattern, is_complete=True):
    """
    Imprime um padrão de forma estruturada e legível.
    Formatação específica para cada tipo de padrão.
    """
    pattern_type = pattern.get('pattern_type', 'Unknown')
    anchor = pattern.get('anchor_class', '?')
    stereotype = pattern.get('anchor_stereotype', '?')
    elements = pattern.get('elements', {})
    constraints = pattern.get('constraints', {})
    
    # Símbolo de status
    status_icon = "+" if is_complete else "!"
    print(f"\n{status_icon} {pattern_type}")
    print(f"  Anchor: {anchor} (@{stereotype})")
    
    # Formatação específica por tipo de padrão
    if pattern_type == "Subkind_Pattern":
        _print_subkind_pattern(elements, constraints)
    elif pattern_type == "Role_Pattern":
        _print_role_pattern(elements, constraints)
    elif pattern_type == "Phase_Pattern":
        _print_phase_pattern(elements, constraints)
    elif pattern_type == "Relator_Pattern":
        _print_relator_pattern(elements, constraints)
    elif pattern_type == "Mode_Pattern":
        _print_mode_pattern(elements, constraints)
    elif pattern_type == "RoleMixin_Pattern":
        _print_rolemixin_pattern(elements, constraints)
    else:
        # Fallback para padrões desconhecidos
        print(f"  Elements: {elements}")
        print(f"  Constraints: {constraints}")
    
    # Mostrar violations e suggestions para padrões incompletos
    if not is_complete:
        violations = pattern.get('violations', [])
        suggestions = pattern.get('suggestions', [])
        
        if violations:
            print("  Violations:")
            for v in violations:
                severity = v.get('severity', 'warning').upper()
                message = v.get('message', '')
                print(f"    - [{severity}] {message}")
        
        if suggestions:
            print("  Suggestions:")
            for s in suggestions:
                print(f"    - {s.get('message', '')}")
                code_sug = s.get('code_suggestion', '')
                if code_sug:
                    # Limitar tamanho e mostrar código sugerido
                    if len(code_sug) > 60:
                        print(f"      Code: {code_sug[:60]}...")
                    else:
                        print(f"      Code: {code_sug}")


def _print_subkind_pattern(elements, constraints):
    """Imprime detalhes do Subkind_Pattern."""
    general = elements.get('general', '?')
    specifics = elements.get('specifics', [])
    genset_name = elements.get('genset')
    
    print(f"  General (Parent): {general}")
    
    if specifics:
        print(f"  Subkinds: {', '.join(specifics)}")
    
    if genset_name:
        disjoint = "disjoint" if constraints.get('disjoint') else ""
        complete = "complete" if constraints.get('complete') else ""
        modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
        print(f"  Genset: {genset_name} [{modifiers}]")
        
        if constraints.get('disjoint_implicit'):
            print(f"    (!) disjoint was implicitly applied")
    else:
        print(f"  Genset: (none)")


def _print_role_pattern(elements, constraints):
    """Imprime detalhes do Role_Pattern."""
    general = elements.get('general', '?')
    specifics = elements.get('specifics', [])
    genset_name = elements.get('genset')
    roles_details = elements.get('roles_details', [])
    
    print(f"  General (Parent): {general}")
    
    if specifics:
        print(f"  Roles: {', '.join(specifics)}")
    
    if genset_name:
        disjoint = "disjoint" if constraints.get('disjoint') else ""
        complete = "complete" if constraints.get('complete') else ""
        modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
        print(f"  Genset: {genset_name} [{modifiers}]")
    else:
        print(f"  Genset: (none)")
    
    # Mostrar detalhes de cada role
    if roles_details:
        print("  Role Details:")
        for role_info in roles_details:
            role_name = role_info.get('name', '?')
            has_body = role_info.get('has_body', False)
            attributes = role_info.get('attributes', [])
            
            body_str = "(with body)" if has_body else "(no body)"
            print(f"    - {role_name} {body_str}")
            
            if attributes:
                for attr in attributes:
                    # Chaves: 'name' e 'type' (definido em ParserSemantic.py)
                    attr_name = attr.get('name', '?')
                    attr_type = attr.get('type', '?')
                    print(f"        {attr_name}: {attr_type}")


def _print_phase_pattern(elements, constraints):
    """Imprime detalhes do Phase_Pattern."""
    general = elements.get('general', '?')
    specifics = elements.get('specifics', [])
    genset_name = elements.get('genset')
    
    print(f"  General (Parent): {general}")
    
    if specifics:
        print(f"  Phases: {', '.join(specifics)}")
    
    if genset_name:
        disjoint = "disjoint" if constraints.get('disjoint') else ""
        complete = "complete" if constraints.get('complete') else ""
        modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
        print(f"  Genset: {genset_name} [{modifiers}]")
        
        if constraints.get('disjoint_implicit'):
            print(f"    (!) disjoint was implicitly applied")
    else:
        print(f"  Genset: (none)")


def _print_relator_pattern(elements, constraints):
    """Imprime detalhes do Relator_Pattern."""
    relator = elements.get('relator', '?')
    mediations = elements.get('mediations', [])
    mediation_targets = elements.get('mediation_targets', [])
    material_rel = elements.get('material_relation')
    
    print(f"  Relator: {relator}")
    
    if mediations:
        print("  Mediations:")
        for med in mediations:
            target = med.get('target', '?')
            card = format_cardinality(med.get('cardinality'))
            print(f"    - @mediation -> {target} {card}")
    
    if material_rel:
        first = material_rel.get('first_end', '?')
        second = material_rel.get('second_end', '?')
        rel_name = material_rel.get('relation_name', '')
        card1 = format_cardinality(material_rel.get('first_cardinality'))
        card2 = format_cardinality(material_rel.get('second_cardinality'))
        
        name_str = f" -- {rel_name} --" if rel_name else " <->"
        print(f"  Material Relation: {first} {card1}{name_str} {card2} {second}")
    else:
        if len(mediation_targets) >= 2:
            print("  Material Relation: (missing!)")


def _print_mode_pattern(elements, constraints):
    """Imprime detalhes do Mode_Pattern."""
    mode = elements.get('mode', '?')
    characterizations = elements.get('characterizations', [])
    external_deps = elements.get('external_dependences', [])
    
    print(f"  Mode: {mode}")
    
    if characterizations:
        print("  Characterizations:")
        for char in characterizations:
            target = char.get('target', '?')
            card = format_cardinality(char.get('cardinality'))
            print(f"    - @characterization -> {target} {card}")
    
    if external_deps:
        print("  External Dependencies:")
        for dep in external_deps:
            target = dep.get('target', '?')
            card = format_cardinality(dep.get('cardinality'))
            print(f"    - @externalDependence -> {target} {card}")


def _print_rolemixin_pattern(elements, constraints):
    """Imprime detalhes do RoleMixin_Pattern."""
    rolemixin = elements.get('rolemixin', '?')
    gensets = elements.get('gensets', [])
    role_specifics = elements.get('role_specifics', [])
    
    print(f"  RoleMixin: {rolemixin}")
    
    if role_specifics:
        print(f"  Role Specifics: {', '.join(role_specifics)}")
    
    if gensets:
        print("  Gensets:")
        for g in gensets:
            genset_name = g.get('name', '(anonymous)')
            disjoint = "disjoint" if g.get('disjoint') else ""
            complete = "complete" if g.get('complete') else ""
            modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
            specifics = g.get('specifics', [])
            print(f"    - {genset_name} [{modifiers}]")
            if specifics:
                print(f"      Specifics: {', '.join(specifics)}")

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
    
    # Contar estereótipos de classes e relações
    symbols = file_result.get("symbols", {})
    classes = symbols.get("classes", [])
    relations = symbols.get("relations", [])
    
    # Contar estereótipos de classes (todos os que aparecem nos dados)
    class_stereo_counts = {}
    for c in classes:
        stereo = c.get('class_stereotype')
        if stereo:
            class_stereo_counts[stereo] = class_stereo_counts.get(stereo, 0) + 1
    
    # Contar estereótipos de relações (todos os que aparecem nos dados)
    relation_stereo_counts = {}
    for r in relations:
        stereo = r.get('relation_stereotype')
        if stereo:
            relation_stereo_counts[stereo] = relation_stereo_counts.get(stereo, 0) + 1
    
    # Imprimir contagem de estereótipos de classes (apenas > 0)
    if class_stereo_counts:
        print("\nClass Stereotypes:")
        for stereo, count in sorted(class_stereo_counts.items()):
            print(f"  @{stereo}: {count}")
    
    # Imprimir contagem de estereótipos de relações (apenas > 0)
    if relation_stereo_counts:
        print("\nRelation Stereotypes:")
        for stereo, count in sorted(relation_stereo_counts.items()):
            print(f"  @{stereo}: {count}")

    complete = file_result.get("patterns", [])
    incomplete = file_result.get("incomplete_patterns", [])

    if complete:
        print("\n" + "-" * 40)
        print("COMPLETE PATTERNS")
        print("-" * 40)
        for pattern in complete:
            print_pattern(pattern, is_complete=True)

    if incomplete:
        print("\n" + "-" * 40)
        print("INCOMPLETE PATTERNS")
        print("-" * 40)
        for pattern in incomplete:
            print_pattern(pattern, is_complete=False)

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