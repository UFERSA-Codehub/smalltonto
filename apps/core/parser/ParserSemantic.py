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
    from lexer.TokenType import data_types, class_stereotypes, relation_stereotypes

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
        # Buscar todas as classes com estereótipo 'role'
        all_roles = self.symbol_table.get_classes_by_stereotype('role')
        
        # Agrupar roles por sua classe pai (general)
        roles_by_parent = {}
        roles_without_specialization = []
        role_bodies = {}  # Para armazenar informações do corpo de cada role
        
        for role_class in all_roles:
            role_name = role_class.get('class_name')
            parents = role_class.get('specialization', {}).get('parents', [])
            body = role_class.get('body')
            
            # Validação: role sem especialização é uma violação crítica
            if not parents:
                roles_without_specialization.append(role_name)
                continue
            
            # VALIDAÇÃO DE CORPO: Verificar se há chaves vazias {}
            if body is not None and len(body) == 0:
                self.warnings.append({
                    "code": "ROLE_WITH_EMPTY_BRACES",
                    "severity": "warning",
                    "message": f"Role '{role_name}' has empty braces. Consider removing them or adding content"
                })
            
            # Processar corpo da role (se houver)
            attributes = []
            internal_relations = []
            
            if body and len(body) > 0:
                for item in body:
                    node_type = item.get('node_type')
                    
                    if node_type == 'attribute':
                        attr_name = item.get('attr_name')
                        attr_type = item.get('attr_type')
                        
                        # VALIDAÇÃO DE TIPO: Verificar se o tipo existe na tabela de símbolos
                        if attr_type and not self.symbol_table.resolve_type(attr_type):
                            self.errors.append({
                                "code": "ROLE_ATTRIBUTE_TYPE_NOT_FOUND",
                                "severity": "error",
                                "message": f"Role '{role_name}' attribute '{attr_name}' has undefined type '{attr_type}'"
                            })
                        
                        attributes.append({
                            "name": attr_name,
                            "type": attr_type,
                            "cardinality": item.get('cardinality')
                        })
                    
                    elif node_type == 'internal_relation':
                        internal_relations.append({
                            "stereotype": item.get('relation_stereotype'),
                            "target": item.get('second_end'),
                            "cardinality": item.get('second_cardinality')
                        })
            
            # Armazenar informações do corpo
            role_bodies[role_name] = {
                "has_body": body is not None and len(body) > 0,
                "attributes": attributes,
                "internal_relations": internal_relations
            }
            
            # Agrupar roles pela primeira classe pai
            # (roles podem ter múltiplos pais, mas focamos no principal)
            primary_parent = parents[0]
            
            if primary_parent not in roles_by_parent:
                roles_by_parent[primary_parent] = []
            roles_by_parent[primary_parent].append(role_name)
        
        # Reportar roles sem especialização como erro
        for role_name in roles_without_specialization:
            self.errors.append({
                "code": "ROLE_WITHOUT_SPECIALIZATION",
                "severity": "error",
                "message": f"Role '{role_name}' must specialize from a kind or other sortal"
            })
        
        # Detectar padrões para cada grupo de roles
        for parent_class, role_names in roles_by_parent.items():
            # Se houver apenas um role, ainda criamos um pattern (pode ser válido)
            if len(role_names) == 0:
                continue
            
            # Buscar genset que formalize este grupo de roles
            genset_def = self._find_matching_genset(parent_class, role_names)
            
            violations = []
            suggestions = []
            
            # Se houver múltiplos roles, sugerir genset (não obrigatório)
            if len(role_names) > 1 and genset_def is None:
                violations.append({
                    "code": "SUGGESTED_GENSET",
                    "severity": "warning",
                    "message": f"Multiple roles specializing '{parent_class}' could benefit from a genset for clarity"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "insert_code",
                    "message": "Consider adding a genset to formalize the role pattern",
                    "code_suggestion": self._suggest_genset(
                        parent_class, 
                        role_names, 
                        disjoint=False,  # Roles não precisam ser disjoint por padrão
                        complete=False   # Roles não precisam ser complete
                    )
                })
            
            # Se genset existe, validar consistência
            if genset_def is not None:
                genset_specifics = set(genset_def.get('specifics', []))
                detected_specifics = set(role_names)
                
                # Verificar se todas as roles detectadas estão no genset
                missing_specifics = detected_specifics - genset_specifics
                if missing_specifics:
                    violations.append({
                        "code": "INCOMPLETE_GENSET_SPECIFICS",
                        "severity": "warning",
                        "message": f"Genset '{genset_def.get('genset_name')}' is missing roles: {', '.join(missing_specifics)}"
                    })
                    all_specifics = list(genset_specifics | detected_specifics)
                    suggestions.append({
                        "type": "coercion",
                        "action": "modify_code",
                        "message": f"Update genset to include all roles",
                        "code_suggestion": self._suggest_genset(
                            parent_class,
                            all_specifics,
                            disjoint=genset_def.get('disjoint', False),
                            complete=genset_def.get('complete', False)
                        )
                    })
            
            # Construir informações do corpo para cada role
            roles_info = []
            for role_name in role_names:
                role_info = {
                    "name": role_name,
                    "has_body": role_bodies[role_name]["has_body"]
                }
                
                # Adicionar atributos se houver
                if role_bodies[role_name]["attributes"]:
                    role_info["attributes"] = role_bodies[role_name]["attributes"]
                
                # Adicionar relações internas se houver
                if role_bodies[role_name]["internal_relations"]:
                    role_info["internal_relations"] = role_bodies[role_name]["internal_relations"]
                
                roles_info.append(role_info)
            
            # Construir constraints
            constraints = {
                "disjoint": genset_def.get('disjoint', False) if genset_def else False,
                "complete": genset_def.get('complete', False) if genset_def else False,
                "has_genset": genset_def is not None
            }
            
            # Construir elementos do padrão
            elements = {
                "general": parent_class,
                "specifics": role_names,
                "genset": genset_def.get('genset_name') if genset_def else None,
                "roles_details": roles_info  # Incluir detalhes dos corpos
            }
            
            # Criar o padrão
            pattern = self._create_pattern(
                pattern_type="Role_Pattern",
                anchor_class=parent_class,
                anchor_stereotype=self.symbol_table.get_class(parent_class).get('class_stereotype', 'unknown') if self.symbol_table.get_class(parent_class) else 'unknown',
                elements=elements,
                constraints=constraints,
                violations=violations,
                suggestions=suggestions
            )
            
            # Adicionar à lista apropriada
            if violations:
                self.incomplete_patterns.append(pattern)
            else:
                self.patterns.append(pattern)

    def _detect_phase_patterns(self) -> None:
        '''
        Docstring for _detect_phase_patterns
        
        :param self: Description
        '''
        # Buscar todas as classes com estereótipo 'phase'
        all_phases = self.symbol_table.get_classes_by_stereotype('phase')
        
        # Agrupar phases por sua classe pai (general)
        phases_by_parent = {}
        phases_without_specialization = []
        
        for phase_class in all_phases:
            phase_name = phase_class.get('class_name')
            parents = phase_class.get('specialization', {}).get('parents', [])
            
            # Validação: phase sem especialização é erro crítico
            if not parents:
                phases_without_specialization.append(phase_name)
                continue
            
            # Agrupar phases pela primeira classe pai
            primary_parent = parents[0]
            
            if primary_parent not in phases_by_parent:
                phases_by_parent[primary_parent] = []
            phases_by_parent[primary_parent].append(phase_name)
        
        # Reportar phases sem especialização como erro
        for phase_name in phases_without_specialization:
            self.errors.append({
                "code": "PHASE_WITHOUT_SPECIALIZATION",
                "severity": "error",
                "message": f"Phase '{phase_name}' must specialize from a kind or other sortal"
            })
        
        # Detectar padrões para cada grupo de phases
        for parent_class, phase_names in phases_by_parent.items():
            if len(phase_names) == 0:
                continue
            
            # Buscar genset que formalize este grupo de phases
            genset_def = self._find_matching_genset(parent_class, phase_names)
            
            violations = []
            suggestions = []
            
            # Sugerir genset para múltiplos phases (warning, não obrigatório)
            if len(phase_names) > 1 and genset_def is None:
                violations.append({
                    "code": "SUGGESTED_GENSET",
                    "severity": "warning",
                    "message": f"Multiple phases specializing '{parent_class}' should have a genset to formalize the phase partition"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "insert_code",
                    "message": "Consider adding a genset with 'disjoint' to formalize the phase pattern",
                    "code_suggestion": self._suggest_genset(
                        parent_class, 
                        phase_names, 
                        disjoint=True,  # Disjoint é obrigatório quando há genset para phases
                        complete=False  # Complete é opcional
                    )
                })
            
            # Se genset existe, validar propriedades
            if genset_def is not None:
                genset_specifics = set(genset_def.get('specifics', []))
                detected_specifics = set(phase_names)
                
                # VALIDAÇÃO CRÍTICA: Genset de phases DEVE ter disjoint (ERROR)
                if not genset_def.get('disjoint'):
                    violations.append({
                        "code": "MISSING_DISJOINT",
                        "severity": "error",
                        "message": f"Phase_Pattern genset '{genset_def.get('genset_name')}' MUST have 'disjoint' keyword (phases are mutually exclusive)"
                    })
                    suggestions.append({
                        "type": "coercion",
                        "action": "add_keyword",
                        "message": "Add 'disjoint' keyword to genset (mandatory for phases)",
                        "code_suggestion": f"disjoint genset {genset_def.get('genset_name')} {{ ... }}"
                    })
                
                # Verificar se todas as phases detectadas estão no genset
                missing_specifics = detected_specifics - genset_specifics
                if missing_specifics:
                    violations.append({
                        "code": "INCOMPLETE_GENSET_SPECIFICS",
                        "severity": "warning",
                        "message": f"Genset '{genset_def.get('genset_name')}' is missing phases: {', '.join(missing_specifics)}"
                    })
                    all_specifics = list(genset_specifics | detected_specifics)
                    suggestions.append({
                        "type": "coercion",
                        "action": "modify_code",
                        "message": f"Update genset to include all phases",
                        "code_suggestion": self._suggest_genset(
                            parent_class,
                            all_specifics,
                            disjoint=True,  # Manter disjoint (obrigatório)
                            complete=genset_def.get('complete', False)
                        )
                    })
            
            # Construir constraints
            constraints = {
                "disjoint": genset_def.get('disjoint', False) if genset_def else False,
                "complete": genset_def.get('complete', False) if genset_def else False,
                "has_genset": genset_def is not None
            }
            
            # Construir elementos do padrão
            elements = {
                "general": parent_class,
                "specifics": phase_names,
                "genset": genset_def.get('genset_name') if genset_def else None
            }
            
            # Criar o padrão
            pattern = self._create_pattern(
                pattern_type="Phase_Pattern",
                anchor_class=parent_class,
                anchor_stereotype=self.symbol_table.get_class(parent_class).get('class_stereotype', 'unknown') if self.symbol_table.get_class(parent_class) else 'unknown',
                elements=elements,
                constraints=constraints,
                violations=violations,
                suggestions=suggestions
            )
            
            # Adicionar à lista apropriada
            if violations:
                self.incomplete_patterns.append(pattern)
            else:
                self.patterns.append(pattern)

    def _detect_relator_patterns(self) -> None:
        '''
        Docstring for _detect_relator_patterns
        
        :param self: Description
        '''
        all_relators = self.symbol_table.get_classes_by_stereotype('relator')
        
        for relator_class in all_relators:
            relator_name = relator_class.get('class_name')
            body = relator_class.get('body') or []
            
            violations = []
            suggestions = []
            
            # Buscar relações internas
            internal_relations = [item for item in body if item.get('node_type') == 'internal_relation']
            
            # VALIDAÇÃO 1: Relator sem corpo → WARNING
            if not body or len(body) == 0:
                violations.append({
                    "code": "RELATOR_WITHOUT_BODY",
                    "severity": "warning",
                    "message": f"Relator '{relator_name}' has no body (no internal relations)"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "add_mediations",
                    "message": "Add mediation relations to connect at least two participants",
                    "code_suggestion": f"relator {relator_name} {{\n    @mediation [1] -- [1] ParticipantClass1\n    @mediation [1] -- [1] ParticipantClass2\n}}"
                })
            
            # Filtrar apenas mediations
            mediations = [rel for rel in internal_relations if rel.get('relation_stereotype') == 'mediation']
            
            # VALIDAÇÃO 2: Relator com 0 mediations → ERROR
            if len(internal_relations) > 0 and len(mediations) == 0:
                violations.append({
                    "code": "RELATOR_WITHOUT_MEDIATIONS",
                    "severity": "error",
                    "message": f"Relator '{relator_name}' has no mediation relations (all internal relations must use @mediation)"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "add_stereotype",
                    "message": "Add @mediation stereotype to internal relations",
                    "code_suggestion": "@mediation [1] -- [1] TargetClass"
                })
            
            # VALIDAÇÃO 3: Relator com apenas 1 mediation → ERROR
            if len(mediations) == 1:
                violations.append({
                    "code": "INSUFFICIENT_MEDIATIONS",
                    "severity": "error",
                    "message": f"Relator '{relator_name}' must connect at least two participants (found only 1 mediation)"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "add_mediation",
                    "message": "Add at least one more mediation relation",
                    "code_suggestion": "@mediation [1] -- [1] AnotherParticipant"
                })
            
            # VALIDAÇÃO 4: Relações sem @mediation → ERROR
            relations_without_mediation = [rel for rel in internal_relations if rel.get('relation_stereotype') != 'mediation']
            if relations_without_mediation:
                for rel in relations_without_mediation:
                    target = rel.get('second_end', 'unknown')
                    violations.append({
                        "code": "MISSING_MEDIATION_STEREOTYPE",
                        "severity": "error",
                        "message": f"Relation to '{target}' in relator '{relator_name}' must use @mediation stereotype"
                    })
                    suggestions.append({
                        "type": "coercion",
                        "action": "add_stereotype",
                        "message": f"Add @mediation stereotype to relation with '{target}'",
                        "code_suggestion": f"@mediation [1] -- [1] {target}"
                    })
            
            # VALIDAÇÃO 5: Verificar se alvos das mediations existem na tabela de símbolos
            mediation_targets = []
            for mediation in mediations:
                target = mediation.get('second_end')
                if target:
                    mediation_targets.append(target)
                    # Verificar se o alvo existe
                    if not self.symbol_table.class_exists(target):
                        violations.append({
                            "code": "MEDIATION_TARGET_NOT_FOUND",
                            "severity": "error",
                            "message": f"Mediation target '{target}' in relator '{relator_name}' does not exist in symbol table"
                        })
            
            # VALIDAÇÃO 6: Verificar se existe relação @material externa correspondente → WARNING
            if len(mediation_targets) >= 2:
                material_relations = self.symbol_table.get_relations_by_stereotype('material')
                
                # Verificar se existe material conectando os alvos das mediations
                found_material = False
                for material_rel in material_relations:
                    if material_rel.get('node_type') == 'external_relation':
                        first_end = material_rel.get('first_end')
                        second_end = material_rel.get('second_end')
                        
                        # Verificar se conecta os mesmos participantes (qualquer ordem)
                        if (first_end in mediation_targets and second_end in mediation_targets and
                            first_end != second_end):
                            found_material = True
                            break
                
                if not found_material:
                    violations.append({
                        "code": "MISSING_MATERIAL_RELATION",
                        "severity": "warning",
                        "message": f"Relator '{relator_name}' should have a corresponding @material relation connecting the mediated participants"
                    })
                    target1 = mediation_targets[0]
                    target2 = mediation_targets[1] if len(mediation_targets) > 1 else mediation_targets[0]
                    suggestions.append({
                        "type": "coercion",
                        "action": "add_external_relation",
                        "message": f"Add @material relation between {target1} and {target2}",
                        "code_suggestion": f"@material relation {target1} [1..*] -- relationName -- [1..*] {target2}"
                    })
            
            # Construir constraints
            constraints = {
                "has_body": len(body) > 0,
                "mediation_count": len(mediations),
                "has_material_relation": len(mediation_targets) >= 2  # Simplificado
            }
            
            # Construir elementos do padrão
            elements = {
                "relator": relator_name,
                "mediations": [
                    {
                        "target": m.get('second_end'),
                        "cardinality": m.get('second_cardinality')
                    }
                    for m in mediations
                ],
                "mediation_targets": mediation_targets
            }
            
            # Criar o padrão
            pattern = self._create_pattern(
                pattern_type="Relator_Pattern",
                anchor_class=relator_name,
                anchor_stereotype="relator",
                elements=elements,
                constraints=constraints,
                violations=violations,
                suggestions=suggestions
            )
            
            # Adicionar à lista apropriada
            if violations:
                self.incomplete_patterns.append(pattern)
            else:
                self.patterns.append(pattern)

    def _detect_mode_patterns(self) -> None:
        '''
        Docstring for _detect_mode_patterns
        
        :param self: Description
        '''
        all_modes = self.symbol_table.get_classes_by_stereotype('mode')
        
        for mode_class in all_modes:
            mode_name = mode_class.get('class_name')
            body = mode_class.get('body') or []
            
            violations = []
            suggestions = []
            
            # Buscar relações internas
            internal_relations = [item for item in body if item.get('node_type') == 'internal_relation']
            
            # VALIDAÇÃO 1: Mode sem corpo → ERROR
            if not body or len(body) == 0:
                violations.append({
                    "code": "MODE_WITHOUT_BODY",
                    "severity": "error",
                    "message": f"Mode '{mode_name}' must have a body with @characterization and @externalDependence relations"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "add_relations",
                    "message": "Add @characterization and @externalDependence relations to the mode body",
                    "code_suggestion": (
                        f"mode {mode_name} {{\n"
                        f"    @characterization [1..*] -- [1] TargetClass\n"
                        f"    @externalDependence [1..*] -- [1] DependencyClass\n"
                        f"}}"
                    )
                })
            
            # Filtrar characterizations e externalDependences
            characterizations = [rel for rel in internal_relations if rel.get('relation_stereotype') == 'characterization']
            external_dependences = [rel for rel in internal_relations if rel.get('relation_stereotype') == 'externalDependence']
            
            # VALIDAÇÃO 2: Mode sem @characterization → ERROR
            if len(internal_relations) > 0 and len(characterizations) == 0:
                violations.append({
                    "code": "MODE_WITHOUT_CHARACTERIZATION",
                    "severity": "error",
                    "message": f"Mode '{mode_name}' must have at least one @characterization relation"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "add_characterization",
                    "message": "Add @characterization relation to specify what this mode characterizes",
                    "code_suggestion": f"    @characterization [1..*] -- [1] TargetClass"
                })
            
            # VALIDAÇÃO 3: Mode sem @externalDependence → ERROR
            if len(internal_relations) > 0 and len(external_dependences) == 0:
                violations.append({
                    "code": "MODE_WITHOUT_EXTERNAL_DEPENDENCE",
                    "severity": "error",
                    "message": f"Mode '{mode_name}' must have at least one @externalDependence relation"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "add_external_dependence",
                    "message": "Add @externalDependence relation to specify external dependencies",
                    "code_suggestion": f"    @externalDependence [1..*] -- [1] DependencyClass"
                })
            
            # VALIDAÇÃO 4: Verificar se mode tem specializes (não deveria ter)
            specialization = mode_class.get('specialization')
            if specialization and specialization.get('parents'):
                violations.append({
                    "code": "MODE_WITH_SPECIALIZATION",
                    "severity": "warning",
                    "message": f"Mode '{mode_name}' should not have specialization (no inheritance pattern defined for modes)"
                })
            
            # VALIDAÇÃO 5: Verificar se mode está em genset (não deveria estar)
            gensets_as_specific = self.symbol_table.get_genset_for_specific(mode_name)
            if gensets_as_specific:
                genset_names = [g.get('genset_name') for g in gensets_as_specific]
                violations.append({
                    "code": "MODE_IN_GENSET",
                    "severity": "warning",
                    "message": f"Mode '{mode_name}' should not be part of gensets: {', '.join(genset_names)}"
                })
            
            # VALIDAÇÃO 6: Verificar se alvos das relações existem na tabela de símbolos
            characterization_targets = []
            for char in characterizations:
                target = char.get('second_end')
                if target:
                    if not self.symbol_table.class_exists(target):
                        violations.append({
                            "code": "MODE_CHARACTERIZATION_TARGET_NOT_FOUND",
                            "severity": "error",
                            "message": f"Mode '{mode_name}' characterization target '{target}' does not exist in symbol table"
                        })
                    else:
                        characterization_targets.append(target)
            
            external_dependence_targets = []
            for ext_dep in external_dependences:
                target = ext_dep.get('second_end')
                if target:
                    if not self.symbol_table.class_exists(target):
                        violations.append({
                            "code": "MODE_EXTERNAL_DEPENDENCE_TARGET_NOT_FOUND",
                            "severity": "error",
                            "message": f"Mode '{mode_name}' externalDependence target '{target}' does not exist in symbol table"
                        })
                    else:
                        external_dependence_targets.append(target)
            
            # Construir constraints
            constraints = {
                "has_body": len(body) > 0,
                "characterization_count": len(characterizations),
                "external_dependence_count": len(external_dependences),
                "has_specialization": specialization is not None and bool(specialization.get('parents')),
                "in_genset": len(gensets_as_specific) > 0
            }
            
            # Construir elementos do padrão
            elements = {
                "mode": mode_name,
                "characterizations": [
                    {
                        "target": c.get('second_end'),
                        "cardinality": c.get('second_cardinality')
                    }
                    for c in characterizations
                ],
                "external_dependences": [
                    {
                        "target": e.get('second_end'),
                        "cardinality": e.get('second_cardinality')
                    }
                    for e in external_dependences
                ],
                "characterization_targets": characterization_targets,
                "external_dependence_targets": external_dependence_targets
            }
            
            # Criar o padrão
            pattern = self._create_pattern(
                pattern_type="Mode_Pattern",
                anchor_class=mode_name,
                anchor_stereotype="mode",
                elements=elements,
                constraints=constraints,
                violations=violations,
                suggestions=suggestions
            )
            
            # Adicionar à lista apropriada
            if violations:
                self.incomplete_patterns.append(pattern)
            else:
                self.patterns.append(pattern)

    def _detect_rolemixin_patterns(self) -> None:
        '''
        Docstring for _detect_rolemixin_patterns
        
        :param self: Description
        '''
        all_rolemixins = self.symbol_table.get_classes_by_stereotype('roleMixin')
        
        for rolemixin_class in all_rolemixins:
            rolemixin_name = rolemixin_class.get('class_name')
            body = rolemixin_class.get('body') or []
            
            violations = []
            suggestions = []
            
            # VALIDAÇÃO 1: RoleMixin com specializes → WARNING (não deveria ter)
            specialization = rolemixin_class.get('specialization')
            if specialization and specialization.get('parents'):
                violations.append({
                    "code": "ROLEMIXIN_WITH_SPECIALIZATION",
                    "severity": "warning",
                    "message": f"RoleMixin '{rolemixin_name}' should not have specialization"
                })
            
            # VALIDAÇÃO 2: Buscar gensets onde RoleMixin é general
            gensets_as_general = self.symbol_table.get_gensets_for_general(rolemixin_name)
            
            if not gensets_as_general:
                # WARNING: Ideal ter pelo menos um genset com RoleMixin como general
                violations.append({
                    "code": "ROLEMIXIN_WITHOUT_GENSET",
                    "severity": "warning",
                    "message": f"RoleMixin '{rolemixin_name}' should have at least one genset where it is the general"
                })
                suggestions.append({
                    "type": "coercion",
                    "action": "add_genset",
                    "message": "Add a genset with this RoleMixin as general and roles as specifics",
                    "code_suggestion": self._suggest_genset(
                        rolemixin_name, 
                        ['Role_Name1', 'Role_Name2'], 
                        disjoint=True, 
                        complete=True
                    )
                })
            
            # VALIDAÇÃO 3: Para cada genset onde RoleMixin é general, validar propriedades
            role_specifics = []
            for genset_def in gensets_as_general:
                genset_name = genset_def.get('genset_name')
                is_disjoint = genset_def.get('disjoint', False)
                is_complete = genset_def.get('complete', False)
                specifics = genset_def.get('specifics', [])
                
                # Verificar se genset é pelo menos disjoint
                if not is_disjoint:
                    violations.append({
                        "code": "ROLEMIXIN_GENSET_NOT_DISJOINT",
                        "severity": "warning",
                        "message": f"Genset '{genset_name}' for RoleMixin '{rolemixin_name}' should be at least disjoint"
                    })
                
                # VALIDAÇÃO 4: Verificar se specifics são roles
                for specific in specifics:
                    specific_class = self.symbol_table.get_class(specific)
                    if specific_class:
                        stereotype = specific_class.get('class_stereotype')
                        if stereotype == 'role':
                            role_specifics.append(specific)
                        else:
                            violations.append({
                                "code": "ROLEMIXIN_GENSET_NON_ROLE_SPECIFIC",
                                "severity": "warning",
                                "message": f"Genset '{genset_name}' specific '{specific}' is not a role (stereotype: {stereotype})"
                            })
                    else:
                        violations.append({
                            "code": "ROLEMIXIN_GENSET_SPECIFIC_NOT_FOUND",
                            "severity": "error",
                            "message": f"Genset '{genset_name}' specific '{specific}' does not exist in symbol table"
                        })
            
            # VALIDAÇÃO 5: Verificar se RoleMixin está como specific em algum genset (não esperado)
            gensets_as_specific = self.symbol_table.get_genset_for_specific(rolemixin_name)
            if gensets_as_specific:
                genset_names = [g.get('genset_name') for g in gensets_as_specific]
                violations.append({
                    "code": "ROLEMIXIN_AS_GENSET_SPECIFIC",
                    "severity": "warning",
                    "message": f"RoleMixin '{rolemixin_name}' should not be a specific in gensets: {', '.join(genset_names)}"
                })
            
            # Construir constraints
            constraints = {
                "has_body": len(body) > 0,
                "has_specialization": specialization is not None and bool(specialization.get('parents')),
                "genset_count": len(gensets_as_general),
                "has_genset": len(gensets_as_general) > 0,
                "role_specifics_count": len(role_specifics)
            }
            
            # Construir elementos do padrão
            elements = {
                "rolemixin": rolemixin_name,
                "gensets": [
                    {
                        "name": g.get('genset_name'),
                        "disjoint": g.get('disjoint', False),
                        "complete": g.get('complete', False),
                        "specifics": g.get('specifics', [])
                    }
                    for g in gensets_as_general
                ],
                "role_specifics": role_specifics
            }
            
            # Criar o padrão
            pattern = self._create_pattern(
                pattern_type="RoleMixin_Pattern",
                anchor_class=rolemixin_name,
                anchor_stereotype="roleMixin",
                elements=elements,
                constraints=constraints,
                violations=violations,
                suggestions=suggestions
            )
            
            # Adicionar à lista apropriada
            # Apenas violations de severity "error" tornam o pattern incompleto
            critical_violations = [v for v in violations if v.get('severity') == 'error']
            if critical_violations:
                self.incomplete_patterns.append(pattern)
            else:
                self.patterns.append(pattern)
        