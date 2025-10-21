import os

from PyQt6.QtCore import QDir, QModelIndex, pyqtSignal
from PyQt6.QtGui import QFileSystemModel
from PyQt6.QtWidgets import QLabel, QTreeView, QVBoxLayout, QWidget


class FileExplorer(QWidget):
    file_selected = pyqtSignal(str)
    directory_changed = pyqtSignal(str)

    def __init__(self):
        super().__init__()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        # Header
        header = QLabel("File Explorer")
        header.setStyleSheet("font-weight: bold; padding: 5px;")
        layout.addWidget(header)

        # Tree view
        self.tree_view = QTreeView()
        self.file_model = QFileSystemModel()
        self.file_model.setRootPath(QDir.currentPath())

        # Set filters to show relevant files
        self.file_model.setNameFilters(["*.tonto", "*.py", "*.txt", "*.md"])
        self.file_model.setNameFilterDisables(False)

        self.tree_view.setModel(self.file_model)
        self.tree_view.clicked.connect(self.on_item_clicked)

        # Hide size, type, and date columns
        for i in range(1, 4):
            self.tree_view.hideColumn(i)

        layout.addWidget(self.tree_view)

    def set_root_path(self, path):
        if os.path.exists(path):
            root_index = self.file_model.setRootPath(path)
            self.tree_view.setRootIndex(root_index)
            self.directory_changed.emit(path)

    def on_item_clicked(self, index: QModelIndex):
        file_path = self.file_model.filePath(index)
        if os.path.isfile(file_path):
            self.file_selected.emit(file_path)
