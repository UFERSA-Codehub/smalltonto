#!/usr/bin/env python3
import os
import sys

from PyQt6.QtWidgets import QApplication

# Add parent directory to path to import lexer modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tonto_gui import TontoLexerGUI


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("Tonto Lexer GUI")
    app.setApplicationVersion("1.0")

    window = TontoLexerGUI()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
