import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useApp } from "../AppShell";
import OntoUmlDiagram from "./OntoUmlDiagram/OntoUmlDiagram";
import AstTreeView from "./AstTreeView/AstTreeView";
import SummaryPanel from "./SummaryPanel";
import "./AstViewer.css";

const VIEW_MODES = {
  ONTOUML: "ontouml",
  TREE: "tree",
  RAW: "raw",
};

export default function AstViewer({ ast }) {
  const { selectedAstNode, setSelectedAstNode } = useApp();
  const [viewMode, setViewMode] = useState(VIEW_MODES.ONTOUML);

  const packageName = ast?.package?.package_name || "Untitled";

  return (
    <div className="ast-viewer">
      {/* Tab Header */}
      <div className="ast-viewer__header">
        <div className="ast-viewer__tabs">
          <button
            className={`ast-viewer__tab ${viewMode === VIEW_MODES.ONTOUML ? "ast-viewer__tab--active" : ""}`}
            onClick={() => setViewMode(VIEW_MODES.ONTOUML)}
          >
            OntoUML Diagram
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
        {viewMode === VIEW_MODES.ONTOUML ? (
          <ReactFlowProvider>
            <OntoUmlDiagram />
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
