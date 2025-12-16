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
 * Identify hub nodes - nodes mediated by 2+ relators.
 * Hub nodes need special positioning as they're shared between relators.
 *
 * @param {Array} patterns - Relator patterns from detectRelatorPatterns
 * @returns {Map<nodeId, { relatorIds: string[], mediationCount: number }>}
 */
function identifyHubNodes(patterns) {
  const nodeMediationMap = new Map();

  // Count how many relators mediate each node
  patterns.forEach((pattern) => {
    const relatorId = pattern.relator.id;
    pattern.mediatedNodeIds.forEach((nodeId) => {
      if (!nodeMediationMap.has(nodeId)) {
        nodeMediationMap.set(nodeId, { relatorIds: [], mediationCount: 0 });
      }
      const entry = nodeMediationMap.get(nodeId);
      entry.relatorIds.push(relatorId);
      entry.mediationCount++;
    });
  });

  // Filter to only hub nodes (mediated by 2+ relators)
  const hubNodes = new Map();
  nodeMediationMap.forEach((value, nodeId) => {
    if (value.mediationCount >= 2) {
      hubNodes.set(nodeId, value);
    }
  });

  return hubNodes;
}

/**
 * Sort relators by connectivity - relators with more hub connections first.
 * This ensures highly-connected relators are positioned centrally.
 *
 * @param {Array} patterns - Relator patterns
 * @param {Map} hubNodes - Hub node map from identifyHubNodes
 * @returns {Array} Sorted patterns (most connected first)
 */
function sortRelatorsByConnectivity(patterns, hubNodes) {
  return [...patterns].sort((a, b) => {
    // Count hub connections for each relator
    const aHubCount = a.mediatedNodeIds.filter((id) => hubNodes.has(id)).length;
    const bHubCount = b.mediatedNodeIds.filter((id) => hubNodes.has(id)).length;

    // More hub connections = higher priority (sorted first)
    if (bHubCount !== aHubCount) return bHubCount - aHubCount;

    // Secondary sort: more total mediations = higher priority
    return b.mediatedNodeIds.length - a.mediatedNodeIds.length;
  });
}

/**
 * Group connected patterns - patterns that share nodes are in the same group.
 * Uses BFS to find all connected patterns.
 *
 * @param {Array} patterns - All relator patterns
 * @returns {Array<Array<number>>} Array of groups, each containing pattern indices
 */
function groupConnectedPatterns(patterns) {
  // Build node-to-patterns mapping
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

  // Group connected patterns using BFS
  const patternGroups = [];
  const processedPatterns = new Set();

  patterns.forEach((_, idx) => {
    if (processedPatterns.has(idx)) return;

    const group = [idx];
    processedPatterns.add(idx);

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

  return patternGroups;
}

/**
 * Assign relators to vertical rows.
 * Relators that share hub nodes go on different rows to prevent overlap.
 *
 * @param {Array} patterns - Sorted relator patterns
 * @param {Map} hubNodes - Hub node map
 * @returns {Array<Array>} Array of rows, each containing patterns for that row
 */
function assignRelatorsToRows(patterns, hubNodes) {
  const rows = [];
  const assignedRelators = new Set();

  patterns.forEach((pattern) => {
    if (assignedRelators.has(pattern.relator.id)) return;

    // Find which row this relator can go in
    let assignedRow = -1;

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const rowRelators = rows[rowIdx];
      let canPlaceInRow = true;

      // Check if any relator in this row shares a hub with current pattern
      for (const existingPattern of rowRelators) {
        const sharedHubs = pattern.mediatedNodeIds.filter(
          (id) => hubNodes.has(id) && existingPattern.mediatedNodeIds.includes(id)
        );

        if (sharedHubs.length > 0) {
          canPlaceInRow = false;
          break;
        }
      }

      if (canPlaceInRow) {
        assignedRow = rowIdx;
        break;
      }
    }

    // If no suitable row found, create a new one
    if (assignedRow === -1) {
      assignedRow = rows.length;
      rows.push([]);
    }

    rows[assignedRow].push(pattern);
    assignedRelators.add(pattern.relator.id);
  });

  return rows;
}

/**
 * Calculate the width needed for a group of patterns.
 * Handles both simple layout (no hubs) and hub-aware layout differently.
 *
 * @param {Array} patterns - Patterns in this group
 * @param {number} mediationSpread - Horizontal spacing for mediations
 * @param {Map} hubNodes - Hub node map
 * @param {boolean} groupHasHubs - Whether this group has any hub nodes
 * @returns {number} Total width needed
 */
function calculateGroupWidth(patterns, mediationSpread, hubNodes, groupHasHubs) {
  if (!groupHasHubs) {
    // Simple layout: width based on alternating left/right positioning
    // For alternating, we need ceil(count/2) positions on each side
    const maxMediations = Math.max(...patterns.map((p) => p.mediatedNodeIds.length));
    const sidesNeeded = Math.ceil(maxMediations / 2);
    // Width = left side + relator + right side
    return mediationSpread * sidesNeeded * 2 + 200;
  }

  // Hub-aware layout: consider non-hub nodes and hub nodes separately
  const maxNonHubCount = Math.max(
    ...patterns.map((p) => {
      return p.mediatedNodeIds.filter((id) => !hubNodes.has(id)).length;
    })
  );

  // Base width for non-hub mediated nodes (alternating left/right of relator)
  const sidesNeeded = Math.ceil(maxNonHubCount / 2);
  const baseWidth = mediationSpread * sidesNeeded * 2 + 200;

  // Add width for hub nodes (positioned to the right)
  const hubCount = new Set(
    patterns.flatMap((p) => p.mediatedNodeIds.filter((id) => hubNodes.has(id)))
  ).size;
  const hubWidth = hubCount * mediationSpread;

  return baseWidth + hubWidth;
}

/**
 * Layout a pattern group using simple alternating left/right positioning.
 * Used when the group has NO hub nodes (no shared mediations between relators).
 *
 * @param {Array} patterns - Patterns in this group
 * @param {Array} nodes - All nodes
 * @param {number} startX - Starting X position for this group
 * @param {number} mediationSpread - Horizontal spacing
 * @param {number} enumOffsetY - Vertical offset for enums
 * @param {Set} repositionedNodeIds - Track repositioned nodes
 * @returns {number} The ending X position (for next group)
 */
function layoutSimplePatternGroup(patterns, nodes, startX, mediationSpread, enumOffsetY, repositionedNodeIds) {
  let currentX = startX;

  patterns.forEach((pattern) => {
    const { relator, mediatedNodeIds, enumNodeIds } = pattern;

    // Calculate width needed for this pattern's mediations
    const sidesNeeded = Math.ceil(mediatedNodeIds.length / 2);
    const patternWidth = mediationSpread * Math.max(sidesNeeded, 1) * 2 + 200;
    const relatorCenterX = currentX + patternWidth / 2;

    const relatorWidth = relator.measured?.width || 150;
    const relatorHeight = relator.measured?.height || 52;
    const relatorY = relator.position.y; // Keep dagre's Y position
    const relatorCenterY = relatorY + relatorHeight / 2;

    // Position relator at center of its group
    if (!repositionedNodeIds.has(relator.id)) {
      relator.position.x = relatorCenterX - relatorWidth / 2;
      relator.position.y = relatorY;
      repositionedNodeIds.add(relator.id);
    }

    console.log("[Simple Layout] Relator positioned:", {
      name: relator.data?.name,
      x: relator.position.x,
      y: relator.position.y,
    });

    // Position mediated nodes alternating LEFT/RIGHT
    mediatedNodeIds.forEach((nodeId, index) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || repositionedNodeIds.has(nodeId)) return;

      const nodeWidth = node.measured?.width || 150;
      const nodeHeight = node.measured?.height || 52;

      // Alternate: 0 -> left, 1 -> right, 2 -> further left, etc.
      const side = index % 2 === 0 ? -1 : 1;
      const distance = mediationSpread * Math.ceil((index + 1) / 2);

      // Position relative to relator CENTER
      node.position.x = relator.position.x + relatorWidth / 2 + side * distance - nodeWidth / 2;
      node.position.y = relatorCenterY - nodeHeight / 2;
      repositionedNodeIds.add(nodeId);

      console.log("[Simple Layout] Mediated node positioned:", {
        name: node.data?.name,
        side: side === -1 ? "left" : "right",
        x: node.position.x,
        y: node.position.y,
      });
    });

    // Position enums below relator (centered)
    enumNodeIds.forEach((enumId, index) => {
      const enumNode = nodes.find((n) => n.id === enumId);
      if (!enumNode || repositionedNodeIds.has(enumId)) return;

      const enumWidth = enumNode.measured?.width || 140;
      const offset = (index - (enumNodeIds.length - 1) / 2) * 180;

      enumNode.position.x = relator.position.x + relatorWidth / 2 + offset - enumWidth / 2;
      enumNode.position.y = relator.position.y + relatorHeight + enumOffsetY;
      repositionedNodeIds.add(enumId);

      console.log("[Simple Layout] Enum positioned:", {
        name: enumNode.data?.name,
        x: enumNode.position.x,
        y: enumNode.position.y,
      });
    });

    currentX += patternWidth + 100; // Gap between patterns
  });

  return currentX;
}

/**
 * Layout a pattern group using hub-aware vertical stacking.
 * Used when the group HAS hub nodes (shared mediations between relators).
 *
 * @param {Array} patterns - Sorted patterns in this group
 * @param {Map} hubNodes - Hub node map
 * @param {Array} nodes - All nodes
 * @param {number} startX - Starting X position
 * @param {number} groupWidth - Pre-calculated group width
 * @param {number} mediationSpread - Horizontal spacing
 * @param {number} enumOffsetY - Vertical offset for enums
 * @param {number} relatorRowSpacing - Vertical spacing between rows
 * @param {Set} repositionedNodeIds - Track repositioned nodes
 * @returns {number} The ending X position
 */
function layoutHubAwarePatternGroup(
  patterns,
  hubNodes,
  nodes,
  startX,
  groupWidth,
  mediationSpread,
  enumOffsetY,
  relatorRowSpacing,
  repositionedNodeIds
) {
  const groupCenterX = startX + groupWidth / 2;

  // Assign relators to vertical rows
  const relatorRows = assignRelatorsToRows(patterns, hubNodes);

  console.log(
    "[Hub Layout] Relator rows:",
    relatorRows.map((row, i) => `Row ${i}: ${row.map((p) => p.relator.data?.name).join(", ")}`)
  );

  // Position relators in their rows
  const baseY = 100;
  const relatorPositions = new Map();

  relatorRows.forEach((rowPatterns, rowIndex) => {
    const rowY = baseY + rowIndex * relatorRowSpacing;
    const rowWidth = rowPatterns.length * mediationSpread;
    let rowStartX = groupCenterX - rowWidth / 2;

    rowPatterns.forEach((pattern, indexInRow) => {
      const relator = pattern.relator;
      const relatorWidth = relator.measured?.width || 150;

      const relatorX = rowStartX + indexInRow * mediationSpread + mediationSpread / 2 - relatorWidth / 2;

      if (!repositionedNodeIds.has(relator.id)) {
        relator.position.x = relatorX;
        relator.position.y = rowY;
        repositionedNodeIds.add(relator.id);
      }

      relatorPositions.set(relator.id, { x: relator.position.x, y: relator.position.y });

      console.log("[Hub Layout] Relator positioned:", {
        name: relator.data?.name,
        row: rowIndex,
        x: relator.position.x,
        y: relator.position.y,
      });
    });
  });

  // Position hub nodes at vertical center of their connected relators
  hubNodes.forEach((hubInfo, hubNodeId) => {
    const hubNode = nodes.find((n) => n.id === hubNodeId);
    if (!hubNode || repositionedNodeIds.has(hubNodeId)) return;

    // Only process hubs that belong to this group
    const groupRelatorIds = new Set(patterns.map((p) => p.relator.id));
    const relevantRelatorIds = hubInfo.relatorIds.filter((rid) => groupRelatorIds.has(rid));

    if (relevantRelatorIds.length === 0) return;

    const connectedPositions = relevantRelatorIds.map((rid) => relatorPositions.get(rid)).filter(Boolean);

    if (connectedPositions.length === 0) return;

    const avgY = connectedPositions.reduce((sum, p) => sum + p.y, 0) / connectedPositions.length;
    const maxX = Math.max(...connectedPositions.map((p) => p.x));

    const hubHeight = hubNode.measured?.height || 52;

    hubNode.position.x = maxX + mediationSpread;
    hubNode.position.y = avgY - hubHeight / 2 + 26;
    repositionedNodeIds.add(hubNodeId);

    console.log("[Hub Layout] Hub node positioned:", {
      name: hubNode.data?.name,
      connectedRelators: relevantRelatorIds.length,
      x: hubNode.position.x,
      y: hubNode.position.y,
    });
  });

  // Position non-hub mediated nodes (ALTERNATING LEFT/RIGHT - this is the fix!)
  patterns.forEach((pattern) => {
    const relator = pattern.relator;
    const relatorWidth = relator.measured?.width || 150;
    const relatorHeight = relator.measured?.height || 52;
    const relatorCenterY = relator.position.y + relatorHeight / 2;

    const nonHubMediatedIds = pattern.mediatedNodeIds.filter((id) => !hubNodes.has(id));

    nonHubMediatedIds.forEach((nodeId, index) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || repositionedNodeIds.has(nodeId)) return;

      const nodeWidth = node.measured?.width || 150;
      const nodeHeight = node.measured?.height || 52;

      // FIXED: Alternate left/right instead of all-left
      const side = index % 2 === 0 ? -1 : 1;
      const distance = mediationSpread * Math.ceil((index + 1) / 2);

      node.position.x = relator.position.x + relatorWidth / 2 + side * distance - nodeWidth / 2;
      node.position.y = relatorCenterY - nodeHeight / 2;
      repositionedNodeIds.add(nodeId);

      console.log("[Hub Layout] Non-hub node positioned:", {
        name: node.data?.name,
        side: side === -1 ? "left" : "right",
        x: node.position.x,
        y: node.position.y,
      });
    });

    // Position enums below relator
    pattern.enumNodeIds.forEach((enumId, index) => {
      const enumNode = nodes.find((n) => n.id === enumId);
      if (!enumNode || repositionedNodeIds.has(enumId)) return;

      const enumWidth = enumNode.measured?.width || 140;
      const relatorCenterX = relator.position.x + relatorWidth / 2;
      const offset = (index - (pattern.enumNodeIds.length - 1) / 2) * 180;

      enumNode.position.x = relatorCenterX + offset - enumWidth / 2;
      enumNode.position.y = relator.position.y + relatorHeight + enumOffsetY;
      repositionedNodeIds.add(enumId);
    });
  });

  return startX + groupWidth;
}

/**
 * Apply relator-specific layout positioning with hybrid approach.
 *
 * Algorithm:
 * 1. Identify hub nodes (mediated by 2+ relators)
 * 2. Group connected patterns
 * 3. For each group:
 *    - If NO hub nodes: Use simple layout (relator in center, mediations left/right)
 *    - If HAS hub nodes: Use hub-aware layout (vertical stacking, hubs to right)
 *
 * @param {Array} nodes - Nodes to position
 * @param {Array} edges - Edges
 * @param {Object} options - Layout options
 * @param {Set} repositionedNodeIds - Set to track repositioned node IDs
 */
function applyRelatorLayout(nodes, edges, options = {}, repositionedNodeIds = new Set()) {
  const {
    mediationSpread = 350,
    enumOffsetY = 180,
    relatorRowSpacing = 300, // Increased for better separation
    groupSpacing = 500,
  } = options;

  const patterns = detectRelatorPatterns(nodes, edges);

  if (patterns.length === 0) {
    return nodes;
  }

  // Identify hub nodes globally
  const hubNodes = identifyHubNodes(patterns);

  console.log("[Layout] Hub nodes found:", hubNodes.size);

  // Group connected patterns
  const patternGroups = groupConnectedPatterns(patterns);

  console.log("[Layout] Pattern groups:", patternGroups.length);

  // Process each group
  let currentGroupX = 100;

  patternGroups.forEach((groupPatternIndices) => {
    const groupPatterns = groupPatternIndices.map((idx) => patterns[idx]);

    // Check if this group has any hub nodes
    const groupHasHubs = groupPatterns.some((pattern) =>
      pattern.mediatedNodeIds.some((id) => hubNodes.has(id))
    );

    console.log(
      "[Layout] Group has hubs:",
      groupHasHubs,
      "patterns:",
      groupPatterns.map((p) => p.relator.data?.name)
    );

    if (!groupHasHubs) {
      // SIMPLE LAYOUT: No shared mediations
      // Relator in center, mediations alternate left/right
      currentGroupX = layoutSimplePatternGroup(
        groupPatterns,
        nodes,
        currentGroupX,
        mediationSpread,
        enumOffsetY,
        repositionedNodeIds
      );
    } else {
      // HUB-AWARE LAYOUT: Complex case with shared nodes
      // Vertical stacking, hubs to the right
      const sortedPatterns = sortRelatorsByConnectivity(groupPatterns, hubNodes);
      const groupWidth = calculateGroupWidth(sortedPatterns, mediationSpread, hubNodes, true);

      layoutHubAwarePatternGroup(
        sortedPatterns,
        hubNodes,
        nodes,
        currentGroupX,
        groupWidth,
        mediationSpread,
        enumOffsetY,
        relatorRowSpacing,
        repositionedNodeIds
      );

      currentGroupX += groupWidth;
    }

    currentGroupX += groupSpacing;
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

  // Calculate center X for positioning children
  // If some siblings are pre-positioned (e.g., by relator layout), use their center
  // Otherwise, use the parent's center
  let centerX;
  if (prePositionedSiblings.length > 0) {
    // Calculate center X from pre-positioned siblings' positions
    const prePositionedCenters = prePositionedSiblings.map((child) => {
      const width = child.measured?.width || 150;
      return child.position.x + width / 2;
    });
    centerX = prePositionedCenters.reduce((a, b) => a + b, 0) / prePositionedCenters.length;

    console.log("[Generalization Debug] Using pre-positioned siblings for centerX:", {
      parentId: parentId,
      prePositionedCount: prePositionedSiblings.length,
      prePositionedCenters: prePositionedCenters,
      calculatedCenterX: centerX,
      originalParentCenterX: parentCenterX,
    });
  } else {
    centerX = parentCenterX;
  }

  // Starting X position (left edge of the leftmost child's space)
  let currentX = centerX - totalWidth / 2;

  childIds.forEach((childId, index) => {
    const child = nodes.find((n) => n.id === childId);
    if (!child) return;

    const childWidth = child.measured?.width || 150;
    const allocatedSpace = childSpaces[index];

    // Position child at the center of its allocated space
    const childCenterX = currentX + allocatedSpace / 2;

    // Check if this child was already positioned (e.g., by relator layout)
    const wasPrePositioned = repositionedNodeIds.has(childId);

    // Calculate the new X position for this child
    const newX = childCenterX - childWidth / 2;

    if (!wasPrePositioned) {
      // Not pre-positioned: set both X and Y
      child.position.x = newX;
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
      // Pre-positioned by relator layout
      // We need to spread siblings evenly, so update X position as well
      // Only update if there are non-pre-positioned siblings that need proper spacing
      const hasNonPrePositionedSiblings = childIds.some(
        (id) => !repositionedNodeIds.has(id) || id === childId
      );

      if (hasNonPrePositionedSiblings && prePositionedSiblings.length < childIds.length) {
        // Mixed case: some siblings are pre-positioned, some are not
        // Reposition this pre-positioned sibling to maintain even spacing
        console.log("[Generalization Debug] Repositioning pre-positioned sibling for even spacing:", {
          id: childId,
          name: child.data?.name,
          oldX: child.position.x,
          newX: newX,
          oldY: child.position.y,
          newY: childY,
        });
        child.position.x = newX;
        child.position.y = childY;
      } else {
        // All siblings are pre-positioned, just align Y
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
 * Resolve node collisions by pushing overlapping nodes apart.
 * Uses iterative approach to handle chain reactions.
 *
 * @param {Array} nodes - All nodes
 * @param {number} minGap - Minimum gap between node edges (default 30px)
 * @param {number} maxIterations - Maximum iterations to prevent infinite loops
 * @returns {Array} Nodes with resolved positions
 */
function resolveCollisions(nodes, minGap = 30, maxIterations = 10) {
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let hasCollision = false;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Get node dimensions
        const aWidth = nodeA.measured?.width || 150;
        const aHeight = nodeA.measured?.height || 52;
        const bWidth = nodeB.measured?.width || 150;
        const bHeight = nodeB.measured?.height || 52;

        // Calculate centers
        const aCenterX = nodeA.position.x + aWidth / 2;
        const aCenterY = nodeA.position.y + aHeight / 2;
        const bCenterX = nodeB.position.x + bWidth / 2;
        const bCenterY = nodeB.position.y + bHeight / 2;

        // Calculate overlap amounts
        const minDistX = (aWidth + bWidth) / 2 + minGap;
        const minDistY = (aHeight + bHeight) / 2 + minGap;
        const actualDistX = Math.abs(aCenterX - bCenterX);
        const actualDistY = Math.abs(aCenterY - bCenterY);

        const overlapX = minDistX - actualDistX;
        const overlapY = minDistY - actualDistY;

        // Check if there's actual overlap (both X and Y must overlap)
        if (overlapX > 0 && overlapY > 0) {
          hasCollision = true;

          // Push apart in the direction of least overlap
          if (overlapX < overlapY) {
            // Push horizontally
            const pushX = overlapX / 2 + 5; // Extra 5px for safety
            if (aCenterX < bCenterX) {
              nodeA.position.x -= pushX;
              nodeB.position.x += pushX;
            } else {
              nodeA.position.x += pushX;
              nodeB.position.x -= pushX;
            }
          } else {
            // Push vertically
            const pushY = overlapY / 2 + 5;
            if (aCenterY < bCenterY) {
              nodeA.position.y -= pushY;
              nodeB.position.y += pushY;
            } else {
              nodeA.position.y += pushY;
              nodeB.position.y -= pushY;
            }
          }

          console.log("[Collision] Resolved overlap:", {
            nodeA: nodeA.data?.name || nodeA.id,
            nodeB: nodeB.data?.name || nodeB.id,
            overlapX,
            overlapY,
          });
        }
      }
    }

    // If no collisions found, we're done
    if (!hasCollision) {
      console.log(`[Collision] Resolved in ${iteration + 1} iterations`);
      break;
    }
  }

  return nodes;
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

  // Post-process Phase 1: Apply relator-specific layout
  // This positions relators, mediated classes, and relator enums
  applyRelatorLayout(layoutedNodes, edges, {
    mediationSpread: options.mediationSpread || 220,
    enumOffsetY: options.enumOffsetY || 150,
    parentOffsetY: options.parentOffsetY || 150,
    relatorSpread: options.relatorSpread || 500,
  }, repositionedNodeIds);

  // Post-process Phase 2: Apply generalization hierarchy layout
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

  // Post-process Phase 4: Resolve any remaining collisions
  resolveCollisions(layoutedNodes, 50, 25);

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

  // Phase 2: Apply generalization hierarchy layout
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

  // Phase 4: Resolve collisions
  resolveCollisions(repositionedNodes, 50, 25);

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
