#!/usr/bin/env python
"""
Tokenize Tonto source files.
Usage: python tokenize.py <file.tonto>
"""

import sys


from Lexer import build_lexer
from TokenType import get_token_category


def tokenize_file(filepath):
    """
    Tokenize a Tonto source file and print all tokens.
    
    Args:
        filepath: Path to the .tonto file
    """
    lexer = build_lexer()
    
    # Read the file
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    # Tokenize
    lexer.input(code)
    
    # Print header
    print(f"\nTokenizing: {filepath}")
    print(f"File size: {len(code)} characters\n")
    print(f"{'TOKEN TYPE':<25} {'VALUE':<20} {'CATEGORY':<20} {'LINE':<5} {'COLUMN':<5}")
    print("=" * 80)
    
    # Print all tokens
    token_count = 0
    category_counts = {}

    counted_categories = {
        "LANGUAGE_KEYWORD",
        "CLASS_STEREOTYPE",
        "RELATION_STEREOTYPE",
        "DATA_TYPE",
        "META_ATTRIBUTE",
    }
    
    for tok in lexer:
        category = get_token_category(tok.type)
        
        # Truncate long values for display
        display_value = str(tok.value)
        if len(display_value) > 18:
            display_value = display_value[:15] + "..."
        
        print(f"{tok.type:<25} {display_value:<20} {category:<20} {tok.lineno:<5} {tok.lexpos}")
        
        token_count += 1
        if category in counted_categories:
            category_counts[category] = category_counts.get(category, 0) + 1
    
    # Print summary
    print("=" * 80)
    print(f"\nSummary:")
    print(f"  Total tokens: {token_count}")
    print(f"\n  Tokens by category:")
    for category, count in category_counts.items():
        print(f"    {category:<20}: {count}")

    # TODO: Adicionar relatório de erros léxicos, se houver
    # Com sugestão (no caso de erro léxico, o único erro possível é caractere ilegal)


def main():
    """Main entry point."""
    if len(sys.argv) < 2:
        print("Usage: python tokenize.py <file.tonto>")
        print("\nTokenizes a Tonto source file and displays all tokens.")
        sys.exit(1)
    
    filepath = sys.argv[1]
    tokenize_file(filepath)


if __name__ == '__main__':
    main()