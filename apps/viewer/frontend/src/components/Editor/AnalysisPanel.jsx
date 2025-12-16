import { useState, useRef, useEffect } from "react";
import { useApp } from "../AppShell";
import TokenList from "./TokenList";
import ErrorList from "./ErrorList";
import WarningList from "./WarningList";
import "./AnalysisPanel.css";

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 320;

export default function AnalysisPanel() {
  const { parseResult, analysisView, setAnalysisView } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);
  const isResizingRef = useRef(false);

  const tokenCount = parseResult?.tokens?.length || 0;
  const errorCount = parseResult?.errors?.length || 0;
  const warningCount = parseResult?.warnings?.length || 0;

  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
  };

  // Resize handlers using refs to avoid stale closures
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current || !panelRef.current) return;
      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Handle cursor style during resize
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [isResizing]);

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
              className={`analysis-panel__tab ${analysisView === "warnings" ? "analysis-panel__tab--active" : ""} ${warningCount > 0 ? "analysis-panel__tab--has-warnings" : ""}`}
              onClick={() => setAnalysisView("warnings")}
            >
              Warnings
              <span className="analysis-panel__tab-count">{warningCount}</span>
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
        {analysisView === "tokens" && (
          <TokenList tokens={parseResult?.tokens || []} />
        )}
        {analysisView === "errors" && (
          <ErrorList errors={parseResult?.errors || []} />
        )}
        {analysisView === "warnings" && (
          <WarningList warnings={parseResult?.warnings || []} />
        )}
      </div>
    </aside>
  );
}
