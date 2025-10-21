smallTONTO
========================

**smallTONTO** é um projeto de desenvolvimento incremental de um conjunto completo de 
ferramentas para a linguagem de modelagem Tonto, que suporta conceitos de OntoUML 
incluindo estereótipos de classe e relação, além de construções específicas para 
modelagem ontológica.

Sobre o Projeto
-----------------------

**Analisador Léxico**

O projeto atualmente inclui um analisador léxico completo implementado usando PLY 
(Python Lex-Yacc) que reconhece:

* **Palavras-chave da linguagem** - ``package``, ``import``, ``genset``, ``specializes``, etc.
* **Estereótipos OntoUML para classes** - ``kind``, ``subkind``, ``phase``, ``role``, ``category``, ``quality``, ``mode``, ``event``, ``situation``, etc.
* **Estereótipos OntoUML para relações** - ``material``, ``mediation``, ``characterization``, ``formal``, ``derivation``, etc.
* **Identificadores e nomes** - Classes, relações, instâncias com convenções específicas
* **Literais** - Strings, números
* **Operadores e delimitadores** - Chaves, parênteses, colchetes, dois-pontos, etc.
* **Tokens especiais de relação** - Composição (``--<o>``), agregação (``--<>``), associações direcionais
* **Comentários e anotações** - ``@mediation``, ``-- nomeRelacao --``

Documentação
============

.. toctree::
   :maxdepth: 5
   :caption: Conteúdo:

   guide
   examples
   api

Índices e Referências
=====================

* :ref:`genindex`
* :ref:`modindex`

