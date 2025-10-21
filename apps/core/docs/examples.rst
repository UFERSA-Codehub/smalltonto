Exemplos
========

Esta seção contém exemplos de uso da linguagem Tonto e demonstra como o analisador 
léxico smallTONTO processa diferentes construções da linguagem.

Exemplos Básicos
-----------------

Exemplo: Propriedade de Carro
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Este exemplo mostra uma modelagem simples de propriedade de carros usando OntoUML:

.. code-block:: text

   package CarOwnership 

   kind Organization
   subkind CarAgency specializes Organization
   kind Car

   relator CarOwnership {
       @mediation
       -- involvesOwner -- [1] CarAgency

       @mediation
       -- involvesProperty -- [1] Car
   }

**Tokens gerados pelo lexer:**

.. code-block:: text

   KEYWORD_PACKAGE      package              LANGUAGE_KEYWORD
   CLASS_NAME           CarOwnership         ID
   CLASS_KIND           kind                 CLASS_STEREOTYPE
   CLASS_NAME           Organization         ID
   CLASS_SUBKIND        subkind              CLASS_STEREOTYPE
   CLASS_NAME           CarAgency            ID
   KEYWORD_SPECIALIZES  specializes          LANGUAGE_KEYWORD
   CLASS_NAME           Organization         ID
   CLASS_KIND           kind                 CLASS_STEREOTYPE
   CLASS_NAME           Car                  ID
   KEYWORD_RELATOR      relator              LANGUAGE_KEYWORD
   CLASS_NAME           CarOwnership         ID
   LBRACE               {                    DELIMITER
   ANNOTATION           @                    PUNCTUATION
   RELATION_MEDIATION   mediation            RELATION_STEREOTYPE
   DASH                 -                    PUNCTUATION
   DASH                 -                    PUNCTUATION
   RELATION_NAME        involvesOwner        ID
   DASH                 -                    PUNCTUATION
   DASH                 -                    PUNCTUATION
   LBRACKET             [                    DELIMITER
   NUMBER               1                    LITERAL
   RBRACKET             ]                    DELIMITER
   CLASS_NAME           CarAgency            ID
   ANNOTATION           @                    PUNCTUATION
   RELATION_MEDIATION   mediation            RELATION_STEREOTYPE
   DASH                 -                    PUNCTUATION
   DASH                 -                    PUNCTUATION
   RELATION_NAME        involvesProperty     ID
   DASH                 -                    PUNCTUATION
   DASH                 -                    PUNCTUATION
   LBRACKET             [                    DELIMITER
   NUMBER               1                    LITERAL
   RBRACKET             ]                    DELIMITER
   CLASS_NAME           Car                  ID
   RBRACE               }                    DELIMITER

**Observações importantes:**

* O token ``DASH`` representa cada caractere ``-`` individualmente
* Relações como ``-- involvesOwner --`` são tokenizadas como sequências de ``DASH``, ``RELATION_NAME``, ``DASH``
* Anotações como ``@mediation`` são divididas em ``ANNOTATION`` (``@``) + ``RELATION_MEDIATION`` (``mediation``)

Exemplo: Alergia Alimentar
^^^^^^^^^^^^^^^^^^^^^^^^^^

Este exemplo mostra uma modelagem mais complexa com múltiplos estereótipos OntoUML:

.. code-block:: text

   import alergiaalimentar

   package alergiaalimentar

   kind Paciente
   kind Alimento

   subkind Proteina of functional-complexes specializes Componente_Alimentar 
   phase Crianca of functional-complexes specializes Paciente 
   phase Adulto of functional-complexes specializes Paciente 

   mode Sintoma
   subkind Cutaneo of intrinsic-modes specializes Sintoma 
   subkind Gastrointestinal of intrinsic-modes specializes Sintoma 

   relator Alergia
   subkind Imuno_Mediada of relators specializes Alergia 
   subkind Nao_Imuno_Mediada of relators specializes Alergia 

   event Reacao_Adversa
   event Consumo_Alimentar

   quality Comobidarde_Alergica
   quality Heranca_Genetica

   situation Exposicao_ao_Alergeno

**Características destacadas:**

* **Estereótipos de classe OntoUML**: ``CLASS_KIND``, ``CLASS_SUBKIND``, ``CLASS_PHASE``, ``CLASS_MODE``, ``CLASS_ROLE``, ``CLASS_EVENT``, ``CLASS_SITUATION``, ``CLASS_QUALITY``
* **Estereótipos de relação**: ``KEYWORD_RELATOR``
* **Palavras-chave da linguagem**: ``KEYWORD_IMPORT``, ``KEYWORD_PACKAGE``, ``KEYWORD_SPECIALIZES``, ``KEYWORD_FUNCTIONAL_COMPLEXES``, ``KEYWORD_RELATORS``
* **Identificadores**: ``CLASS_NAME``, ``RELATION_NAME`` para nomes de classes e relações

Exemplos Avançados
-------------------

Exemplo: Generalização (Gensets)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

O lexer também processa conjuntos de generalização:

.. code-block:: text

   genset disjoint_complete {
       general Componente_Alimentar
       specifics Proteina Aditivo_Alimentar Carboidrato
   }

**Tokens para genset:**

.. code-block:: text

   KEYWORD_GENSET      genset               LANGUAGE_KEYWORD
   RELATION_NAME       disjoint_complete    ID
   LBRACE              {                    DELIMITER
   KEYWORD_GENERAL     general              LANGUAGE_KEYWORD
   CLASS_NAME          Componente_Alimentar ID
   KEYWORD_SPECIFICS   specifics            LANGUAGE_KEYWORD
   CLASS_NAME          Proteina             ID
   CLASS_NAME          Aditivo_Alimentar    ID
   CLASS_NAME          Carboidrato          ID
   RBRACE              }                    DELIMITER

**Nota sobre delimitadores:** Atualmente, vírgulas (``,``) são reportadas como caracteres ilegais. 
A linguagem Tonto usa espaços para separar itens em listas.

Tokens Especiais de Relação
^^^^^^^^^^^^^^^^^^^^^^^^^^^

O lexer reconhece tokens especiais para diferentes tipos de associações:

.. code-block:: text

   Token               Descrição                    Categoria
   ─────────────────────────────────────────────────────────
   ASSOCIATION         --                          Associação simples
   ASSOCIATIONl        <--                         Associação direcional reversa
   ASSOCIATIONR        -->                         Associação direcional
   ASSOCIATIONLR       <-->                        Associação bidirecional
   AGGREGATIONL        <>--                        Agregação esquerda
   AGGREGATIONR        --<>                        Agregação direita
   COMPOSITIONL        <o>--                       Composição esquerda
   COMPOSITIONR        --<o>                       Composição direita
   CARDINALITY         ..                          Intervalo de cardinalidade

Usando o Lexer
---------------

Uso Programático
^^^^^^^^^^^^^^^^

Para tokenizar estes exemplos programaticamente:

.. code-block:: python

   from lexer.Lexer import build_lexer

   # Código Tonto de exemplo
   codigo = '''
   package ExemploSimples
   
   kind Pessoa {
       nome: String
       idade: Number
   }
   
   subkind Estudante specializes Pessoa
   '''

   # Criar lexer e tokenizar
   lexer = build_lexer()
   lexer.input(codigo)

   # Processar todos os tokens
   tokens = []
   for token in lexer:
       tokens.append((token.type, token.value, token.lineno))
       print(f"Linha {token.lineno}: {token.type} = '{token.value}'")

   print(f"\\nTotal de tokens encontrados: {len(tokens)}")

Tratamento de Erros
^^^^^^^^^^^^^^^^^^^

O lexer pode detectar e reportar erros léxicos:

.. code-block:: python

   from lexer.Lexer import build_lexer, lexer_errors

   # Código com caracteres inválidos
   codigo_com_erro = "kind Pessoa { nome, idade }"  # vírgula é ilegal

   lexer = build_lexer()
   lexer.input(codigo_com_erro)
   
   # Processar tokens
   list(lexer)
   
   # Verificar erros
   if lexer_errors:
       print("Erros léxicos encontrados:")
       for erro in lexer_errors:
           print(f"  {erro}")

Uso via Linha de Comando
^^^^^^^^^^^^^^^^^^^^^^^^

Para analisar arquivos .tonto diretamente:

.. code-block:: bash

   # Tokenizar um arquivo específico
   python -m lexer.Tokenizer examples/professor/CarExample/src/car.tonto

   # Ou usar o exemplo de alergia alimentar
   python -m lexer.Tokenizer examples/professor/FoodAllergyExample/src/alergiaalimentar.tonto

A saída inclui:

* Tabela detalhada de todos os tokens com tipo, valor, categoria e posição
* Contagem total de tokens
* Relatório de erros léxicos (se houver)
* Estatísticas de distribuição por categoria
* Gráfico visual das proporções de diferentes tipos de tokens