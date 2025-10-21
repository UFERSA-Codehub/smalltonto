"""
Módulo analisador léxico (lexer) para a linguagem de modelagem Tonto.

Este pacote implementa um analisador léxico completo para a linguagem Tonto,
que suporta conceitos de OntoUML incluindo estereótipos de classe e relação,
além de construções específicas para modelagem ontológica.

Módulos:
    Lexer: Implementação principal do analisador léxico usando PLY
    TokenType: Definições de tipos de tokens e palavras reservadas
    Tokenizer: Utilitário de linha de comando para tokenização
    Utils: Funções utilitárias para formatação e exibição de relatórios

Examples:
    Uso básico do lexer:
    
    >>> from lexer.Lexer import build_lexer
    >>> lexer = build_lexer()
    >>> lexer.input("kind Person")
    >>> token = lexer.token()
    >>> print(f"{token.type}: {token.value}")
    CLASS_KIND: kind
    
    Tokenização de arquivo via linha de comando:
    
    ```bash
    python -m lexer.Tokenizer arquivo.tonto
    ```
"""