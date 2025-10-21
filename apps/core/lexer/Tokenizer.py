#!/usr/bin/env python
"""
Utilitário de linha de comando para tokenização de arquivos fonte Tonto.

Este módulo fornece uma interface de linha de comando para tokenizar arquivos
da linguagem Tonto, exibindo todos os tokens encontrados junto com estatísticas
detalhadas sobre categorias de tokens, erros léxicos e distribuição de palavras-chave.

O tokenizador processa o arquivo fonte e exibe:
- Lista completa de tokens com tipo, valor, categoria e posição
- Contagem total de tokens
- Distribuição de palavras-chave e estereótipos por categoria
- Relatório de erros léxicos encontrados
- Estatísticas organizadas em formato visual

Examples:
    Uso básico:
    ```bash
    python Tokenizer.py exemplo.tonto
    ```

    Com opção de truncamento para arquivos grandes:
    ```bash
    python Tokenizer.py exemplo.tonto --truncate
    ```

Attributes:
    Suporta detecção automática de cores no terminal e formatação adequada
    para redirecionamento de saída.
"""

import sys

# Handle both relative imports (for package usage) and absolute imports (for direct script usage)
try:
    from .Lexer import build_lexer, get_errors
    from .TokenType import get_token_category
    from .Utils import Colors, build_and_print_summary
except ImportError:
    # Fallback for when run as a script directly
    from Lexer import build_lexer, get_errors
    from TokenType import get_token_category
    from Utils import Colors, build_and_print_summary


def tokenize_file(filepath, truncate=False):
    """
    Tokeniza um arquivo fonte Tonto e exibe análise detalhada.

    Processa o arquivo especificado através do analisador léxico,
    coletando todos os tokens, categorizando-os e gerando um relatório
    visual completo com estatísticas e distribuição por categorias.

    Args:
        filepath (str): Caminho para o arquivo .tonto a ser tokenizado.
        truncate (bool): Se True, limita a exibição de tokens para evitar
            saída excessivamente longa em arquivos grandes. Padrão: False.

    Raises:
        FileNotFoundError: Se o arquivo especificado não for encontrado.
        Exception: Para outros erros de leitura de arquivo.

    Examples:
        >>> tokenize_file("exemplo.tonto")
        # Exibe tokens completos e estatísticas

        >>> tokenize_file("arquivo_grande.tonto", truncate=True)
        # Limita exibição de tokens para primeiros 10

    Note:
        A função termina o programa (sys.exit) em caso de erro de arquivo.
        Erros léxicos não interrompem a execução, mas são reportados.
    """
    lexer = build_lexer()

    # Read the file
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            code = f.read()
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    # Tokenize
    lexer.input(code)

    # Collect all tokens and build token lines
    token_count = 0
    category_counts = {}
    token_lines = []

    # Categories we want to count
    counted_categories = {"LANGUAGE_KEYWORD", "CLASS_STEREOTYPE", "RELATION_STEREOTYPE", "DATA_TYPE", "META_ATTRIBUTE"}

    for tok in lexer:
        category = get_token_category(tok.type)

        # Truncate long values for display
        display_value = str(tok.value)
        if len(display_value) > 18:
            display_value = display_value[:15] + "..."

        # Build token line
        token_line = f"{tok.type:<25} {display_value:<20} {category:<20} {tok.lineno:<5} {tok.lexpos}"
        token_lines.append(token_line)

        token_count += 1

        # Only count specific categories
        if category in counted_categories:
            category_counts[category] = category_counts.get(category, 0) + 1

    # Get errors and build summary
    errors = get_errors()

    # Build and print everything in one box
    build_and_print_summary(filepath, code, token_count, category_counts, errors, counted_categories, token_lines, truncate)


def main():
    """
    Função principal do utilitário de linha de comando.

    Processa argumentos da linha de comando, inicializa suporte a cores
    e invoca a tokenização do arquivo especificado. Exibe ajuda quando
    argumentos inadequados são fornecidos.

    Args:
        sys.argv: Argumentos da linha de comando esperados:
            - sys.argv[1]: Caminho do arquivo .tonto
            - --truncate: (opcional) Limita exibição de tokens

    Raises:
        SystemExit: Com código 1 quando argumentos são insuficientes.

    Examples:
        Chamada típica via linha de comando:
        ```bash
        python Tokenizer.py exemplo.tonto
        python Tokenizer.py exemplo.tonto --truncate
        ```
    """
    # Initialize color support
    Colors.initialize()

    if len(sys.argv) < 2:
        print("Usage: python tokenize.py <file.tonto> [--truncate]")
        print("\nTokenizes a Tonto source file and displays all tokens.")
        sys.exit(1)

    filepath = sys.argv[1]
    truncate = "--truncate" in sys.argv

    tokenize_file(filepath, truncate)


if __name__ == "__main__":
    main()
