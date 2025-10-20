import ply.lex as lex

from TokenType import tokens, reserved

# Globals
lexer_errors = []


# Token definitions
t_LBRACE       = r'\{'
t_RBRACE       = r'\}'
t_LPAREN       = r'\('
t_RPAREN       = r'\)'
t_LBRACKET     = r'\['
t_RBRACKET     = r'\]'
t_CARDINALITY  = r'\.\.'
t_COMPOSITIONL = r'<>\-\-'
t_COMPOSITIONR = r'\-\-<>'
t_ASTERISK     = r'\*'
t_ANNOTATION   = r'@'
t_COLON        = r':'

# Ignore spaces
t_ignore = ' \t'

def t_STRING(t):
    r'\"([^\\\n]|(\\.))*?\"'
    t.value = t.value[1:-1]  # Remove quotes
    return t

# Number token with conversion
def t_NUMBER(t):
    r'\d+'
    t.value = int(t.value)
    return t

'''
 Convenção para novos tipos: iniciando com letra, sem números, sem sublinhado e 
 terminando com a subcadeia “DataType”. 
 Exemplo: 
 CPFDataType, PhoneNumberDataType.
 '''
def t_NEW_DATATYPE(t):
    r'[a-zA-Z][a-zA-Z]*DataType'
    t.type = reserved.get(t.value, 'NEW_DATATYPE')
    return t


'''
Convenção para nomes de classes: iniciando com letra maiúscula, seguida por qualquer
combinação de letras, ou tendo sublinhado como subcadeia própria, sem números. 
Exemplos:
Person, Child, Church, University, Second_Baptist_Church. 
'''
def t_CLASS_NAME(t):
    r'[A-Z][a-zA-Z_]*'
    t.type = reserved.get(t.value, 'CLASS_NAME')
    return t

'''
Convenção para nomes de relações: começando com letra minúscula, seguida por qualquer
combinação de letras, ou tendo sublinhado como subcadeia própria, sem números. 
Exemplos: 
has, hasParent, has_parent, isPartOf, is_part_of.
'''
def t_RELATION_NAME(t):
    r'[a-z][a-zA-Z_]*'
    t.type = reserved.get(t.value, 'RELATION_NAME')  # Check for reserved words
    return t

'''
Convenção para nomes de instâncias: iniciando com qualquer letra, podendo ter o 
sublinhado como subcadeia própria e terminando com algum número inteiro. 
Exemplos: 
Planeta1, Planeta2,pizza03, pizza123.
'''
def t_INSTANCE_NAME(t):
    r'[a-zA-Z_]+[0-9]+'
    return t


def t_IDENTIFIER(t):
    r'[a-zA-Z_][a-zA-Z0-9_]*'
    t.type = reserved.get(t.value, 'IDENTIFIER')
    return t

def t_COMMENT(t):
    r'//.*'
    #r'//.*|/\*[\s\S]*?\*/'
    pass  # Ignore comments

def t_newline(t):
    r'\n+'
    t.lexer.lineno += len(t.value)

# Error handling
def t_error(t):
    
    error_msg = f"Illegal character '{t.value[0]}' at line {t.lineno}"
    lexer_errors.append(error_msg)
    t.lexer.skip(1)

def get_errors():
    return lexer_errors

def build_lexer():
    global lexer_errors
    lexer_errors = []
    return lex.lex()

# Build lexer
lexer = build_lexer()
