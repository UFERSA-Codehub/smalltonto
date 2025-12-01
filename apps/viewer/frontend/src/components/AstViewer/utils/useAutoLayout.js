import { useMemo } from "react";
import dagre from "dagre";

const NODE_WIDTH = 200;
const NODE_HEIGHT_BASE = 60;
const NODE_HEIGHT_PER_ITEM = 24;

/**
 * Hook that computes automatic layout for React Flow nodes using dagre.
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} options - Layout options
 * @returns {{ nodes: Array, edges: Array }}
 */
export function useAutoLayout(nodes, edges, options = {}) {
  const { direction = "TB", nodeSep = 50, rankSep = 80 } = options;

  const layouted = useMemo(() => {
    if (!nodes.length) {
      return { nodes: [], edges: [] };
    }

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: direction,
      nodesep: nodeSep,
      ranksep: rankSep,
      marginx: 20,
      marginy: 20,
    });

    // Add nodes with estimated dimensions
    nodes.forEach((node) => {
      const height = estimateNodeHeight(node);
      dagreGraph.setNode(node.id, {
        width: NODE_WIDTH,
        height: height,
      });
    });

    // Add edges (only containment edges affect hierarchy)
    edges.forEach((edge) => {
      // Skip specialization edges for layout - they go upward and shouldn't affect tree structure
      if (edge.type !== "specialization") {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    });

    // Compute layout
    dagre.layout(dagreGraph);

    // Apply computed positions to nodes
    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      if (!nodeWithPosition) {
        return node;
      }

      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2,
        },
      };
    });

    return { nodes: layoutedNodes, edges };
  }, [nodes, edges, direction, nodeSep, rankSep]);

  return layouted;
}

/**
 * Estimates the height of a node based on its content.
 */
function estimateNodeHeight(node) {
  let height = NODE_HEIGHT_BASE;

  switch (node.type) {
    case "package":
      height = 50;
      break;

    case "class":
    case "datatype": {
      const attrCount = node.data?.attributes?.length || 0;
      const relCount = node.data?.relations?.length || 0;
      height = NODE_HEIGHT_BASE + (attrCount + relCount) * NODE_HEIGHT_PER_ITEM;
      break;
    }

    case "enum": {
      const valueCount = node.data?.values?.length || 0;
      height = NODE_HEIGHT_BASE + Math.ceil(valueCount / 3) * NODE_HEIGHT_PER_ITEM;
      break;
    }

    case "genset": {
      const specificCount = node.data?.specifics?.length || 0;
      height = NODE_HEIGHT_BASE + specificCount * NODE_HEIGHT_PER_ITEM;
      break;
    }

    default:
      height = NODE_HEIGHT_BASE;
  }

  return Math.max(height, NODE_HEIGHT_BASE);
}

export default useAutoLayout;
