Referência da API
=================

Esta seção contém a documentação completa da API do analisador léxico smallTONTO,
gerada automaticamente a partir dos docstrings dos módulos.

Visão Geral
-----------

O analisador léxico smallTONTO é construído usando PLY (Python Lex-Yacc) e fornece uma
solução completa de tokenização para a linguagem Tonto. A API consiste em cinco módulos principais:

* **Lexer** - A implementação principal do analisador léxico
* **TokenType** - Definições e constantes dos tipos de token
* **Tokenizer** - Interface de linha de comando para tokenização
* **Utils** - Funções utilitárias para manipulação de arquivos e gerenciamento de erros
* **lexer** - Inicialização do pacote e ponto de entrada principal

Componentes Principais
----------------------

Analisador Léxico
^^^^^^^^^^^^^^^^^

A implementação principal do lexer fornecendo funcionalidade de tokenização.

.. automodule:: lexer.Lexer
   :members:
   :undoc-members:
   :show-inheritance:
   :member-order: bysource

Tipos de Token
^^^^^^^^^^^^^^

Definições abrangentes dos tipos de token para a linguagem Tonto.

.. automodule:: lexer.TokenType
   :members:
   :undoc-members:
   :show-inheritance:
   :member-order: alphabetical

Interface de Linha de Comando
------------------------------

CLI do Tokenizador
^^^^^^^^^^^^^^^^^^

Interface de linha de comando para tokenização interativa e processamento de arquivos.

.. automodule:: lexer.Tokenizer
   :members:
   :undoc-members:
   :show-inheritance:
   :member-order: bysource

Utilitários
-----------

Funções Utilitárias
^^^^^^^^^^^^^^^^^^^

Funções auxiliares para operações de arquivo, tratamento de erros e tarefas comuns.

.. automodule:: lexer.Utils
   :members:
   :undoc-members:
   :show-inheritance:
   :member-order: bysource

Módulo do Pacote
----------------

Pacote Principal
^^^^^^^^^^^^^^^^

Inicialização do pacote e ponto de entrada principal.

.. automodule:: lexer
   :members:
   :member-order: bysource
   :no-index: