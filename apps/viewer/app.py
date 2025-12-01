import os

os.environ.setdefault("QTWEBENGINE_CHROMIUM_FLAGS", "--disable-gpu")

import webview

from api.file_system import FileSystemAPI
from api.parser_api import ParserAPI


class ViewerAPI(FileSystemAPI, ParserAPI):
    def __init__(self):
        FileSystemAPI.__init__(self)
        ParserAPI.__init__(self)

    def get_app_info(self) -> dict:
        return {
            "name": "Tonto Viewer",
            "version": "0.1.0",
            "description": "IDE for Tonto language files with AST visualization",
        }


def get_frontend_path() -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dist_path = os.path.join(base_dir, "frontend", "dist", "index.html")

    if not os.path.exists(dist_path):
        return "http://localhost:5173"

    return dist_path


def main():
    api = ViewerAPI()
    frontend_url = get_frontend_path()

    window = webview.create_window(
        title="Tonto Viewer",
        url=frontend_url,
        js_api=api,
        width=1200,
        height=800,
        min_size=(800, 600),
    )

    webview.start(gui="qt", debug=True)


if __name__ == "__main__":
    main()
