import os
import sys

from file_explorer import FileExplorer
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QAction, QFont
from PyQt6.QtWidgets import (
    QFileDialog,
    QHBoxLayout,
    QLabel,
    QMainWindow,
    QMessageBox,
    QSplitter,
    QStatusBar,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)
from symbol_tree import SymbolTree

# Import lexer modules
try:
    from Lexer import build_lexer, get_errors

    # from Tokenizer import tokenize_file
    from TokenType import get_token_category
except ImportError as e:
    print(f"Error importing lexer modules: {e}")
    sys.exit(1)


class TontoLexerGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.current_file = None
        self.current_directory = None
        self.setup_ui()
        self.setup_menu()
        self.setup_statusbar()

    def setup_ui(self):
        self.setWindowTitle("Tonto Lexer GUI")
        self.setGeometry(100, 100, 1400, 800)

        # Create central widget and main layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        # Main horizontal layout: [Left-bar] | [Center-content] | [Right-panel]
        main_splitter = QSplitter(Qt.Orientation.Horizontal)

        # Left-bar (explorer): Directory and file tree navigation
        self.file_explorer = FileExplorer()
        self.file_explorer.file_selected.connect(self.on_file_selected)
        self.file_explorer.directory_changed.connect(self.on_directory_changed)
        main_splitter.addWidget(self.file_explorer)

        # Center-content: File content display area
        self.file_content = QTextEdit()
        self.file_content.setReadOnly(True)
        self.file_content.setFont(QFont("Consolas, Monaco, monospace", 10))
        main_splitter.addWidget(self.file_content)

        # Right-panel: Vertical split of symbol tree (top) and log (bottom)
        right_splitter = QSplitter(Qt.Orientation.Vertical)

        # Right-panel top: Symbol tree with tokenized data
        self.symbol_tree = SymbolTree()
        right_splitter.addWidget(self.symbol_tree)

        # Right-panel bottom: Log/debug output area
        log_widget = QWidget()
        log_layout = QVBoxLayout(log_widget)
        log_layout.addWidget(QLabel("Log/Debug Output:"))

        self.log_output = QTextEdit()
        self.log_output.setMaximumHeight(200)
        self.log_output.setFont(QFont("Consolas, Monaco, monospace", 9))
        log_layout.addWidget(self.log_output)

        right_splitter.addWidget(log_widget)

        main_splitter.addWidget(right_splitter)

        # Set splitter proportions
        main_splitter.setSizes([300, 600, 400])
        right_splitter.setSizes([400, 200])

        # Set main layout
        layout = QHBoxLayout(central_widget)
        layout.addWidget(main_splitter)

    def setup_menu(self):
        menubar = self.menuBar()

        # File menu
        file_menu = menubar.addMenu("File")

        open_file_action = QAction("Open File", self)
        open_file_action.setShortcut("Ctrl+O")
        open_file_action.triggered.connect(self.open_file)
        file_menu.addAction(open_file_action)

        open_dir_action = QAction("Open Directory", self)
        open_dir_action.setShortcut("Ctrl+Shift+O")
        open_dir_action.triggered.connect(self.open_directory)
        file_menu.addAction(open_dir_action)

        file_menu.addSeparator()

        exit_action = QAction("Exit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

        # View menu
        view_menu = menubar.addMenu("View")

        refresh_action = QAction("Refresh", self)
        refresh_action.setShortcut("F5")
        refresh_action.triggered.connect(self.refresh_current_file)
        view_menu.addAction(refresh_action)

    def setup_statusbar(self):
        self.statusbar = QStatusBar()
        self.setStatusBar(self.statusbar)
        self.statusbar.showMessage("Ready")

    def open_file(self):
        file_path, _ = QFileDialog.getOpenFileName(self, "Open Tonto File", "", "Tonto files (*.tonto);;All files (*.*)")
        if file_path:
            self.load_file(file_path)
            self.file_explorer.set_root_path(os.path.dirname(file_path))

    def open_directory(self):
        dir_path = QFileDialog.getExistingDirectory(self, "Open Directory")
        if dir_path:
            self.file_explorer.set_root_path(dir_path)
            self.current_directory = dir_path
            self.statusbar.showMessage(f"Directory: {dir_path}")

    def on_file_selected(self, file_path):
        if file_path.endswith(".tonto"):
            self.load_file(file_path)
        else:
            self.log_output.append(f"Selected non-Tonto file: {file_path}")

    def on_directory_changed(self, dir_path):
        self.current_directory = dir_path
        self.statusbar.showMessage(f"Directory: {dir_path}")

    def load_file(self, file_path):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            self.file_content.setPlainText(content)
            self.current_file = file_path
            self.statusbar.showMessage(f"File: {os.path.basename(file_path)}")

            # Tokenize and analyze the file
            self.analyze_file(file_path, content)

        except Exception as e:
            QMessageBox.critical(self, "Error", f"Could not load file: {str(e)}")
            self.log_output.append(f"ERROR: Failed to load {file_path}: {str(e)}")

    def analyze_file(self, file_path, content):
        try:
            self.log_output.clear()
            self.log_output.append(f"Analyzing file: {os.path.basename(file_path)}")

            # Build lexer and tokenize
            lexer = build_lexer()
            lexer.input(content)

            tokens = []
            token_count = 0
            category_counts = {}
            counted_categories = {"LANGUAGE_KEYWORD", "CLASS_STEREOTYPE", "RELATION_STEREOTYPE", "DATA_TYPE", "META_ATTRIBUTE"}

            # Collect tokens
            for tok in lexer:
                category = get_token_category(tok.type)
                tokens.append({"type": tok.type, "value": str(tok.value), "category": category, "lineno": tok.lineno})

                token_count += 1
                if category in counted_categories:
                    category_counts[category] = category_counts.get(category, 0) + 1

            # Get errors
            errors = get_errors()

            # Update symbol tree
            self.symbol_tree.update_tokens(tokens)

            # Update log with summary
            self.log_output.append(f"Total tokens: {token_count}")
            self.log_output.append(f"File size: {len(content)} characters")

            if category_counts:
                self.log_output.append("\nToken categories:")
                for category, count in sorted(category_counts.items()):
                    self.log_output.append(f"  {category}: {count}")

            if errors:
                self.log_output.append(f"\nLexical errors ({len(errors)}):")
                for error in errors:
                    self.log_output.append(f"  {error}")
            else:
                self.log_output.append("\nNo lexical errors found ✓")

        except Exception as e:
            self.log_output.append(f"ERROR: Analysis failed: {str(e)}")

    def refresh_current_file(self):
        if self.current_file:
            self.load_file(self.current_file)
        else:
            self.log_output.append("No file to refresh")
