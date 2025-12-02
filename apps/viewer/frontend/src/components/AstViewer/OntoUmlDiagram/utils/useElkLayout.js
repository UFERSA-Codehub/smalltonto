import { useMemo, useState, useEffect, useRef } from "react";
import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();

// Default node dimensions
const DEFAULT_NODE_WIDTH = 150;
const DEFAULT_NODE_HEIGHT = 60;
const NODE_HEIGHT_PER_ATTRIBUTE = 18;

/**
 * Estimate node dimensions based on content
 */
function estimateNodeDimensions(node) {
  let width = DEFAULT_NODE_WIDTH;
  let height = DEFAULT_NODE_HEIGHT;

  // Adjust width based on name length
  const nameLength = node.data?.name?.length || 0;
  width = Math.max(width, nameLength * 8 + 40);

  // Adjust height based on attributes
  const attrCount = node.data?.attributes?.length || 0;
  if (attrCount > 0) {
    height += attrCount * NODE_HEIGHT_PER_ATTRIBUTE + 10;
  }

  // Adjust height for enum values
  const valueCount = node.data?.values?.length || 0;
  if (valueCount > 0) {
    height += valueCount * NODE_HEIGHT_PER_ATTRIBUTE + 10;
  }

  return { width, height };
}

/**
 * Convert React Flow nodes/edges to ELK graph format
 */
function toElkGraph(nodes, edges) {
  const elkNodes = nodes.map((node) => {
    const { width, height } = estimateNodeDimensions(node);
    return {
      id: node.id,
      width,
      height,
    };
  });

  const elkEdges = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }));

  return {
    id: "root",
    layoutOptions: {
      // Use layered algorithm for hierarchical diagrams
      "elk.algorithm": "layered",
      // Direction: bottom to top (parents at top, children below pointing up)
      "elk.direction": "UP",
      // Spacing options
      "elk.spacing.nodeNode": "50",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
      "elk.layered.spacing.edgeNodeBetweenLayers": "30",
      // Edge spacing to reduce clutter when multiple edges converge
      "elk.layered.spacing.edgeEdge": "25",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "20",
      "elk.layered.spacing.edgeNode": "30",
      // Edge routing: orthogonal (right angles) like the reference image
      "elk.edgeRouting": "ORTHOGONAL",
      // Node placement strategy
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      // Minimize edge crossings
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
      // Port constraints
      "elk.portConstraints": "FIXED_SIDE",
      // Hierarchy handling
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    },
    children: elkNodes,
    edges: elkEdges,
  };
}

/**
 * Apply ELK layout results back to React Flow nodes
 */
function applyLayoutToNodes(nodes, layoutedGraph) {
  const layoutMap = new Map();
  layoutedGraph.children?.forEach((elkNode) => {
    layoutMap.set(elkNode.id, { x: elkNode.x, y: elkNode.y });
  });

  return nodes.map((node) => {
    const position = layoutMap.get(node.id);
    if (position) {
      return {
        ...node,
        position: { x: position.x, y: position.y },
      };
    }
    return node;
  });
}

/**
 * Hook that computes automatic layout for React Flow nodes using ELK.
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @returns {{ nodes: Array, edges: Array, isLayouting: boolean }}
 */
export function useElkLayout(nodes, edges) {
  const [layoutedNodes, setLayoutedNodes] = useState(nodes);
  const [isLayouting, setIsLayouting] = useState(false);
  const isLayoutingRef = useRef(false);

  // Memoize the ELK graph to avoid unnecessary recalculations
  const elkGraph = useMemo(() => {
    if (!nodes.length) return null;
    return toElkGraph(nodes, edges);
  }, [nodes, edges]);

  useEffect(() => {
    if (!elkGraph || isLayoutingRef.current) return;

    // Use ref to track layouting state to avoid race conditions
    isLayoutingRef.current = true;
    setIsLayouting(true);

    elk
      .layout(elkGraph)
      .then((layoutedGraph) => {
        const newNodes = applyLayoutToNodes(nodes, layoutedGraph);
        setLayoutedNodes(newNodes);
      })
      .catch((err) => {
        console.error("ELK layout error:", err);
        // Fall back to original positions
        setLayoutedNodes(nodes);
      })
      .finally(() => {
        isLayoutingRef.current = false;
        setIsLayouting(false);
      });
  }, [elkGraph, nodes]);

  return {
    nodes: layoutedNodes,
    edges,
    isLayouting,
  };
}

export default useElkLayout;
