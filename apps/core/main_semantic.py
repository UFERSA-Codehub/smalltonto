#!/usr/bin/env python
"""
Script principal para análise semântica de arquivos Tonto.

Executa o pipeline completo: Lexer -> Parser -> Análise Semântica
e exibe os resultados usando o SemanticVisualizer.

Usage:
    python main_semantic.py <source_file> [options]

Options:
    -v, --verbose  Show detailed pattern information and violations
    --json         Output full results as JSON

Examples:
    python main_semantic.py examples/example.tonto
    python main_semantic.py examples/example.tonto --verbose
    python main_semantic.py examples/example.tonto --json
"""

from lexer.MyLexer import MyLexer
from parser.MyParser import MyParser
from parser.ParserSemantic import ParserSemantic
from parser.SemanticVisualizer import print_semantic_report
import json
import sys
import os


def main():
    """
    Ponto de entrada principal.
    
    Processa argumentos da linha de comando, executa análise léxica,
    sintática e semântica, e exibe resultados usando o visualizador.
    """
    if len(sys.argv) < 2:
        print("Usage: python main_semantic.py <source_file> [options]")
        print("\nRuns full compiler pipeline: Lexer -> Syntax Analysis -> Semantic Analysis")
        print("\nOptions:")
        print("  -v, --verbose  Show detailed pattern information and violations")
        print("  --json         Output full results as JSON")
        sys.exit(1)

    filepath = sys.argv[1]

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            code = f.read()
    except FileNotFoundError:
        print(f"Error: File '{filepath}' not found")
        sys.exit(1)

    # Inicializar lexer
    lexer = MyLexer()
    lexer.build()

    # Inicializar parser
    parser = MyParser(lexer)
    parser.build(debug=False)

    # Executar análise sintática
    ast = parser.parse(code, filename=os.path.abspath(filepath))

    # Executar análise semântica
    semantic = ParserSemantic()
    result = semantic.analyze(ast, filename=filepath)

    # Adicionar erros do lexer/parser ao resultado para o visualizador
    result["lexer_errors"] = lexer.errors
    result["parser_errors"] = parser.errors

    # Verificar modo verbose
    verbose = "--verbose" in sys.argv or "-v" in sys.argv

    # Imprimir relatório visual
    print_semantic_report(result, filepath, verbose=verbose)

    # Saída JSON se solicitada
    if "--json" in sys.argv:
        print("\n" + "=" * 60)
        print("FULL JSON OUTPUT")
        print("=" * 60)
        # Remover erros do lexer/parser antes de serializar (já mostrados no visualizador)
        result_copy = {k: v for k, v in result.items() if k not in ("lexer_errors", "parser_errors")}
        print(json.dumps(result_copy, indent=2))


# Recomendação pra teste:
# examples/professor/Pizzaria_Model/src/Monobloco/Pizzaria_MONO.tonto
# examples/example2.tonto
# examples/professor/Hospital_Model/src/Pessoa.tonto
# examples/professor/Pizzaria_Model/src/Pessoa.tonto
# examples/professor/FoodAllergyExample/src/alergiaalimentar.tonto
if __name__ == "__main__":
    main()
