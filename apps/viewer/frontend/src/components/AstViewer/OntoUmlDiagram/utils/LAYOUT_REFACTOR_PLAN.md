# Layout Refactor Plan - Dual-Role Node Handling

## Current Status: Phase 2

**Phase 1 (COMPLETED)**: Basic hybrid layout - simple vs hub-aware branching
- Result: `example2.tonto` works correctly
- Issue: `Hospital.tonto` still cluttered due to dual-role nodes

**Phase 2 (IN PROGRESS)**: Dual-role node handling
- Nodes that are BOTH in generalization hierarchy AND mediated by relators
- Solution: Generalization-first layout with relator positioning around fixed nodes

---

## Problem Statement

### Issue 1: Simple cases broken by hub-aware layout (FIXED in Phase 1)
When viewing simple models like `example2.tonto` (CarOwnership), the hub-aware layout places all mediated nodes to the LEFT of the relator instead of alternating left/right. The relator should be in the CENTER of its mediations.

### Issue 2: Complex cases have overlapping nodes (PARTIALLY FIXED)
When viewing complex models like `Hospital.tonto`, nodes overlap because multiple relators share mediated nodes (hub nodes) and the layout doesn't handle this properly.

### Issue 3: Dual-role nodes cause layout conflicts (NEW - Phase 2)
Nodes like `Paciente` and `FuncionarioDaUBS` are BOTH:
- Children in a generalization hierarchy (under `Pessoa`)
- Mediated by relators (`Consulta_Medica`, `Vacinacao`, etc.)

Current behavior:
1. Relator layout runs FIRST, positions these nodes to the right of relators
2. Generalization layout runs SECOND, skips them because they're already "repositioned"
3. Result: Hierarchy is broken, nodes scattered, edges cross everywhere

---

## Solution: Generalization-First with Relator Accommodation

### Core Principle
**Generalization hierarchy takes visual priority.** Relators are positioned AROUND the already-placed hierarchy nodes.

### Algorithm Overview

1. **Run generalization layout FIRST**
   - Position parent nodes above their children
   - Spread children horizontally with smart spacing
   - This establishes the visual hierarchy

2. **Identify dual-role nodes**
   - Nodes that appear in BOTH generalization edges AND relator mediation patterns
   - These nodes should NOT be repositioned by relator layout

3. **Position relators NEAR their mediated nodes**
   - Instead of positioning mediations around relators, position relators around mediations
   - Calculate relator position based on centroid of its pre-positioned mediated nodes
   - Place relator BELOW or to the LEFT of its mediated nodes cluster

4. **Position non-dual-role mediated nodes**
   - Nodes that are ONLY mediated (not in hierarchy) still get positioned relative to relator
   - Use alternating left/right as before

5. **Position enums below their relators**

6. **Resolve collisions** as final safety net

### Visual Example for Hospital.tonto

```
                              Pessoa
                                △
        ┌──────────┬──────────┬──────────┬──────────┬──────────┐
        │          │          │          │          │          │
     Crianca  Adolescente   Adulto     Idoso   FuncionarioDaUBS
                                                       △
                                                 ┌─────┴─────┐
                                             Enfermeiro   Medico
                                                 │           │
                                                 │           │
                    ┌────────────────────────────┼───────────┤
                    │                            │           │
                Vacinacao ←──────────────────────┘           │
                    │                                        │
                    └── Vacina                               │
                                                             │
                                              Consulta_Medica
                                                     │
                                                     └───→ Paciente (positioned by genset)
                                                              │
                                              Servico_Basico_De_Saude
                                                     │
                                                     └───→ Unidade_Basica_De_Saude
                                                              │
                                              Vinculo_Empregaticio
```

Key insights:
- `Pessoa` hierarchy is laid out first (top section)
- Relators are positioned BELOW and connected via edges to hierarchy nodes
- Each relator finds a clear position based on where its mediated nodes already are

---

## Implementation Steps for Phase 2

### Step 2.1: Add identifyDualRoleNodes function

**Purpose**: Find nodes that are BOTH in a generalization hierarchy AND mediated by a relator.

```javascript
/**
 * Identify dual-role nodes - nodes that are BOTH in a generalization hierarchy
 * AND mediated by a relator. These nodes should be positioned by generalization
 * layout first, and relator layout should respect their positions.
 *
 * @param {Array} nodes - All nodes
 * @param {Array} edges - All edges
 * @param {Array} patterns - Relator patterns
 * @returns {Set<string>} Set of dual-role node IDs
 */
function identifyDualRoleNodes(nodes, edges, patterns) {
  // Find nodes involved in generalization (either as parent or child)
  const generalizationNodeIds = new Set();
  edges.forEach((edge) => {
    if (edge.type === "generalization") {
      generalizationNodeIds.add(edge.source); // child
      generalizationNodeIds.add(edge.target); // parent
    }
  });

  // Find nodes that are mediated by relators
  const mediatedNodeIds = new Set();
  patterns.forEach((pattern) => {
    pattern.mediatedNodeIds.forEach((id) => mediatedNodeIds.add(id));
  });

  // Dual-role = intersection
  const dualRoleNodes = new Set();
  mediatedNodeIds.forEach((id) => {
    if (generalizationNodeIds.has(id)) {
      dualRoleNodes.add(id);
    }
  });

  return dualRoleNodes;
}
```

### Step 2.2: Swap layout order in both layout functions

**Current order** (in `runDagreLayout` and `relayoutWithMeasurements`):
1. applyRelatorLayout
2. applyGeneralizationLayout
3. applyEnumDependencyLayout
4. resolveCollisions

**New order**:
1. applyGeneralizationLayout (positions hierarchy first)
2. applyRelatorLayout (respects pre-positioned nodes, positions relators around them)
3. applyEnumDependencyLayout
4. resolveCollisions

### Step 2.3: Modify applyRelatorLayout to work with pre-positioned nodes

**Key changes**:
1. Accept `dualRoleNodes` set as parameter
2. For groups with dual-role nodes, calculate relator position based on mediated node positions
3. Don't reposition dual-role nodes (skip them)
4. Position relator at centroid of mediated nodes (slightly below/left)

```javascript
/**
 * Calculate the best position for a relator based on its mediated nodes' positions.
 * The relator should be positioned near the centroid of its mediated nodes.
 *
 * @param {Object} pattern - Relator pattern
 * @param {Array} nodes - All nodes
 * @param {Set} dualRoleNodes - Nodes already positioned by generalization
 * @returns {{ x: number, y: number }} Best position for the relator
 */
function calculateRelatorPositionFromMediations(pattern, nodes, dualRoleNodes) {
  const mediatedPositions = [];
  
  pattern.mediatedNodeIds.forEach((nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node && dualRoleNodes.has(nodeId)) {
      // This node is pre-positioned by generalization layout
      const width = node.measured?.width || 150;
      const height = node.measured?.height || 52;
      mediatedPositions.push({
        x: node.position.x + width / 2,
        y: node.position.y + height / 2,
      });
    }
  });

  if (mediatedPositions.length === 0) {
    // No pre-positioned mediations, return null to use default positioning
    return null;
  }

  // Calculate centroid
  const avgX = mediatedPositions.reduce((sum, p) => sum + p.x, 0) / mediatedPositions.length;
  const avgY = mediatedPositions.reduce((sum, p) => sum + p.y, 0) / mediatedPositions.length;

  // Position relator BELOW the centroid (with offset)
  return {
    x: avgX,
    y: avgY + 120, // Place relator below the mediated nodes
  };
}
```

### Step 2.4: Update layoutHubAwarePatternGroup for dual-role awareness

**Key changes**:
1. Skip repositioning of dual-role nodes (they're already placed by generalization)
2. Calculate relator positions based on where their mediated nodes are
3. Use larger vertical spacing when there are many relators

### Step 2.5: Improve collision resolution

**Changes**:
- Increase maxIterations from 10 to 25
- Add horizontal bias (prefer pushing horizontally to preserve vertical hierarchy)
- Increase minGap from 30 to 50 for better spacing

---

## Reference Files

### Primary File to Modify

```
apps/viewer/frontend/src/components/AstViewer/OntoUmlDiagram/utils/useLayout.js
```

### Test Files

```
apps/core/examples/example2.tonto                    # Simple case - single relator
apps/core/examples/professor/Hospital_Model/src/Monobloco/Hospital.tonto  # Complex - 4 relators, 2 hubs
apps/core/examples/professor/CarExample/src/carRental.tonto              # Medium - relator + generalization
apps/core/examples/professor/Pizzaria_Model/src/Monobloco/Pizzaria.tonto # Complex model
```

### Reference Images (Problems)

```
check/ex2.png - Shows relator NOT in center, CarAgency overlapping edge (example2.tonto)
check/monobloco.png - Shows overlapping nodes in Hospital.tonto
check/aaa.png - Shows sibling overlap issue in carRental.tonto
```

---

## Implementation Steps

### Step 1: Update calculateGroupWidth to handle both cases (COMPLETED)

**Location**: `calculateGroupWidth` function

**Purpose**: Calculate width differently for simple vs hub-aware layouts.

**Changes**:
- Add `groupHasHubs` parameter
- For simple layout: width based on alternating left/right (ceil(count/2) per side)
- For hub layout: existing logic + hub width

---

### Step 2: Add layoutSimplePatternGroup function (IN PROGRESS)

**Location**: Add after `calculateGroupWidth`, before `applyRelatorLayout`

**Purpose**: Handle simple cases where there are NO hub nodes in the group. This restores the original behavior:
- Relator positioned in CENTER of its group
- Mediated nodes alternate LEFT/RIGHT (0→left, 1→right, 2→further left, etc.)
- Enums below relator

**New Function**:

```javascript
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
    const patternWidth = mediationSpread * sidesNeeded * 2 + 200;
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
```

---

### Step 3: Add layoutHubAwarePatternGroup function (PENDING)

**Location**: Add after `layoutSimplePatternGroup`

**Purpose**: Handle complex cases where hub nodes exist. Uses vertical stacking for relators that share hubs.

**Key behaviors**:
- Assign relators to vertical rows (relators sharing hubs go to different rows)
- Position hub nodes at vertical center of their connected relators (to the right)
- Non-hub nodes STILL alternate left/right around their relator (fixing the current bug)

**New Function**:

```javascript
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
  
  console.log("[Hub Layout] Relator rows:", 
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
    
    const connectedPositions = relevantRelatorIds
      .map((rid) => relatorPositions.get(rid))
      .filter(Boolean);
    
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
```

---

### Step 4: Rewrite applyRelatorLayout to branch based on hub presence (PENDING)

**Location**: Replace existing `applyRelatorLayout` function

**Purpose**: Main orchestration function that:
1. Detects patterns and hub nodes
2. Groups connected patterns
3. For each group, checks if it has hubs
4. Calls `layoutSimplePatternGroup` or `layoutHubAwarePatternGroup` accordingly

**New Implementation**:

```javascript
function applyRelatorLayout(nodes, edges, options = {}, repositionedNodeIds = new Set()) {
  const {
    mediationSpread = 350,
    enumOffsetY = 180,
    relatorRowSpacing = 220,
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
    
    console.log("[Layout] Group has hubs:", groupHasHubs, 
      "patterns:", groupPatterns.map((p) => p.relator.data?.name)
    );
    
    if (!groupHasHubs) {
      // SIMPLE LAYOUT: No shared mediations
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
```

---

## Expected Results

### example2.tonto (CarOwnership) - Simple Layout

After implementation:
```
                   «kind»
               Organization
                    △
                    │ specializes
                    │
«kind»        «subkind»                    «relator»
 Car  ←────── CarAgency ─────────────► CarOwnership
      involvesProperty    involvesOwner
```

Key improvements:
- `CarOwnership` relator in CENTER (not far right)
- `CarAgency` to the LEFT of relator (first mediation)
- `Car` to the RIGHT of relator (second mediation)
- Clear, non-overlapping edges

### Hospital.tonto (Complex) - Hub-Aware Layout

After implementation:
```
                                              Paciente (HUB)
                                                   │
Row 0:  Medico ←── [Consulta_Medica] ──────────────┤
                                                   │
Row 1:  Enfermeiro ←── [Vacinacao] ─────────────────┤
              │                                    │
              └── Vacina                           │
                                                   │
Row 2:  [Servico_Basico_De_Saude] ──────────────────┤
              │                                    │
              └── Unidade_Basica_De_Saude (HUB) ────┤
                           │                       
Row 3:  FuncionarioDaUBS ←── [Vinculo_Empregaticio]
```

Key improvements:
- No overlapping nodes
- Relators vertically stacked when they share hubs
- Hub nodes (Paciente, UBS) positioned at vertical center of their connected relators
- Non-hub nodes alternate left/right around their relators
- Clear visual hierarchy

### carRental.tonto - Regression Test

Should continue to work correctly:
- Car → AvailableCar, UnderMaintenanceCar (spread horizontally via generalization layout)
- RentalCar → positioned by relator layout
- CarRental relator with its mediations centered

---

## Testing Checklist

- [ ] Run ESLint: `npm run lint` in `apps/viewer/frontend/`
- [ ] Run build: `npm run build` in `apps/viewer/frontend/`
- [ ] Test example2.tonto: Relator in CENTER, mediations left/right
- [ ] Test Hospital.tonto: No overlapping nodes, clear relator rows
- [ ] Test carRental.tonto: Siblings properly spread, no regression
- [ ] Test Pizzaria example: Complex model renders correctly
- [ ] Run Python tests: `pytest` in `apps/core/`

---

## Rollback Plan

If issues arise, the changes can be rolled back by:

1. Reverting changes to `useLayout.js`
2. Restoring original `applyRelatorLayout` function
3. Removing new helper functions

The changes are isolated to one file (`useLayout.js`) making rollback straightforward.

---

## Future Improvements

After this implementation:

1. **Dynamic spacing**: Calculate spacing based on actual node sizes
2. **Better hub positioning**: Consider edge routing when positioning hubs
3. **Genset visualization**: Add visual grouping for genset members
4. **Layout caching**: Cache layouts for unchanged ASTs

---

## References

### Files Modified

| File | Changes |
|------|---------|
| `apps/viewer/frontend/src/components/AstViewer/OntoUmlDiagram/utils/useLayout.js` | Main implementation |

### Helper Functions Added

| Function | Purpose |
|----------|---------|
| `identifyHubNodes()` | Find nodes mediated by 2+ relators |
| `sortRelatorsByConnectivity()` | Sort relators by hub connections |
| `groupConnectedPatterns()` | Group relators that share nodes |
| `assignRelatorsToRows()` | Assign relators to vertical rows |
| `calculateGroupWidth()` | Calculate horizontal space needed |
| `layoutSimplePatternGroup()` | Layout groups without hubs (alternating left/right) |
| `layoutHubAwarePatternGroup()` | Layout groups with hubs (vertical stacking) |
| `resolveCollisions()` | Push overlapping nodes apart |

### Test Files

| File | Purpose |
|------|---------|
| `apps/core/examples/example2.tonto` | Simple single-relator test |
| `apps/core/examples/professor/Hospital_Model/src/Monobloco/Hospital.tonto` | Complex multi-relator test |
| `apps/core/examples/professor/CarExample/src/carRental.tonto` | Sibling/relator regression test |
| `apps/core/examples/professor/Pizzaria_Model/src/Monobloco/Pizzaria.tonto` | Additional complex test |
