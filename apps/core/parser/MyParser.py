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

# ======================================= REGRAS DE PRODUÇÃO ======================================= #


# ======================================= TONTO FILE ======================================= #
# Arquivo Tonto completo: seção de imports, declaração do package e conteúdo do package

    def p_tonto_file(self, p):
        '''tonto_file : import_section package_declaration package_content'''
        p[0] = {
            'node_type': 'tonto_file',
            'imports': p[1],        # Lista de imports
            'package': p[2],        # Declaração do package
            'content': p[3]         # Conteúdo do package
        }

# ======================================= IMPORT SECTION ======================================= #
# Seção de imports (opcional)

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

# ======================================= PACKAGE DECLARATION & CONTENT ======================================= #
# Declaração do package e seu conteúdo

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

# ======================================= DEFINITIONS ======================================= #
# Definitions podem ser classes, datatypes ou enums

    def p_definition_list(self, p):
        '''definition_list : definition_list definition
                           | definition'''
        if len(p) == 3:             # Múltiplas definições
            p[0] = p[1] + [p[2]]    
        else:                       # Única definição
            p[0] = [p[1]]
            
    def p_definition(self, p):
        '''definition : class_definition
                      | datatype_definition
                      | enum_definition
                      | genset_definition
        '''
        p[0] = p[1]

# ======================================= CLASS DEFINITION ======================================= #
# Definição de classes com estereótipos, especializações e corpo

    def p_class_definition(self, p):
        '''class_definition : class_stereotype IDENTIFIER
                            | class_stereotype IDENTIFIER specialization
                            | class_stereotype IDENTIFIER '{' '}' 
                            | class_stereotype IDENTIFIER '{' class_body '}'
                            | class_stereotype IDENTIFIER specialization '{' '}' 
                            | class_stereotype IDENTIFIER specialization '{' class_body '}' '''
                            
        stereotype = p[1]
        name = p[2]
        body = None
        specialization = None

        if len(p) == 3:                             # stereotype IDENTIFIER
            pass                                    
        elif len(p) == 4:                           # stereotype IDENTIFIER specialization
            specialization = p[3]                   
        elif len(p) == 5:                           # stereotype IDENTIFIER '{' '}'
            body = []
        elif len(p) == 6:                           # stereotype IDENTIFIER '{' class_body '}'
            if p[3] == '{':
                body = p[4]
            else:                                   # stereotype IDENTIFIER specialization '{' '}'
                specialization = p[3]
                body = []
        elif len(p) == 7:                           # stereotype IDENTIFIER specialization '{' class_body '}'
            specialization = p[3]
            body = p[5]

        p[0] = {
            'node_type': 'class_definition',
            'class_stereotype': stereotype,
            'class_name': name,
            'specialization': specialization,
            'body': body
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

    def p_class_body(self, p):
        '''class_body : class_body_item
                      | class_body class_body_item'''

        if len(p) == 2:                     # Único item no corpo da classe
            p[0] = [p[1]]
        else:                               # Múltiplos itens no corpo da classe
            p[0] = p[1] + [p[2]]

    def p_class_body_item(self, p):
        '''class_body_item : attribute'''
        p[0] = p[1]

# ======================================= ATTRIBUTE DEFINITION ======================================= #
# Definição de atributos com tipo, cardinalidade e meta-atributos

    def p_attribute(self, p):
        '''attribute : IDENTIFIER ':' type_reference
                | IDENTIFIER ':' type_reference cardinality
                | IDENTIFIER ':' type_reference meta_attributes
                | IDENTIFIER ':' type_reference cardinality meta_attributes'''
        
        attr_name = p[1]
        attr_type = p[3]
        cardinality = None
        meta_attributes = None

        if len(p) == 4:                                                             # IDENTIFIER ':' IDENTIFIER
            pass                                                                    # name: type
        elif len(p) == 5:
            if isinstance(p[4], dict) and p[4].get('node_type') == 'cardinality':   # IDENTIFIER ':' IDENTIFIER cardinality
                cardinality = p[4]                                                  # name: type [1..*]
            else:                                                                   # IDENTIFIER ':' IDENTIFIER meta_attributes
                meta_attributes = p[4]                                              # name: type {const}
        elif len(p) == 6:                                                           # IDENTIFIER ':' IDENTIFIER cardinality meta_attributes
            cardinality = p[4]                                                      # name: type [1..*] {const}
            meta_attributes = p[5]

        p[0] = {
            'node_type': 'attribute',
            'attribute_name': attr_name,
            'attribute_type': attr_type,
            'cardinality': cardinality,
            'meta_attributes': meta_attributes
        }


# ======================================= TYPE REFERENCE ======================================= #
# Referência de tipo para atributos

    def p_type_reference(self, p):
        '''type_reference : IDENTIFIER
                          | TYPE_STRING
                          | TYPE_NUMBER
                          | TYPE_BOOLEAN
                          | TYPE_DATE
                          | TYPE_TIME
                          | TYPE_DATETIME'''
        p[0] = p[1]

# ======================================= CARDINALITY DEFINITION ======================================= #
# Definição de cardinalidade para atributos

    def p_cardinality(self, p):
        '''cardinality : '[' cardinality_range ']'
                       | '[' cardinality_range CARDINALITY cardinality_range ']' '''

        if len(p) == 4:                            # [ 1 ] or [ * ]
            p[0] = {
                'node_type': 'cardinality',
                'min': p[2],
                'max': p[2]
            }
        else:                                       # [ 1 .. * ]
            p[0] = {
                'node_type': 'cardinality',
                'min': p[2],
                'max': p[4]
            }

    def p_cardinality_range(self, p):
        '''cardinality_range : NUMBER
                             | '*' '''
        p[0] = p[1]

# ======================================= META ATTRIBUTES ======================================= #
# Definição de meta-atributos para atributos

    def p_meta_attributes(self, p):
        '''meta_attributes : '{' meta_attribute_list '}' '''
        p[0] = {
            'node_type': 'meta_attributes',
            'attributes': p[2]
        }
    
    def p_meta_attribute_list(self, p):
        '''meta_attribute_list : meta_attribute
                               | meta_attribute_list ',' meta_attribute'''
        if len(p) == 2:                     # Único meta-atributo
            p[0] = [p[1]]
        else:                               # Múltiplos meta-atributos
            p[0] = p[1] + [p[3]]

    def p_meta_attribute(self, p):
        '''meta_attribute : META_ORDERED
                          | META_CONST
                          | META_DERIVED
                          | META_SUBSETS
                          | META_REDEFINES'''

        p[0] = p[1]

# ======================================= DATATYPE DEFINITION ======================================= #
# Definição de datatypes com especializações e corpo

    def p_datatype_definition(self, p):
        '''datatype_definition : KEYWORD_DATATYPE IDENTIFIER
                               | KEYWORD_DATATYPE IDENTIFIER specialization
                               | KEYWORD_DATATYPE IDENTIFIER '{' '}'
                               | KEYWORD_DATATYPE IDENTIFIER '{' datatype_body '}'
                               | KEYWORD_DATATYPE IDENTIFIER specialization '{' '}'
                               | KEYWORD_DATATYPE IDENTIFIER specialization '{' datatype_body '}' '''

        name = p[2]
        body = None
        specialization = None

        if len(p) == 3:                     # datatype Nome
            pass
        elif len(p) == 4:                   # datatype Nome specializes
            specialization = p[3]
        elif len(p) == 5:                   # datatype Nome { }
            body = []
        elif len(p) == 6:
            if p[3] == '{':                 # datatype Nome { corpo }
                body = p[4]
            else:                          # datatype Nome specializes { }
                specialization = p[3]
                body = []
        elif len(p) == 7:                   # datatype Nome specializes { corpo }
            specialization = p[3]
            body = p[5]

        p[0] = {
            'node_type': 'datatype_definition',
            'datatype_name': name,
            'specialization': specialization,
            'body': body
        }

    def p_datatype_body(self, p):
        '''datatype_body : attribute
                         | datatype_body attribute'''

        if len(p) == 2:                     # Único atributo do datatype
            p[0] = [p[1]]
        else:                               # Múltiplos atributos do datatype
            p[0] = p[1] + [p[2]]

# ======================================= ENUM DEFINITION ======================================= #
# Definição de enums com especializações e valores

    def p_enum_definition(self, p):
        '''enum_definition : KEYWORD_ENUM IDENTIFIER '{' enum_values '}'
                           | KEYWORD_ENUM IDENTIFIER specialization '{' enum_values '}' '''
        
        name = p[2]
        specialization = None
        values = None

        if len(p) == 6:                     # enum Nome { valores }
            values = p[4]
        elif len(p) == 7:                   # enum Nome specializes { valores }
            specialization = p[3]
            values = p[5]

        p[0] = {
            'node_type': 'enum_definition',
            'enum_name': name,
            'specialization': specialization,
            'values': values
        }

    def p_enum_values(self, p):
        '''enum_values : IDENTIFIER
                       | enum_values ',' IDENTIFIER'''
        if len(p) == 2:
            p[0] = [p[1]]                   # Único valor
        else:
            p[0] = p[1] + [p[3]]            # Múltiplos valores

# ======================================= GENSET DEFINITION ======================================= #
# Definição de gensets com blocos ou forma curta

    def p_genset_definition(self, p):
        '''genset_definition : genset_block
                             | genset_short '''

        p[0] = p[1]
    
    def p_genset_block(self, p):
        '''genset_block : genset_modifiers KEYWORD_GENSET IDENTIFIER '{' genset_body '}' '''

        modifiers = p[1]
        name = p[3]
        body = p[5]

        p[0] = {
            'node_type': 'genset_definition',
            'genset_name': name,
            'disjoint': modifiers['disjoint'],
            'complete': modifiers['complete'],
            'general': body['general'],
            'categorizer': body['categorizer'],
            'specifics': body['specifics']
        }

    def p_genset_short(self, p):
        '''genset_short : genset_modifiers KEYWORD_GENSET IDENTIFIER KEYWORD_WHERE identifier_list KEYWORD_SPECIALIZES IDENTIFIER'''

        modifiers = p[1]
        name = p[3]
        specifics = p[5]
        general = p[7]

        p[0] = {
            'node_type': 'genset_definition',
            'genset_name': name,
            'disjoint': modifiers['disjoint'],
            'complete': modifiers['complete'],
            'general': general,
            'categorizer': None,
            'specifics': specifics
        }

    def p_genset_modifiers(self, p):
        ''' genset_modifiers : KEYWORD_DISJOINT KEYWORD_COMPLETE
                            | KEYWORD_COMPLETE KEYWORD_DISJOINT
                            | KEYWORD_DISJOINT
                            | KEYWORD_COMPLETE
                            | empty '''

        if p[1] is None:               # Sem modificadores
            p[0] = {
                'disjoint': False,
                'complete': False
            }
        elif len(p) == 3:          # Ambos os modificadores // Não importa a ordem
            p[0] = {
                'disjoint': True,
                'complete': True
            }
        
        elif p[1] == 'disjoint':      # Apenas disjoint
            p[0] = {
                'disjoint': True,
                'complete': False
            }

        elif p[1] == 'complete':      # Apenas complete
            p[0] = {
                'disjoint': False,
                'complete': True
            }
    
    def p_genset_body(self, p):
        '''genset_body : KEYWORD_GENERAL IDENTIFIER KEYWORD_SPECIFICS identifier_list
                       | KEYWORD_GENERAL IDENTIFIER KEYWORD_CATEGORIZER IDENTIFIER KEYWORD_SPECIFICS identifier_list'''

        if len(p) == 5:                    # Sem categorizer
            p[0] = {
                'general': p[2],
                'categorizer': None,
                'specifics': p[4]
            }
        else:                               # Com categorizer
            p[0] = {
                'general': p[2],
                'categorizer': p[4],
                'specifics': p[6]
            }
    

# ======================================= GENERIC RULES ======================================= #

    def p_empty(self, p):
        '''empty :'''
        p[0] = None

    def p_specialization(self, p):
        '''specialization : KEYWORD_SPECIALIZES identifier_list'''
        p[0] = {
            'node_type': 'specialization',
            'parents': p[2]
        }

    def p_identifier_list(self, p):
        '''identifier_list : IDENTIFIER
                           | identifier_list ',' IDENTIFIER'''
        if len(p) == 2:
            p[0] = [p[1]]                   # Único identificador
        else:
            p[0] = p[1] + [p[3]]            # Múltiplos identificadores


# ======================================= ERROR HANDLING ======================================= #

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