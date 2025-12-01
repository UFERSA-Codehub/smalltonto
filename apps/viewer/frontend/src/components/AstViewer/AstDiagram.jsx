import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes/AstNodes";
import { transformAstToFlow } from "./utils/astToFlow";
import { useAutoLayout } from "./utils/useAutoLayout";
import { useApp } from "../AppShell";
import "./AstDiagram.css";

// Custom edge styles
const edgeTypes = {};

const defaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
};

// Edge style based on type
function getEdgeStyle(edge) {
  switch (edge.type) {
    case "specialization":
      return {
        ...edge,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "#3b82f6",
          strokeWidth: 2,
          strokeDasharray: "5,5",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#3b82f6",
          width: 20,
          height: 20,
        },
        label: "specializes",
        labelStyle: { fontSize: 10, fill: "#6b7280" },
        labelBgStyle: { fill: "white", fillOpacity: 0.8 },
      };

    case "relation":
      return {
        ...edge,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "#10b981",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
          width: 15,
          height: 15,
        },
        label: edge.data?.name || "",
        labelStyle: { fontSize: 10, fill: "#374151" },
        labelBgStyle: { fill: "white", fillOpacity: 0.8 },
      };

    case "genset-general":
      return {
        ...edge,
        type: "smoothstep",
        style: {
          stroke: "#f59e0b",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#f59e0b",
        },
        label: "general",
        labelStyle: { fontSize: 9, fill: "#92400e" },
        labelBgStyle: { fill: "#fef3c7", fillOpacity: 0.9 },
      };

    case "genset-specific":
      return {
        ...edge,
        type: "smoothstep",
        style: {
          stroke: "#f59e0b",
          strokeWidth: 1.5,
          strokeDasharray: "3,3",
        },
        label: "specific",
        labelStyle: { fontSize: 9, fill: "#92400e" },
        labelBgStyle: { fill: "#fef3c7", fillOpacity: 0.9 },
      };

    case "containment":
    default:
      return {
        ...edge,
        type: "smoothstep",
        style: {
          stroke: "#9ca3af",
          strokeWidth: 1.5,
        },
      };
  }
}

function AstDiagramInner({ ast, selectedNodeId, onNodeSelect }) {
  const { fitView, setCenter } = useReactFlow();

  // Transform AST to React Flow format
  const { nodes: rawNodes, edges: rawEdges, summary } = useMemo(() => {
    return transformAstToFlow(ast);
  }, [ast]);

  // Apply auto-layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useAutoLayout(rawNodes, rawEdges);

  // Apply edge styles
  const styledEdges = useMemo(() => {
    return layoutedEdges.map(getEdgeStyle);
  }, [layoutedEdges]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(styledEdges);

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(styledEdges);
  }, [layoutedNodes, styledEdges, setNodes, setEdges]);

  // Fit view when AST changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 100);
    return () => clearTimeout(timer);
  }, [ast, fitView]);

  // Focus on selected node
  useEffect(() => {
    if (selectedNodeId) {
      const node = nodes.find((n) => n.id === selectedNodeId);
      if (node) {
        setCenter(node.position.x + 100, node.position.y + 50, {
          zoom: 1.2,
          duration: 300,
        });
      }
    }
  }, [selectedNodeId, nodes, setCenter]);

  // Handle node click
  const handleNodeClick = useCallback(
    (event, node) => {
      if (onNodeSelect) {
        onNodeSelect(node.id);
      }
    },
    [onNodeSelect]
  );

  // Update selected state on nodes
  const nodesWithSelection = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
    }));
  }, [nodes, selectedNodeId]);

  return (
    <ReactFlow
      nodes={nodesWithSelection}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      minZoom={0.1}
      maxZoom={2}
      nodesDraggable={true}
      nodesConnectable={false}
      elementsSelectable={true}
      proOptions={{ hideAttribution: true }}
    >
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(node) => {
          switch (node.type) {
            case "package":
              return "#3b82f6";
            case "class":
              return "#60a5fa";
            case "datatype":
              return "#8b5cf6";
            case "enum":
              return "#10b981";
            case "genset":
              return "#f59e0b";
            default:
              return "#9ca3af";
          }
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
        style={{ backgroundColor: "var(--color-background-secondary)" }}
      />
      <Background variant="dots" gap={16} size={1} color="var(--color-border)" />
    </ReactFlow>
  );
}

export default function AstDiagram({ ast }) {
  const { selectedAstNode, setSelectedAstNode } = useApp();

  return (
    <div className="ast-diagram">
      <AstDiagramInner ast={ast} selectedNodeId={selectedAstNode} onNodeSelect={setSelectedAstNode} />
    </div>
  );
}
