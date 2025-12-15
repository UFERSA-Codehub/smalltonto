import ply.lex as lex

try:
    from .TokenType import get_token_category, literals, reserved, tokens
except ImportError:
    from TokenType import get_token_category, literals, reserved, tokens

class MyLexer:
    """
    Analisador léxico para a linguagem personalizada.
    """

    #Token list (necessário para o PLY)
    tokens = tokens
    literals = literals

    def __init__(self):
        """Inicializa o analisador léxico."""
        
        self.lexer = None               # Instância do lexer PLY
        self.errors = []                # Lista de erros encontrados
        self.token_count = 0            # Contador total de tokens
        self.category_counts = {}       # Contador de categorias de tokens

        self.filename = None            # Nome do arquivo sendo processado
        self.input_text = None          # Armazena o texto de entrada para referência futura

    def build(self, **kwargs):
        """Constrói o analisador léxico."""
        self.lexer = lex.lex(module=self, **kwargs)         # Cria o lexer PLY
        return self.lexer                                   # Retorna a instância do lexer

    def reset(self):
        """Reseta o estado do analisador léxico."""
        self.errors = []                # Limpa a lista de erros
        self.token_count = 0            # Limpa o contador total de tokens
        self.category_counts = {}       # Limpa o contador de categorias de tokens
        if self.lexer:
            self.lexer.lineno = 1       # Reseta o número da linha para 1

    def input(self, data, filename=None):
        """Fornece dados de entrada para o analisador léxico."""
        self.reset()                    # Automaticamente reseta ao receber nova entrada
        self.filename = filename        # Nome do arquivo sendo processado
        self.input_text = data          # Armazena o texto de entrada
        self.lexer.input(data)          # Fornece os dados ao lexer PLY

    def token(self):
        """Retorna o próximo token do fluxo de entrada."""
        tok = self.lexer.token()
        if tok:
            self.token_count += 1
            category = get_token_category(tok.type)
            self.category_counts[category] = self.category_counts.get(category, 0) + 1
        return tok

    def tokenize(self, data):
        """Tokeniza os dados de entrada e retorna uma lista de tokens."""
        self.input(data)
        tokens = []
        while True:
            tok = self.token()
            if not tok:
                break
            tokens.append(tok)
        return tokens

    def __iter__(self):
        """Permite iteração sobre os tokens."""
        return self

    def __next__(self):
        """Retorna o próximo token para o protocolo de iteração."""
        tok = self.token()
        if tok is None:
            raise StopIteration
        return tok

    def find_column(self, token):
        """Retorna a coluna do token na linha."""
        pos = token.lexpos if hasattr(token, 'lexpos') else token
        line_start = self.input_text.rfind('\n', 0, pos) + 1
        return (pos - line_start) + 1

    def get_errors(self):
        """Retorna a lista de erros encontrados."""
        return self.errors

    def get_error_context(self, token_or_pos):
        """Retorna o contexto do erro para um token específico."""
        pos = token_or_pos.lexpos if hasattr(token_or_pos, 'lexpos') else token_or_pos
        line_start = self.input_text.rfind('\n', 0, pos) + 1
        line_end = self.input_text.find('\n', pos)

        if line_end == -1:
            line_end = len(self.input_text)
        return self.input_text[line_start:line_end]

    def format_error_pointer(self, token_or_pos):
        column = self.find_column(token_or_pos)
        return ' ' * (column -1) + '^'


    #Regras de tokens (o parâmetro 'self' é necessário para todos)

    # Expressões regulares de tokens (mais longas primeiro)
    t_ASSOCIATIONLR = r"<-->"
    t_ASSOCIATIONL  = r"<--"
    t_ASSOCIATIONR  = r"-->"
    t_ASSOCIATION   = r"--"
    t_AGGREGATIONL  = r"<>--"
    t_AGGREGATIONR  = r"--<>"
    t_COMPOSITIONL  = r"<o>--"
    t_COMPOSITIONR  = r"--<o>"
    t_CARDINALITY   = r"\.\."
    t_ignore = " \t"

    def t_STRING(self, t):
        r'"([^\\\n]|(\\.))*?"'
        t.value = t.value[1:-1]  # Remove as aspas
        return t

    def t_NUMBER(self, t):
        r"\d+"
        t.value = int(t.value)
        return t
    '''
    Novos tipos: iniciando com letra, sem números, sem sublinhado e terminando com a subcadeia
    “DataType”. Exemplo: CPFDataType, PhoneNumberDataType.
    '''
    def t_NEW_DATATYPE(self, t):
        r"[a-zA-Z][a-zA-Z]*DataType"
        t.type = reserved.get(t.value, "NEW_DATATYPE")
        t.category = get_token_category(t.type)
        return t

    def t_FUNCTIONAL_COMPLEXES(self, t):
        r"functional-complexes"
        t.type = reserved.get(t.value, "IDENTIFIER")
        t.category = get_token_category(t.type)
        return t
    
    def t_INTRINSIC_MODES(self, t):
        r"intrinsic-modes"
        t.type = reserved.get(t.value, "IDENTIFIER")
        t.category = get_token_category(t.type)
        return t
    
    def t_EXTRINSIC_MODES(self, t):
        r"extrinsic-modes"
        t.type = reserved.get(t.value, "IDENTIFIER")
        t.category = get_token_category(t.type)
        return t
    
    def t_ABSTRACT_INDIVIDUALS(self, t):
        r"abstract-individuals"
        t.type = reserved.get(t.value, "IDENTIFIER")
        t.category = get_token_category(t.type)
        return t

    '''
    Convenção para nomes de instâncias: iniciando com letra minúscula, podendo ter sublinhado
    como subcadeia própria e terminando com algum número inteiro. Exemplos: planeta1, planeta2,
    pizza03, pizza123. Nomes de classe como SubclassName1 NÃO são instâncias (começam com maiúscula).
    '''
    def t_INSTANCE_NAME(self, t):
        r"[a-z][a-zA-Z_]*[0-9]+"
        t.type = "INSTANCE_NAME"  # Nomes de instâncias nunca são palavras reservadas (terminam com números)
        t.category = get_token_category("INSTANCE_NAME")
        return t

    '''
    Convenção para nomes de classes: iniciando com letra maiúscula, seguida por qualquer
    combinação de letras/números, ou tendo sublinhado como subcadeia própria. Exemplos:
    Person, Child, Church, University, Second_Baptist_Church, SubclassName1.
    '''
    def t_CLASS_NAME(self, t):
        r"[A-Z][a-zA-Z0-9_]*"
        t.type = reserved.get(t.value, "CLASS_NAME")
        t.category = get_token_category(t.type)
        return t

    '''
    Convenção para nomes de relações: começando com letra minúscula, seguida por qualquer
    combinação de letras, ou tendo sublinhado como subcadeia própria, sem números. Exemplos:
    has, hasParent, has_parent, isPartOf, is_part_of
    '''
    def t_RELATION_NAME(self, t):
        r"[a-z][a-zA-Z_]*"
        t.type = reserved.get(t.value, "RELATION_NAME")
        t.category = get_token_category(t.type)
        return t

    def t_IDENTIFIER(self, t):
        r"[a-zA-Z_][a-zA-Z0-9_]*"
        t.type = reserved.get(t.value, "IDENTIFIER")
        t.category = get_token_category(t.type)
        return t

    def t_COMMENT(self, t):
        r"//.*"
        pass  # Ignora comentários

    def t_newline(self, t):
        r"\n+"
        t.lexer.lineno += len(t.value)

    def t_error(self, t):

        column = self.find_column(t)
        line_text = self.get_error_context(t)
        pointer = self.format_error_pointer(t)

        error_info = {
            'type': 'IllegalCharacter',
            'character': t.value[0],
            'line': t.lineno,
            'column': column,
            'line_text': line_text,
            'pointer': pointer,
            'filename': self.filename,
            'message': f"Illegal character '{t.value[0]}' at line {t.lineno}, column {column}"
        }
        #error_msg = f"Illegal character '{t.value[0]}' at line {t.lineno}"
        self.errors.append(error_info)
        t.lexer.skip(1)

    
