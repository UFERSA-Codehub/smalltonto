<div align="center">
  <h1>SmallTonto Core</h1>
  <p>Ferramentas CLI para análise léxica e sintática da linguagem TONTO</p>

  <p>
    <a href="https://www.python.org/downloads/">
      <img src="https://img.shields.io/badge/python-3.11+-blue.svg" alt="Python">
    </a>
    <a href="https://pypi.org/project/ply/">
      <img src="https://img.shields.io/badge/PLY-3.11-orange.svg" alt="PLY">
    </a>
  </p>
</div>

---

## Sumário

- [Requisitos](#requisitos)
- [Instalação](#instalação)
- [Uso](#uso)
  - [Analisador Léxico](#analisador-léxico)
  - [Analisador Sintático](#analisador-sintático)
- [Estrutura de Arquivos](#estrutura-de-arquivos)
- [Exemplos](#exemplos)

---

## Requisitos

- Python 3.11 ou superior
- pip (gerenciador de pacotes Python)

---

## Instalação

### 1. Clone o repositório (se ainda não o fez)

```bash
git clone https://github.com/UFERSA-Codehub/smalltonto.git
cd smalltonto
```

### 2. Navegue até a pasta core

```bash
cd apps/core
```

### 3. Crie e ative um ambiente virtual

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\activate
```

**Linux/macOS:**
```bash
python -m venv .venv
source .venv/bin/activate
```

> **Nota para Windows:** Caso encontre erro de execução de scripts, execute `Set-ExecutionPolicy AllSigned` no PowerShell como Administrador.

### 4. Instale as dependências

```bash
pip install -r requirements.txt
```

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Uso

### Analisador Léxico

O analisador léxico tokeniza arquivos `.tonto` e exibe uma análise detalhada dos tokens encontrados.

```bash
python lexer/Tokenizer.py <arquivo.tonto> [--truncate]
```

**Parâmetros:**
- `<arquivo.tonto>` - Caminho para o arquivo a ser analisado
- `--truncate` - (Opcional) Limita a exibição a 20 tokens para arquivos grandes

**Exemplo:**
```bash
python lexer/Tokenizer.py examples/example.tonto
python lexer/Tokenizer.py examples/example.tonto --truncate
```

**Saída:**
- Lista completa de tokens com tipo, valor, categoria, linha e coluna
- Estatísticas de distribuição por categoria
- Relatório de erros léxicos encontrados

<div align="center">
  <img src="../../apps/docs/images/lexer-cli.png" alt="Exemplo de saída do analisador léxico" height="400">
  <p><em>Exemplo da saída do analisador léxico mostrando tokenização completa e estatísticas.</em></p>
</div>

---

### Analisador Sintático

O analisador sintático verifica a estrutura gramatical do código e gera uma Árvore Sintática Abstrata (AST).

```bash
python main.py <arquivo.tonto>
```

**Exemplo:**
```bash
python main.py examples/example.tonto
```

**Saída:**
- AST em formato JSON (em caso de sucesso)
- Relatório de erros sintáticos com:
  - Localização (arquivo, linha, coluna)
  - Mensagem descritiva
  - Tokens esperados
  - **Recomendações** contextuais para correção

**Exemplo de erro com recomendação:**
```
Syntax Errors:
  → test.tonto:1:1: Unexpected token 'packge' (type: IDENTIFIER). Expected: package, import
    packge TestTypo
    ^
    Recommendation: Did you mean 'package'?
```

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Estrutura de Arquivos

```
apps/core/
├── lexer/
│   ├── MyLexer.py       # Implementação do analisador léxico
│   ├── TokenType.py     # Definições de tokens e palavras reservadas
│   ├── Tokenizer.py     # CLI para tokenização
│   └── Utils.py         # Utilitários de formatação de saída
│
├── parser/
│   ├── MyParser.py      # Implementação do analisador sintático
│   └── parser.out       # Tabelas geradas pelo PLY (automático)
│
├── examples/
│   ├── example.tonto    # Exemplos básicos
│   ├── example2.tonto
│   ├── example3.tonto
│   └── errors/          # Arquivos de teste para tratamento de erros
│
├── tests/
│   └── test_lexer.py    # Testes unitários
│
├── main.py              # CLI principal para análise sintática
├── requirements.txt     # Dependências Python
└── README.md            # Este arquivo
```

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

## Exemplos

A pasta `examples/` contém arquivos `.tonto` para testar os analisadores:

<div align="center">
  <table>
    <thead>
      <tr>
        <th>Arquivo</th>
        <th>Descrição</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>example.tonto</code></td>
        <td>Exemplo básico com classes e relações</td>
      </tr>
      <tr>
        <td><code>example2.tonto</code></td>
        <td>Exemplo com relator e mediações</td>
      </tr>
      <tr>
        <td><code>example3.tonto</code></td>
        <td>Exemplo abrangente com múltiplos construtos</td>
      </tr>
      <tr>
        <td><code>errors/</code></td>
        <td>Arquivos com erros intencionais para testar o tratamento de erros</td>
      </tr>
    </tbody>
  </table>
</div>

### Exemplo de código TONTO válido

```tonto
package University

kind Person {
    name: String
    birthDate: Date {const}
}

subkind Student specializes Person {
    enrollmentId: String
}

relator Enrollment {
    @mediation -- [1] Student
    @mediation -- [1] Course
}
```

<p align="right">(<a href="#sumário">voltar ao topo</a>)</p>

---

<div align="center">
  <p>
    <a href="../../README.md">← Voltar para o README principal</a>
  </p>
</div>
