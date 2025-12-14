'''
Primeira coisa: Tabela de símbolos.

Para a tabela de símbolos, precisamos:
Classes, / nome, esteriotipo, especialização, corpo (atributos, relações)
Relações, / nome, esteriotipo, origem, destino, cardinalidades
Gensets, / nome, disjoint, complete, general, specifics
Datatypes, / nome, especializações, atributos
Enums, / nome, valores
Tipos primitivos / nome (String, Number, Boolean, Date, Time, Datetime)

- Construção da tabela de símbolos;
- Detecção de Ontology Design Pattern;
- Validação semântica e sugestão de correções.

'''

try:
    from lexer.TokenType import data_types, class_stereotypes, relation_stereotypes
except ImportError:
    from .lexer.TokenType import data_types, class_stereotypes, relation_stereotypes

class SymbolTable:

    def __init__(self):
        '''Inicializa a tabela de símbolos vazia.'''
        self.classes = {}           # dict -> definição de classe 
        self.relations = []         # list -> definição de relação (interna + externa) [relações não possuem nome único]
        self.gensets = {}           # dict -> definição de genset
        self.datatypes = {}         # dict -> definição de datatype
        self.enums = {}             # dict -> definição de enum
        self.primitives = {}        # dict -> definição de tipos primitivos

        # Popular a tabela de símbolos com tipos primitivos
        self._init_primitives()

    def _init_primitives(self):
        for type_name in data_types.keys():
            self.primitives[type_name] = {
                'node_type': 'primitive_type',
                'name': type_name
            }

    # adicionar os dales na tabela de símbolos
    def add_class(self, class_def: dict) -> None:
        '''
        Adiciona uma definição de classe na tabela de símbolos.

        Args:
            class_def (dict): nó AST com node_type='class_definition'.
                Expected keys: class_name, class_stereotype, specialization, body
        '''
        name = class_def.get('class_name')
        if name:
            self.classes[name] = class_def

    def add_relation(self, relation_def: dict, source_class: str = None) -> None:
        '''
        Adiciona uma definição de relação na tabela de símbolos.

        Args:
            relation_def (dict): nó AST com node_type='internal_relation' | 'external_relation'.
                source_class: nome da classe de origem (para relações internas)
        '''

        if relation_def.get('node_type') == 'internal_relation' and source_class:
            relation_def = relation_def.copy() # evitar mutação do nó original
            relation_def['source_class'] = source_class
        
        self.relations.append(relation_def)

    def add_genset(self, genset_def: dict) -> None:
        '''
        Adiciona uma definição de genset na tabela de símbolos.

        Args:
            genset_def (dict): nó AST com node_type='genset_definition'.
                Expected keys: genset_name, disjoint, complete, general, specifics
        '''
        name = genset_def.get('genset_name')
        if name:
            self.gensets[name] = genset_def

    def add_datatype(self, datatype_def: dict) -> None:
        '''
        Adiciona uma definição de datatype na tabela de símbolos.

        Args:
            datatype_def (dict): nó AST com node_type='datatype_definition'.
                Expected keys: datatype_name, specializations, body
        '''
        name = datatype_def.get('datatype_name')
        if name:
            self.datatypes[name] = datatype_def

    def add_enum(self, enum_def: dict) -> None:
        '''
        Adiciona uma definição de enum na tabela de símbolos.

        Args:
            enum_def (dict): nó AST com node_type='enum_definition'.
                Expected keys: enum_name, values
        '''
        name = enum_def.get('enum_name')
        if name:
            self.enums[name] = enum_def

    #==================================

    def get_class(self, class_name: str) -> dict | None:
        return self.classes.get(class_name)

    def get_genset(self, genset_name: str) -> dict | None:
        return self.gensets.get(genset_name)

    def get_datatype(self, datatype_name: str) -> dict | None:
        return self.datatypes.get(datatype_name)

    def get_enum(self, enum_name: str) -> dict | None:
        return self.enums.get(enum_name)
    
    def resolve_type(self, type_name: str) -> dict | None:
        return (
            self.primitives.get(type_name) or
            self.classes.get(type_name) or
            self.datatypes.get(type_name) or
            self.enums.get(type_name)
        )

    def class_exists(self, class_name: str) -> bool:
        return class_name in self.classes

    def datatype_exists(self, datatype_name: str) -> bool:
        return self.resolve_type(datatype_name) is not None
    
    #==================================
    '''
    Para detecção de padrão, é necessário:
    Classes (classe geral, classes específicas);
    - Especializações de uma classe;
    - Classe na qual se especializa (pai);
    - Relações envolvendo uma classe;
    - Gensets envolvendo uma classe.
    '''


    
    def get_classes_by_stereotype(self, stereotype: str) -> list[dict]:
        '''
        Pega todas as classes com um determinado estereótipo.

        Args:
            stereotype (str): estereótipo da classe ('kind', 'role', 'phase', etc.)

        Returns:
            list[dict]: lista de dicionários de definições de classes com o estereótipo especificado
        '''
        return [
            class_def for class_def in self.classes.values()
            if class_def.get('class_stereotype') == stereotype
        ]

    def get_children_of(self, class_name: str, stereotype: str = None) -> list[dict]:
        '''
        Pega todas as classes que se especializam em uma determinada classe.

        Args:
            class_name (str): nome da classe pai
            stereotype (str, optional): estereótipo das classes filhas ('subkind', 'role'). Defaults to None.

        Returns:
            list[dict]: lista de dicionários de definições de classes que se especializam na classe especificada
        '''
        children = []
        for class_def in self.classes.values():
            specialization = class_def.get('specialization')
            if specialization:
                parents = specialization.get('parents', [])
                if class_name in parents:
                    if stereotype is None or class_def.get('class_stereotype') == stereotype:
                        children.append(class_def)
        return children

    def get_parents_of(self, class_name: str) -> list[dict]:
        '''
        Pega todas as classes das quais uma determinada classe se especializa.

        Args:
            class_name (str): nome da classe filha

        Returns:
            list[dict]: lista de dicionários de definições de classes que são pais da classe especificada
        '''
        class_def = self.get_class(class_name)
        if class_def and class_def.get('specialization'):
            return class_def['specialization'].get('parents', [])
        return []

    def get_gensets_for_general(self, class_name: str) -> list[dict]:
        '''
        Pega todos os gensets nos quais uma determinada classe é a geral.

        Args:
            class_name (str): nome da classe geral

        Returns:
            list[dict]: lista de dicionários de definições de gensets onde a classe especificada é a geral
        '''
        return [
            genset_def for genset_def in self.gensets.values()
            if genset_def.get('general') == class_name
        ]
        

    def get_genset_for_specific(self, class_name: str) -> list[dict]:
        '''
        Pega todos os gensets nos quais uma determinada classe é uma específica.

        Args:
            class_name (str): nome da classe específica

        Returns:
            list[dict]: lista de dicionários de definições de gensets onde a classe especificada é uma específica
        '''
        return [
            genset_def for genset_def in self.gensets.values()
            if class_name in genset_def.get('specifics', [])
        ]

    def get_relations_for_class(self, class_name: str) -> list[dict]:
        '''
        Pega todas as relações (internas e externas) envolvendo uma determinada classe.

        Args:
            class_name (str): nome da classe da busca
        
        Returns:
            list[dict]: lista de dicionários de definições de relações envolvendo a classe especificada
        '''
        result = []
        for rel in self.relations:
            if (rel.get('source_class') == class_name or
                rel.get('first_end') == class_name or
                rel.get('second_end') == class_name):
                result.append(rel)
        return result

    def get_internal_relations_of(self, class_name: str) -> list[dict]:
        '''
        Pega todas as relações internas envolvendo uma determinada classe.

        Args:
            class_name (str): nome da classe da busca
        
        Returns:
            list[dict]: lista de dicionários de definições de relações internas envolvendo a classe especificada
        '''
        return [
            rel for rel in self.relations
            if rel.get('node_type') == 'internal_relation' and
            rel.get('source_class') == class_name
        ]
    
    def get_relations_by_stereotype(self, stereotype: str) -> list[dict]:
        '''
        Pega todas as relações com um determinado estereótipo.

        Args:
            stereotype (str): estereótipo da relação ('mediation', 'characterization', etc.)

        Returns:
            list[dict]: lista de dicionários de definições de relações com o estereótipo especificado
        '''
        return [
            rel for rel in self.relations
            if rel.get('relation_stereotype') == stereotype
        ]

    #==================================

    def export(self) -> dict:
        '''
        Exporta a tabela de símbolos como um dicionário.

        Returns:
            dict: dicionário representando a tabela de símbolos
        '''
        return {
            'classes': list(self.classes.values()),
            'relations': self.relations,        # Já é uma lista
            'gensets': list(self.gensets.values()),
            'datatypes': list(self.datatypes.values()),
            'enums': list(self.enums.values()),
            # Primitivos não precisam ser exportados, pois já são conhecidos
        }

    def __repr__(self) -> str:
        return(
            f"<SymbolTable("
            f"classes={len(self.classes)}, "
            f"relations={len(self.relations)}, "
            f"gensets={len(self.gensets)}, "
            f"datatypes={len(self.datatypes)}, "
            f"enums={len(self.enums)})>"
        )

    def populate_from_ast(self, ast: dict) -> None:
        '''
        Popula a tabela de símbolos a partir da AST do modelo.

        Args:
            ast (dict): nó raiz da AST do modelo
        '''
        content = ast.get('content', [])

        for definition in content:
            node_type = definition.get('node_type')

            if node_type == 'class_definition':
                self.add_class(definition)

                class_name = definition.get('class_name')
                body = definition.get('body') or []
                for item in body:
                    if item.get('node_type') == 'internal_relation':
                        self.add_relation(item, source_class=class_name)

            elif node_type == 'datatype_definition':
                self.add_datatype(definition)

            elif node_type == 'enum_definition':
                self.add_enum(definition)

            elif node_type == 'genset_definition':
                self.add_genset(definition)

            elif node_type == 'external_relation':
                self.add_relation(definition)

#==================================

class ParserSemantic:
    '''
    Analisador semântico para modelos Smalltonto.
    '''

    def __init__(self):
        self.symbol_table: SymbolTable = None
        self.patterns: list[dict] = []
        self.incomplete_patterns: list[dict] = []
        self.errors: list[dict] = []
        self.warnings: list[dict] = []
        self.imports: list[str] = []
        self.filename: str = None
        self.package_name: str = None

    def analyze(self, ast: dict, filename: str = None) -> dict:
        '''
        Realiza a análise semântica do modelo da AST e detecta os padrões Odontology Design Pattern.
        
        Args:
            ast (dict): Passada pelo analisador sintático.
            filename (str, optional): nome do arquivo do modelo. Defaults to None.

        Returns:
            dict: resultado da análise semântica, padrões detectados, erros e avisos.
        '''
        self.patterns = []
        self.incomplete_patterns = []
        self.errors = []
        self.warnings = []
        self.filename = filename

        self.package_name = ast.get('package', {}).get('package_name')
        self.imports = [import_def.get('module_name') for import_def in ast.get('imports', [])]

        self.symbol_table = SymbolTable()
        self.symbol_table.populate_from_ast(ast)

        # Detecção de padrões ODP
        self._detect_subkind_patterns()
        self._detect_role_patterns()
        self._detect_phase_patterns()
        self._detect_relator_patterns()
        self._detect_mode_patterns()
        self._detect_rolemixin_patterns()

        #buildar o dale
        return self._build_result()
    

    def _build_result(self) -> dict:
        return {
            "ontology": None, # Placeholder para multiplos arquivos
            "files":[
                {
                    "filename": self.filename,
                    "package": self.package_name,
                    "imports": self.imports,
                    "symbols": self.symbol_table.export(),
                    "patterns": self.patterns,
                    "incomplete_patterns": self.incomplete_patterns,
                    "errors": self.errors,
                    "warnings": self.warnings
                }
            ],
            "summary": {
                "total_patterns": len(self.patterns) + len(self.incomplete_patterns),
                "complete_patterns": len(self.patterns),
                "incomplete_patterns": len(self.incomplete_patterns),
                "pattern_counts": self._count_patterns()
            }
        }
    
    def _count_patterns(self) -> dict:
        '''
        Conta os padrões detectados por tipo.
        
        :param self: Description
        :return: Description
        :rtype: dict
        '''
        counts = {
            "Subkind_Pattern": 0,
            "Role_Pattern": 0,
            "Phase_Pattern": 0,
            "Relator_Pattern": 0,
            "Mode_Pattern": 0,
            "RoleMixin_Pattern": 0
        }
        for pattern in self.patterns + self.incomplete_patterns:
            pattern_type = pattern.get('pattern_type')
            if pattern_type in counts:
                counts[pattern_type] += 1
        return counts
    
    def _find_matching_genset(self, general: str, specifics: list[str]) -> dict | None:
       '''
       Docstring for _find_matching_genset
       
       :param self: Description
       :param general: Description
       :type general: str
       :param specifics: Description
       :type specifics: list[str]
       :return: Description
       :rtype: dict | None
       '''
       
       for genset_def in self.symbol_table.gensets.values():
            if genset_def.get('general') != general:
                continue
            genset_specifics = set(genset_def.get('specifics', []))
            if genset_specifics == set(specifics):
                return genset_def
            
            if genset_specifics & set(specifics):
                return genset_def
            
       return None
    
    def _create_pattern(
            self,
            pattern_type: str,
            anchor_class: str,
            anchor_stereotype: str,
            elements: dict,
            constraints: dict,
            violations: list[str] = None,
            suggestions: list[dict] = None
    ) -> dict:
        '''
        Docstring for _create_pattern
        
        :param self: Description
        :param pattern_type: Description
        :type pattern_type: str
        :param anchor_class: Description
        :type anchor_class: str
        :param anchor_stereotype: Description
        :type anchor_stereotype: str
        :param elements: Description
        :type elements: dict
        :param constraints: Description
        :type constraints: dict
        :param violations: Description
        :type violations: list[str]
        :param suggestions: Description
        :type suggestions: list[dict]
        :return: Description
        :rtype: dict
        '''
        is_complete = not violations
        return {
            "pattern_type": pattern_type,
            "status": "complete" if is_complete else "incomplete",
            "anchor_class": anchor_class,
            "anchor_stereotype": anchor_stereotype,
            "elements": elements,
            "constraints": constraints,
            "violations": violations or [],
            "suggestions": suggestions or []
        }
    
    def _suggest_genset(
            self,
            general: str,
            specifics: list[str],
            disjoint: bool = False,
            complete: bool = False
    ) -> str:
        '''
        Docstring for _suggest_genset
        
        :param self: Description
        :param general: Description
        :type general: str
        :param specifics: Description
        :type specifics: list[str]
        :param disjoint: Description
        '''
        genset_name = f'{general}_Genset'

        keywords = []
        if disjoint:
            keywords.append('disjoint')
        if complete:
            keywords.append('complete')
        prefix = ' '.join(keywords) + ' ' if keywords else ''

        specifics_str = ', '.join(specifics)

        return(
            f'{prefix}genset {genset_name} {{\n'
            f'    general {general}\n'
            f'    specifics {specifics_str}\n'
            f'}}'
        )
    
    def _detect_subkind_patterns(self) -> None:
        '''
        Docstring for _detect_subkind_patterns
        
        :param self: Description
        '''
        kinds = self.symbol_table.get_classes_by_stereotype('kind')

        for kind_class in kinds:
            kind_name = kind_class.get('class_name')

            subkind_children = self.symbol_table.get_children_of(kind_name, stereotype='subkind')

            if not subkind_children:
                continue

            subkind_names = [child.get('class_name') for child in subkind_children]
            genset_def = self._find_matching_genset(kind_name, subkind_names)

            violations = []
            suggestions = []

            if genset_def is None:
                violations.append({
                    "code": "MISSING_GENSET",
                    "severity": "warning",
                    "message": f"Subkind_Pattern for '{kind_name}' should have a genset to formalize the generalization"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "insert_code",
                    "message": "Add a genset to formalize the subkind pattern",
                    "code_suggestion": self._suggest_genset(kind_name, subkind_names, disjoint=True
                    )
                })
            else:
                # Genset existe, verificar propriedades
                genset_specifics = set(genset_def.get('specifics', []))
                detected_specifics = set(subkind_names)

                # Checar se todas as específicas estão no genset
                missing_specifics = detected_specifics - genset_specifics
                if missing_specifics:
                    violations.append({
                        "code": "INCOMPLETE_GENSET_SPECIFICS",
                        "severity": "warning",
                        "message": f"Genset '{genset_def.get('genset_name')}' is missing subkinds: {', '.join(missing_specifics)}"
                    })
                    all_specifics = list(genset_specifics | detected_specifics)
                    suggestions.append({
                        "type": "coercion",
                        "action": "modify_code",
                        "message": f"Update genset to include all subkinds",
                        "code_suggestion": self._suggest_genset(
                            kind_name,
                            all_specifics,
                            disjoint=genset_def.get('disjoint', True),
                            complete=genset_def.get('complete', False)
                        )
                    })

                if not genset_def.get('disjoint'):
                    violations.append({
                        "code": "MISSING_DISJOINT",
                        "severity": "warning",
                        "message": f"Subkind_Pattern genset '{genset_def.get('genset_name')}' should have 'disjoint' keyword"
                    })
                    suggestions.append({
                        "type": "coercion",
                        "action": "add_keyword",
                        "message": "Add 'disjoint' keyword to genset",
                        "code_suggestion": f"disjoint genset {genset_def.get('genset_name')} {{ ... }}"
                    })

            # Construir o dicionário das propriedades do genset
            constraints = {
                "disjoint": genset_def.get('disjoint', False) if genset_def else False,
                "complete": genset_def.get('complete', False) if genset_def else False
            }

            # Construir o dicionário dos elementos do genset
            elements = {
                "general": kind_name,
                "specifics": subkind_names,
                "genset": genset_def.get('genset_name') if genset_def else None
            }

            # Criar o padrão e adicionar à lista apropriada
            pattern = self._create_pattern(
                pattern_type="Subkind_Pattern",
                anchor_class=kind_name,
                anchor_stereotype="kind",
                elements=elements,
                constraints=constraints,
                violations=violations,
                suggestions=suggestions
            )

            if violations:
                self.incomplete_patterns.append(pattern)
            else:
                self.patterns.append(pattern)

    def _detect_role_patterns(self) -> None:
        '''
        Docstring for _detect_role_patterns
        
        :param self: Description
        '''
        pass

    def _detect_phase_patterns(self) -> None:
        '''
        Docstring for _detect_phase_patterns
        
        :param self: Description
        '''
        pass

    def _detect_relator_patterns(self) -> None:
        '''
        Docstring for _detect_relator_patterns
        
        :param self: Description
        '''
        pass

    def _detect_mode_patterns(self) -> None:
        '''
        Docstring for _detect_mode_patterns
        
        :param self: Description
        '''
        pass

    def _detect_rolemixin_patterns(self) -> None:
        '''
        Docstring for _detect_rolemixin_patterns
        
        :param self: Description
        '''
        pass
        