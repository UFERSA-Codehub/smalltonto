import { FolderOpen, Settings, Sun, Moon } from "lucide-react";
import { useApp } from "../AppShell";
import "./Toolbar.css";

export default function Toolbar() {
  const {
    mode,
    setMode,
    isDark,
    setIsDark,
    openSettingsModal,
    requestFolderChange,
  } = useApp();

  return (
    <header className="toolbar">
      <div className="toolbar__left">
        <span className="toolbar__title">Tonto Viewer</span>
        <button
          className="toolbar__icon-btn"
          onClick={requestFolderChange}
          title="Change root folder"
        >
          <FolderOpen size={18} />
        </button>
      </div>

      <div className="toolbar__center">
        <div className="toolbar__mode-toggle">
          <button
            className={`toolbar__mode-btn ${mode === "ide" ? "toolbar__mode-btn--active" : ""}`}
            onClick={() => setMode("ide")}
          >
            IDE
          </button>
          <button
            className={`toolbar__mode-btn ${mode === "ast" ? "toolbar__mode-btn--active" : ""}`}
            onClick={() => setMode("ast")}
          >
            Analysis
          </button>
        </div>
      </div>

      <div className="toolbar__right">
        <button
          className="toolbar__icon-btn"
          onClick={() => setIsDark(!isDark)}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button
          className="toolbar__icon-btn"
          onClick={openSettingsModal}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
