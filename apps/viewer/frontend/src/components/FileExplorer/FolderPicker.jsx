import { FolderOpen, Sun, Moon } from "lucide-react";
import { useApp } from "../AppShell";
import "./FolderPicker.css";

export default function FolderPicker() {
  const { setRootFolder, isDark, setIsDark } = useApp();

  const handleSelectFolder = async () => {
    if (window.pywebview && window.pywebview.api) {
      try {
        const folder = await window.pywebview.api.select_folder();
        if (folder) {
          setRootFolder(folder);
        }
      } catch (error) {
        console.error("Failed to select folder:", error);
      }
    } else {
      console.log("PyWebView not available, using mock folder");
      setRootFolder("/mock/project/folder");
    }
  };

  return (
    <div className="folder-picker">
      <div className="folder-picker__card">
        <div className="folder-picker__icon">
          <FolderOpen size={64} strokeWidth={1.5} />
        </div>

        <h1 className="folder-picker__title">Tonto Viewer</h1>

        <p className="folder-picker__description">
          Select a folder containing your <code>.tonto</code> files to get
          started.
        </p>

        <button className="folder-picker__button" onClick={handleSelectFolder}>
          Select Folder
        </button>

        <div className="folder-picker__footer">
          <button
            className="folder-picker__theme-toggle"
            onClick={() => setIsDark(!isDark)}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
