from PyQt6.QtCore import Qt
from PyQt6.QtWidgets import QLabel, QTreeWidget, QTreeWidgetItem, QVBoxLayout, QWidget


class SymbolTree(QWidget):
    def __init__(self):
        super().__init__()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)

        # Header
        header = QLabel("Symbol Tree")
        header.setStyleSheet("font-weight: bold; padding: 5px;")
        layout.addWidget(header)

        # Tree widget
        self.tree_widget = QTreeWidget()
        self.tree_widget.setHeaderLabels(["Symbol", "Type", "Category", "Line"])
        layout.addWidget(self.tree_widget)

    def update_tokens(self, tokens):
        self.tree_widget.clear()

        # Group tokens by category
        categories = {}
        for token in tokens:
            category = token["category"]
            if category not in categories:
                categories[category] = []
            categories[category].append(token)

        # Create tree structure
        for category, category_tokens in categories.items():
            if not category_tokens:
                continue

            category_item = QTreeWidgetItem(self.tree_widget)
            category_item.setText(0, f"{category} ({len(category_tokens)})")
            category_item.setText(1, "Category")
            category_item.setExpanded(True)

            # Color coding for categories
            if "CLASS" in category:
                category_item.setBackground(0, Qt.GlobalColor.magenta)
            elif "RELATION" in category:
                category_item.setBackground(0, Qt.GlobalColor.cyan)
            elif "LANGUAGE" in category:
                category_item.setBackground(0, Qt.GlobalColor.yellow)
            elif "DATA_TYPE" in category:
                category_item.setBackground(0, Qt.GlobalColor.green)
            elif "META" in category:
                category_item.setBackground(0, Qt.GlobalColor.blue)

            # Add tokens under category
            for token in category_tokens:
                token_item = QTreeWidgetItem(category_item)

                # Truncate long values
                display_value = token["value"]
                if len(display_value) > 20:
                    display_value = display_value[:17] + "..."

                token_item.setText(0, display_value)
                token_item.setText(1, token["type"])
                token_item.setText(2, token["category"])
                token_item.setText(3, str(token["lineno"]))

        # Resize columns to content
        for i in range(4):
            self.tree_widget.resizeColumnToContents(i)
