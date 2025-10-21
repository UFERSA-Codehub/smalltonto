#!/usr/bin/env python
"""
Tokenize Tonto source files.
Usage: python tokenize.py <file.tonto>
"""

import sys

from Lexer import build_lexer, get_errors
from TokenType import get_token_category
from Utils import Colors, build_and_print_summary


def tokenize_file(filepath, truncate=False):
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
        token_line = f"{tok.type:<25} {display_value:<20} {category:<20} {tok.lineno:<5}{tok.lexpos}"
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
