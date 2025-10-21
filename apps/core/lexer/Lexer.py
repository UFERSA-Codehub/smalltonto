"""
Analisador léxico (lexer) para a linguagem de modelagem Tonto.

Este módulo implementa um analisador léxico usando PLY (Python Lex-Yacc) para
tokenizar código fonte da linguagem Tonto. A linguagem suporta conceitos de
OntoUML incluindo estereótipos de classe e relação, além de construções
específicas para modelagem ontológica.

O lexer reconhece diferentes tipos de tokens incluindo:
- Palavras-chave da linguagem (package, import, genset, etc.)
- Estereótipos OntoUML para classes e relações
- Identificadores com convenções específicas
- Literais (strings, números)
- Operadores e delimitadores
- Comentários e anotações

Examples:
    Uso básico do lexer:

    >>> lexer = build_lexer()
    >>> lexer.input("package MyModel { kind Person }")
    >>> for token in lexer:
    ...     print(f"{token.type}: {token.value}")
    KEYWORD_PACKAGE: package
    IDENTIFIER: MyModel
    LBRACE: {
    CLASS_KIND: kind
    CLASS_NAME: Person
    RBRACE: }

Attributes:
    lexer_errors (list): Lista global que armazena erros léxicos encontrados
        durante a análise. É resetada a cada nova chamada de build_lexer().
"""

import ply.lex as lex

try:
    from .TokenType import reserved, tokens  # noqa: F401
except ImportError:
    from TokenType import reserved, tokens  # noqa: F401

# Globals
lexer_errors = []


# Token definitions
t_LBRACE = r"\{"
t_RBRACE = r"\}"
t_LPAREN = r"\("
t_RPAREN = r"\)"
t_LBRACKET = r"\["
t_RBRACKET = r"\]"
t_CARDINALITY = r"\.\."
t_COMPOSITIONL = r"<>\-\-"
t_COMPOSITIONR = r"\-\-<>"
t_ASTERISK = r"\*"
t_ANNOTATION = r"@"
t_COLON = r":"
t_DASH = r"-"

# Ignore spaces
t_ignore = " \t"


def t_STRING(t):
    r"\"([^\\\n]|(\\.))*?\""
    """
    Reconhece literais de string delimitados por aspas duplas.
    
    Suporta caracteres de escape e remove automaticamente as aspas 
    delimitadoras do valor do token. Não permite quebras de linha
    dentro de strings.

    Args:
        t: Token objeto do PLY contendo informações sobre o token encontrado.

    Returns:
        Token: Token processado com valor da string sem as aspas.

    Examples:
        >>> # Entrada: "Hello World"
        >>> # Saída: Token(type='STRING', value='Hello World')
    """
    t.value = t.value[1:-1]  # Remove quotes
    return t


def t_NUMBER(t):
    r"\d+"
    """
    Reconhece literais numéricos inteiros.
    
    Converte automaticamente a string de dígitos para um valor inteiro.
    Suporta apenas números inteiros positivos sem sinal.

    Args:
        t: Token objeto do PLY contendo a string de dígitos.

    Returns:
        Token: Token com valor convertido para inteiro.

    Examples:
        >>> # Entrada: "123"
        >>> # Saída: Token(type='NUMBER', value=123)
    """
    t.value = int(t.value)
    return t


def t_NEW_DATATYPE(t):
    r"[a-zA-Z][a-zA-Z]*DataType"
    """
    Reconhece novos tipos de dados definidos pelo usuário.
    
    Convenção para novos tipos: devem iniciar com letra, conter apenas 
    letras (sem números ou sublinhados) e terminar com a subcadeia "DataType".
    
    Args:
        t: Token objeto do PLY contendo o identificador do tipo.

    Returns:
        Token: Token com tipo NEW_DATATYPE ou palavra reservada se aplicável.

    Examples:
        Exemplos de tipos válidos:
        - CPFDataType
        - PhoneNumberDataType  
        - EmailDataType
        
        >>> # Entrada: "CPFDataType"
        >>> # Saída: Token(type='NEW_DATATYPE', value='CPFDataType')
    """
    t.type = reserved.get(t.value, "NEW_DATATYPE")
    return t


def t_CLASS_NAME(t):
    r"[A-Z][a-zA-Z_]*"
    """
    Reconhece nomes de classes seguindo convenções de nomenclatura.
    
    Convenção para nomes de classes: devem iniciar com letra maiúscula, 
    seguida por qualquer combinação de letras maiúsculas/minúsculas, 
    podendo conter sublinhados, mas sem números.
    
    Args:
        t: Token objeto do PLY contendo o nome da classe.

    Returns:
        Token: Token com tipo CLASS_NAME ou palavra reservada se for estereótipo.

    Examples:
        Exemplos de nomes válidos:
        - Person
        - Child  
        - Church
        - University
        - Second_Baptist_Church
        
        >>> # Entrada: "Person"
        >>> # Saída: Token(type='CLASS_NAME', value='Person')
    """
    t.type = reserved.get(t.value, "CLASS_NAME")
    return t


def t_RELATION_NAME(t):
    r"[a-z][a-zA-Z_]*"
    """
    Reconhece nomes de relações seguindo convenções de nomenclatura.
    
    Convenção para nomes de relações: devem começar com letra minúscula, 
    seguida por qualquer combinação de letras maiúsculas/minúsculas, 
    podendo conter sublinhados, mas sem números.
    
    Args:
        t: Token objeto do PLY contendo o nome da relação.

    Returns:
        Token: Token com tipo RELATION_NAME ou palavra reservada se for 
            estereótipo ou palavra-chave da linguagem.

    Examples:
        Exemplos de nomes válidos:
        - has
        - hasParent
        - has_parent  
        - isPartOf
        - is_part_of
        
        >>> # Entrada: "hasParent"
        >>> # Saída: Token(type='RELATION_NAME', value='hasParent')
    """
    t.type = reserved.get(t.value, "RELATION_NAME")  # Check for reserved words
    return t


def t_INSTANCE_NAME(t):
    r"[a-zA-Z_]+[0-9]+"
    """
    Reconhece nomes de instâncias seguindo convenções de nomenclatura.
    
    Convenção para nomes de instâncias: devem iniciar com qualquer letra
    (maiúscula ou minúscula), podem conter sublinhados, e devem terminar 
    com pelo menos um dígito numérico.
    
    Args:
        t: Token objeto do PLY contendo o nome da instância.

    Returns:
        Token: Token com tipo INSTANCE_NAME.

    Examples:
        Exemplos de nomes válidos:
        - Planeta1
        - Planeta2
        - pizza03
        - pizza123
        - My_Object_42
        
        >>> # Entrada: "Planeta1"
        >>> # Saída: Token(type='INSTANCE_NAME', value='Planeta1')
    """
    return t


def t_IDENTIFIER(t):
    r"[a-zA-Z_][a-zA-Z0-9_]*"
    """
    Reconhece identificadores gerais que não se encaixam em outras categorias.
    
    Função de fallback para identificadores que seguem padrão alfanumérico
    básico mas não se enquadram nas convenções específicas de classe, 
    relação ou instância.
    
    Args:
        t: Token objeto do PLY contendo o identificador.

    Returns:
        Token: Token com tipo IDENTIFIER ou palavra reservada se aplicável.

    Examples:
        >>> # Entrada: "myVariable"
        >>> # Saída: Token(type='IDENTIFIER', value='myVariable')
        >>> # Entrada: "package" (palavra reservada)
        >>> # Saída: Token(type='KEYWORD_PACKAGE', value='package')
    """
    t.type = reserved.get(t.value, "IDENTIFIER")
    return t


def t_COMMENT(t):
    r"//.*"
    """
    Reconhece e ignora comentários de linha única.
    
    Suporta comentários no estilo C++ que iniciam com // e se estendem
    até o final da linha. Os comentários são ignorados durante a tokenização.
    
    Args:
        t: Token objeto do PLY contendo o comentário.

    Returns:
        None: Comentários são descartados (não retornam token).

    Examples:
        >>> # Entrada: "// Este é um comentário"
        >>> # Saída: (ignorado, nenhum token gerado)
    
    Note:
        Atualmente suporta apenas comentários de linha (//). 
        Comentários de bloco (/* */) estão comentados para implementação futura.
    """
    # r'//.*|/\*[\s\S]*?\*/'
    pass  # Ignore comments


def t_newline(t):
    r"\n+"
    """
    Processa quebras de linha e atualiza contador de linhas.
    
    Reconhece uma ou mais quebras de linha consecutivas e atualiza
    o contador de linhas do lexer para rastreamento de posição no código.
    
    Args:
        t: Token objeto do PLY contendo as quebras de linha.

    Returns:
        None: Quebras de linha não geram tokens, apenas atualizam contador.

    Note:
        Esta função é crucial para relatórios de erro precisos, 
        pois mantém o número da linha atual durante a análise.
    """
    t.lexer.lineno += len(t.value)


def t_error(t):
    """
    Manipula caracteres não reconhecidos durante a análise léxica.

    Quando o lexer encontra um caractere que não corresponde a nenhuma
    regra de token, esta função é chamada para registrar o erro e
    pular o caractere inválido.

    Args:
        t: Token objeto do PLY contendo o caractere inválido e posição.

    Note:
        Erros são armazenados na lista global lexer_errors para
        posterior recuperação via get_errors().
    """
    error_msg = f"Illegal character '{t.value[0]}' at line {t.lineno}"
    lexer_errors.append(error_msg)
    t.lexer.skip(1)


def get_errors():
    """
    Retorna a lista de erros léxicos encontrados durante a análise.

    Fornece acesso aos erros coletados durante a tokenização,
    útil para relatórios de erro e diagnósticos.

    Returns:
        list[str]: Lista contendo mensagens de erro formatadas,
            cada uma indicando caractere inválido e número da linha.

    Examples:
        >>> lexer = build_lexer()
        >>> lexer.input("invalid@char")
        >>> errors = get_errors()
        >>> print(errors)
        ["Illegal character '@' at line 1"]
    """
    return lexer_errors


def build_lexer():
    """
    Constrói e retorna uma nova instância do analisador léxico.

    Cria um novo lexer usando PLY, resetando a lista de erros para
    garantir estado limpo a cada nova análise. Esta função deve ser
    chamada para obter uma instância fresca do lexer.

    Returns:
        LexToken: Instância do lexer PLY configurado com todas as regras
            de token definidas neste módulo.

    Examples:
        >>> lexer = build_lexer()
        >>> lexer.input("kind Person")
        >>> token = lexer.token()
        >>> print(f"{token.type}: {token.value}")
        CLASS_KIND: kind

    Note:
        Reseta automaticamente a lista global de erros (lexer_errors)
        para garantir que erros de análises anteriores não persistam.
    """
    global lexer_errors
    lexer_errors = []
    return lex.lex()


# Build lexer
lexer = build_lexer()
