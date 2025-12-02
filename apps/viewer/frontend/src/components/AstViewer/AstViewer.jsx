import { useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useApp } from "../AppShell";
import HierarchyDiagram from "./HierarchyDiagram/HierarchyDiagram";
import AstTreeView from "./AstTreeView/AstTreeView";
// OntoUML diagram hidden for now - keeping code for future use
// import OntoUmlDiagram from "./OntoUmlDiagram/OntoUmlDiagram";
import SummaryPanel from "./SummaryPanel";
import "./AstViewer.css";

const VIEW_MODES = {
  HIERARCHY: "hierarchy",
  TREE: "tree",
  RAW: "raw",
  // ONTOUML: "ontouml", // Hidden for now
};

export default function AstViewer({ ast }) {
  const { selectedAstNode, setSelectedAstNode } = useApp();
  const [viewMode, setViewMode] = useState(VIEW_MODES.HIERARCHY);

  const packageName = ast?.package?.package_name || "Untitled";

  return (
    <div className="ast-viewer">
      {/* Tab Header */}
      <div className="ast-viewer__header">
        <div className="ast-viewer__tabs">
          <button
            className={`ast-viewer__tab ${viewMode === VIEW_MODES.HIERARCHY ? "ast-viewer__tab--active" : ""}`}
            onClick={() => setViewMode(VIEW_MODES.HIERARCHY)}
          >
            AST Hierarchy
          </button>
          <button
            className={`ast-viewer__tab ${viewMode === VIEW_MODES.TREE ? "ast-viewer__tab--active" : ""}`}
            onClick={() => setViewMode(VIEW_MODES.TREE)}
          >
            AST Tree
          </button>
          <button
            className={`ast-viewer__tab ${viewMode === VIEW_MODES.RAW ? "ast-viewer__tab--active" : ""}`}
            onClick={() => setViewMode(VIEW_MODES.RAW)}
          >
            Raw JSON
          </button>
        </div>
        <div className="ast-viewer__package-name">
          {packageName}
        </div>
      </div>

      {/* Diagram Content */}
      <div className="ast-viewer__content">
        {viewMode === VIEW_MODES.HIERARCHY ? (
          <ReactFlowProvider>
            <HierarchyDiagram
              ast={ast}
              selectedNodeId={selectedAstNode}
              onNodeSelect={setSelectedAstNode}
            />
          </ReactFlowProvider>
        ) : viewMode === VIEW_MODES.TREE ? (
          <AstTreeView
            ast={ast}
            selectedNodeId={selectedAstNode}
            onNodeSelect={setSelectedAstNode}
          />
        ) : (
          <div className="ast-viewer__raw-json">
            <pre>{JSON.stringify(ast, null, 2)}</pre>
          </div>
        )}
        <SummaryPanel ast={ast} />
      </div>
    </div>
  );
}
