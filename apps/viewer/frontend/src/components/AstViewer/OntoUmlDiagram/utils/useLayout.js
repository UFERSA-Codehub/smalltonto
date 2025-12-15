import dagre from "dagre";

/**
 * Estimated node dimensions based on node type and content.
 * These values match the actual CSS-rendered heights:
 * - Header: ~22px (padding 4+4, line-height ~14)
 * - Name: ~26px (padding 6+6, line-height ~14)
 * - Borders: ~3-4px
 * - Attribute indicator (when present): ~22px
 */
const NODE_DIMENSIONS = {
  ontoUmlClass: { width: 150, height: 52 },
  ontoUmlRelator: { width: 150, height: 52 },
  ontoUmlEnum: { width: 140, height: 48 },
  ontoUmlGhost: { width: 120, height: 40 },
  ontoUmlDatatype: { width: 140, height: 48 },
};

/**
 * Get estimated dimensions for a node based on its type and data.
 */
function getNodeDimensions(node) {
  const base = NODE_DIMENSIONS[node.type] || { width: 150, height: 60 };

  // Add extra height for attribute indicator
  const attrCount = node.data?.attributes?.length || 0;
  const valueCount = node.data?.values?.length || 0;

  let height = base.height;
  if (attrCount > 0 || valueCount > 0) {
    height += 24; // Height for the indicator row
  }

  // Estimate width based on name length
  const name = node.data?.name || "";
  const estimatedWidth = Math.max(base.width, name.length * 8 + 40);

  return { width: Math.min(estimatedWidth, 250), height };
}

/**
 * Detect relator patterns in the graph.
 * A relator pattern consists of:
 * - A relator node (stereotype = "relator")
 * - Mediated class nodes (connected via mediation edges)
 * - Optional enum dependencies (connected via dependency edges)
 * - Optional parent classes (generalizations of mediated classes)
 */
function detectRelatorPatterns(nodes, edges) {
  const patterns = [];

  // Find all relator nodes
  const relators = nodes.filter(
    (n) => n.data?.stereotype?.toLowerCase() === "relator"
  );

  for (const relator of relators) {
    // Find mediation edges FROM this relator
    const mediationEdges = edges.filter(
      (e) =>
        e.source === relator.id &&
        (e.type === "mediation" || e.data?.stereotype === "mediation")
    );
    const mediatedNodeIds = mediationEdges.map((e) => e.target);

    // Find dependency edges FROM this relator (enum dependencies)
    const dependencyEdges = edges.filter(
      (e) => e.source === relator.id && e.type === "dependency"
    );
    const enumNodeIds = dependencyEdges.map((e) => e.target);

    // Find generalization edges FROM mediated classes TO their parents
    const generalizationEdges = edges.filter(
      (e) => e.type === "generalization" && mediatedNodeIds.includes(e.source)
    );
    const parentNodeIds = [...new Set(generalizationEdges.map((e) => e.target))];

    // Find material relations BETWEEN mediated classes
    const materialEdges = edges.filter(
      (e) =>
        (e.type === "association" || e.data?.stereotype === "material") &&
        mediatedNodeIds.includes(e.source) &&
        mediatedNodeIds.includes(e.target)
    );

    patterns.push({
      relator,
      mediatedNodeIds,
      enumNodeIds,
      parentNodeIds,
      mediationEdges,
      dependencyEdges,
      generalizationEdges,
      materialEdges,
    });
  }

  return patterns;
}

/**
 * Apply relator-specific layout positioning.
 * Rearranges nodes to match OntoUML visual conventions:
 * - Relator in center
 * - Mediated classes spread horizontally (left/right)
 * - Enum dependencies below relator
 * - Parent classes (generalizations) above
 * - Multiple unrelated relators placed side by side
 *
 * @param {Array} nodes - Nodes to position
 * @param {Array} edges - Edges
 * @param {Object} options - Layout options
 * @param {Set} repositionedNodeIds - Optional set to track repositioned node IDs (will be populated)
 */
function applyRelatorLayout(nodes, edges, options = {}, repositionedNodeIds = new Set()) {
  const {
    mediationSpread = 320, // Horizontal distance from relator to mediated class
    enumOffsetY = 200, // Vertical distance below relator for enums
    parentOffsetY = 200, // Vertical distance above mediated classes for parents
    relatorSpread = 600, // Horizontal distance between unrelated relator clusters
  } = options;

  const patterns = detectRelatorPatterns(nodes, edges);

  if (patterns.length === 0) {
    return nodes; // No relators, return unchanged
  }

  // Find shared nodes between patterns (connected relators)
  const nodeToPatterns = new Map();
  patterns.forEach((pattern, idx) => {
    [
      pattern.relator.id,
      ...pattern.mediatedNodeIds,
      ...pattern.enumNodeIds,
      ...pattern.parentNodeIds,
    ].forEach((nodeId) => {
      if (!nodeToPatterns.has(nodeId)) {
        nodeToPatterns.set(nodeId, []);
      }
      nodeToPatterns.get(nodeId).push(idx);
    });
  });

  // Group connected patterns (relators that share nodes)
  const patternGroups = [];
  const processedPatterns = new Set();

  patterns.forEach((pattern, idx) => {
    if (processedPatterns.has(idx)) return;

    const group = [idx];
    processedPatterns.add(idx);

    // Find all connected patterns via shared nodes
    const queue = [idx];
    while (queue.length > 0) {
      const currentIdx = queue.shift();
      const currentPattern = patterns[currentIdx];

      const allNodeIds = [
        currentPattern.relator.id,
        ...currentPattern.mediatedNodeIds,
        ...currentPattern.enumNodeIds,
        ...currentPattern.parentNodeIds,
      ];

      allNodeIds.forEach((nodeId) => {
        const connectedPatternIdxs = nodeToPatterns.get(nodeId) || [];
        connectedPatternIdxs.forEach((connectedIdx) => {
          if (!processedPatterns.has(connectedIdx)) {
            group.push(connectedIdx);
            processedPatterns.add(connectedIdx);
            queue.push(connectedIdx);
          }
        });
      });
    }

    patternGroups.push(group);
  });

  // Calculate base X position for each pattern group (side by side)
  let currentGroupX = 0;

  patternGroups.forEach((group) => {
    // Calculate width needed for this group
    const groupPatterns = group.map((idx) => patterns[idx]);
    const maxMediatedCount = Math.max(
      ...groupPatterns.map((p) => p.mediatedNodeIds.length)
    );
    const groupWidth = mediationSpread * Math.max(2, maxMediatedCount) + 200;

    // Process each pattern in the group
    groupPatterns.forEach((pattern, patternIndexInGroup) => {
      const { relator, mediatedNodeIds, enumNodeIds, parentNodeIds } = pattern;

      // Calculate relator position
      // Use dagre Y position, but adjust X for group placement
      const relatorY = relator.position.y;
      const relatorX =
        currentGroupX +
        groupWidth / 2 +
        patternIndexInGroup * (mediationSpread / 2);

      // Reposition relator
      const relatorHeight = relator.measured?.height || 52;
      const relatorCenterY = relatorY + relatorHeight / 2;

      console.log("[Layout Debug] Relator:", {
        id: relator.id,
        name: relator.data?.name,
        positionY: relatorY,
        measuredHeight: relator.measured?.height,
        usedHeight: relatorHeight,
        centerY: relatorCenterY,
        hasAttributes: (relator.data?.attributes?.length || 0) > 0,
        attrCount: relator.data?.attributes?.length || 0,
      });

      if (!repositionedNodeIds.has(relator.id)) {
        relator.position.x = relatorX;
        relator.position.y = relatorY;
        repositionedNodeIds.add(relator.id);
      }

      // Position mediated classes horizontally around relator
      // Align vertical centers for straight horizontal edges
      mediatedNodeIds.forEach((id, index) => {
        const node = nodes.find((n) => n.id === id);
        if (node && !repositionedNodeIds.has(id)) {
          // Alternate left/right: 0 -> left, 1 -> right, 2 -> further left, etc.
          const side = index % 2 === 0 ? -1 : 1;
          const distance = mediationSpread * Math.ceil((index + 1) / 2);

          const nodeHeight = node.measured?.height || 52;
          // Align center of this node with center of relator
          node.position.x = relatorX + side * distance;
          node.position.y = relatorCenterY - nodeHeight / 2;

          console.log("[Layout Debug] Mediated node:", {
            id: node.id,
            name: node.data?.name,
            measuredHeight: node.measured?.height,
            usedHeight: nodeHeight,
            finalPositionY: node.position.y,
            expectedCenterY: node.position.y + nodeHeight / 2,
            relatorCenterY: relatorCenterY,
            centerDiff: (node.position.y + nodeHeight / 2) - relatorCenterY,
            hasAttributes: (node.data?.attributes?.length || 0) > 0,
            attrCount: node.data?.attributes?.length || 0,
          });

          repositionedNodeIds.add(id);
        }
      });

      // Position enums below relator (centered)
      enumNodeIds.forEach((id, index) => {
        const node = nodes.find((n) => n.id === id);
        if (node && !repositionedNodeIds.has(id)) {
          const offset = (index - (enumNodeIds.length - 1) / 2) * 180;

          node.position.x = relatorX + offset;
          node.position.y = relatorCenterY + enumOffsetY;

          repositionedNodeIds.add(id);
        }
      });

      // Position parent classes above the cluster
      parentNodeIds.forEach((id, index) => {
        const node = nodes.find((n) => n.id === id);
        if (node && !repositionedNodeIds.has(id)) {
          // Center above the mediated classes
          const mediatedNodes = mediatedNodeIds
            .map((mid) => nodes.find((n) => n.id === mid))
            .filter(Boolean);

          const avgX =
            mediatedNodes.length > 0
              ? mediatedNodes.reduce((sum, n) => sum + n.position.x, 0) /
                mediatedNodes.length
              : relatorX;

          node.position.x = avgX + index * 100; // Spread if multiple parents
          node.position.y = relatorCenterY - parentOffsetY;

          repositionedNodeIds.add(id);
        }
      });
    });

    // Move to next group position
    currentGroupX += groupWidth + relatorSpread;
  });

  return nodes;
}

/**
 * Identify which nodes are mediated by which relators.
 * Returns a Map<nodeId, Set<relatorId>> indicating which relators mediate each node.
 */
function identifyMediatedNodes(edges) {
  const mediatedBy = new Map();

  edges.forEach((edge) => {
    // Check if this is a mediation edge
    const isMediation = edge.type === "mediation" || edge.data?.stereotype === "mediation";
    if (isMediation) {
      const relatorId = edge.source;
      const mediatedNodeId = edge.target;

      if (!mediatedBy.has(mediatedNodeId)) {
        mediatedBy.set(mediatedNodeId, new Set());
      }
      mediatedBy.get(mediatedNodeId).add(relatorId);
    }
  });

  return mediatedBy;
}

/**
 * Check if an edge is a material relation between nodes that are both mediated
 * by the same relator (co-mediated nodes).
 *
 * Material relations between co-mediated nodes should use top handles to avoid
 * overlapping with the horizontal mediation edges.
 */
function isMaterialBetweenCoMediatedNodes(edge, mediatedBy) {
  // Check if this is a material relation
  const isMaterial = edge.type === "association" && edge.data?.stereotype === "material";
  if (!isMaterial) return false;

  // Get the relators that mediate source and target
  const sourceRelators = mediatedBy.get(edge.source);
  const targetRelators = mediatedBy.get(edge.target);

  // Both nodes must be mediated
  if (!sourceRelators || !targetRelators) return false;

  // Check if they share at least one common relator
  for (const relatorId of sourceRelators) {
    if (targetRelators.has(relatorId)) {
      return true;
    }
  }

  return false;
}

/**
 * Build a tree structure representing generalization hierarchies.
 * Returns maps of parent→children and child→parent relationships.
 *
 * Generalization edges go FROM child TO parent (arrow points TO parent).
 * So edge.source = child, edge.target = parent.
 */
function buildGeneralizationTree(nodes, edges) {
  const parentToChildren = new Map(); // parentId -> [childIds]
  const childToParent = new Map(); // childId -> parentId

  edges.forEach((edge) => {
    if (edge.type === "generalization") {
      const childId = edge.source; // Arrow comes FROM child
      const parentId = edge.target; // Arrow points TO parent

      if (!parentToChildren.has(parentId)) {
        parentToChildren.set(parentId, []);
      }
      parentToChildren.get(parentId).push(childId);
      childToParent.set(childId, parentId);
    }
  });

  return { parentToChildren, childToParent };
}

/**
 * Calculate the width of a subtree rooted at nodeId.
 * Width is based on the number of leaf nodes (nodes with no children).
 * This determines how much horizontal space the subtree needs.
 *
 * @param {string} nodeId - Root of the subtree
 * @param {Map} parentToChildren - Parent to children mapping
 * @param {Map} subtreeWidthCache - Cache for memoization
 * @returns {number} Width of subtree (minimum 1 for leaf nodes)
 */
function calculateSubtreeWidth(nodeId, parentToChildren, subtreeWidthCache) {
  // Return cached value if available
  if (subtreeWidthCache.has(nodeId)) {
    return subtreeWidthCache.get(nodeId);
  }

  const children = parentToChildren.get(nodeId) || [];

  if (children.length === 0) {
    // Leaf node - width is 1
    subtreeWidthCache.set(nodeId, 1);
    return 1;
  }

  // Sum of children's subtree widths
  const totalWidth = children.reduce((sum, childId) => {
    return sum + calculateSubtreeWidth(childId, parentToChildren, subtreeWidthCache);
  }, 0);

  subtreeWidthCache.set(nodeId, totalWidth);
  return totalWidth;
}

/**
 * Apply generalization hierarchy layout with smart spacing.
 * Positions parent classes ABOVE their children, with children spread horizontally.
 * Spacing is proportional to subtree width - siblings with more descendants get more space.
 *
 * This respects already-positioned nodes (e.g., from relator layout) and adjusts
 * only those nodes that haven't been positioned yet.
 *
 * @param {Array} nodes - Nodes (may be partially positioned)
 * @param {Array} edges - Edges
 * @param {Object} options - Layout options
 * @param {Set} repositionedNodeIds - Set of node IDs already positioned
 */
function applyGeneralizationLayout(nodes, edges, options = {}, repositionedNodeIds = new Set()) {
  const {
    baseNodeSpacing = 180, // Base horizontal spacing per "unit" of subtree width
    levelHeight = 150,     // Vertical distance between hierarchy levels
    minNodeSpacing = 160,  // Minimum spacing between sibling nodes
  } = options;

  const { parentToChildren, childToParent } = buildGeneralizationTree(nodes, edges);

  // If no generalizations, return early
  if (parentToChildren.size === 0) {
    console.log("[Smart Spacing] No generalization edges found");
    return nodes;
  }

  console.log("[Smart Spacing] Generalization tree built:", {
    parentToChildren: Object.fromEntries(parentToChildren),
    childToParent: Object.fromEntries(childToParent),
  });

  // Pre-calculate subtree widths for all nodes (memoized)
  const subtreeWidthCache = new Map();
  for (const nodeId of parentToChildren.keys()) {
    calculateSubtreeWidth(nodeId, parentToChildren, subtreeWidthCache);
  }

  console.log("[Smart Spacing] Subtree widths calculated:", Object.fromEntries(subtreeWidthCache));

  // Find root parents (parents that are not children of anyone in the hierarchy)
  const rootParents = [...parentToChildren.keys()].filter((id) => !childToParent.has(id));
  console.log("[Smart Spacing] Root parents:", rootParents);

  // For each root, layout the subtree with smart spacing
  rootParents.forEach((rootId) => {
    const rootNode = nodes.find((n) => n.id === rootId);
    if (!rootNode) return;

    // Recursively position subtree below root
    positionSubtreeWithSmartSpacing(
      rootId,
      parentToChildren,
      nodes,
      rootNode.position.y,
      subtreeWidthCache,
      baseNodeSpacing,
      minNodeSpacing,
      levelHeight,
      repositionedNodeIds
    );
  });

  // After positioning children, recenter parents above their children
  // Process bottom-up so children positions are final
  // Pass levelHeight so Y positioning uses consistent spacing
  recenterParentsAboveChildren(parentToChildren, childToParent, nodes, repositionedNodeIds, levelHeight);

  return nodes;
}

/**
 * Recursively position children below their parent using smart spacing.
 * Space allocated to each child is proportional to its subtree width.
 *
 * @param {string} parentId - Parent node ID
 * @param {Map} parentToChildren - Parent to children mapping
 * @param {Array} nodes - All nodes
 * @param {number} parentY - Parent's Y position
 * @param {Map} subtreeWidthCache - Pre-calculated subtree widths
 * @param {number} baseNodeSpacing - Base spacing per unit of subtree width
 * @param {number} minNodeSpacing - Minimum spacing between siblings
 * @param {number} levelHeight - Vertical distance between levels
 * @param {Set} repositionedNodeIds - Set of already-positioned node IDs
 */
function positionSubtreeWithSmartSpacing(
  parentId,
  parentToChildren,
  nodes,
  parentY,
  subtreeWidthCache,
  baseNodeSpacing,
  minNodeSpacing,
  levelHeight,
  repositionedNodeIds
) {
  const parent = nodes.find((n) => n.id === parentId);
  const childIds = parentToChildren.get(parentId) || [];

  if (childIds.length === 0) return;

  // Get parent dimensions
  const parentWidth = parent?.measured?.width || 150;
  const parentHeight = parent?.measured?.height || 52;
  const parentCenterX = parent ? parent.position.x + parentWidth / 2 : 0;

  // Calculate default child Y position (below parent)
  const defaultChildY = parentY + parentHeight + levelHeight;

  // Check if any siblings are already positioned (by relator layout)
  // If so, use their Y position to ensure all siblings are aligned
  const childNodes = childIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean);
  const prePositionedSiblings = childNodes.filter((child) => repositionedNodeIds.has(child.id));
  
  let childY;
  if (prePositionedSiblings.length > 0) {
    // Use the Y position of the first pre-positioned sibling
    // This ensures all siblings align with those already placed by relator layout
    childY = prePositionedSiblings[0].position.y;
    console.log("[Generalization Debug] Using pre-positioned sibling Y:", {
      parentId: parentId,
      prePositionedSibling: prePositionedSiblings[0].id,
      siblingY: childY,
      defaultY: defaultChildY,
    });
  } else {
    childY = defaultChildY;
  }

  // Calculate space needed for each child based on subtree width
  const childSpaces = childIds.map((childId) => {
    const subtreeWidth = subtreeWidthCache.get(childId) || 1;
    // Each unit of subtree width gets baseNodeSpacing, but ensure minimum spacing
    return Math.max(subtreeWidth * baseNodeSpacing, minNodeSpacing);
  });

  // Total width needed for all children
  const totalWidth = childSpaces.reduce((sum, space) => sum + space, 0);

  // Starting X position (left edge of the leftmost child's space)
  let currentX = parentCenterX - totalWidth / 2;

  childIds.forEach((childId, index) => {
    const child = nodes.find((n) => n.id === childId);
    if (!child) return;

    const childWidth = child.measured?.width || 150;
    const allocatedSpace = childSpaces[index];

    // Position child at the center of its allocated space
    const childCenterX = currentX + allocatedSpace / 2;

    // Check if this child was already positioned (e.g., by relator layout)
    const wasPrePositioned = repositionedNodeIds.has(childId);

    if (!wasPrePositioned) {
      // Not pre-positioned: set both X and Y
      child.position.x = childCenterX - childWidth / 2;
      child.position.y = childY;
      repositionedNodeIds.add(childId);

      console.log("[Generalization Debug] Child positioned:", {
        id: childId,
        name: child.data?.name,
        parentId: parentId,
        subtreeWidth: subtreeWidthCache.get(childId),
        allocatedSpace: allocatedSpace,
        x: child.position.x,
        y: child.position.y,
      });
    } else {
      // Pre-positioned: only align Y to match siblings, preserve X from relator layout
      // This ensures siblings are at the same hierarchy level
      if (child.position.y !== childY) {
        console.log("[Generalization Debug] Aligning pre-positioned sibling Y:", {
          id: childId,
          name: child.data?.name,
          oldY: child.position.y,
          newY: childY,
        });
        child.position.y = childY;
      }
    }

    // Move to next position
    currentX += allocatedSpace;

    // Recursively position grandchildren
    positionSubtreeWithSmartSpacing(
      childId,
      parentToChildren,
      nodes,
      child.position.y,
      subtreeWidthCache,
      baseNodeSpacing,
      minNodeSpacing,
      levelHeight,
      repositionedNodeIds
    );
  });
}

/**
 * Recenter parents above their children clusters.
 * Process from deepest children up to ensure child positions are finalized first.
 * 
 * This function handles both X centering and Y positioning:
 * - X: Centers parent horizontally above children cluster
 * - Y: Ensures parent is ABOVE all children (fixes cases where children were pre-positioned by relator layout)
 * 
 * @param {Map} parentToChildren - Parent to children mapping
 * @param {Map} childToParent - Child to parent mapping
 * @param {Array} nodes - All nodes
 * @param {Set} repositionedNodeIds - Set of already-positioned node IDs
 * @param {number} levelHeight - Vertical spacing between parent and children (default 150)
 */
function recenterParentsAboveChildren(parentToChildren, childToParent, nodes, repositionedNodeIds, levelHeight = 150) {
  // Build depth map (distance from root)
  const depthMap = new Map();

  function setDepth(nodeId, depth) {
    depthMap.set(nodeId, depth);
    const children = parentToChildren.get(nodeId) || [];
    children.forEach((childId) => setDepth(childId, depth + 1));
  }

  // Find roots and set depths
  const roots = [...parentToChildren.keys()].filter((id) => !childToParent.has(id));
  roots.forEach((rootId) => setDepth(rootId, 0));

  // Sort parents by depth descending (deepest first for bottom-up processing)
  const sortedParents = [...parentToChildren.keys()].sort((a, b) => (depthMap.get(b) || 0) - (depthMap.get(a) || 0));

  sortedParents.forEach((parentId) => {
    const parent = nodes.find((n) => n.id === parentId);
    if (!parent) return;

    const childIds = parentToChildren.get(parentId) || [];
    const childNodes = childIds.map((id) => nodes.find((n) => n.id === id)).filter(Boolean);

    if (childNodes.length === 0) return;

    const parentWidth = parent.measured?.width || 150;
    const parentHeight = parent.measured?.height || 52;

    // Calculate average center X of children (for horizontal centering)
    const avgChildCenterX =
      childNodes.reduce((sum, child) => {
        const childWidth = child.measured?.width || 150;
        return sum + child.position.x + childWidth / 2;
      }, 0) / childNodes.length;

    // Find the minimum Y position of all children (topmost child)
    const minChildY = Math.min(...childNodes.map((child) => child.position.y));

    // Calculate where parent should be: ABOVE the topmost child
    const targetParentY = minChildY - parentHeight - levelHeight;

    // Check if parent needs to be moved up (is currently at or below children)
    const parentNeedsYAdjustment = parent.position.y >= minChildY - parentHeight;

    // Adjust X position (center above children)
    // Only if not already repositioned by higher-priority layout (like relator layout)
    if (!repositionedNodeIds.has(parentId)) {
      parent.position.x = avgChildCenterX - parentWidth / 2;
      repositionedNodeIds.add(parentId);
    }

    // ALWAYS adjust Y if parent is not above children
    // This fixes cases where children were pre-positioned by relator layout
    if (parentNeedsYAdjustment) {
      const oldY = parent.position.y;
      parent.position.y = targetParentY;

      console.log("[Generalization Debug] Parent repositioned above children:", {
        id: parentId,
        name: parent.data?.name,
        oldY: oldY,
        newY: parent.position.y,
        minChildY: minChildY,
        childCount: childNodes.length,
      });
    } else {
      console.log("[Generalization Debug] Parent already above children:", {
        id: parentId,
        name: parent.data?.name,
        parentY: parent.position.y,
        minChildY: minChildY,
      });
    }
  });
}

/**
 * Detect dependency edges from classes to enums.
 * Returns array of { sourceNode, targetNode, isFromRelator } objects.
 */
function detectEnumDependencies(nodes, edges) {
  const dependencies = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  edges.forEach((edge) => {
    if (edge.type === "dependency") {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode || !targetNode) return;

      const isFromRelator = sourceNode.data?.stereotype?.toLowerCase() === "relator";
      const isToEnum = targetNode.type === "ontoUmlEnum";

      if (isToEnum) {
        dependencies.push({
          edge,
          sourceNode,
          targetNode,
          isFromRelator,
        });
      }
    }
  });

  return dependencies;
}

/**
 * Apply enum/datatype dependency layout.
 * Positions enums based on their source:
 * - From Relator: enum positioned BELOW relator (handled by applyRelatorLayout)
 * - From Class: enum positioned to the RIGHT of the class
 *
 * @param {Array} nodes - Nodes (may be partially positioned)
 * @param {Array} edges - Edges
 * @param {Object} options - Layout options
 * @param {Set} repositionedNodeIds - Set of node IDs already positioned
 */
function applyEnumDependencyLayout(nodes, edges, options = {}, repositionedNodeIds = new Set()) {
  const { enumOffsetX = 200, enumOffsetY = 150 } = options;

  const dependencies = detectEnumDependencies(nodes, edges);

  dependencies.forEach(({ sourceNode, targetNode, isFromRelator }) => {
    // Skip if already positioned (e.g., by relator layout)
    if (repositionedNodeIds.has(targetNode.id)) return;

    const sourceWidth = sourceNode.measured?.width || 150;
    const sourceHeight = sourceNode.measured?.height || 52;
    const targetHeight = targetNode.measured?.height || 48;

    if (isFromRelator) {
      // Relator dependency: enum below (already handled by applyRelatorLayout)
      // But if not positioned yet, position it below
      targetNode.position.x = sourceNode.position.x;
      targetNode.position.y = sourceNode.position.y + sourceHeight + enumOffsetY;

      console.log("[Enum Layout Debug] Enum below relator:", {
        id: targetNode.id,
        name: targetNode.data?.name,
        sourceId: sourceNode.id,
      });
    } else {
      // Class dependency: enum to the right
      // Align vertical center with source class center
      const sourceCenterY = sourceNode.position.y + sourceHeight / 2;
      targetNode.position.x = sourceNode.position.x + sourceWidth + enumOffsetX;
      targetNode.position.y = sourceCenterY - targetHeight / 2;

      console.log("[Enum Layout Debug] Enum to right of class:", {
        id: targetNode.id,
        name: targetNode.data?.name,
        sourceId: sourceNode.id,
        newX: targetNode.position.x,
        newY: targetNode.position.y,
      });
    }

    repositionedNodeIds.add(targetNode.id);
  });

  return nodes;
}

/**
 * Assign sourceHandle and targetHandle to edges based on relative node positions.
 * This ensures edges connect through the appropriate side handles for clean routing.
 *
 * Handle naming convention: "{position}-{type}" (e.g., "left-source", "right-target")
 *
 * Logic:
 * - Generalization edges: always use top-source (child) to bottom-target (parent)
 * - Material relations between co-mediated nodes: use top handles (curves above)
 * - If target is to the RIGHT of source: source uses right-source, target uses left-target
 * - If target is to the LEFT of source: source uses left-source, target uses right-target
 * - If target is BELOW source: source uses bottom-source, target uses top-target
 * - If target is ABOVE source: source uses top-source, target uses bottom-target
 */
function assignEdgeHandles(nodes, edges) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build mediation map for co-mediated node detection
  const mediatedBy = identifyMediatedNodes(edges);

  return edges.map((edge) => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);

    if (!sourceNode || !targetNode) return edge;

    // Calculate relative positions (using node position which is top-left corner)
    // Add half of estimated node width/height for center-to-center calculation
    const sourceX = sourceNode.position.x + (sourceNode.measured?.width || 150) / 2;
    const sourceY = sourceNode.position.y + (sourceNode.measured?.height || 52) / 2;
    const targetX = targetNode.position.x + (targetNode.measured?.width || 150) / 2;
    const targetY = targetNode.position.y + (targetNode.measured?.height || 52) / 2;

    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    let sourceHandle, targetHandle;

    // Priority 1: Generalization edges - always use top (child) to bottom (parent)
    // This creates the standard UML hierarchy visual with arrow pointing up to parent
    if (edge.type === "generalization") {
      sourceHandle = "top-source"; // Child at top
      targetHandle = "bottom-target"; // Parent at bottom
      return { ...edge, sourceHandle, targetHandle };
    }

    // Priority 2: Material relations between co-mediated nodes should use top handles
    // This curves the edge above the nodes, avoiding conflict with horizontal mediations
    if (isMaterialBetweenCoMediatedNodes(edge, mediatedBy)) {
      sourceHandle = "top-source";
      targetHandle = "top-target";
      return { ...edge, sourceHandle, targetHandle };
    }

    // Priority 3: Position-based routing for other edge types
    // Use 0.5 threshold - prefer horizontal handles unless clearly vertical
    // This ensures nodes that are roughly on the same Y level use left/right handles
    const isMostlyHorizontal = absDx > absDy * 0.5;
    const isMostlyVertical = absDy > absDx * 2;

    if (isMostlyHorizontal) {
      if (dx > 0) {
        // Target is to the RIGHT of source
        sourceHandle = "right-source";
        targetHandle = "left-target";
      } else {
        // Target is to the LEFT of source
        sourceHandle = "left-source";
        targetHandle = "right-target";
      }
    } else if (isMostlyVertical) {
      if (dy > 0) {
        // Target is BELOW source (positive Y is down in screen coordinates)
        sourceHandle = "bottom-source";
        targetHandle = "top-target";
      } else {
        // Target is ABOVE source
        sourceHandle = "top-source";
        targetHandle = "bottom-target";
      }
    } else {
      // Diagonal case - prefer horizontal handles for cleaner routing
      if (dx > 0) {
        sourceHandle = "right-source";
        targetHandle = "left-target";
      } else {
        sourceHandle = "left-source";
        targetHandle = "right-target";
      }
    }

    return { ...edge, sourceHandle, targetHandle };
  });
}

/**
 * Apply dagre layout to nodes and edges.
 * Returns positioned nodes with x,y coordinates.
 *
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} options - Layout options
 * @returns {{ layoutedNodes: Array, layoutedEdges: Array }}
 */
export function applyDagreLayout(nodes, edges, options = {}) {
  if (!nodes.length) {
    return { layoutedNodes: [], layoutedEdges: edges };
  }

  const {
    direction = "TB", // TB = top-to-bottom, LR = left-to-right
    nodeSep = 150, // Horizontal separation between nodes
    rankSep = 180, // Vertical separation between ranks
    align = "UL", // Alignment within rank
  } = options;

  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: nodeSep,
    ranksep: rankSep,
    align,
    marginx: 20,
    marginy: 20,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    const { width, height } = getNodeDimensions(node);
    g.setNode(node.id, { width, height });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    // Only add edge if both nodes exist
    if (g.hasNode(edge.source) && g.hasNode(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  });

  // Run dagre layout
  dagre.layout(g);

  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const dagreNode = g.node(node.id);
    if (!dagreNode) {
      return node;
    }

    // Dagre gives center position, React Flow uses top-left
    const { width, height } = getNodeDimensions(node);
    return {
      ...node,
      position: {
        x: dagreNode.x - width / 2,
        y: dagreNode.y - height / 2,
      },
      // Store measured dimensions for potential future use
      measured: { width, height },
    };
  });

  // Track which nodes have been repositioned by each layout phase
  const repositionedNodeIds = new Set();

  // Post-process Phase 1: Apply relator-specific layout (highest priority)
  // This positions relators, mediated classes, and relator enums
  applyRelatorLayout(layoutedNodes, edges, {
    mediationSpread: options.mediationSpread || 220,
    enumOffsetY: options.enumOffsetY || 150,
    parentOffsetY: options.parentOffsetY || 150,
    relatorSpread: options.relatorSpread || 500,
  }, repositionedNodeIds);

  // Post-process Phase 2: Apply generalization hierarchy layout with smart spacing
  // This positions parents above children, allocates space proportional to subtree width
  applyGeneralizationLayout(layoutedNodes, edges, {
    baseNodeSpacing: options.baseNodeSpacing || 180,
    minNodeSpacing: options.minNodeSpacing || 160,
    levelHeight: options.levelHeight || 150,
  }, repositionedNodeIds);

  // Post-process Phase 3: Apply enum dependency layout
  // This positions enums to the right of classes that reference them
  applyEnumDependencyLayout(layoutedNodes, edges, {
    enumOffsetX: options.enumOffsetX || 200,
    enumOffsetY: options.enumOffsetY || 150,
  }, repositionedNodeIds);

  // Assign edge handles based on final node positions
  const finalEdges = assignEdgeHandles(layoutedNodes, edges);

  return { layoutedNodes, layoutedEdges: finalEdges };
}

/**
 * Re-layout nodes using actual measured heights from React Flow.
 * This should be called after React Flow has measured all nodes.
 *
 * @param {Array} nodesWithMeasurements - React Flow nodes with measured dimensions
 * @param {Array} edges - React Flow edges
 * @param {Object} options - Layout options
 * @returns {{ nodes: Array, edges: Array }}
 */
export function relayoutWithMeasurements(nodesWithMeasurements, edges, options = {}) {
  // Clone nodes to avoid mutation
  const repositionedNodes = nodesWithMeasurements.map(n => ({ ...n }));
  
  // Track which nodes have been repositioned
  const repositionedNodeIds = new Set();
  
  // Phase 1: Apply relator layout using actual measurements
  applyRelatorLayout(repositionedNodes, edges, options, repositionedNodeIds);
  
  // Phase 2: Apply generalization hierarchy layout with smart spacing
  applyGeneralizationLayout(repositionedNodes, edges, {
    baseNodeSpacing: options.baseNodeSpacing || 180,
    minNodeSpacing: options.minNodeSpacing || 160,
    levelHeight: options.levelHeight || 150,
  }, repositionedNodeIds);

  // Phase 3: Apply enum dependency layout
  applyEnumDependencyLayout(repositionedNodes, edges, {
    enumOffsetX: options.enumOffsetX || 200,
    enumOffsetY: options.enumOffsetY || 150,
  }, repositionedNodeIds);

  // Re-assign edge handles based on new positions
  const finalEdges = assignEdgeHandles(repositionedNodes, edges);

  return { nodes: repositionedNodes, edges: finalEdges };
}

/**
 * Hook-style function to compute layout.
 * Can be used directly without React hooks for simpler usage.
 *
 * @param {Array} nodes - React Flow nodes
 * @param {Array} edges - React Flow edges
 * @param {Object} options - Layout options
 * @returns {{ layoutedNodes: Array, layoutedEdges: Array }}
 */
export function useLayout(nodes, edges, options = {}) {
  // For now, this is a simple synchronous computation.
  // Could be enhanced with useMemo if needed, but React Compiler handles that.
  return applyDagreLayout(nodes, edges, options);
}

export default useLayout;
