import { useMemo, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./nodes/OntoUmlNodes";
import { edgeTypes } from "./edges/OntoUmlEdges";
import { transformAstToOntoUml } from "./utils/astToOntoUml";
import { useElkLayout } from "./utils/useElkLayout";
import "./OntoUmlDiagram.css";

function OntoUmlDiagramInner({ 
  ast, 
  selectedNodeId, 
  onNodeSelect, 
  onExternalNodeClick,
  attributeDisplay,
  showExternalClasses 
}) {
  const { fitView, setCenter } = useReactFlow();

  // Transform AST to OntoUML React Flow format
  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    return transformAstToOntoUml(ast, { showExternalClasses });
  }, [ast, showExternalClasses]);

  // Apply ELK auto-layout
  const { nodes: layoutedNodes, edges: layoutedEdges } = useElkLayout(rawNodes, rawEdges);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  // Update nodes when layout changes
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

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
      // If it's a ghost/external node and we have a handler, trigger navigation
      if (node.data?.isExternal && onExternalNodeClick) {
        onExternalNodeClick(node.data.sourceModule);
        return;
      }
      
      if (onNodeSelect) {
        onNodeSelect(node.id);
      }
    },
    [onNodeSelect, onExternalNodeClick]
  );

  // Update selected state on nodes and inject attributeDisplay
  const nodesWithSelection = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      selected: node.id === selectedNodeId,
      data: {
        ...node.data,
        attributeDisplay: attributeDisplay || "shown",
      },
    }));
  }, [nodes, selectedNodeId, attributeDisplay]);

  return (
    <ReactFlow
      nodes={nodesWithSelection}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
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
          // Ghost nodes get a distinct color
          if (node.data?.isExternal) {
            return "#e0e0e0";
          }
          // Return OntoUML stereotype colors
          const stereotype = node.data?.stereotype;
          switch (stereotype) {
            case "kind":
              return "#FFCDD2";
            case "subkind":
            case "role":
            case "phase":
              return "#F8BBD0";
            case "relator":
              return "#C8E6C9";
            case "category":
            case "roleMixin":
            case "mixin":
            case "phaseMixin":
              return "#FFFFFF";
            case "collective":
              return "#E1F5FE";
            case "quality":
            case "mode":
              return "#B3E5FC";
            case "datatype":
              return "#FFF9C4";
            case "enum":
              return "#F5F5F5";
            default:
              return "#E0E0E0";
          }
        }}
        maskColor="rgba(0, 0, 0, 0.1)"
        style={{ backgroundColor: "var(--color-background-secondary)" }}
      />
      <Background variant="dots" gap={16} size={1} color="var(--color-border)" />
    </ReactFlow>
  );
}

export default function OntoUmlDiagram({ 
  ast, 
  selectedNodeId, 
  onNodeSelect, 
  onExternalNodeClick,
  attributeDisplay,
  showExternalClasses = true
}) {
  return (
    <div className="ontouml-diagram">
      <OntoUmlDiagramInner
        ast={ast}
        selectedNodeId={selectedNodeId}
        onNodeSelect={onNodeSelect}
        onExternalNodeClick={onExternalNodeClick}
        attributeDisplay={attributeDisplay}
        showExternalClasses={showExternalClasses}
      />
    </div>
  );
}
