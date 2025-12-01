import AppShell, { useApp } from "./components/AppShell";
import EditorArea from "./components/Editor/EditorArea";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import "./App.css";

function MainContent() {
  const { mode, activeTab, activeTabPath, closeTab, switchTab, saveTab, parseResult } = useApp();

  useKeyboardShortcuts({
    "ctrl+w": () => {
      if (activeTabPath) {
        closeTab(activeTabPath);
      }
    },
    "ctrl+tab": () => switchTab("next"),
    "ctrl+shift+tab": () => switchTab("prev"),
    "ctrl+s": () => {
      if (activeTabPath) {
        saveTab(activeTabPath);
      }
    },
  });

  if (mode === "ide") {
    return <EditorArea />;
  }

  if (!activeTab) {
    return (
      <div className="main-content main-content--empty">
        <p>Select a .tonto file from the explorer to view AST</p>
      </div>
    );
  }

  if (!activeTab.name.endsWith(".tonto")) {
    return (
      <div className="main-content main-content--empty">
        <p>Select a .tonto file to view AST</p>
      </div>
    );
  }

  return (
    <div className="main-content main-content--ast">
      <div className="ast-placeholder">
        <h3>AST Mode</h3>
        <p>
          Viewing AST for: <strong>{activeTab.name}</strong>
        </p>
        {parseResult?.ast && (
          <pre className="ast-placeholder__preview">
            {JSON.stringify(parseResult.ast, null, 2).slice(0, 500)}...
          </pre>
        )}
        <p className="ast-placeholder__note">React Flow diagram coming in Phase 4</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppShell>
      <MainContent />
    </AppShell>
  );
}

export default App;
