import { useState, useRef, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useApp } from "../../AppShell";
import { nodeTypes } from "./nodes";
import { edgeTypes } from "./edges";
import { NodeContextMenu, NodeDetailsPopup } from "./menu";
import { transformAstToOntoUml } from "./utils/astToOntoUml";
import { useLayout, relayoutWithMeasurements } from "./utils/useLayout";
import "./OntoUmlDiagram.css";

/**
 * SVG marker definitions for custom arrowheads.
 */
function MarkerDefinitions() {
  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }}>
      <defs>
        {/* Generalization arrow - hollow triangle pointing in edge direction */}
        <marker
          id="generalization-arrow"
          viewBox="0 0 20 20"
          refX="20"
          refY="10"
          markerWidth="12"
          markerHeight="12"
          orient="auto"
        >
          <path
            d="M 0 0 L 20 10 L 0 20 z"
            fill="white"
            stroke="black"
            strokeWidth="2"
          />
        </marker>

        {/* Dependency arrow - open arrow */}
        <marker
          id="dependency-arrow"
          viewBox="0 0 20 20"
          refX="18"
          refY="10"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 20 10 L 0 20"
            fill="none"
            stroke="#666"
            strokeWidth="2"
          />
        </marker>
      </defs>
    </svg>
  );
}

/**
 * OntoUML Diagram component using React Flow.
 * Displays classes, relators, enums as nodes with appropriate edges.
 */
export default function OntoUmlDiagram() {
  const { parseResult, setHighlightRequest } = useApp();

  const [contextMenu, setContextMenu] = useState(null);
  const [detailsPopup, setDetailsPopup] = useState(null);
  
  // Track if we've done the measurement-based relayout
  const hasRelayouted = useRef(false);
  const lastAstRef = useRef(null);

  // Transform AST/semantic data to React Flow nodes and edges
  const { nodes: rawNodes, edges: rawEdges } = transformAstToOntoUml(
    parseResult?.ast,
    parseResult?.semantic
  );

  // Reset relayout flag when AST changes (in effect, not during render)
  useEffect(() => {
    if (parseResult?.ast !== lastAstRef.current) {
      lastAstRef.current = parseResult?.ast;
      hasRelayouted.current = false;
    }
  }, [parseResult?.ast]);

  // Apply initial dagre layout to position nodes
  const { layoutedNodes: initialNodes, layoutedEdges: initialEdges } = useLayout(rawNodes, rawEdges, {
    direction: "TB",
    nodeSep: 150,
    rankSep: 180,
    mediationSpread: 320,
    enumOffsetY: 200,
    parentOffsetY: 200,
  });

  // Use React Flow's state management for nodes/edges
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle nodes change - detect when measurements are available and relayout
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    
    // Check if this is a dimensions change (React Flow measured the nodes)
    const hasDimensionChange = changes.some(c => c.type === 'dimensions');
    
    if (hasDimensionChange && !hasRelayouted.current) {
      // Get current nodes with measurements from React Flow
      setNodes(currentNodes => {
        // Check if all nodes have measurements
        const allMeasured = currentNodes.every(n => n.measured?.height);
        
        if (allMeasured) {
          hasRelayouted.current = true;
          
          // Re-run layout with actual measurements
          const { nodes: relayoutedNodes, edges: relayoutedEdges } = relayoutWithMeasurements(
            currentNodes,
            rawEdges,
            {
              mediationSpread: 320,
              enumOffsetY: 200,
              parentOffsetY: 200,
            }
          );
          
          // Update edges too
          setEdges(relayoutedEdges);
          
          console.log("[Relayout] Applied measurement-based layout");
          
          return relayoutedNodes;
        }
        
        return currentNodes;
      });
    }
  }, [onNodesChange, rawEdges, setNodes, setEdges]);

  // Handle node click - show context menu
  const handleNodeClick = (event, node) => {
    event.stopPropagation();
    setDetailsPopup(null); // Close any open details
    setContextMenu({
      node,
      position: { x: event.clientX, y: event.clientY },
    });
  };

  // Handle pane click - close menus
  const handlePaneClick = () => {
    setContextMenu(null);
    setDetailsPopup(null);
  };

  // Show in code - trigger editor highlight
  const handleShowInCode = (node) => {
    // Extract the class/enum name and find its line number
    const name = node.data?.name;
    if (name && parseResult?.ast) {
      // Search for the definition in AST content
      const content = parseResult.ast.content || [];
      for (const item of content) {
        const itemName =
          item.class_name || item.enum_name || item.datatype_name;
        if (itemName === name && item.line !== undefined) {
          setHighlightRequest({
            line: item.line,
            column: item.column || 1,
            length: name.length,
          });
          return;
        }
      }
    }
  };

  // Show details popup
  const handleShowDetails = (node) => {
    // Position popup near where context menu was
    const position = contextMenu?.position || { x: 200, y: 200 };
    setDetailsPopup({
      node,
      position: { x: position.x + 10, y: position.y + 10 },
    });
  };

  // Close context menu
  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Close details popup
  const handleCloseDetailsPopup = () => {
    setDetailsPopup(null);
  };

  // Show placeholder if no data
  if (!nodes.length) {
    return (
      <div className="ontouml-diagram ontouml-diagram--placeholder">
        <div className="ontouml-diagram__placeholder-content">
          <span>No diagram data available</span>
          <span className="ontouml-diagram__placeholder-hint">
            Open a .tonto file to see the OntoUML diagram
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="ontouml-diagram">
      <MarkerDefinitions />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>

      {/* Context menu */}
      {contextMenu && (
        <NodeContextMenu
          node={contextMenu.node}
          position={contextMenu.position}
          onShowInCode={handleShowInCode}
          onShowDetails={handleShowDetails}
          onClose={handleCloseContextMenu}
        />
      )}

      {/* Details popup */}
      {detailsPopup && (
        <NodeDetailsPopup
          node={detailsPopup.node}
          position={detailsPopup.position}
          onClose={handleCloseDetailsPopup}
        />
      )}
    </div>
  );
}
