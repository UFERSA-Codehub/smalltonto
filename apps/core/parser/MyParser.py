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
        '''definition : class_definition
                        | genset_definition'''
        p[0] = p[1]

    def p_class_definition(self, p):
        '''class_definition : class_stereotype IDENTIFIER
                            | class_stereotype IDENTIFIER '{' '}' '''

        #TODO tratar caso de uso com functional-complexes
        #ex: phase Adulto of functional-complexes specializes Paciente

        if len(p) == 3:
            p[0] = {
                'node_type': 'class_definition',
                'class_stereotype': p[1],
                'class_name': p[2],
                'body': None
            }
        else:
            p[0] = {
                'node_type': 'class_definition',
                'class_stereotype': p[1],
                'class_name': p[2],
                'body': []
            }

    def p_class_stereotype(self, p):
        '''class_stereotype : CLASS_EVENT
                            | CLASS_SITUATION
                            | CLASS_PROCESS
                            | CLASS_CATEGORY
                            | CLASS_MIXIN
                            | CLASS_PHASEMIXIN
                            | CLASS_ROLEMIXIN
                            | CLASS_HISTORICALROLEMIXIN
                            | CLASS_KIND
                            | CLASS_COLLECTIVE
                            | CLASS_QUANTITY
                            | CLASS_QUALITY
                            | CLASS_MODE
                            | CLASS_INTRISICMODE
                            | CLASS_EXTRINSICMODE
                            | CLASS_SUBKIND
                            | CLASS_PHASE
                            | CLASS_ROLE
                            | CLASS_HISTORICALROLE
                            | KEYWORD_RELATOR'''
        p[0] = p[1]

    #def p_specialization(self, p):

    def p_identifier_list(self, p):
        '''identifier_list : identifier_list ',' IDENTIFIER
                           | IDENTIFIER'''
        if len(p) == 4:  # Lista existente + vírgula + novo ID
            p[0] = p[1] + [p[3]]
        else:            # Primeiro ID
            p[0] = [p[1]]

    def p_genset_definition(self, p):
        '''genset_definition : genset_properties KEYWORD_GENSET IDENTIFIER '{' genset_body '}' '''
        p[0] = {
            'node_type': 'genset_definition',
            'properties': p[1],     # disjoint, complete, etc.
            'genset_name': p[3],
            'general': p[5]['general'],
            'specifics': p[5]['specifics']
        }

    def p_genset_properties(self, p):
        '''genset_properties : KEYWORD_DISJOINT KEYWORD_COMPLETE
                             | KEYWORD_COMPLETE KEYWORD_DISJOINT
                             | KEYWORD_DISJOINT
                             | KEYWORD_COMPLETE
                             | empty'''
        # Normaliza para uma lista de propriedades
        if len(p) == 3:
            p[0] = [p[1], p[2]]
        elif len(p) == 2 and p[1] is not None:
            p[0] = [p[1]]
        else:
            p[0] = []

    def p_genset_body(self, p):
        '''genset_body : general_clause specifics_clause'''
        p[0] = {
            'general': p[1],
            'specifics': p[2]
        }

    def p_general_clause(self, p):
        '''general_clause : KEYWORD_GENERAL IDENTIFIER'''
        p[0] = p[2] # Retorna apenas o nome da classe geral

    def p_specifics_clause(self, p):
        '''specifics_clause : KEYWORD_SPECIFICS identifier_list'''
        p[0] = p[2] # Retorna a lista de identificadores

    #TODO regra para identificar keyword WHERE


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