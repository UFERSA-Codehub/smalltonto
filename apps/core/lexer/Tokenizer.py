#!/usr/bin/env python
'''
Tokenize Tonto source files.
Usage: python tokenize.py <file.tonto>
'''

import sys

from Lexer import build_lexer, get_errors
from TokenType import get_token_category
from Utils import (
    Colors, print_progress_bar, get_category_color,
    format_summary_header, format_section_title,
    format_error_message, format_error_count
)

def tokenize_file(filepath):

    lexer = build_lexer()
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)
    
    lexer.input(code)
    summary_builder(filepath, lexer, code)


def summary_builder(filepath, lexer, code):
    # Print header
    print(f"\nTokenizing: {filepath}")
    print(f"File size: {len(code)} characters\n")
    print(f"{'TOKEN TYPE':<25} {'VALUE':<20} {'LINE':<10} COLUMN")
    print("=" * 85)
    
    # Print all tokens
    token_count = 0
    category_counts = {}
    
    # Categories we want to count
    counted_categories = {
        "LANGUAGE_KEYWORD",
        "CLASS_STEREOTYPE", 
        "RELATION_STEREOTYPE",
        "DATA_TYPE",
        "META_ATTRIBUTE"
    }
    
    for tok in lexer:
        category = get_token_category(tok.type)
        
        # Truncate long values for display
        display_value = str(tok.value)
        if len(display_value) > 18:
            display_value = display_value[:15] + "..."
        
        print(f"{tok.type:<25} {display_value:<20} {tok.lineno:<10} {tok.lexpos}")
        
        token_count += 1
        
        # Only count specific categories
        if category in counted_categories:
            category_counts[category] = category_counts.get(category, 0) + 1
    
    # Print summary
    print("=" * 85)
    print(format_summary_header())
    print("=" * 85)
    
    # Total tokens
    print(f"\n{Colors.BOLD}Total Tokens:{Colors.RESET} {Colors.GREEN}{token_count}{Colors.RESET}")
    
    # Show errors if any
    errors = get_errors()
    error_count = len(errors)
    print(f"{Colors.BOLD}Errors:{Colors.RESET} {format_error_count(error_count)}")
    
    if errors:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️  Lexical Errors:{Colors.RESET}")
        for error in errors:
            print(format_error_message(error))
    
    # Keywords and stereotypes distribution
    if category_counts:
        total_keywords = sum(category_counts.values())
        print(f"\n{format_section_title('Keywords & Stereotypes Distribution', '🏷️')}")
        print(f"{Colors.BOLD}Total:{Colors.RESET} {total_keywords}\n")
        
        # Sort by count (descending)
        sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        
        for category, count in sorted_categories:
            percentage = (count / total_keywords) * 100
            bar = print_progress_bar(percentage, count, total_keywords)
            color = get_category_color(category)
                
            print(f"  {color}{category:<25}{Colors.RESET} {bar}")
    else:
        print(f"\n{Colors.YELLOW}No keywords or stereotypes found.{Colors.RESET}")
    
    print("\n" + "=" * 85)
    print()


def main():
    '''Main entry point.'''
    # Initialize color support
    Colors.initialize()
    
    if len(sys.argv) < 2:
        print("Usage: python tokenize.py <file.tonto>")
        print("\nTokenizes a Tonto source file and displays all tokens.")
        sys.exit(1)
    
    filepath = sys.argv[1]
    tokenize_file(filepath)


if __name__ == '__main__':
    main()