#!/usr/bin/env python
"""
Visualizador de resultados da análise semântica para arquivos Tonto.

Este módulo fornece uma interface visual para exibir resultados da análise
semântica, incluindo padrões detectados, estereótipos, warnings e sugestões.
Segue o mesmo estilo visual do Tokenizer.py.

Examples:
    Uso típico:
    
    >>> from parser.SemanticVisualizer import print_semantic_report
    >>> print_semantic_report(result, filepath, verbose=False)
"""

import sys

# Handle both relative imports (package) and absolute imports (direct script)
try:
    from lexer.Utils import (
        Colors, BOX_STYLES, strip_ansi_codes, print_progress_bar
    )
except ImportError:
    from ..lexer.Utils import (
        Colors, BOX_STYLES, strip_ansi_codes, print_progress_bar
    )


# ============================================
# HELPER FUNCTIONS
# ============================================

def format_semantic_header():
    """
    Formata o cabeçalho da seção de análise semântica.
    
    Returns:
        str: Texto "SEMANTIC ANALYSIS" formatado com cor ciano.
    """
    return f"{Colors.CYAN}SEMANTIC ANALYSIS{Colors.RESET}"


def format_status_icon(count, is_warning=False):
    """
    Retorna ícone de status formatado com cor apropriada.
    
    Args:
        count: Número de erros/warnings
        is_warning: Se True, usa amarelo para count > 0
    
    Returns:
        str: "None ✓" (verde), "N ✗" (vermelho), ou "N ⚠" (amarelo)
    """
    if count == 0:
        return f"{Colors.GREEN}None ✓{Colors.RESET}"
    elif is_warning:
        return f"{Colors.YELLOW}{count} ⚠{Colors.RESET}"
    else:
        return f"{Colors.RED}{count} ✗{Colors.RESET}"


def format_cardinality(card):
    """
    Formata cardinalidade de dict para string legível.
    
    Args:
        card: Cardinalidade como dict {'min': 1, 'max': '*'} ou string
    
    Returns:
        str: Cardinalidade formatada como '[1..*]'
    
    Examples:
        >>> format_cardinality({'min': 1, 'max': '*'})
        '[1..*]'
        >>> format_cardinality('1')
        '[1]'
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


def truncate_text(text, max_len=60):
    """
    Trunca texto adicionando '...' se exceder o tamanho máximo.
    
    Args:
        text: Texto a truncar
        max_len: Tamanho máximo permitido
    
    Returns:
        str: Texto truncado ou original se menor que max_len
    """
    if len(text) <= max_len:
        return text
    return text[:max_len - 3] + "..."


# ============================================
# BOX RENDERER
# ============================================

def _render_box(title, content_lines):
    """
    Renderiza conteúdo dentro de uma caixa com bordas arredondadas.
    
    Usa BOX_STYLES["rounded"] do Utils.py.
    Adapta largura à linha de conteúdo mais longa.
    
    Args:
        title: Texto do cabeçalho (será centralizado)
        content_lines: Lista de strings para exibir
    """
    print("\n")
    
    box = BOX_STYLES["rounded"]
    
    # Calcular largura necessária
    title_length = len(strip_ansi_codes(title))
    max_content_length = max(len(strip_ansi_codes(line)) for line in content_lines) if content_lines else 0
    content_width = max(title_length, max_content_length) + 4
    
    # Construir linhas da caixa
    top_line = box["tl"] + box["h"] * content_width + box["tr"]
    bottom_line = box["bl"] + box["h"] * content_width + box["br"]
    title_padding = (content_width - title_length) // 2
    title_line = box["v"] + " " * title_padding + title + " " * (content_width - title_length - title_padding) + box["v"]
    separator = box["v"] + box["h"] * content_width + box["v"]
    
    # Imprimir caixa
    print(top_line)
    print(title_line)
    print(separator)
    
    for line in content_lines:
        line_length = len(strip_ansi_codes(line))
        spaces_needed = content_width - line_length - 4
        padded_line = box["v"] + "  " + line + " " * spaces_needed + "  " + box["v"]
        print(padded_line)
    
    print(bottom_line)
    print()


# ============================================
# SECTION BUILDERS - SUMMARY STATISTICS
# ============================================

def _build_file_summary(filepath, result):
    """
    Constrói seção de resumo do arquivo.
    
    Args:
        filepath: Caminho do arquivo analisado
        result: Dict completo do resultado (inclui lexer_errors, parser_errors)
    
    Returns:
        list: Lista de linhas formatadas
    """
    lines = []
    
    lines.append(f"{Colors.BOLD}{Colors.BLUE}File Summary:{Colors.RESET}")
    lines.append(f"{Colors.BOLD}File:{Colors.RESET} {filepath}")
    
    # Erros léxicos
    lexer_errors = result.get("lexer_errors", [])
    lines.append(f"{Colors.BOLD}Lexical Errors:{Colors.RESET} {format_status_icon(len(lexer_errors))}")
    
    # Erros sintáticos
    parser_errors = result.get("parser_errors", [])
    lines.append(f"{Colors.BOLD}Syntax Errors:{Colors.RESET} {format_status_icon(len(parser_errors))}")
    
    # Warnings semânticos (baseado em patterns incompletos)
    file_result = result.get("files", [{}])[0]
    incomplete = file_result.get("incomplete_patterns", [])
    warning_count = sum(len(p.get("violations", [])) for p in incomplete)
    lines.append(f"{Colors.BOLD}Semantic Warnings:{Colors.RESET} {format_status_icon(warning_count, is_warning=True)}")
    
    return lines


def _build_patterns_summary(summary):
    """
    Constrói seção de padrões detectados com barras de progresso.
    
    Args:
        summary: Dict "summary" do result
    
    Returns:
        list: Lista de linhas formatadas
    """
    lines = []
    
    total = summary.get("total_patterns", 0)
    complete = summary.get("complete_patterns", 0)
    incomplete = summary.get("incomplete_patterns", 0)
    pattern_counts = summary.get("pattern_counts", {})
    
    lines.append(f"{Colors.BOLD}{Colors.BLUE}PATTERNS DETECTED{Colors.RESET}")
    lines.append(f"Total: {total}  (Complete: {Colors.GREEN}{complete}{Colors.RESET}, Incomplete: {Colors.YELLOW}{incomplete}{Colors.RESET})")
    
    if pattern_counts and total > 0:
        lines.append("")
        
        # Ordenar por contagem (maior primeiro)
        sorted_patterns = sorted(pattern_counts.items(), key=lambda x: x[1], reverse=True)
        max_name_len = max(len(name) for name, _ in sorted_patterns)
        
        for pattern_type, count in sorted_patterns:
            if count > 0:
                percentage = (count / total) * 100
                bar = print_progress_bar(percentage, count, total)
                lines.append(f"{pattern_type:<{max_name_len}}  {bar}")
    
    return lines


def _build_class_stereotypes(symbols):
    """
    Constrói seção de distribuição de estereótipos de classes.
    
    Args:
        symbols: Dict "symbols" do file_result
    
    Returns:
        list: Lista de linhas formatadas (vazia se não houver classes)
    """
    lines = []
    
    classes = symbols.get("classes", [])
    if not classes:
        return lines
    
    # Contar estereótipos
    stereo_counts = {}
    for c in classes:
        stereo = c.get('class_stereotype')
        if stereo:
            stereo_counts[stereo] = stereo_counts.get(stereo, 0) + 1
    
    if not stereo_counts:
        return lines
    
    total = sum(stereo_counts.values())
    
    lines.append(f"{Colors.BOLD}{Colors.BLUE}CLASS STEREOTYPES{Colors.RESET}")
    
    # Ordenar alfabeticamente
    sorted_stereos = sorted(stereo_counts.items())
    max_name_len = max(len(f"@{name}") for name, _ in sorted_stereos)
    
    for stereo, count in sorted_stereos:
        percentage = (count / total) * 100
        bar = print_progress_bar(percentage, count, total)
        lines.append(f"{Colors.MAGENTA}@{stereo:<{max_name_len - 1}}{Colors.RESET}  {bar}")
    
    return lines


def _build_relation_stereotypes(symbols):
    """
    Constrói seção de distribuição de estereótipos de relações.
    
    Args:
        symbols: Dict "symbols" do file_result
    
    Returns:
        list: Lista de linhas formatadas (vazia se não houver relações)
    """
    lines = []
    
    relations = symbols.get("relations", [])
    if not relations:
        return lines
    
    # Contar estereótipos
    stereo_counts = {}
    for r in relations:
        stereo = r.get('relation_stereotype')
        if stereo:
            stereo_counts[stereo] = stereo_counts.get(stereo, 0) + 1
    
    if not stereo_counts:
        return lines
    
    total = sum(stereo_counts.values())
    
    lines.append(f"{Colors.BOLD}{Colors.BLUE}RELATION STEREOTYPES{Colors.RESET}")
    
    # Ordenar alfabeticamente
    sorted_stereos = sorted(stereo_counts.items())
    max_name_len = max(len(f"@{name}") for name, _ in sorted_stereos)
    
    for stereo, count in sorted_stereos:
        percentage = (count / total) * 100
        bar = print_progress_bar(percentage, count, total)
        lines.append(f"{Colors.CYAN}@{stereo:<{max_name_len - 1}}{Colors.RESET}  {bar}")
    
    return lines


def _build_enums_count(symbols):
    """
    Constrói linha de contagem de enums.
    
    Args:
        symbols: Dict "symbols" do file_result
    
    Returns:
        list: Lista com uma linha, ou vazia se não houver enums
    """
    enums = symbols.get("enums", [])
    if enums:
        return [f"{Colors.BOLD}Enums:{Colors.RESET} {len(enums)}"]
    return []


# ============================================
# SECTION BUILDERS - WARNINGS AND PATTERNS
# ============================================

def _build_warnings_list(incomplete_patterns, truncate=True):
    """
    Constrói seção de warnings para modo padrão (não-verbose).
    
    Args:
        incomplete_patterns: Lista de dicts de padrões incompletos
        truncate: Se True, trunca mensagens longas em 60 caracteres
    
    Returns:
        list: Lista de linhas formatadas
    """
    lines = []
    
    if not incomplete_patterns:
        return lines
    
    lines.append(f"{Colors.BOLD}{Colors.YELLOW}WARNINGS{Colors.RESET}")
    
    for pattern in incomplete_patterns:
        pattern_type = pattern.get("pattern_type", "Unknown")
        anchor = pattern.get("anchor_class", "?")
        violations = pattern.get("violations", [])
        
        for violation in violations:
            message = violation.get("message", "")
            if truncate:
                message = truncate_text(message, 55)
            
            line = f"{Colors.YELLOW}→{Colors.RESET} [{pattern_type}] {anchor}: {message}"
            lines.append(line)
    
    return lines


def _build_complete_patterns(patterns):
    """
    Constrói seção detalhada de padrões completos para modo verbose.
    
    Args:
        patterns: Lista de dicts de padrões completos
    
    Returns:
        list: Lista de linhas formatadas
    """
    lines = []
    
    if not patterns:
        return lines
    
    lines.append(f"{Colors.BOLD}{Colors.GREEN}COMPLETE PATTERNS{Colors.RESET}")
    lines.append("─" * 20)
    
    for pattern in patterns:
        pattern_lines = _format_pattern(pattern, is_complete=True)
        lines.extend(pattern_lines)
        lines.append("")  # Espaçamento entre padrões
    
    return lines


def _build_incomplete_patterns(patterns):
    """
    Constrói seção detalhada de padrões incompletos com violations para modo verbose.
    
    Args:
        patterns: Lista de dicts de padrões incompletos
    
    Returns:
        list: Lista de linhas formatadas
    """
    lines = []
    
    if not patterns:
        return lines
    
    lines.append(f"{Colors.BOLD}{Colors.YELLOW}INCOMPLETE PATTERNS{Colors.RESET}")
    lines.append("─" * 20)
    
    for pattern in patterns:
        pattern_lines = _format_pattern(pattern, is_complete=False)
        lines.extend(pattern_lines)
        lines.append("")  # Espaçamento entre padrões
    
    return lines


# ============================================
# PATTERN FORMATTERS
# ============================================

def _format_pattern(pattern, is_complete=True):
    """
    Formata um único padrão para exibição dentro da caixa.
    Delega para formatadores específicos de cada tipo.
    
    Args:
        pattern: Dict do padrão de ParserSemantic
        is_complete: True para padrões completos, False para incompletos
    
    Returns:
        list: Lista de linhas formatadas
    """
    lines = []
    
    pattern_type = pattern.get('pattern_type', 'Unknown')
    anchor = pattern.get('anchor_class', '?')
    stereotype = pattern.get('anchor_stereotype', '?')
    elements = pattern.get('elements', {})
    constraints = pattern.get('constraints', {})
    
    # Ícone de status
    status_icon = f"{Colors.GREEN}+{Colors.RESET}" if is_complete else f"{Colors.YELLOW}!{Colors.RESET}"
    lines.append(f"{status_icon} {pattern_type}")
    lines.append(f"  Anchor: {anchor} (@{stereotype})")
    
    # Formatação específica por tipo de padrão
    if pattern_type == "Subkind_Pattern":
        lines.extend(_format_subkind_pattern(elements, constraints))
    elif pattern_type == "Role_Pattern":
        lines.extend(_format_role_pattern(elements, constraints))
    elif pattern_type == "Phase_Pattern":
        lines.extend(_format_phase_pattern(elements, constraints))
    elif pattern_type == "Relator_Pattern":
        lines.extend(_format_relator_pattern(elements, constraints))
    elif pattern_type == "Mode_Pattern":
        lines.extend(_format_mode_pattern(elements, constraints))
    elif pattern_type == "RoleMixin_Pattern":
        lines.extend(_format_rolemixin_pattern(elements, constraints))
    
    # Violations e suggestions para padrões incompletos
    if not is_complete:
        violations = pattern.get('violations', [])
        suggestions = pattern.get('suggestions', [])
        
        if violations:
            lines.append(f"  {Colors.YELLOW}Violations:{Colors.RESET}")
            for v in violations:
                severity = v.get('severity', 'warning').upper()
                message = v.get('message', '')
                lines.append(f"    - [{severity}] {message}")
        
        if suggestions:
            lines.append(f"  {Colors.CYAN}Suggestions:{Colors.RESET}")
            for s in suggestions:
                lines.append(f"    - {s.get('message', '')}")
                code_sug = s.get('code_suggestion', '')
                if code_sug:
                    # Mostrar código sugerido (pode ser multi-linha)
                    code_lines = code_sug.split('\n')
                    for code_line in code_lines[:3]:  # Limitar a 3 linhas
                        lines.append(f"      {code_line}")
                    if len(code_lines) > 3:
                        lines.append(f"      ...")
    
    return lines


def _format_subkind_pattern(elements, constraints):
    """Formata detalhes do Subkind_Pattern."""
    lines = []
    
    general = elements.get('general', '?')
    specifics = elements.get('specifics', [])
    genset_name = elements.get('genset')
    
    lines.append(f"  General (Parent): {general}")
    
    if specifics:
        lines.append(f"  Subkinds: {', '.join(specifics)}")
    
    if genset_name:
        disjoint = "disjoint" if constraints.get('disjoint') else ""
        complete = "complete" if constraints.get('complete') else ""
        modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
        lines.append(f"  Genset: {genset_name} [{modifiers}]")
        
        if constraints.get('disjoint_implicit'):
            lines.append(f"    {Colors.YELLOW}(!) disjoint was implicitly applied{Colors.RESET}")
    else:
        lines.append(f"  Genset: (none)")
    
    return lines


def _format_role_pattern(elements, constraints):
    """Formata detalhes do Role_Pattern."""
    lines = []
    
    general = elements.get('general', '?')
    specifics = elements.get('specifics', [])
    genset_name = elements.get('genset')
    roles_details = elements.get('roles_details', [])
    
    lines.append(f"  General (Parent): {general}")
    
    if specifics:
        lines.append(f"  Roles: {', '.join(specifics)}")
    
    if genset_name:
        disjoint = "disjoint" if constraints.get('disjoint') else ""
        complete = "complete" if constraints.get('complete') else ""
        modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
        lines.append(f"  Genset: {genset_name} [{modifiers}]")
    else:
        lines.append(f"  Genset: (none)")
    
    # Mostrar detalhes de cada role
    if roles_details:
        lines.append("  Role Details:")
        for role_info in roles_details:
            role_name = role_info.get('name', '?')
            has_body = role_info.get('has_body', False)
            attributes = role_info.get('attributes', [])
            
            body_str = "(with body)" if has_body else "(no body)"
            lines.append(f"    - {role_name} {body_str}")
            
            if attributes:
                for attr in attributes:
                    attr_name = attr.get('name', '?')
                    attr_type = attr.get('type', '?')
                    lines.append(f"        {attr_name}: {attr_type}")
    
    return lines


def _format_phase_pattern(elements, constraints):
    """Formata detalhes do Phase_Pattern."""
    lines = []
    
    general = elements.get('general', '?')
    specifics = elements.get('specifics', [])
    genset_name = elements.get('genset')
    
    lines.append(f"  General (Parent): {general}")
    
    if specifics:
        lines.append(f"  Phases: {', '.join(specifics)}")
    
    if genset_name:
        disjoint = "disjoint" if constraints.get('disjoint') else ""
        complete = "complete" if constraints.get('complete') else ""
        modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
        lines.append(f"  Genset: {genset_name} [{modifiers}]")
        
        if constraints.get('disjoint_implicit'):
            lines.append(f"    {Colors.YELLOW}(!) disjoint was implicitly applied{Colors.RESET}")
    else:
        lines.append(f"  Genset: (none)")
    
    return lines


def _format_relator_pattern(elements, constraints):
    """Formata detalhes do Relator_Pattern."""
    lines = []
    
    relator = elements.get('relator', '?')
    mediations = elements.get('mediations', [])
    mediation_targets = elements.get('mediation_targets', [])
    material_rel = elements.get('material_relation')
    
    lines.append(f"  Relator: {relator}")
    
    if mediations:
        lines.append("  Mediations:")
        for med in mediations:
            target = med.get('target', '?')
            card = format_cardinality(med.get('cardinality'))
            lines.append(f"    - @mediation -> {target} {card}")
    
    if material_rel:
        first = material_rel.get('first_end', '?')
        second = material_rel.get('second_end', '?')
        rel_name = material_rel.get('relation_name', '')
        card1 = format_cardinality(material_rel.get('first_cardinality'))
        card2 = format_cardinality(material_rel.get('second_cardinality'))
        
        name_str = f" -- {rel_name} --" if rel_name else " <->"
        lines.append(f"  Material Relation: {first} {card1}{name_str} {card2} {second}")
    else:
        if len(mediation_targets) >= 2:
            lines.append(f"  Material Relation: {Colors.YELLOW}(missing!){Colors.RESET}")
    
    return lines


def _format_mode_pattern(elements, constraints):
    """Formata detalhes do Mode_Pattern."""
    lines = []
    
    mode = elements.get('mode', '?')
    characterizations = elements.get('characterizations', [])
    external_deps = elements.get('external_dependences', [])
    
    lines.append(f"  Mode: {mode}")
    
    if characterizations:
        lines.append("  Characterizations:")
        for char in characterizations:
            target = char.get('target', '?')
            card = format_cardinality(char.get('cardinality'))
            lines.append(f"    - @characterization -> {target} {card}")
    
    if external_deps:
        lines.append("  External Dependencies:")
        for dep in external_deps:
            target = dep.get('target', '?')
            card = format_cardinality(dep.get('cardinality'))
            lines.append(f"    - @externalDependence -> {target} {card}")
    
    return lines


def _format_rolemixin_pattern(elements, constraints):
    """Formata detalhes do RoleMixin_Pattern."""
    lines = []
    
    rolemixin = elements.get('rolemixin', '?')
    gensets = elements.get('gensets', [])
    role_specifics = elements.get('role_specifics', [])
    
    lines.append(f"  RoleMixin: {rolemixin}")
    
    if role_specifics:
        lines.append(f"  Role Specifics: {', '.join(role_specifics)}")
    
    if gensets:
        lines.append("  Gensets:")
        for g in gensets:
            genset_name = g.get('name', '(anonymous)')
            disjoint = "disjoint" if g.get('disjoint') else ""
            complete = "complete" if g.get('complete') else ""
            modifiers = ' '.join(filter(None, [disjoint, complete])) or "(no modifiers)"
            specifics = g.get('specifics', [])
            lines.append(f"    - {genset_name} [{modifiers}]")
            if specifics:
                lines.append(f"      Specifics: {', '.join(specifics)}")
    
    return lines


# ============================================
# MAIN ENTRY POINT
# ============================================

def print_semantic_report(result, filepath, verbose=False):
    """
    Função principal para imprimir o relatório visual da análise semântica.
    
    Args:
        result: Dict de resultado do ParserSemantic.analyze()
            Chaves esperadas:
            - summary: {total_patterns, complete_patterns, incomplete_patterns, pattern_counts}
            - files: [{symbols, patterns, incomplete_patterns}]
            - lexer_errors: list (adicionado por main_semantic.py)
            - parser_errors: list (adicionado por main_semantic.py)
        filepath: Caminho do arquivo analisado
        verbose: Se True, mostra detalhes completos dos padrões
    
    Examples:
        >>> print_semantic_report(result, "example.tonto", verbose=False)
        # Mostra resumo com warnings truncados
        
        >>> print_semantic_report(result, "example.tonto", verbose=True)
        # Mostra todos os padrões com detalhes completos
    """
    Colors.initialize()
    
    content_lines = []
    
    # Seção 1: Resumo do arquivo
    content_lines.extend(_build_file_summary(filepath, result))
    content_lines.append("")
    
    # Seção 2: Padrões detectados
    summary = result.get("summary", {})
    content_lines.extend(_build_patterns_summary(summary))
    content_lines.append("")
    
    # Seção 3: Estereótipos de classes
    file_result = result.get("files", [{}])[0]
    symbols = file_result.get("symbols", {})
    
    class_stereo_lines = _build_class_stereotypes(symbols)
    if class_stereo_lines:
        content_lines.extend(class_stereo_lines)
        content_lines.append("")
    
    # Seção 4: Estereótipos de relações
    relation_stereo_lines = _build_relation_stereotypes(symbols)
    if relation_stereo_lines:
        content_lines.extend(relation_stereo_lines)
        content_lines.append("")
    
    # Seção 5: Contagem de enums
    enum_lines = _build_enums_count(symbols)
    if enum_lines:
        content_lines.extend(enum_lines)
        content_lines.append("")
    
    # Seção 6: Padrões ou Warnings
    complete = file_result.get("patterns", [])
    incomplete = file_result.get("incomplete_patterns", [])
    
    if verbose:
        # Modo verbose: mostrar todos os padrões com detalhes
        if complete:
            content_lines.extend(_build_complete_patterns(complete))
        if incomplete:
            content_lines.extend(_build_incomplete_patterns(incomplete))
    else:
        # Modo padrão: mostrar apenas resumo de warnings
        if incomplete:
            content_lines.extend(_build_warnings_list(incomplete, truncate=True))
            content_lines.append("")
            content_lines.append(f"{Colors.YELLOW}Use --verbose or -v for full details.{Colors.RESET}")
    
    # Renderizar a caixa
    _render_box(format_semantic_header(), content_lines)
