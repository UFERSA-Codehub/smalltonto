import os


class FileSystemAPI:
    def select_folder(self) -> str | None:
        import webview

        window = webview.active_window()
        if window:
            result = window.create_file_dialog(webview.FileDialog.FOLDER)
            if result and len(result) > 0:
                return result[0]
        return None

    def list_directory(self, path: str) -> list[dict]:
        if not os.path.isdir(path):
            return []

        items = []
        try:
            for name in os.listdir(path):
                full_path = os.path.join(path, name)
                is_dir = os.path.isdir(full_path)
                _, ext = os.path.splitext(name)

                items.append(
                    {
                        "name": name,
                        "path": full_path,
                        "type": "directory" if is_dir else "file",
                        "extension": ext.lower() if ext else "",
                    }
                )

            items.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))

        except PermissionError:
            return []

        return items

    def read_file(self, path: str) -> str | None:
        if not os.path.isfile(path):
            return None

        try:
            with open(path, "r", encoding="utf-8") as f:
                return f.read()
        except (PermissionError, UnicodeDecodeError, IOError):
            return None

    def write_file(self, path: str, content: str) -> bool:
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)
            return True
        except (PermissionError, IOError):
            return False

    def get_file_info(self, path: str) -> dict | None:
        if not os.path.exists(path):
            return None

        name = os.path.basename(path)
        _, ext = os.path.splitext(name)

        return {
            "name": name,
            "path": path,
            "type": "directory" if os.path.isdir(path) else "file",
            "extension": ext.lower() if ext else "",
            "size": os.path.getsize(path) if os.path.isfile(path) else 0,
        }
