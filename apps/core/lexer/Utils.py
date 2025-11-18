"""
Utilitários para formatação visual e exibição de relatórios do tokenizador.

Este módulo fornece funcionalidades para criar saídas visuais atrativas
do analisador léxico, incluindo suporte a cores ANSI, barras de progresso,
formatação de caixas e geração de relatórios estruturados.

Classes:
    Colors: Gerencia códigos ANSI para colorização de terminal
    
Functions:
    Diversas funções para formatação de seções, barras de progresso
    e construção de relatórios visuais organizados.

Examples:
    >>> Colors.initialize()
    >>> print(f"{Colors.RED}Erro{Colors.RESET}")
    >>> bar = print_progress_bar(75, 3, 4)
    >>> print(bar)
    ███████████████████░░░░░  75.0% (3/4)
"""

import sys


class Colors:
    """
    Classe para gerenciamento de códigos de cores ANSI em terminais.
    
    Fornece constantes para cores e formatação de texto, com suporte
    para detecção automática de capacidades do terminal e desabilitação
    automática quando a saída é redirecionada.
    
    Attributes:
        RESET (str): Código para resetar formatação
        RED (str): Código para cor vermelha
        GREEN (str): Código para cor verde  
        YELLOW (str): Código para cor amarela
        BLUE (str): Código para cor azul
        MAGENTA (str): Código para cor magenta
        CYAN (str): Código para cor ciano
        BOLD (str): Código para texto em negrito
    
    Examples:
        >>> Colors.initialize()
        >>> print(f"{Colors.RED}Texto vermelho{Colors.RESET}")
        >>> Colors.disable()  # Desabilita cores manualmente
    """
    RESET = "\033[0m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    BOLD = "\033[1m"

    @staticmethod
    def disable():
        """
        Desabilita todas as códigos de cor ANSI.
        
        Define todos os códigos de cor como strings vazias, efetivamente
        desabilitando a colorização. Útil quando a saída é redirecionada
        ou quando o terminal não suporta cores.
        """
        Colors.RESET = ""
        Colors.RED = ""
        Colors.GREEN = ""
        Colors.YELLOW = ""
        Colors.BLUE = ""
        Colors.MAGENTA = ""
        Colors.CYAN = ""
        Colors.BOLD = ""

    @staticmethod
    def initialize():
        """
        Inicializa suporte a cores detectando capacidades do terminal.
        
        Verifica se o terminal suporta códigos ANSI e se a saída não está
        sendo redirecionada. No Windows, tenta habilitar suporte ANSI.
        Desabilita cores automaticamente se necessário.
        
        Note:
            Deve ser chamada antes de usar qualquer código de cor.
            É seguro chamar múltiplas vezes.
        """
        # Detect if output is being piped or redirected
        if not sys.stdout.isatty():
            Colors.disable()
            return

        # On Windows, try to enable ANSI colors
        if sys.platform == "win32":
            try:
                import ctypes

                kernel32 = ctypes.windll.kernel32
                kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
            except Exception:
                Colors.disable()


def print_progress_bar(percentage, count, total, width=25):
    """
    Gera uma barra de progresso visual em caracteres Unicode.
    
    Cria uma representação visual de progresso usando caracteres de bloco
    Unicode, mostrando preenchimento proporcional à porcentagem fornecida.
    
    Args:
        percentage (float): Porcentagem de progresso (0-100).
        count (int): Valor atual do contador.
        total (int): Valor total/máximo do contador.
        width (int): Largura da barra em caracteres. Padrão: 25.
    
    Returns:
        str: String formatada contendo a barra visual, porcentagem e contadores.
    
    Examples:
        >>> print_progress_bar(75.0, 3, 4)
        '███████████████████░░░░░  75.0% (3/4)'
        >>> print_progress_bar(50.0, 1, 2, width=10) 
        '█████░░░░░  50.0% (1/2)'
    """
    filled = int(width * percentage / 100)
    bar = "█" * filled + "░" * (width - filled)
    percentage_str = f"{percentage:5.1f}%"
    return f"{bar} {percentage_str} ({count}/{total})"


def get_category_color(category):
    """
    Retorna a cor ANSI apropriada para uma categoria de token.
    
    Mapeia diferentes categorias semânticas de tokens para cores específicas,
    permitindo highlight visual consistente em relatórios e exibições.
    
    Args:
        category (str): Nome da categoria do token (ex: 'CLASS_STEREOTYPE', 
            'LANGUAGE_KEYWORD', 'RELATION_STEREOTYPE').
    
    Returns:
        str: Código de cor ANSI correspondente à categoria.
    
    Examples:
        >>> get_category_color('CLASS_STEREOTYPE')
        '\\033[95m'  # MAGENTA
        >>> get_category_color('LANGUAGE_KEYWORD') 
        '\\033[93m'  # YELLOW
        >>> get_category_color('UNKNOWN')
        '\\033[0m'   # RESET
    """
    if "CLASS" in category:
        return Colors.MAGENTA
    elif "RELATION" in category:
        return Colors.CYAN
    elif "LANGUAGE" in category:
        return Colors.YELLOW
    elif "DATA_TYPE" in category:
        return Colors.GREEN
    elif "META" in category:
        return Colors.BLUE
    else:
        return Colors.RESET


def format_summary_header():
    """
    Formata o cabeçalho da seção de resumo.
    
    Returns:
        str: Texto "SUMMARY" formatado com cor ciano.
    """
    return f"{Colors.CYAN}SUMMARY{Colors.RESET}"


def format_distribution_title():
    """
    Formata o título da seção de distribuição de palavras-chave.
    
    Returns:
        str: Título formatado com emoji e cor azul.
    """
    return f"{Colors.BLUE}🏷️  Keywords & Stereotypes Distribution{Colors.RESET}"


def format_section_title(title, emoji=""):
    """
    Formata título de seção com formatação consistente.
    
    Args:
        title (str): Texto do título.
        emoji (str): Emoji opcional para prefixar o título.
    
    Returns:
        str: Título formatado em negrito e azul com emoji opcional.
    """
    prefix = f"{emoji}  " if emoji else ""
    return f"{Colors.BOLD}{Colors.BLUE}{prefix}{title}{Colors.RESET}"


def format_error_section_header():
    """
    Formata o cabeçalho da seção de erros léxicos.
    
    Returns:
        str: Texto "Lexical Errors:" em vermelho e negrito.
    """
    return f"{Colors.RED}{Colors.BOLD}Lexical Errors:{Colors.RESET}"


def format_error_message(error):
    """
    Formata mensagem de erro individual com dica adicional.
    
    Args:
        error: Pode ser string (formato legado) ou dict (formato novo com contexto)
    
    Returns:
        str: Mensagem formatada em vermelho com seta e dica adicional
            para caracteres ilegais.
    """
    # Formato novo (dict com contexto completo)
    if isinstance(error, dict):
        lines = []

        location = f"{error['filename']}:{error['line']}:{error['column']}"
        lines.append(f"  {Colors.RED}→ {location}: {error['message']}{Colors.RESET}")

        if 'line_text' in error:
            lines.append(f"    {Colors.CYAN}{error['line_text']}{Colors.RESET}")

        if 'pointer' in error:
            lines.append(f"    {Colors.RED}{error['pointer']}{Colors.RESET}")
    
        # Adiciona sugestões baseadas no caractere ilegal
        #char = error.get('character', '')
        #if char == '$':
        #    lines.append(f"    {Colors.YELLOW}Hint: Use '@' for annotations in TONTO{Colors.RESET}")
        #elif char == '%':
        #    lines.append(f"    {Colors.YELLOW}Hint: Check TONTO language specification for valid characters{Colors.RESET}")

        return '\n'.join(lines)
    
    # Formato antigo (string simples)
    #if isinstance(error, str):
    #    if error.startswith("Illegal character"):
    #        error = error + ", refer to the documentation for valid characters."
    #    return f"  {Colors.RED}→{Colors.RESET} {error}"
    
    # Fallback para outros tipos
    #return f"  {Colors.RED}→{Colors.RESET} {str(error)}"
    
    #if message.startswith("Illegal character"):
    #    message = message + ", refer to the documentation for valid characters."
    #return f"  {Colors.RED}→{Colors.RESET} {message}"

    return str(error)


def format_no_keywords_message():
    """
    Formata mensagem quando nenhuma palavra-chave é encontrada.
    
    Returns:
        str: Mensagem em amarelo indicando ausência de palavras-chave.
    """
    return f"{Colors.YELLOW}No keywords or stereotypes found.{Colors.RESET}"


def format_total_keywords_label(total):
    """
    Formata rótulo com total de palavras-chave encontradas.
    
    Args:
        total (int): Número total de palavras-chave.
    
    Returns:
        str: Rótulo formatado em negrito com contagem.
    """
    return f"{Colors.BOLD}Total Keywords & Stereotypes:{Colors.RESET} {total}"


def format_error_count(count):
    """
    Formata contagem de erros com indicador visual.
    
    Args:
        count (int): Número de erros encontrados.
    
    Returns:
        str: Contagem formatada - verde com ✓ se zero, vermelho com ✗ se > 0.
    """
    if count > 0:
        return f"{Colors.RED}{count} ✗{Colors.RESET}"
    else:
        return f"{Colors.GREEN}{None} ✓{Colors.RESET}"


# Box drawing characters for different styles
BOX_STYLES = {
    "simple": {"tl": "+", "tr": "+", "bl": "+", "br": "+", "h": "-", "v": "|", "sep": "+"},
    "single": {"tl": "┌", "tr": "┐", "bl": "└", "br": "┘", "h": "─", "v": "│", "sep": "┼"},
    "double": {"tl": "╔", "tr": "╗", "bl": "╚", "br": "╝", "h": "═", "v": "║", "sep": "╬"},
    "rounded": {"tl": "╭", "tr": "╮", "bl": "╰", "br": "╯", "h": "─", "v": "│", "sep": "┼"},
    "heavy": {"tl": "┏", "tr": "┓", "bl": "┗", "br": "┛", "h": "━", "v": "┃", "sep": "╋"},
}


def strip_ansi_codes(text):
    """
    Remove códigos de escape ANSI de uma string.
    
    Utiliza expressão regular para identificar e remover todos os
    códigos de controle ANSI, útil para calcular largura real do
    texto para alinhamento visual.
    
    Args:
        text (str): Texto que pode conter códigos ANSI.
    
    Returns:
        str: Texto limpo sem códigos de escape.
    
    Examples:
        >>> strip_ansi_codes("\\033[91mErro\\033[0m")
        'Erro'
        >>> strip_ansi_codes("Texto normal")
        'Texto normal'
    """
    import re

    ansi_escape = re.compile(r"\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])")
    return ansi_escape.sub("", text)


def build_and_print_summary(
    filepath, code, token_count, category_counts, errors, counted_categories, token_lines=None, truncate=False, max_tokens=10
):
    """
    Constrói e exibe relatório visual completo da análise léxica.
    
    Gera um relatório formatado em caixa contendo informações do arquivo,
    lista de tokens, estatísticas de distribuição por categoria e erros
    encontrados. O relatório é visualmente organizado com cores e bordas.
    
    Args:
        filepath (str): Caminho do arquivo analisado.
        code (str): Conteúdo do código fonte.
        token_count (int): Total de tokens encontrados.
        category_counts (dict): Dicionário com contagem por categoria.
        errors (list): Lista de mensagens de erro.
        counted_categories (set): Categorias contabilizadas nas estatísticas.
        token_lines (list, optional): Linhas formatadas dos tokens para exibição.
        truncate (bool): Se True, limita exibição de tokens. Padrão: False.
        max_tokens (int): Número máximo de tokens a exibir se truncate=True.
    
    Examples:
        >>> build_and_print_summary(
        ...     "test.tonto", "kind Person", 2, 
        ...     {"CLASS_STEREOTYPE": 1}, [], {"CLASS_STEREOTYPE"}
        ... )
        # Exibe caixa formatada com todas as informações
    
    Note:
        Esta função imprime diretamente no stdout e não retorna valores.
        A formatação adapta-se automaticamente ao conteúdo mais longo.
    """
    print("\n")

    box = BOX_STYLES["rounded"]
    error_count = len(errors)
    content_lines = []

    # === SUMMARY INFO ===
    content_lines.append(f"{Colors.BOLD}{Colors.BLUE}File Summary:{Colors.RESET}")
    content_lines.append(f"{Colors.BOLD}File:{Colors.RESET} {filepath}")
    content_lines.append(f"{Colors.BOLD}Size:{Colors.RESET} {len(code)} characters")
    content_lines.append(f"{Colors.BOLD}Total Tokens:{Colors.RESET} {token_count}")
    content_lines.append(f"{Colors.BOLD}Lexical Errors:{Colors.RESET} {format_error_count(error_count)}")

    # === TOKENS ===
    if token_lines:
        content_lines.append("")  # spacing
        content_lines.append(format_section_title("TOKENS", emoji=""))

        header_line = f"  {'TOKEN TYPE':<25} {'VALUE':<20} {'CATEGORY':<20} {'LINE':<5} {'COLUMN'}"
        content_lines.append(f"{Colors.BOLD}{header_line}{Colors.RESET}")
        separator_line = f"  {'-' * 25} {'-' * 20} {'-' * 20} {'-' * 4} {'-' * 7}"
        content_lines.append(separator_line)

        lines_to_show = token_lines
        truncated = False

        if truncate and len(token_lines) > max_tokens:
            lines_to_show = token_lines[:max_tokens]
            truncated = True

        for line in lines_to_show:
            content_lines.append(f"  {line}")

        if truncated:
            hidden = len(token_lines) - max_tokens
            content_lines.append(f"{Colors.YELLOW}  ... ({hidden} more tokens hidden){Colors.RESET}")

    # === ERRORS ===
    if errors:
        content_lines.append("")  # spacing
        content_lines.append(format_error_section_header())
        for error in errors:
            error_msg = format_error_message(error)

            if '\n' in error_msg:
                content_lines.extend(error_msg.split('\n'))
            else:
                content_lines.append(error_msg)
                
            #content_lines.append(format_error_message(error))

    # === DISTRIBUTION ===
    if category_counts:
        total_keywords = sum(category_counts.values())
        content_lines.append("")
        content_lines.append(format_total_keywords_label(total_keywords))
        content_lines.append("")
        sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        max_category_length = max(len(cat) for cat, _ in sorted_categories)

        for category, count in sorted_categories:
            percentage = (count / total_keywords) * 100
            bar = print_progress_bar(percentage, count, total_keywords)
            color = get_category_color(category)
            content_lines.append(f"{color}{category:<{max_category_length}}{Colors.RESET} {bar}")
    else:
        content_lines.append("")
        content_lines.append(format_no_keywords_message())

    # === BOX RENDER ===
    title = format_summary_header()
    title_length = len(strip_ansi_codes(title))
    max_content_length = max(len(strip_ansi_codes(line)) for line in content_lines)
    content_width = max(title_length, max_content_length) + 4

    top_line = box["tl"] + box["h"] * content_width + box["tr"]
    bottom_line = box["bl"] + box["h"] * content_width + box["br"]
    title_padding = (content_width - title_length) // 2
    title_line = box["v"] + " " * title_padding + title + " " * (content_width - title_length - title_padding) + box["v"]
    separator = box["v"] + box["h"] * content_width + box["v"]

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
