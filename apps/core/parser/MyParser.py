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

    def build(self, **kwargs):
        """Constrói o analisador sintático."""
        self.parser = yacc.yacc(
            module=self, 
            outputdir='parser/',
            **kwargs)      # Cria o parser PLY
        return self.parser                                  # Retorna a instância do parser

    def parse(self, data, filename=None):
        """Analisa os dados de entrada e retorna a árvore sintática."""
        self.lexer.input(data, filename)                    # Fornece os dados ao lexer
        result = self.parser.parse(lexer=self.lexer.lexer)  # Executa a análise sintática
        return result                                       # Retorna a árvore sintática

    def p_tonto_file(self, p):
        '''tonto_file : import_section package_declaration'''
        p[0] = {
            'node_type': 'tonto_file',
            'imports': p[1],        # Lista de imports
            'package': p[2]       # Declaração do package
            #'content': p[3]         # Conteúdo do package
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

    def p_empty(self, p):
        '''empty :'''
        p[0] = None

    def p_error(self, p):
        if p:
            self.errors.append(f"Syntax error at token '{p.value}' (type: {p.type}) on line {p.lineno}")
        else:
            self.errors.append("Syntax error at EOF")