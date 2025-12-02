<div align="center">
  <img src="apps/docs/images/(small)TontoLogo.png" alt="SmallTonto" width="400">

  <h3>Compilador para a linguagem TONTO (Textual Ontology Language)</h3>

  <p>
    <a href="https://ufersa-codehub.github.io/smalltonto/">
      <img src="https://img.shields.io/badge/docs-latest-brightgreen.svg?style=flat" alt="Documentation">
    </a>
    <a href="https://www.python.org/downloads/">
      <img src="https://img.shields.io/badge/python-3.11+-blue.svg" alt="Python">
    </a>
    <a href="https://nodejs.org/">
      <img src="https://img.shields.io/badge/node-18+-green.svg" alt="Node.js">
    </a>
    <!--
    <a href="LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License">
    </a>
    -->
  </p>

  <table>
    <tr>
      <td align="left">
        <strong>Disciplina:</strong> Compiladores<br>
        <strong>Curso:</strong> Ciência da Computação<br>
        <strong>Universidade:</strong> UFERSA - Universidade Federal Rural do Semiárido<br>
        <strong>Ano:</strong> 2025
      </td>
    </tr>
  </table>
</div>

---

## Sumário

- [Início Rápido](#início-rápido)
- [Sobre o Projeto](#sobre-o-projeto)
  - [Linguagem TONTO](#linguagem-tonto---textual-ontology-language)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Unidade 1: Analisador Léxico](#unidade-1-analisador-léxico)
  - [Problema](#problema)
  - [Exemplo de Saída](#exemplo-de-saída)
- [Unidade 2: Analisador Sintático](#unidade-2-analisador-sintático)
  - [Problema](#problema-1)
  - [Exemplo de Saída](#exemplo-de-saída-1)
- [Referências](#referências)

---

## Início Rápido

Executáveis pré-compilados estão disponíveis na aba [Releases](https://github.com/UFERSA-Codehub/smalltonto/releases).

<div align="center">
  <table>
    <thead>
      <tr>
        <th>Componente</th>
        <th>Descrição</th>
        <th>Download</th>
        <th>Build Manual</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Viewer (Desktop)</strong></td>
        <td>Interface gráfica com editor e visualização de AST</td>
        <td><a href="https://github.com/UFERSA-Codehub/smalltonto/releases/tag/v0.1.1">v0.1.1</a> (Windows)</td>
        <td><a href="apps/viewer/README.md#build">Instruções</a></td>
      </tr>
      <tr>
        <td><strong>Core (CLI)</strong></td>
        <td>Análise léxica e sintática via terminal</td>
        <td><a href="https://github.com/UFERSA-Codehub/smalltonto/releases/tag/v1.0.0">v1.0.0</a> (Windows)</td>
        <td><a href="apps/core/README.md#instalação">Instruções</a></td>
      </tr>
    </tbody>
  </table>
</div>

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Sobre o Projeto

No presente repositório estão as implementações avaliativas para a disciplina de Compiladores, separadas por unidade. Cada unidade define a implementação de uma parte de um Compilador de Linguagem de Ontologia Textual (*Textual Ontology Language*, TONTO), limitando-se porém aos analisadores léxico, sintático e semântico, de modo a se adequar ao escopo dessa disciplina.

### Linguagem TONTO - *Textual Ontology Language*

A TONTO (Textual Ontology Language) é uma linguagem textual para especificação de ontologias computacionais — grafos de conhecimento usados na Web Semântica (Web 3.0). Criada para facilitar o desenvolvimento de ontologias por especialistas de diversas áreas, a TONTO permite gerar automaticamente modelos em formatos como OntoUML, JSON e gUFO (OWL). Possui suporte no VSCode, com ferramentas para modularização, orquestração de dependências e conversão entre formatos.

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Estrutura do Projeto

```
smalltonto/
├── apps/
│   ├── core/           # CLI - Analisador Léxico e Sintático
│   │   ├── lexer/      # Implementação do analisador léxico
│   │   ├── parser/     # Implementação do analisador sintático
│   │   └── examples/   # Arquivos de exemplo .tonto
│   │
│   ├── viewer/         # Aplicação Desktop
│   │   ├── api/        # Backend Python (PyWebView)
│   │   └── frontend/   # Frontend React + Vite
│   │
│   └── docs/           # Documentação e imagens
│
└── README.md           # Este arquivo
```

<div align="center">
  <table>
    <thead>
      <tr>
        <th>Componente</th>
        <th>Descrição</th>
        <th>Documentação</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Core (CLI)</strong></td>
        <td>Ferramentas de linha de comando para análise léxica e sintática</td>
        <td><a href="apps/core/README.md">apps/core/README.md</a></td>
      </tr>
      <tr>
        <td><strong>Viewer (Desktop)</strong></td>
        <td>Aplicação desktop com interface gráfica para visualização</td>
        <td><a href="apps/viewer/README.md">apps/viewer/README.md</a></td>
      </tr>
    </tbody>
  </table>
</div>

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Unidade 1: Analisador Léxico

### Problema

Projetar um analisador léxico para a linguagem TONTO para reconhecer os elementos da linguagem. Considerando que o autor da ferramenta já disponibiliza um analisador para tal, alguns requisitos mais específicos serão dados neste trabalho de implementação e pesquisa, de forma a permitir que um ontologista crie um documento TONTO com um formato bem definido para cada um dos elementos da linguagem.

O analisador deve reconhecer os seguintes casos:

- **Estereótipos de classe:** `event, situation, process, category, mixin, phaseMixin, roleMixin, historicalRoleMixin, kind, collective, quantity, quality, mode, intrisicMode, extrinsicMode, subkind, phase, role, historicalRole.`
- **Estereótipos de relações:** `material, derivation, comparative, mediation, characterization, externalDependence, subCollectionOf, subQualityOf, componentOf, instantiation, memberOf, termination, participational, participation, historicalDependence, creation, manifestation, bringsAbout, triggers, composition, aggregation, inherence, value, formal, constitution`.
- **Palavras reservadas:** `genset, disjoint, complete, general, specifics, where, package, import, functional-complexes.`
- **Símbolos especiais:** `{`, `}`, `(`, `)`, `[`, `]`, `..`, `<>--`, `--<>`, `*`, `@`, `:`.
- **Convenção para nomes de classes:** iniciando com letra maiúscula, seguida por qualquer combinação de letras, ou tendo sublinhado como subcadeia própria, sem números. Exemplos: *Person, Child, Church, University, Second_Baptist_Church.*
- **Convenção para nomes de relações:** começando com letra minúscula, seguida por qualquer combinação de letras, ou tendo sublinhado como subcadeia própria, sem números. Exemplos: *has, hasParent, has_parent, isPartOf, is_part_of.*
- **Convenção para nomes de instâncias:** iniciando com qualquer letra, podendo ter o sublinhado como subcadeia própria e terminando com algum número inteiro. Exemplos: *Planeta1, Planeta2, pizza03, pizza123.*
- **Tipos de dados nativos:** `number, string, boolean, date, time, datetime.`
- **Novos tipos:** iniciando com letra, sem números, sem sublinhado e terminando com a subcadeia "DataType". Exemplo: *CPFDataType, PhoneNumberDataType.*
- **Meta-atributos:** `ordered, const, derived, subsets, redefines.`

### Exemplo de Saída

<div align="center">
  <img src="apps/docs/images/lexer-cli.png" alt="Exemplo de saída do analisador léxico" height="500">
  <p><em>Exemplo da saída do analisador mostrando tokenização completa, erros léxicos detectados e estatísticas de distribuição por categoria.</em></p>
</div>

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Unidade 2: Analisador Sintático

### Problema

Projetar um analisador sintático para a linguagem TONTO para verificação da corretude da especificação textual de uma ontologia nos seguintes casos:

#### 1. Declaração de pacotes

Uma especificação Tonto é dividida em pacotes. Cada pacote define uma "visão" de uma ontologia. Vários pacotes ou visões compõem uma ontologia completa. Pacotes funcionam como *namespaces* ou contêineres lógicos de classes, seus respectivos atributos e relações. Cada modelo em Tonto precisa começar com a declaração de um pacote:

```tonto
package myPackage
```

#### 2. Declaração de classes

Uma classe é declarada com um estereótipo de classe em OntoUML (e.g., **kind**, **subkind**, **role**, **phase** etc.) seguida de seu nome conforme regras definidas no analisador léxico. A declaração de uma classe pode conter atributos próprios:

```tonto
kind Person {
  name: string
  birthDate: date {const}
}

phase Child specializes Person
```

#### 3. Declaração de tipos de dados

Tonto contém seis tipos de dados nativos (***number***, ***string***, ***boolean***, ***date***, ***time*** e ***datetime***). É possível construir ou derivar outros tipos mais complexos a partir desses tipos básicos:

```tonto
datatype Address {
  street: string
  number: int
}
```

#### 4. Declaração de classes enumeradas

Certas classes podem ser criadas com um tipo finito e pré-definido de instâncias. Essas são as chamadas classes enumeradas (**enumerated classes**):

```tonto
enum EyeColor { Blue, Green, Brown, Black }
```

#### 5. Generalizações (*Generalization sets*)

Ontologias são vocabulários construídos com base em taxonomias. As taxonomias podem ser organizadas em grupos de generalizações:

```tonto
disjoint complete genset PersonAgeGroup where Child, Adult specializes Person

genset PersonAgeGroup {
  general Person
  specifics Child, Adult
}
```

#### 6. Declarações de relações

Em Tonto, uma relação pode ser declarada interna ou externamente a uma classe:

```tonto
// Relação interna
kind University {
  @componentOf [1] <>-- [1..*] Department
}

// Relação externa
@mediation relation EmploymentContract [1..*] -- [1] Employee
```

### Exemplo de Saída

<div align="center">
  <img src="apps/docs/images/viewer-app-ast-view.png" alt="Visualização da AST no Viewer" width="800">
  <p><em>Visualização da Árvore Sintática Abstrata (AST) no aplicativo Viewer.</em></p>
</div>

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Referências

1. W3C. (2025). Resource Description Framework – Concepts and Abstract Data Model. Disponível online em: https://www.w3.org/TR/rdf12-concepts/
2. W3C. (2012). Web Ontology Language Conformance (Second Edition). Disponível online em: https://www.w3.org/TR/owl2-conformance/
3. Guizzardi, G., Fonseca, C. M., Benevides, A. B., Almeida, J. P. A., Porello, D., & Sales, T. P. (2018, September). Endurant types in ontology-driven conceptual modeling: Towards OntoUML 2.0. In International Conference on Conceptual Modeling (pp. 136-150). Cham: Springer International Publishing.
4. Coutinho, M. L., Almeida, J. P. A., Sales, T. P., & Guizzardi, G. (2024). A Textual Syntax and Toolset for Well-Founded Ontologies. In 14th International Conference on Formal Ontology in Information Systems, FOIS 2024 (pp. 208-222). IOS.
5. Lenke, M., Tonto: A Textual Syntax for OntoUML – A textual way for conceptual modeling. Disponível online em: https://matheuslenke.github.io/tonto-docs/
6. Lenke, M., Tonto Grammar (Langium). Gramática de referência para o analisador sintático. Disponível online em: https://github.com/matheuslenke/Tonto/tree/main/packages/tonto/src/language/grammar
7. Alencar, P., Compiladores UFERSA. Repositório de testes e exemplos. Disponível online em: https://github.com/patricioalencar/Compiladores_UFERSA

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>
