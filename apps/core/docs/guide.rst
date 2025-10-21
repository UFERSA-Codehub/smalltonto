Guia do Usuário
================

Esta seção fornece informações sobre como instalar, configurar e usar o analisador 
léxico do smallTONTO.

Instalação
----------

1. Clone o repositório::

    git clone https://github.com/UFERSA-Codehub/smalltonto.git
    cd smalltonto/apps/core

2. Crie um ambiente virtual::

    python -m venv .venv
    source .venv/bin/activate  # Linux/Mac
    # ou
    .venv\Scripts\activate  # Windows

3. Instale as dependências::

    pip install -r requirements.txt

Uso Básico do Lexer
--------------------

Importando e usando o lexer
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: python

    from lexer.Lexer import build_lexer
    
    # Criar uma instância do lexer
    lexer = build_lexer()
    
    # Tokenizar código Tonto
    codigo_tonto = """
    package ExemploBasico {
        kind Person {
            nome: String
            idade: Number
        }
    }
    """
    
    lexer.input(codigo_tonto)
    
    # Obter todos os tokens
    for token in lexer:
        print(f"{token.type}: {token.value}")

Exemplo de saída::

    KEYWORD_PACKAGE: package
    CLASS_NAME: ExemploBasico
    LBRACE: {
    CLASS_KIND: kind
    CLASS_NAME: Person
    LBRACE: {
    CLASS_NAME: nome
    COLON: :
    TYPE_STRING: String
    CLASS_NAME: idade
    COLON: :
    TYPE_NUMBER: Number
    RBRACE: }
    RBRACE: }

Uso via Linha de Comando
------------------------

O tokenizador pode ser usado diretamente via linha de comando para analisar 
arquivos .tonto::

    python -m lexer.Tokenizer arquivo.tonto

**Saída detalhada incluirá:**

1. **Resumo do arquivo** - Nome, tamanho, total de tokens
2. **Tabela de tokens** - Tipo, valor, categoria semântica, linha e coluna
3. **Relatório de erros** - Erros léxicos encontrados (se houver)
4. **Estatísticas visuais** - Distribuição de categorias de tokens com gráficos

Exemplo de uso::

    python -m lexer.Tokenizer examples/professor/CarExample/src/car.tonto

Tratamento de Erros
-------------------

O analisador léxico mantém uma lista global de erros léxicos encontrados durante a análise.
Estes erros são armazenados na variável ``lexer_errors`` e podem ser acessados 
após a tokenização:

.. code-block:: python

    from lexer.Lexer import build_lexer, lexer_errors
    
    lexer = build_lexer()
    lexer.input("kind Pessoa { nome, idade }")  # vírgula é ilegal
    
    # Processar tokens
    list(lexer)
    
    # Verificar erros
    if lexer_errors:
        print("Erros encontrados:")
        for erro in lexer_errors:
            print(f"  {erro}")

Tipos de Token Suportados
--------------------------

O analisador léxico reconhece **diferentes tipos de tokens**, organizados nas seguintes categorias:

Palavras-chave da Linguagem
^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: text

   Token                    Palavra-chave
   ──────────────────────── ─────────────────────
   KEYWORD_PACKAGE          package
   KEYWORD_IMPORT           import
   KEYWORD_GENSET           genset
   KEYWORD_DISJOINT         disjoint
   KEYWORD_COMPLETE         complete
   KEYWORD_GENERAL          general
   KEYWORD_SPECIFICS        specifics
   KEYWORD_WHERE            where
   KEYWORD_SPECIALIZES      specializes
   KEYWORD_RELATOR          relator
   KEYWORD_RELATORS         relators
   KEYWORD_FUNCTIONAL_COMPLEXES  functional-complexes

Estereótipos de Classe OntoUML
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: text

   Token                    Estereótipo
   ──────────────────────── ─────────────────────
   CLASS_KIND               kind
   CLASS_SUBKIND            subkind
   CLASS_PHASE              phase
   CLASS_ROLE               role
   CLASS_CATEGORY           category
   CLASS_MIXIN              mixin
   CLASS_PHASEMIXIN         phaseMixin
   CLASS_ROLEMIXIN          roleMixin
   CLASS_COLLECTIVE         collective
   CLASS_QUANTITY           quantity
   CLASS_QUALITY            quality
   CLASS_MODE               mode
   CLASS_EVENT              event
   CLASS_SITUATION          situation
   CLASS_PROCESS            process
   CLASS_HISTORICALROLE     historicalRole

Estereótipos de Relação OntoUML
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: text

   Token                         Estereótipo
   ───────────────────────────── ─────────────────────
   RELATION_MATERIAL             material
   RELATION_MEDIATION            mediation
   RELATION_CHARACTERIZATION     characterization
   RELATION_FORMAL               formal
   RELATION_DERIVATION           derivation
   RELATION_COMPARATIVE          comparative
   RELATION_EXTERNALDEPENDENCE   externalDependence
   RELATION_COMPONENTOF          componentOf
   RELATION_MEMBEROF             memberOf
   RELATION_COMPOSITION          composition
   RELATION_AGGREGATION          aggregation
   RELATION_PARTICIPATION        participation

Tipos de Dados
^^^^^^^^^^^^^^^

.. code-block:: text

   Token            Tipo
   ──────────────── ─────────────
   TYPE_STRING      String
   TYPE_NUMBER      Number
   TYPE_BOOLEAN     Boolean
   TYPE_DATE        Date
   TYPE_TIME        Time
   TYPE_DATETIME    Datetime

Delimitadores e Operadores
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: text

   Token            Símbolo      Descrição
   ──────────────── ──────────── ─────────────────────────
   LBRACE           {            Chave esquerda
   RBRACE           }            Chave direita
   LPAREN           (            Parêntese esquerdo
   RPAREN           )            Parêntese direito
   LBRACKET         [            Colchete esquerdo
   RBRACKET         ]            Colchete direito
   COLON            :            Dois-pontos
   COMMA            ,            Vírgula (reportada como erro)
   DASH             -            Traço (usado em relações)
   ASTERISK         *            Asterisco
   ANNOTATION       @            Arroba (para anotações)

Tokens Especiais de Relação
^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: text

   Token            Símbolo      Descrição
   ──────────────── ──────────── ─────────────────────────
   ASSOCIATION      --           Associação simples
   ASSOCIATIONl     <--          Associação direcional reversa
   ASSOCIATIONR     -->          Associação direcional
   ASSOCIATIONLR    <-->         Associação bidirecional
   AGGREGATIONL     <>--         Agregação esquerda
   AGGREGATIONR     --<>         Agregação direita
   COMPOSITIONL     <o>--        Composição esquerda
   COMPOSITIONR     --<o>        Composição direita
   CARDINALITY      ..           Intervalo de cardinalidade

Identificadores
^^^^^^^^^^^^^^^

.. code-block:: text

   Token            Descrição
   ──────────────── ────────────────────────────────
   CLASS_NAME       Nomes de classes e tipos
   RELATION_NAME    Nomes de relações
   INSTANCE_NAME    Nomes de instâncias
   IDENTIFIER       Identificadores gerais

Categorias Semânticas
---------------------

O lexer categoriza tokens semanticamente para facilitar processamento posterior:

* **LANGUAGE_KEYWORD** - Palavras-chave da linguagem
* **CLASS_STEREOTYPE** - Estereótipos de classe OntoUML
* **RELATION_STEREOTYPE** - Estereótipos de relação OntoUML
* **DATA_TYPE** - Tipos de dados primitivos
* **META_ATTRIBUTE** - Meta-atributos
* **ID** - Identificadores (nomes de classe, relação, instância)
* **LITERAL** - Valores literais (string, número)
* **DELIMITER** - Delimitadores (chaves, parênteses, colchetes)
* **PUNCTUATION** - Pontuação (dois-pontos, asterisco, etc.)
* **RELATION_OPERATOR** - Operadores de relação (composição, agregação)

API Programática
----------------

Para uma referência completa da API, consulte a :doc:`api`. O módulo principal 
oferece funções para:

* ``build_lexer()`` - Construir uma instância do lexer
* ``get_errors()`` - Obter lista de erros léxicos
* ``get_keyword_categories()`` - Obter categorias de palavras-chave
* ``get_token_category(token_type)`` - Obter categoria semântica de um token


Para informações detalhadas sobre exemplos de uso, consulte a seção :doc:`examples`.