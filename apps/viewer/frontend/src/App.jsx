import { ReactFlowProvider } from "@xyflow/react";
import AppShell, { useApp } from "./components/AppShell";
import EditorArea from "./components/Editor/EditorArea";
import AstDiagram from "./components/AstViewer/AstDiagram";
import SummaryPanel from "./components/AstViewer/SummaryPanel";
import ErrorList from "./components/Editor/ErrorList";
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

  // AST Mode
  if (!activeTab) {
    return (
      <div className="main-content main-content--empty">
        <div className="main-content__message">
          <div className="main-content__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <p className="main-content__title">No file selected</p>
          <p className="main-content__subtitle">
            Select a <code>.tonto</code> file from the explorer to view AST
          </p>
        </div>
      </div>
    );
  }

  if (!activeTab.name.endsWith(".tonto")) {
    return (
      <div className="main-content main-content--empty">
        <div className="main-content__message">
          <div className="main-content__icon main-content__icon--warning">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="main-content__title">{activeTab.name}</p>
          <p className="main-content__subtitle">
            Only <code>.tonto</code> files can be visualized as AST
          </p>
        </div>
      </div>
    );
  }

  // Check for parse errors
  if (parseResult?.errors && parseResult.errors.length > 0) {
    return (
      <div className="main-content main-content--error">
        <div className="main-content__error-container">
          <div className="main-content__error-header">
            <div className="main-content__icon main-content__icon--error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <p className="main-content__title">Parse Errors</p>
              <p className="main-content__subtitle">
                Fix the errors below to view the AST diagram
              </p>
            </div>
          </div>
          <div className="main-content__error-list">
            <ErrorList errors={parseResult.errors} />
          </div>
        </div>
      </div>
    );
  }

  // Check for empty AST
  if (!parseResult?.ast || !parseResult.ast.content || parseResult.ast.content.length === 0) {
    return (
      <div className="main-content main-content--empty">
        <div className="main-content__message">
          <div className="main-content__icon main-content__icon--warning">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <p className="main-content__title">Empty Package</p>
          <p className="main-content__subtitle">
            The package has no content to visualize. Add classes, datatypes, or enums.
          </p>
        </div>
      </div>
    );
  }

  // Render AST Diagram with Summary Panel
  return (
    <div className="main-content main-content--ast">
      <ReactFlowProvider>
        <AstDiagram ast={parseResult.ast} />
        <SummaryPanel ast={parseResult.ast} />
      </ReactFlowProvider>
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
