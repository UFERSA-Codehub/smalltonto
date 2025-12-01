import { useApp } from "../AppShell";
import "./StatusBar.css";

export default function StatusBar() {
  const { activeTab, parseResult, isLoading, rootFolder } = useApp();

  const errorCount = parseResult?.errors?.length || 0;
  const tokenCount = parseResult?.tokens?.length || 0;

  return (
    <footer className="status-bar">
      <div className="status-bar__left">
        {rootFolder && (
          <span className="status-bar__item status-bar__folder">
            {rootFolder.split("/").pop()}
          </span>
        )}
      </div>

      <div className="status-bar__center">
        {isLoading && <span className="status-bar__item">Parsing...</span>}
      </div>

      <div className="status-bar__right">
        {activeTab && activeTab.name.endsWith(".tonto") && (
          <>
            <span className="status-bar__item">{tokenCount} tokens</span>
            <span
              className={`status-bar__item ${errorCount > 0 ? "status-bar__item--error" : "status-bar__item--success"}`}
            >
              {errorCount} {errorCount === 1 ? "error" : "errors"}
            </span>
          </>
        )}
        {activeTab && (
          <span className="status-bar__item status-bar__file">
            {activeTab.isDirty && <span className="status-bar__dirty">●</span>}
            {activeTab.name}
          </span>
        )}
      </div>
    </footer>
  );
}
