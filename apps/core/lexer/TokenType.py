"""
Definições de tipos de tokens e palavras reservadas para o analisador léxico da linguagem Tonto.

Este módulo contém todas as definições de tokens, palavras reservadas, estereótipos
OntoUML e funções utilitárias para categorização de tokens do analisador léxico.
A linguagem Tonto suporta conceitos de OntoUML incluindo estereótipos de classe,
estereótipos de relação e palavras-chave específicas da linguagem.

Examples:
    Uso típico para obter categorias de palavras-chave:

    >>> from TokenType import get_keyword_categories
    >>> categories = get_keyword_categories()
    >>> print(categories['language']['package'])
    'KEYWORD_PACKAGE'

    Obter categoria de um token:

    >>> from TokenType import get_token_category
    >>> category = get_token_category('CLASS_KIND')
    >>> print(category)
    'CLASS_STEREOTYPE'
"""

# Define as palavras reservadas da linguagem
language_keywords = {
    "categorizer": "KEYWORD_CATEGORIZER",
    "enum": "KEYWORD_ENUM",
    "datatype": "KEYWORD_DATATYPE",
    "genset": "KEYWORD_GENSET",
    "disjoint": "KEYWORD_DISJOINT",
    "complete": "KEYWORD_COMPLETE",
    "general": "KEYWORD_GENERAL",
    "specifics": "KEYWORD_SPECIFICS",
    "where": "KEYWORD_WHERE",
    "package": "KEYWORD_PACKAGE",
    "import": "KEYWORD_IMPORT",
    "functional-complexes": "KEYWORD_FUNCTIONAL_COMPLEXES",
    "specializes": "KEYWORD_SPECIALIZES",
    "relator": "KEYWORD_RELATOR",
    "relators": "KEYWORD_RELATORS",
    "relation": "KEYWORD_RELATION",
    "inverseOf": "KEYWORD_INVERSEOF",
    # TODO: Adicionar o restante das palavras reservadas!
    # "specializes" // ✅
    # "," //  ✅
    # "-" (não reconhece no functional-complexes) //
    # "of" // ✅
    # "relator" // ✅
    # "relators" // ✅
    # "--" // ✅
}

# OntoUML - Estereótipos de classe
class_stereotypes = {
    "event": "CLASS_EVENT",
    "situation": "CLASS_SITUATION",
    "process": "CLASS_PROCESS",
    "category": "CLASS_CATEGORY",
    "mixin": "CLASS_MIXIN",
    "phaseMixin": "CLASS_PHASEMIXIN",
    "roleMixin": "CLASS_ROLEMIXIN",
    "historicalRoleMixin": "CLASS_HISTORICALROLEMIXIN",
    "kind": "CLASS_KIND",
    "collective": "CLASS_COLLECTIVE",
    "quantity": "CLASS_QUANTITY",
    "quality": "CLASS_QUALITY",
    "mode": "CLASS_MODE",
    "intrisicMode": "CLASS_INTRISICMODE",
    "extrinsicMode": "CLASS_EXTRINSICMODE",
    "subkind": "CLASS_SUBKIND",
    "phase": "CLASS_PHASE",
    "role": "CLASS_ROLE",
    "historicalRole": "CLASS_HISTORICALROLE",
}

# OntoUML - Estereótipos de relação
relation_stereotypes = {
    "material": "RELATION_MATERIAL",
    "derivation": "RELATION_DERIVATION",
    "comparative": "RELATION_COMPARATIVE",
    "mediation": "RELATION_MEDIATION",
    "characterization": "RELATION_CHARACTERIZATION",
    "externalDependence": "RELATION_EXTERNALDEPENDENCE",
    "componentOf": "RELATION_COMPONENTOF",
    "memberOf": "RELATION_MEMBEROF",
    "subCollectionOf": "RELATION_SUBCOLLECTIONOF",
    "subQualityOf": "RELATION_SUBQUALITYOF",
    "instantiation": "RELATION_INSTANTIATION",
    "termination": "RELATION_TERMINATION",
    "participational": "RELATION_PARTICIPATIONAL",
    "participation": "RELATION_PARTICIPATION",
    "historicalDependence": "RELATION_HISTORICALDEPENDENCE",
    "creation": "RELATION_CREATION",
    "manifestation": "RELATION_MANIFESTATION",
    "bringsAbout": "RELATION_BRINGSABOUT",
    "triggers": "RELATION_TRIGGERS",
    "composition": "RELATION_COMPOSITION",
    "aggregation": "RELATION_AGGREGATION",
    "inherence": "RELATION_INHERENCE",
    "value": "RELATION_VALUE",
    "formal": "RELATION_FORMAL",
    "constitution": "RELATION_CONSTITUTION",
}

data_types = {
    "Number": "TYPE_NUMBER",
    "String": "TYPE_STRING",
    "Boolean": "TYPE_BOOLEAN",
    "Date": "TYPE_DATE",
    "Time": "TYPE_TIME",
    "Datetime": "TYPE_DATETIME",
}

meta_attributes = {
    "ordered": "META_ORDERED",
    "const": "META_CONST",
    "derived": "META_DERIVED",
    "subsets": "META_SUBSETS",
    "redefines": "META_REDEFINES",
}

reserved = {}
reserved.update(language_keywords)
reserved.update(class_stereotypes)
reserved.update(relation_stereotypes)
reserved.update(data_types)
reserved.update(meta_attributes)

literals = [
    '{',
    '}',
    '(',
    ')',
    '[',
    ']',
    '*',
    '@',
    ':',
    ',',
    #'-',
    '<',
    '>'
]

# Lista de tokens
tokens = [
    "IDENTIFIER",  # Identificadores e nomes
    "STRING",  # Literais de string
    "NUMBER",  # Literais numéricos
    #"LBRACE",  # "{"
    #"RBRACE",  # "}"
    #"LPAREN",  # "("
    #"RPAREN",  # ")"
    #"LBRACKET",  # "["
    #"RBRACKET",  # "]"
    "CARDINALITY",  # ".."
    "AGGREGATIONL",  # "<>--"
    "AGGREGATIONR",  # "--<>"
    "COMPOSITIONL",  # "<o>--"
    "COMPOSITIONR",  # "--<o>"
    #"ASTERISK",  # "*"
    #"ANNOTATION",  # "@"
    #"COLON",  # ":"
    #"COMMA",  # ","
    #"DASH",  # "-" usado em functional-complexes
    #"SMALLER",  # "<"
    #"GREATER",  # ">"
    "ASSOCIATION",  # "--" usado em associações com direção irrelevante
    "ASSOCIATIONL",  # "<--" usado em associações direcionadas reversas
    "ASSOCIATIONR",  # "-->" usado em associações direcionadas
    "ASSOCIATIONLR",  # "<-->" usado em associações bidirecionais
    "CLASS_NAME",
    "RELATION_NAME",
    "INSTANCE_NAME",
    "NEW_DATATYPE",
] + list(reserved.values())


def get_keyword_categories():
    """
    Retorna um dicionário com todas as categorias de palavras-chave disponíveis.

    Esta função é útil para ferramentas externas como highlight de sintaxe,
    análise semântica ou documentação automática. Retorna todas as categorias
    organizadas de palavras reservadas da linguagem Tonto.

    Returns:
        dict: Dicionário contendo as seguintes chaves:
            - 'language': Palavras-chave da linguagem (package, import, etc.)
            - 'class_stereotypes': Estereótipos de classe OntoUML (kind, role, etc.)
            - 'relation_stereotypes': Estereótipos de relação OntoUML (material, mediation, etc.)
            - 'data_types': Tipos de dados primitivos (Number, String, etc.)
            - 'meta_attributes': Meta-atributos (ordered, const, derived, etc.)

    Examples:
        >>> categories = get_keyword_categories()
        >>> print(categories['language']['package'])
        'KEYWORD_PACKAGE'
        >>> print(list(categories['class_stereotypes'].keys())[:3])
        ['event', 'situation', 'process']
    """
    return {
        "language": language_keywords,
        "class_stereotypes": class_stereotypes,
        "relation_stereotypes": relation_stereotypes,
        "data_types": data_types,
        "meta_attributes": meta_attributes,
    }


def get_token_category(token_type):
    """
    Determina a categoria semântica de um tipo de token específico.

    Esta função categoriza tokens em grupos semânticos para facilitar
    análise sintática, highlight de sintaxe e processamento posterior.
    Útil para ferramentas que precisam tratar diferentes tipos de tokens
    de forma específica.

    Args:
        token_type (str): Tipo do token a ser categorizado. Exemplos:
            'KEYWORD_PACKAGE', 'CLASS_KIND', 'RELATION_MATERIAL', 'IDENTIFIER'.

    Returns:
        str: Nome da categoria semântica. Possíveis valores:
            - 'LANGUAGE_KEYWORD': Palavras-chave da linguagem
            - 'CLASS_STEREOTYPE': Estereótipos de classe OntoUML
            - 'RELATION_STEREOTYPE': Estereótipos de relação OntoUML
            - 'DATA_TYPE': Tipos de dados primitivos
            - 'META_ATTRIBUTE': Meta-atributos
            - 'ID': Identificadores (nomes de classe, relação, instância)
            - 'LITERAL': Valores literais (string, número)
            - 'DELIMITER': Delimitadores (chaves, parênteses, colchetes)
            - 'PUNCTUATION': Pontuação (dois-pontos, asterisco, etc.)
            - 'RELATION_OPERATOR': Operadores de relação (composição, agregação)
            - 'NEW_DATATYPE': Novos tipos de dados definidos pelo usuário
            - 'OTHER': Outros tokens não categorizados

    Examples:
        >>> get_token_category('KEYWORD_PACKAGE')
        'LANGUAGE_KEYWORD'
        >>> get_token_category('CLASS_KIND')
        'CLASS_STEREOTYPE'
        >>> get_token_category('IDENTIFIER')
        'ID'
        >>> get_token_category('STRING')
        'LITERAL'
    """
    if token_type in language_keywords.values():
        return "LANGUAGE_KEYWORD"
    elif token_type in class_stereotypes.values():
        return "CLASS_STEREOTYPE"
    elif token_type in relation_stereotypes.values():
        return "RELATION_STEREOTYPE"
    elif token_type in data_types.values():
        return "DATA_TYPE"
    elif token_type in meta_attributes.values():
        return "META_ATTRIBUTE"
    elif token_type == "IDENTIFIER":
        return "IDENTIFIER"
    elif token_type in ["STRING", "NUMBER"]:
        return "LITERAL"
    elif token_type in ["[", "]", "(", ")", "{", "}"]:
        return "DELIMITER"
    elif token_type in [":", "*", "@", ".", "-"]:
        return "PUNCTUATION"
    elif token_type in ["CARDINALITY", "COMPOSITIONL", "COMPOSITIONR", "AGGREGATIONL", "AGGREGATIONR"]:
        return "RELATION_OPERATOR"
    elif token_type == "NEW_DATATYPE":
        return "NEW_DATATYPE"
    else:
        return "OTHER"
