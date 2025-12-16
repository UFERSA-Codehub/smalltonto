Documento de Requisitos: Analisador Semântico para Tonto
1. Identificação Institucional e Acadêmica

    Instituição: UNIVERSIDADE FEDERAL RURAL DO SEMI-ÁRIDO (UFERSA) 

Centro: CENTRO DE CIÊNCIAS EXATAS E NATURAIS (CCEN)

Departamento: DEPARTAMENTO DE COMPUTAÇÃO

Disciplina: COMPILADORES

Professor: PATRÍCIO DE ALENCAR SILVA

2. Definição do Projeto

Título: ANALISADOR SEMÂNTICO PARA A TEXTUAL ONTOLOGY LANGUAGE

Objetivo: Projetar um analisador semântico para validação de padrões de projeto de ontologias (ontology design patterns - ODPs) especificados na Textual Ontology Language (Tonto).

Contextualização:

    Neste semestre, estudamos como aplicar técnicas do processo de compilação para análise de construtos da linguagem Tonto (Textual Ontology Language).

A análise semântica envolve a validação de estruturas de código em função de seu contexto. Há vários escopos que definem o contexto de um operador de uma linguagem. Esse contexto pode ser imediato (p.ex.: parâmetros próximos, nomes de métodos ou funções, argumentos e outros "complementos" do operador) ou pode ser de ordem maior (p. ex.: importação de conceitos ou classes de múltiplos pacotes ou relações lógicas entre classes).

A linguagem Tonto é "declarativa", ou seja, é usada para representar conhecimento na forma de proposições lógicas a serem analisadas, interpretadas ou como base de inferência de agentes de software inteligentes.

Na fase de análise sintática, foram verificadas as formas corretas de se declarar classes, relações, cardinalidades e outros construtos da linguagem Tonto.

Na fase de análise semântica, o objetivo será validar padrões de projeto de ontologias (ontology design patterns - ODPs) que possam estar presentes no código. Os ODPs conferem uma estrutura lógica mais formal à especificação da ontologia, pois definem regras de combinação dos conceitos e relações.

3. Descrição do Problema: Padrões a Validar

Projetar um analisador semântico para a linguagem TONTO para validação dos seguintes padrões de projeto de ontologias:

3.1.
Subkind Pattern

Arquivo: Subkind_Pattern.tonto

Snippet de código

package Subkind_Pattern

kind ClassName

subkind SubclassName1 specializes ClassName
subkind SubclassName2 specializes ClassName

disjoint complete genset Kind_Subkind_Genset_Name {
    general ClassName
    specifics SubclassName1, SubclassName2
    // "complete" is optional, but "disjoint" applies to
}

3.2.
Role Pattern

Arquivo: Role_Pattern.tonto

Snippet de código

package Role_Pattern

kind ClassName

role Role_Name1 specializes ClassName
role Role_Name2 specializes ClassName

complete genset Class_Role_Genset_Name {
    general ClassName
    specifics Role_Name1, Role_Name2
}
//"complete" is optional, but "disjoint" doesnt apply to notes

3.3.
Phase Pattern

Arquivo: Phase_Pattern.tonto

Snippet de código

package Phase_Pattern

kind ClassName

phase Phase_Name1 specializes ClassName
phase Phase_Name2 specializes ClassName
phase Phase_NameN specializes ClassName

disjoint complete genset Class_Phase_Genset_Name {
    general ClassName
    specifics Phase_Name1, Phase_Name2, Phase_NameN
}
//"disjoint" is mandatory for phases, but "complete" is opt fonat

3.4.
Relator Pattern

Arquivo: Relator_Pattern.tonto

Snippet de código

package Relator_Pattern

kind ClassName1
kind ClassName2

role Role_Name1 specializes ClassName1
role Role_Name2 specializes ClassName2

relator Relator_Name {
    @mediation [1..*] - [1..*] Role_Name1
    @mediation [1..*] - [1..*] Role_Name2
}

@material relation Role_Name1 [1..*] relationName [1..*] Role_Name2
//"relationName" can be replaced by a specific name for the relation

3.5.
Mode Pattern

Arquivo: Mode_Pattern.tonto

Snippet de código

package Mode_Pattern

kind ClassName1
kind ClassName2

mode Mode_Name1 {
    @characterization [1..*] -- [1] ClassName1
    @externalDependence [1..*] -- [1] ClassName2
}

3.6.
RoleMixin Pattern

Arquivo: RoleMixin_Pattern.tonto

Snippet de código

package RoleMixin_Pattern

kind ClassName1
kind ClassName2

roleMixin RoleMixin_Name
role Role_Name1 specializes ClassName1, RoleMixin_Name
role Role_Name2 specializes ClassName2, RoleMixin_Name

disjoint complete genset RoleMixin_Genset_Name {
    general RoleMixin_Name
    specifics Role_Name1, Role_Name2
}

4. Critérios de Avaliação e Entrega

O trabalho deverá ser elaborado e avaliado de acordo com os seguintes critérios:

    Repositório e Documentação (Valor: 2 pontos): Os trabalhos deverão estar no GitHub, com documentação apropriada.

Saída da Análise (Valor: 5 pontos): A saída da análise deverá conter:

    (1) Padrões completos identificados no código;

(2) Padrões incompletos identificados por sobrecarregamento.

Vídeo Explicativo (Valor: 1 ponto): O vídeo explicativo de 05 (cinco) minutos continua obrigatório.

Tratamento de Erros (Valor: 2 pontos): Uso de técnica de coerção para corrigir erros.

Testes: Testes continuam disponíveis em: https://github.com/patricioalencar/Compiladores.