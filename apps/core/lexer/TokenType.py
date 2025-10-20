# Define as palavras reservadas da linguagem
language_keywords = {
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

# Lista de tokens
tokens = [
    "IDENTIFIER",  # Identificadores e nomes
    "STRING",  # Literais de string
    "NUMBER",  # Literais numéricos
    "LBRACE",  # "{"
    "RBRACE",  # "}"
    "LPAREN",  # "("
    "RPAREN",  # ")"
    "LBRACKET",  # "["
    "RBRACKET",  # "]"
    "CARDINALITY",  # ".."
    "AGGREGATIONL",  # "<>--"
    "AGGREGATIONR",  # "--<>"
    "COMPOSITIONL",  # "<o>--"
    "COMPOSITIONR",  # "--<o>"
    "ASTERISK",  # "*"
    "ANNOTATION",  # "@"
    "COLON",  # ":"
    "COMMA",  # ","
    "DASH",  # "-" usado em functional-complexes
    "ASSOCIATION",  # "--" usado em associações com direção irrelevante
    "ASSOCIATIONl",  # "<--" usado em associações direcionadas reversas
    "ASSOCIATIONR",  # "-->" usado em associações direcionadas
    "ASSOCIATIONLR",  # "<-->" usado em associações bidirecionais
    "CLASS_NAME",
    "RELATION_NAME",
    "INSTANCE_NAME",
] + list(reserved.values())


def get_keyword_categories():
    """
    Returns a dictionary of all keyword categories for external use
    (e.g., syntax highlighting).

    Returns:
    dict: Dictionary with keys 'language', 'class_stereotypes',
    'relation_stereotypes', 'data_types', 'meta_attributes'
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
    Returns the category of a given token type.
    For semantic analysis and syntax highlighting.

    Args:
    token_type (str): The token type (e.g., 'KEYWORD_PACKAGE', 'CLASS_KIND')

    Returns:
    str: The category name (e.g., 'LANGUAGE_KEYWORD', 'CLASS_STEREOTYPE')
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
    elif token_type in ["CLASS_NAME", "RELATION_NAME", "INSTANCE_NAME"]:
        return "ID"
    elif token_type == "IDENTIFIER":
        return "ID"
    elif token_type in ["STRING", "NUMBER"]:
        return "LITERAL"
    elif token_type in ["LBRACE", "RBRACE", "LPAREN", "RPAREN", "LBRACKET", "RBRACKET"]:
        return "DELIMITER"
    elif token_type in ["COLON", "ASTERISK", "ANNOTATION", "CARDINALITY"]:
        return "PUNCTUATION"
    elif token_type in ["COMPOSITIONL", "COMPOSITIONR", "AGGREGATIONL", "AGGREGATIONR"]:
        return "RELATION_OPERATOR"
    else:
        return "OTHER"
