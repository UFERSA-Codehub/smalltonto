import { useState } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { useApp } from "../AppShell";
import OntoUmlDiagram from "./OntoUmlDiagram/OntoUmlDiagram";
import SemanticPanel from "./SemanticPanel/SemanticPanel";
import AstTreeView from "./AstTreeView/AstTreeView";
import SummaryPanel from "./SummaryPanel";
import "./AstViewer.css";

const VIEW_MODES = {
  ONTOUML: "ontouml",
  SEMANTIC: "semantic",
  TREE: "tree",
  RAW: "raw",
};

export default function AstViewer({ ast }) {
  const { selectedAstNode, setSelectedAstNode, parseResult } = useApp();
  const [viewMode, setViewMode] = useState(VIEW_MODES.ONTOUML);
  const [jsonMode, setJsonMode] = useState("semantic"); // "ast" or "semantic"

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
            className={`ast-viewer__tab ${viewMode === VIEW_MODES.SEMANTIC ? "ast-viewer__tab--active" : ""}`}
            onClick={() => setViewMode(VIEW_MODES.SEMANTIC)}
          >
            Semantic Analysis
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
        ) : viewMode === VIEW_MODES.SEMANTIC ? (
          <SemanticPanel
            semantic={parseResult?.semantic}
            errors={{
              lexer: parseResult?.errors?.filter((e) => e.type === "lexer") || [],
              parser: parseResult?.errors?.filter((e) => e.type === "parser") || [],
            }}
          />
        ) : viewMode === VIEW_MODES.TREE ? (
          <AstTreeView
            ast={ast}
            selectedNodeId={selectedAstNode}
            onNodeSelect={setSelectedAstNode}
          />
        ) : (
          <div className="ast-viewer__raw-json">
            <div className="ast-viewer__json-toggle">
              <button
                className={`ast-viewer__json-btn ${jsonMode === "semantic" ? "ast-viewer__json-btn--active" : ""}`}
                onClick={() => setJsonMode("semantic")}
              >
                Semantic
              </button>
              <button
                className={`ast-viewer__json-btn ${jsonMode === "ast" ? "ast-viewer__json-btn--active" : ""}`}
                onClick={() => setJsonMode("ast")}
              >
                AST
              </button>
            </div>
            <pre>
              {JSON.stringify(
                jsonMode === "semantic" ? parseResult?.semantic : ast,
                null,
                2
              )}
            </pre>
          </div>
        )}
        <SummaryPanel ast={ast} />
      </div>
    </div>
  );
}
