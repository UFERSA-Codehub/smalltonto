# Define as palavras reservadas da linguagem
language_keywords = {
    'genset': 'KEYWORD_GENSET',
    'disjoint': 'KEYWORD_DISJOINT',
    'complete': 'KEYWORD_COMPLETE',
    'general': 'KEYWORD_GENERAL',
    'specifics': 'KEYWORD_SPECIFICS',
    'where': 'KEYWORD_WHERE',
    'package': 'KEYWORD_PACKAGE',
    'import': 'KEYWORD_IMPORT',
    'functional-complexes': 'KEYWORD_FUNCTIONAL_COMPLEXES',
    # TODO: Adicionar o restante das palavras reservadas!   
}

# OntoUML - Estereótipos de classe
class_stereotypes = {
    'event': 'CLASS_EVENT',
    'situation': 'CLASS_SITUATION',
    'process': 'CLASS_PROCESS',
    'category': 'CLASS_CATEGORY',
    'mixin': 'CLASS_MIXIN',
    'phaseMixin': 'CLASS_PHASEMIXIN',
    'roleMixin': 'CLASS_ROLEMIXIN',
    'historicalRoleMixin': 'CLASS_HISTORICALROLEMIXIN',
    'kind': 'CLASS_KIND',
    'collective': 'CLASS_COLLECTIVE',
    'quantity': 'CLASS_QUANTITY',
    'quality': 'CLASS_QUALITY',
    'mode': 'CLASS_MODE',
    'intrisicMode': 'CLASS_INTRISICMODE',
    'extrinsicMode': 'CLASS_EXTRINSICMODE',
    'subkind': 'CLASS_SUBKIND',
    'phase': 'CLASS_PHASE',
    'role': 'CLASS_ROLE',
    'historicalRole': 'CLASS_HISTORICALROLE',
}

# OntoUML - Estereótipos de relação
relation_stereotypes = {
    'material': 'RELATION_MATERIAL',
    'derivation': 'RELATION_DERIVATION',
    'comparative': 'RELATION_COMPARATIVE',
    'mediation': 'RELATION_MEDIATION',
    'characterization': 'RELATION_CHARACTERIZATION',
    'externalDependence': 'RELATION_EXTERNALDEPENDENCE',
    'componentOf': 'RELATION_COMPONENTOF',
    'memberOf': 'RELATION_MEMBEROF',
    'subCollectionOf': 'RELATION_SUBCOLLECTIONOF',
    'subQualityOf': 'RELATION_SUBQUALITYOF',
    'instantiation': 'RELATION_INSTANTIATION',
    'termination': 'RELATION_TERMINATION',
    'participational': 'RELATION_PARTICIPATIONAL',
    'participation': 'RELATION_PARTICIPATION',
    'historicalDependence': 'RELATION_HISTORICALDEPENDENCE',
    'creation': 'RELATION_CREATION',
    'manifestation': 'RELATION_MANIFESTATION',
    'bringsAbout': 'RELATION_BRINGSABOUT',
    'triggers': 'RELATION_TRIGGERS',
    'composition': 'RELATION_COMPOSITION',
    'aggregation': 'RELATION_AGGREGATION',
    'inherence': 'RELATION_INHERENCE',
    'value': 'RELATION_VALUE',
    'formal': 'RELATION_FORMAL',
    'constitution': 'RELATION_CONSTITUTION',
}

data_types = {
    'number': 'TYPE_NUMBER',
    'string': 'TYPE_STRING',
    'boolean': 'TYPE_BOOLEAN',
    'date': 'TYPE_DATE',
    'time': 'TYPE_TIME',
    'datetime': 'TYPE_DATETIME',
}

meta_attributes ={
    'ordered': 'META_ORDERED',
    'const': 'META_CONST',
    'derived': 'META_DERIVED',
    'subsets': 'META_SUBSETS',
    'redefines': 'META_REDEFINES',
}

reserved = {}
reserved.update(language_keywords)
reserved.update(class_stereotypes)
reserved.update(relation_stereotypes)
reserved.update(data_types)
reserved.update(meta_attributes)

# Lista de tokens
tokens = [
    'IDENTIFIER',   # Identificadores e nomes
    'STRING',       # Literais de string
    'NUMBER',       # Literais numéricos
    'LBRACE',       # "{"
    'RBRACE',       # "}"
    'LPAREN',       # "("
    'RPAREN',       # ")"
    'LBRACKET',     # "["
    'RBRACKET',     # "]"
    'CARDINALITY',  # ".."
    'COMPOSITIONL', # "<>--"
    'COMPOSITIONR', # "--<>"
    'AGGREGATIONL', # "<o>--"
    'AGGREGATIONR', # "--<o>"
    'ASTERISK',     # "*"
    'ANNOTATION',   # "@"
    'COLON',        # ":"
    'CLASS_NAME',
    'RELATION_NAME',
    'INSTANCE_NAME',
] + list(reserved.values())

