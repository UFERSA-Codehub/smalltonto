import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "../AppShell";
import TokenList from "./TokenList";
import ErrorList from "./ErrorList";
import "./AnalysisPanel.css";

const MIN_WIDTH = 350;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

export default function AnalysisPanel() {
  const { parseResult, analysisView, setAnalysisView } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);

  const tokenCount = parseResult?.tokens?.length || 0;
  const errorCount = parseResult?.errors?.length || 0;

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing || !panelRef.current) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
      const clampedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setWidth(clampedWidth);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const panelStyle = isCollapsed
    ? { width: "40px", minWidth: "40px" }
    : { width: `${width}px`, minWidth: `${width}px` };

  return (
    <aside
      ref={panelRef}
      className={`analysis-panel ${isCollapsed ? "analysis-panel--collapsed" : ""} ${isResizing ? "analysis-panel--resizing" : ""}`}
      style={panelStyle}
    >
      {!isCollapsed && (
        <div
          className="analysis-panel__resize-handle"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        />
      )}

      <div className="analysis-panel__header">
        {!isCollapsed && (
          <div className="analysis-panel__tabs">
            <button
              className={`analysis-panel__tab ${analysisView === "tokens" ? "analysis-panel__tab--active" : ""}`}
              onClick={() => setAnalysisView("tokens")}
            >
              Tokens
              <span className="analysis-panel__tab-count">{tokenCount}</span>
            </button>
            <button
              className={`analysis-panel__tab ${analysisView === "errors" ? "analysis-panel__tab--active" : ""} ${errorCount > 0 ? "analysis-panel__tab--has-errors" : ""}`}
              onClick={() => setAnalysisView("errors")}
            >
              Errors
              <span className="analysis-panel__tab-count">{errorCount}</span>
            </button>
          </div>
        )}
        <button
          className="analysis-panel__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "←" : "→"}
        </button>
      </div>

      <div className={`analysis-panel__content ${isCollapsed ? "analysis-panel__content--hidden" : ""}`}>
        {analysisView === "tokens" ? (
          <TokenList tokens={parseResult?.tokens || []} />
        ) : (
          <ErrorList errors={parseResult?.errors || []} />
        )}
      </div>
    </aside>
  );
}
