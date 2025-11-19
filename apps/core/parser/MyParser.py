import ply.yacc as yacc

from lexer.TokenType import tokens

class MyParser:
    """
    Analisador sintático para a linguagem personalizada.
    """

    tokens = tokens

    def __init__(self, lexer):
        """Inicializa o analisador sintático."""
        self.lexer = lexer                                  # Instância do analisador léxico
        self.parser = None                                  # Instância do parser PLY
        self.errors = []                                    # Lista de erros encontrados
        self.filename = None                                # Nome do arquivo sendo processado

    def build(self, **kwargs):
        """Constrói o analisador sintático."""
        self.parser = yacc.yacc(
            module=self, 
            outputdir='parser/',
            **kwargs)      # Cria o parser PLY
        return self.parser                                  # Retorna a instância do parser

    def parse(self, data, filename=None):
        """Analisa os dados de entrada e retorna a árvore sintática."""
        self.filename = filename                            # Armazena o nome do arquivo
        self.lexer.input(data, filename)                    # Fornece os dados ao lexer
        result = self.parser.parse(lexer=self.lexer.lexer)  # Executa a análise sintática
        return result                                       # Retorna a árvore sintática

    def p_tonto_file(self, p):
        '''tonto_file : import_section package_declaration package_content'''
        p[0] = {
            'node_type': 'tonto_file',
            'imports': p[1],        # Lista de imports
            'package': p[2],        # Declaração do package
            'content': p[3]         # Conteúdo do package
        }

    def p_import_section(self, p):
        '''import_section : import_list
                          | empty'''
        if p[1] is None:            # Sem imports
            p[0] = []               
        else:                       # Lista de imports
            p[0] = p[1]          

    def p_import_list(self, p):
        '''import_list : import_list import_statement
                          | import_statement'''
        if len(p) == 3:             # Múltiplos imports
            p[0] = p[1] + [p[2]]    
        else:                       # Único import
            p[0] = [p[1]]

    def p_import_statement(self, p):
        '''import_statement : KEYWORD_IMPORT IDENTIFIER'''
        p[0] = {
            'node_type': 'import_statement',
            'module_name': p[2]
        }   

    def p_package_declaration(self, p):
        '''package_declaration : KEYWORD_PACKAGE IDENTIFIER'''
        p[0] = {
            'node_type': 'package_declaration',
            'package_name': p[2]
        }
    
    def p_package_content(self, p):
        '''package_content : definition_list
                           | empty'''
        if p[1] is None:            # Pacote vazio
            p[0] = []               
        else:                       # Lista de definições
            p[0] = p[1]

    def p_definition_list(self, p):
        '''definition_list : definition_list definition
                           | definition'''
        if len(p) == 3:             # Múltiplas definições
            p[0] = p[1] + [p[2]]    
        else:                       # Única definição
            p[0] = [p[1]]
            
    def p_definition(self, p):
        '''definition : class_definition'''
        p[0] = p[1]

    def p_class_definition(self, p):
        '''class_definition : CLASS_KIND IDENTIFIER '{' '}' '''
        p[0] = {
            'node_type': 'class_definition',
            'class_stereotype': 'kind',
            'class_name': p[2],
            'body': []  # Corpo vazio por enquanto
        }

    def p_empty(self, p):
        '''empty :'''
        p[0] = None

    def find_column(self, p, token_index):
        """Retorna a coluna do token na linha."""
        if not hasattr(p.slice[token_index], 'lexpos'):
            return 1
        pos = p.slice[token_index].lexpos
        line_start = self.lexer.input_text.rfind('\n', 0, pos) + 1
        return (pos - line_start) + 1

    def get_error_context(self, p, token_index):
        """Retorna o contexto do erro para um token específico."""
        if not hasattr(p.slice[token_index], 'lexpos'):
            return ""
        pos = p.slice[token_index].lexpos
        line_start = self.lexer.input_text.rfind('\n', 0, pos) + 1
        line_end = self.lexer.input_text.find('\n', pos)
        
        if line_end == -1:
            line_end = len(self.lexer.input_text)
        return self.lexer.input_text[line_start:line_end]

    def format_error_pointer(self, p, token_index):
        """Cria o ponteiro visual para o erro."""
        column = self.find_column(p, token_index)
        return ' ' * (column - 1) + '^'

    def p_error(self, p):
        """Trata erros de sintaxe durante a análise."""
        if p:
            # Obter tokens esperados
            state = self.parser.state
            expected = []

            if hasattr(self.parser, 'action') and state in self.parser.action:
                expected = list(self.parser.action[state].keys())
                # Filtrar tokens especiais
                expected = [tok for tok in expected if tok not in ('$end', 'error')]

            # Construir mensagem de erro
            column = self.lexer.find_column(p)
            line_text = self.lexer.get_error_context(p)
            pointer = self.lexer.format_error_pointer(p)
            
            error_message = f"Unexpected token '{p.value}' (type: {p.type})"
            if expected:
                expected_str = ', '.join(expected)
                error_message += f". Expected one of: {expected_str}"
            
            error_info = {
                'type': 'SyntaxError',
                'token': p.value,
                'token_type': p.type,
                'line': p.lineno,
                'column': column,
                'line_text': line_text,
                'pointer': pointer,
                'filename': self.filename or '<unknown>',
                'message': error_message,
                'expected': expected
            }
            
            self.errors.append(error_info)
        else:
            # Erro no final do arquivo
            error_info = {
                'type': 'SyntaxError',
                'token': 'EOF',
                'token_type': 'EOF',
                'line': 'EOF',
                'column': 0,
                'line_text': '',
                'pointer': '',
                'filename': self.filename or '<unknown>',
                'message': 'Unexpected end of file',
                'expected': []
            }
            self.errors.append(error_info)