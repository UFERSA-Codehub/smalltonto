# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- New entries will be added here automatically -->

## [v2.0.0] - 2025-12-16

### Added
- improve changelog and add manual release workflow ([`58f218f`](https://github.com/UFERSA-Codehub/smalltonto/commit/58f218f))
- enhance PR body with grouped commits and tree-style file list ([`0f521f8`](https://github.com/UFERSA-Codehub/smalltonto/commit/0f521f8))
- adição de novos exemplos de uso da linguagem ([`5000d5b`](https://github.com/UFERSA-Codehub/smalltonto/commit/5000d5b))
- Json cru, separação de json da AST, visualização em hierarquia do pacote ([`b9e38b9`](https://github.com/UFERSA-Codehub/smalltonto/commit/b9e38b9))
- estereótipos de relação faltantes + exclusão de arquivos .tonto no gitignore ([`ba285eb`](https://github.com/UFERSA-Codehub/smalltonto/commit/ba285eb))
- arquivo .spec para criação do exe com pyinstaller ([`970b735`](https://github.com/UFERSA-Codehub/smalltonto/commit/970b735))
- script powershell para inicialização do projeto ([`4ee0170`](https://github.com/UFERSA-Codehub/smalltonto/commit/4ee0170))
- AST-node-view ([`177ca2e`](https://github.com/UFERSA-Codehub/smalltonto/commit/177ca2e))
- primeira versão do Viewer-App ([`6cc7d6e`](https://github.com/UFERSA-Codehub/smalltonto/commit/6cc7d6e))
- adicionado regra operadores de relação ([`b9ac567`](https://github.com/UFERSA-Codehub/smalltonto/commit/b9ac567))
- iniciado adição de regras de relação ([`0524023`](https://github.com/UFERSA-Codehub/smalltonto/commit/0524023))
- adiciona suporte para datatypes, enums e conjuntos de generalização ([`89d8034`](https://github.com/UFERSA-Codehub/smalltonto/commit/89d8034))
- regra para estereótipo de classe ([`3aca757`](https://github.com/UFERSA-Codehub/smalltonto/commit/3aca757))
- lógica de tratamento de erros ([`e6d7c73`](https://github.com/UFERSA-Codehub/smalltonto/commit/e6d7c73))
- parser com definições básicas para teste ([`c840fb8`](https://github.com/UFERSA-Codehub/smalltonto/commit/c840fb8))
- adição do analisador sintático ([`2a51a1f`](https://github.com/UFERSA-Codehub/smalltonto/commit/2a51a1f))
- estrutura base para o analisador sintático ([`576e407`](https://github.com/UFERSA-Codehub/smalltonto/commit/576e407))
- add Sphinx documentation with GitHub Pages deployment ([`5c171d1`](https://github.com/UFERSA-Codehub/smalltonto/commit/5c171d1))
- added new data column to token table and formatting changes ([`ce11c81`](https://github.com/UFERSA-Codehub/smalltonto/commit/ce11c81))
- added new column COLUMN to token_line in Tokenizer.py ([`9d9675d`](https://github.com/UFERSA-Codehub/smalltonto/commit/9d9675d))
- added rules for recognition of new TONTO data types ([`a516a53`](https://github.com/UFERSA-Codehub/smalltonto/commit/a516a53))
- upgraded summary output ([`3ce6ad6`](https://github.com/UFERSA-Codehub/smalltonto/commit/3ce6ad6))
- added error summary and utils for summary ([`3021b7e`](https://github.com/UFERSA-Codehub/smalltonto/commit/3021b7e))
- adding naming conventions for tokens ([`c5249ca`](https://github.com/UFERSA-Codehub/smalltonto/commit/c5249ca))
- tokenizer ([`7793f47`](https://github.com/UFERSA-Codehub/smalltonto/commit/7793f47))
- execution examples for testing ([`c5bf5e4`](https://github.com/UFERSA-Codehub/smalltonto/commit/c5bf5e4))
- finished lexer ([`e9be8d0`](https://github.com/UFERSA-Codehub/smalltonto/commit/e9be8d0))

### Fixed
- rename Emoji to Icon in legend and use UTC-3 timezone ([`7706f51`](https://github.com/UFERSA-Codehub/smalltonto/commit/7706f51))
- remove heredoc indentation causing permission error ([`c9f3f59`](https://github.com/UFERSA-Codehub/smalltonto/commit/c9f3f59))
- remove double JSON escaping in draft-pr workflow ([`eb05547`](https://github.com/UFERSA-Codehub/smalltonto/commit/eb05547))
- use double quotes for curl -d payload to properly expand PROMPT variable ([`c891173`](https://github.com/UFERSA-Codehub/smalltonto/commit/c891173))
- mudança de comportamento de ambos workflows ([`156cdee`](https://github.com/UFERSA-Codehub/smalltonto/commit/156cdee))
- Draft PR com sintaxe errada ([`cf53b63`](https://github.com/UFERSA-Codehub/smalltonto/commit/cf53b63))
- mudança no body do PR ([`55d5771`](https://github.com/UFERSA-Codehub/smalltonto/commit/55d5771))
- identação heredoc removido ([`1e26f40`](https://github.com/UFERSA-Codehub/smalltonto/commit/1e26f40))
- checagem da branch master para comparação ([`e8ab2fc`](https://github.com/UFERSA-Codehub/smalltonto/commit/e8ab2fc))
- removed incorrect prints in the lexer output ([`536b3ad`](https://github.com/UFERSA-Codehub/smalltonto/commit/536b3ad))
- husky hooks to be platform-aware ([`34e5615`](https://github.com/UFERSA-Codehub/smalltonto/commit/34e5615))
- added missing tokens and corrected datatypes to TokenType.py ([`4cc7d2d`](https://github.com/UFERSA-Codehub/smalltonto/commit/4cc7d2d))

### Changed
- extract draft-pr workflow logic to separate shell scripts ([`007fa74`](https://github.com/UFERSA-Codehub/smalltonto/commit/007fa74))
- excluding .tonto files from committing ([`826a225`](https://github.com/UFERSA-Codehub/smalltonto/commit/826a225))
- mudando a estrutura do analisador léxico para classe ([`4a8881c`](https://github.com/UFERSA-Codehub/smalltonto/commit/4a8881c))
- adição de literals, tokens faltantes, e correções ([`36ba12a`](https://github.com/UFERSA-Codehub/smalltonto/commit/36ba12a))

### Documentation
- mudar o link das instruções para a página de readme ([`86533db`](https://github.com/UFERSA-Codehub/smalltonto/commit/86533db))
- atualização do readme ([`72b6f7b`](https://github.com/UFERSA-Codehub/smalltonto/commit/72b6f7b))
- descrições faltantes na implementação do analisador sintático ([`91f7af5`](https://github.com/UFERSA-Codehub/smalltonto/commit/91f7af5))
- added example image ([`a6f5bdb`](https://github.com/UFERSA-Codehub/smalltonto/commit/a6f5bdb))
