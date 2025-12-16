# OntoUML Diagram Layout & Edge Routing Plan

## Overview

This document outlines the comprehensive plan for implementing intelligent node layout and edge handle assignment for OntoUML diagrams. The goal is to create diagrams that match professional OntoUML visual conventions, with proper node positioning and clean edge routing.

## Reference Images

Consult these reference images for visual conventions:

**Hospital Model:**
- `apps/core/examples/professor/Hospital_Model/views_OntoUML/Consulta_Medica.png`
- `apps/core/examples/professor/Hospital_Model/views_OntoUML/Descricao_Paciente.png`
- `apps/core/examples/professor/Hospital_Model/views_OntoUML/Tipos_De_Vacina.png`
- `apps/core/examples/professor/Hospital_Model/views_OntoUML/UBS_e_Funcionario.png`
- `apps/core/examples/professor/Hospital_Model/views_OntoUML/UBS_e_Paciente.png`
- `apps/core/examples/professor/Hospital_Model/views_OntoUML/Vacinacao.png`

**Pizzaria Model:**
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Atendimento_ao_Cliente.png`
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Borda_da_Pizza.png`
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Cargos_na_Pizzaria.png`
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Cobertura_da_Pizza.png`
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Lista_de_Itens.png`
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Massa_da_Pizza.png`
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Pizzaria_e_Cliente.png`
- `apps/core/examples/professor/Pizzaria_Model/views_OntoUML/Preparo_Da_Pizza.png`

---

## Part 1: Node Layout Patterns

### 1.1 Relator Pattern (✅ Implemented)

**Visual Convention:**
```
                    [Parent Class]
                          △
                          │ generalization
                          │
    [Mediated A] ◄──mediation──► [Relator] ◄──mediation──► [Mediated B]
                                    │
                                    │ dependency
                                    ▼
                              [Enum/Datatype]
```

**Layout Rules:**
- Relator positioned at CENTER of its mediation cluster
- Mediated classes spread HORIZONTALLY (left/right of relator)
- Enum dependencies positioned BELOW the relator
- All mediated nodes aligned on same Y-level (vertical center alignment)

**Source/Target Analysis:**
| Edge Type | Source Node | Target Node | Source Handle | Target Handle |
|-----------|-------------|-------------|---------------|---------------|
| Mediation | Relator | Mediated Class | `left-source` or `right-source` | `right-target` or `left-target` |
| Dependency | Relator | Enum | `bottom-source` | `top-target` |

**Current Implementation:** `applyRelatorLayout()` in `useLayout.js`

---

### 1.2 Generalization Hierarchy Pattern (⚠️ Needs Implementation)

**Visual Convention:**
```
                    [Parent/Kind]
                         △
                         │
            ┌────────────┼────────────┐
            │    {disjoint, complete} │
            │            │            │
       [Child A]    [Child B]    [Child C]
            △            △            △
            │            │            │
     ┌──────┴──────┐    ...    ┌──────┴──────┐
     │             │           │             │
[Grandchild] [Grandchild] [Grandchild] [Grandchild]
```

**Reference Examples:**
- `Cobertura_da_Pizza.png`: Cobertura_Da_Pizza → [Carne, Fruto_Do_Mar, Queijo, Vegetal] → [Calabresa, Presunto, ...]
- `Vacinacao.png`: Pessoa → [Paciente, FuncionarioDaUBS]
- `Cargos_na_Pizzaria.png`: Pessoa → [Dono_De_Pizzaria, Funcionario] with `{disjoint, complete}`

**Layout Rules:**
1. **Parent above children:** Parent class positioned ABOVE its specializing children
2. **Children spread horizontally:** All children of same parent on same Y-level, spread horizontally
3. **Center parent over children:** Parent X = average X of all children
4. **Multi-level hierarchies:** Each level gets its own Y row, recursively
5. **Genset labels:** `{disjoint, complete}` positioned on the connecting line, between parent and children

**Source/Target Analysis:**
| Edge Type | Source Node | Target Node | Source Handle | Target Handle | Notes |
|-----------|-------------|-------------|---------------|---------------|-------|
| Generalization | Child Class | Parent Class | `top-source` | `bottom-target` | Arrow points TO parent |

**Detection Logic:**
```javascript
// A node is a parent if other nodes specialize it
// specialization.parents contains parent class names

// Build parent -> children map
function buildGeneralizationTree(nodes, edges) {
  const parentToChildren = new Map(); // parentId -> [childIds]
  const childToParent = new Map();    // childId -> parentId
  
  edges.forEach(edge => {
    if (edge.type === 'generalization') {
      const childId = edge.source;   // Arrow comes FROM child
      const parentId = edge.target;  // Arrow points TO parent
      
      if (!parentToChildren.has(parentId)) {
        parentToChildren.set(parentId, []);
      }
      parentToChildren.get(parentId).push(childId);
      childToParent.set(childId, parentId);
    }
  });
  
  return { parentToChildren, childToParent };
}
```

**Positioning Algorithm:**
```javascript
function applyGeneralizationLayout(nodes, edges, options) {
  const { parentToChildren, childToParent } = buildGeneralizationTree(nodes, edges);
  const { childSpread = 180, levelHeight = 150 } = options;
  
  // Find root parents (parents that are not children of anyone)
  const rootParents = [...parentToChildren.keys()].filter(id => !childToParent.has(id));
  
  // For each root, layout the tree top-down
  rootParents.forEach(rootId => {
    layoutSubtree(rootId, parentToChildren, nodes, 0, childSpread, levelHeight);
  });
}

function layoutSubtree(parentId, parentToChildren, nodes, level, childSpread, levelHeight) {
  const parent = nodes.find(n => n.id === parentId);
  const children = parentToChildren.get(parentId) || [];
  
  if (children.length === 0) return;
  
  // First, recursively layout all descendants
  children.forEach(childId => {
    layoutSubtree(childId, parentToChildren, nodes, level + 1, childSpread, levelHeight);
  });
  
  // Get child nodes (now with their subtrees positioned)
  const childNodes = children.map(id => nodes.find(n => n.id === id)).filter(Boolean);
  
  // Position children horizontally at this level
  const totalWidth = (children.length - 1) * childSpread;
  const startX = parent.position.x - totalWidth / 2;
  
  childNodes.forEach((child, index) => {
    if (!child.positioned) {
      child.position.x = startX + index * childSpread;
      child.position.y = parent.position.y + levelHeight;
      child.positioned = true;
    }
  });
  
  // Optionally: recenter parent above children
  if (childNodes.length > 0) {
    const avgChildX = childNodes.reduce((sum, c) => sum + c.position.x, 0) / childNodes.length;
    parent.position.x = avgChildX;
  }
}
```

**Genset Label Positioning:**
- Genset labels (`{disjoint, complete}`, `{disjoint}`, `{complete}`) should be positioned on the generalization edge
- Placed between parent and the "fork point" where edges split to children
- Implementation: Add `gensetLabel` to edge data, render in GeneralizationEdge component

---

### 1.3 Enum/Datatype Dependency Pattern (⚠️ Needs Implementation)

**Visual Convention (Attribute Reference):**
```
    [Class with Attribute]  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─▶  [Enum/Datatype]
    +attributeName : EnumType                              <<enumeration>>
                                                           EnumType
                                                           ─────────────
                                                           Value1
                                                           Value2
```

**Reference Examples:**
- `Descricao_Paciente.png`: Paciente (with +tipo_Sanguineo attribute) → Tipo_Sanguineo (enum to the RIGHT)
- `UBS_e_Funcionario.png`: Vinculo_Empregaticio → Tipo_De_Vinculo (enum BELOW relator)

**Layout Rules:**
1. **From Class Attribute:** When a class has an attribute referencing an enum/datatype:
   - Position enum to the RIGHT of the class
   - Use horizontal dashed dependency edge
   
2. **From Relator Attribute:** When a relator has an attribute referencing an enum/datatype:
   - Position enum BELOW the relator (already implemented)
   - Use vertical dashed dependency edge

3. **Priority:** Relator dependencies take precedence over class dependencies

**Source/Target Analysis:**
| Edge Type | Source Node | Target Node | Source Handle | Target Handle | Notes |
|-----------|-------------|-------------|---------------|---------------|-------|
| Dependency (horizontal) | Class | Enum | `right-source` | `left-target` | Enum to right of class |
| Dependency (vertical) | Relator | Enum | `bottom-source` | `top-target` | Enum below relator |

**Detection Logic:**
```javascript
function detectEnumDependencies(nodes, edges) {
  const dependencies = [];
  
  edges.forEach(edge => {
    if (edge.type === 'dependency') {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      const isFromRelator = sourceNode.data?.stereotype?.toLowerCase() === 'relator';
      const isToEnum = targetNode.type === 'ontoUmlEnum';
      
      if (isToEnum) {
        dependencies.push({
          edge,
          sourceNode,
          targetNode,
          fromRelator: isFromRelator,
        });
      }
    }
  });
  
  return dependencies;
}
```

**Positioning Algorithm:**
```javascript
function applyEnumDependencyLayout(nodes, edges, options, repositionedNodeIds) {
  const { enumOffsetX = 250, enumOffsetY = 200 } = options;
  const dependencies = detectEnumDependencies(nodes, edges);
  
  dependencies.forEach(({ sourceNode, targetNode, fromRelator }) => {
    // Skip if already positioned (e.g., by relator layout)
    if (repositionedNodeIds.has(targetNode.id)) return;
    
    if (fromRelator) {
      // Relator dependency: enum below (already handled by applyRelatorLayout)
      // But if not positioned yet:
      targetNode.position.x = sourceNode.position.x;
      targetNode.position.y = sourceNode.position.y + enumOffsetY;
    } else {
      // Class dependency: enum to the right
      targetNode.position.x = sourceNode.position.x + enumOffsetX;
      targetNode.position.y = sourceNode.position.y; // Same Y level
    }
    
    repositionedNodeIds.add(targetNode.id);
  });
}
```

---

### 1.4 Material Relation Pattern (✅ Partially Implemented)

**Visual Convention:**
```
                    ┌────── «material» ──────┐
                    │      relationName      │
                    ▼                        ▼
    [Mediated A] ◄──mediation──► [Relator] ◄──mediation──► [Mediated B]
```

**Reference Examples:**
- `Vacinacao.png`: Paciente ↔ Enfermeiro via "vacinado_Por" material (curved above)
- `UBS_e_Funcionario.png`: Unidade_Basica_De_Saude ↔ FuncionarioDaUBS via "trabalha_Em" material

**Layout Rules:**
1. **Between co-mediated nodes (same Y level):** Use TOP handles, route ABOVE via orthogonal path
2. **Between vertically arranged nodes:** Use SIDE handles
3. **Not between mediated nodes:** Use position-based routing

**Source/Target Analysis:**
| Scenario | Source Handle | Target Handle | Path Style |
|----------|---------------|---------------|------------|
| Horizontal, co-mediated | `top-source` | `top-target` | Orthogonal (up, across, down) |
| Horizontal, not co-mediated | `right-source` | `left-target` | Smooth step |
| Vertical | `bottom-source` or `top-source` | `top-target` or `bottom-target` | Smooth step |

**Current Implementation:** `isMaterialBetweenCoMediatedNodes()` in `useLayout.js`

---

## Part 2: Edge Handle Assignment

### 2.1 Handle Types

Each node has 8 handles:
- `top-source`, `top-target` - Top edge of node
- `bottom-source`, `bottom-target` - Bottom edge of node
- `left-source`, `left-target` - Left edge of node
- `right-source`, `right-target` - Right edge of node

**Source vs Target:**
- `source` handles: Where edges ORIGINATE (the "from" end)
- `target` handles: Where edges TERMINATE (the "to" end)

### 2.2 Edge Type Priority

When assigning handles, process edges in this priority order:

| Priority | Edge Type | Preferred Handles | Reason |
|----------|-----------|-------------------|--------|
| 1 | Generalization | `top-source` → `bottom-target` | Structural hierarchy, always vertical |
| 2 | Mediation | Side handles toward relator | Defines relator pattern layout |
| 3 | Dependency | `bottom-source` → `top-target` or `right-source` → `left-target` | Based on source type |
| 4 | Material | `top` handles or position-based | Avoid overlapping with mediations |
| 5 | Other Association | Position-based | Fill remaining capacity |

### 2.3 Handle Assignment Rules by Edge Type

#### Generalization Edges
```javascript
// Always: child (source) at top, parent (target) at bottom
// Because arrow points FROM child TO parent
sourceHandle = 'top-source';
targetHandle = 'bottom-target';
```

#### Mediation Edges
```javascript
// Based on relative position of mediated node to relator
if (mediatedNode is LEFT of relator) {
  // Relator uses left-source, mediated uses right-target
  sourceHandle = 'left-source';   // On relator
  targetHandle = 'right-target';  // On mediated
} else {
  // Relator uses right-source, mediated uses left-target
  sourceHandle = 'right-source';  // On relator
  targetHandle = 'left-target';   // On mediated
}
```

#### Dependency Edges
```javascript
if (source is Relator && target is Enum) {
  // Vertical: relator to enum below
  sourceHandle = 'bottom-source';
  targetHandle = 'top-target';
} else if (source is Class && target is Enum) {
  // Horizontal: class to enum at right
  sourceHandle = 'right-source';
  targetHandle = 'left-target';
} else {
  // Generic: position-based
  // Use vertical if mostly vertical, horizontal if mostly horizontal
}
```

#### Material Relation Edges
```javascript
if (isMaterialBetweenCoMediatedNodes(edge)) {
  // Both nodes mediated by same relator, use top handles
  sourceHandle = 'top-source';
  targetHandle = 'top-target';
} else {
  // Position-based routing
  if (isMostlyHorizontal) {
    sourceHandle = dx > 0 ? 'right-source' : 'left-source';
    targetHandle = dx > 0 ? 'left-target' : 'right-target';
  } else {
    sourceHandle = dy > 0 ? 'bottom-source' : 'top-source';
    targetHandle = dy > 0 ? 'top-target' : 'bottom-target';
  }
}
```

### 2.4 Handle Capacity & Conflict Resolution

**Recommended max edges per handle:** 2-3

**Conflict Resolution Strategy:**
1. **Primary choice:** Use preferred handle based on edge type rules
2. **Secondary choice:** Use opposite side (e.g., if right is full, try left)
3. **Tertiary choice:** Use perpendicular handles (e.g., top/bottom for horizontal edges)
4. **Fallback:** Allow handle capacity overflow (edges will stack)

```javascript
// Track handle usage
const handleUsage = new Map(); // nodeId -> { handleId -> count }

function getAvailableHandle(nodeId, preferredHandle, alternateHandles) {
  const usage = handleUsage.get(nodeId) || {};
  
  // Try preferred first
  if ((usage[preferredHandle] || 0) < MAX_HANDLE_CAPACITY) {
    return preferredHandle;
  }
  
  // Try alternates in order
  for (const alt of alternateHandles) {
    if ((usage[alt] || 0) < MAX_HANDLE_CAPACITY) {
      return alt;
    }
  }
  
  // Fallback to preferred (allow overflow)
  return preferredHandle;
}
```

---

## Part 3: Combined Layout Algorithm

### 3.1 Layout Execution Order

```javascript
function applyCompleteLayout(nodes, edges, options) {
  const repositionedNodeIds = new Set();
  
  // Phase 1: Relator patterns (highest priority)
  // - Positions relator at center
  // - Positions mediated nodes left/right
  // - Positions relator's enum dependencies below
  applyRelatorLayout(nodes, edges, options, repositionedNodeIds);
  
  // Phase 2: Generalization hierarchies
  // - Positions parents above children
  // - Spreads children horizontally
  // - Respects already-positioned nodes
  applyGeneralizationLayout(nodes, edges, options, repositionedNodeIds);
  
  // Phase 3: Enum/Datatype dependencies (from non-relator classes)
  // - Positions enums to the right of referencing class
  // - Only for enums not already positioned
  applyEnumDependencyLayout(nodes, edges, options, repositionedNodeIds);
  
  // Phase 4: Edge handle assignment
  // - Processes edges by type priority
  // - Assigns source/target handles
  const finalEdges = assignEdgeHandles(nodes, edges);
  
  return { nodes, edges: finalEdges };
}
```

### 3.2 Respecting Already-Positioned Nodes

Each layout phase must:
1. Check `repositionedNodeIds` before moving a node
2. Add node IDs to set after positioning
3. Work around already-positioned nodes

```javascript
function positionNode(node, x, y, repositionedNodeIds) {
  if (repositionedNodeIds.has(node.id)) {
    // Node already positioned by higher-priority layout
    return false;
  }
  
  node.position.x = x;
  node.position.y = y;
  repositionedNodeIds.add(node.id);
  return true;
}
```

### 3.3 Handling Complex Diagrams

**Multiple Relators:**
- Each relator gets its own cluster
- Clusters positioned side-by-side with `relatorSpread` gap
- Shared nodes (mediated by multiple relators) positioned by first relator

**Mixed Patterns:**
- Relator pattern takes precedence
- Generalizations position around relator clusters
- Example: `Vacinacao.png` shows Pessoa (parent) above Paciente/FuncionarioDaUBS (children), while those children are also mediated by Vacinacao relator

**Deep Hierarchies:**
- Process top-down from root parents
- Each level gets consistent Y offset
- Children spread to avoid overlap with other subtrees

---

## Part 4: Implementation Checklist

### Phase 1: Core Infrastructure (✅ Completed)
- [x] 8 bidirectional handles on all node types
- [x] Hide handle dots in CSS
- [x] Basic `assignEdgeHandles()` function
- [x] Measurement-based relayout for accurate positioning

### Phase 2: Relator Pattern (✅ Completed)
- [x] `detectRelatorPatterns()` function
- [x] `applyRelatorLayout()` function
- [x] Mediated nodes positioned left/right with center alignment
- [x] Enum dependencies positioned below relator
- [x] Material relations between co-mediated nodes use top handles

### Phase 3: Generalization Hierarchy (🔲 To Implement)
- [ ] `buildGeneralizationTree()` function
- [ ] `applyGeneralizationLayout()` function
- [ ] Parent positioned above children
- [ ] Children spread horizontally
- [ ] Multi-level hierarchy support
- [ ] Genset label positioning on edges

### Phase 4: Enum/Datatype Dependencies (🔲 To Implement)
- [ ] `detectEnumDependencies()` function
- [ ] `applyEnumDependencyLayout()` function
- [ ] Class attribute → Enum positioned to right
- [ ] Respect already-positioned enums

### Phase 5: Edge Handle Refinement (🔲 To Implement)
- [ ] Priority-based edge processing
- [ ] Handle capacity tracking
- [ ] Conflict resolution
- [ ] Edge-type-specific handle rules

### Phase 6: Testing & Polish (🔲 To Implement)
- [ ] Test with Hospital_Model examples
- [ ] Test with Pizzaria_Model examples
- [ ] Visual comparison with reference images
- [ ] Edge label positioning refinement
- [ ] Performance optimization for large diagrams

---

## Part 5: Testing Scenarios

### Scenario 1: Simple Relator (ConsultaMedica)
**File:** Use mock data `consultaMedica`
**Expected:**
- Consulta_Medica (relator) at center
- Paciente left, Medico right
- Tipo_De_Consulta (enum) below
- Material relation curved above Paciente-Medico

### Scenario 2: Generalization Only
**Test:** Cobertura_da_Pizza hierarchy
**Expected:**
- Cobertura_Da_Pizza at top
- [Carne, Fruto_Do_Mar, Queijo, Vegetal] spread below
- Sub-subkinds spread below each parent
- `{disjoint, complete}` labels visible

### Scenario 3: Mixed Relator + Generalization
**Test:** Vacinacao.png pattern
**Expected:**
- Pessoa at top
- Paciente, FuncionarioDaUBS as children below
- Vacinacao relator with mediations to Paciente, Enfermeiro, Vacina
- Enfermeiro generalizes FuncionarioDaUBS

### Scenario 4: Enum from Class Attribute
**Test:** Descricao_Paciente.png pattern
**Expected:**
- Paciente (with attributes) on left
- Tipo_Sanguineo (enum) to the right
- Horizontal dashed dependency edge

### Scenario 5: Complex Multi-Relator
**Test:** UBS_e_Funcionario.png pattern
**Expected:**
- Multiple relators positioned correctly
- Shared mediated nodes handled
- No edge overlaps

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2024-XX-XX | 0.1 | Initial plan document |
| 2024-XX-XX | 0.2 | Added Phase 1 implementation (material between co-mediated) |
| 2024-XX-XX | 1.0 | Complete rewrite with comprehensive layout patterns |
