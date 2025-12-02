/**
 * Transforms parser AST to OntoUML-style React Flow nodes and edges.
 */

// Relation stereotypes that use composition (filled diamond)
const COMPOSITION_STEREOTYPES = [
  "componentOf",
  "subCollectionOf",
  "subQuantityOf",
];

// Relation stereotypes that use aggregation (hollow diamond)
const AGGREGATION_STEREOTYPES = ["memberOf"];

/**
 * Format cardinality object to string
 */
function formatCardinality(card) {
  if (!card) return null;
  if (card.min === card.max) {
    return `${card.min}`;
  }
  return `${card.min}..${card.max}`;
}

/**
 * Determine edge type based on relation stereotype
 */
function getEdgeType(stereotype) {
  if (!stereotype) return "association";
  if (COMPOSITION_STEREOTYPES.includes(stereotype)) return "composition";
  if (AGGREGATION_STEREOTYPES.includes(stereotype)) return "aggregation";
  return "association";
}

/**
 * Extract attributes from class/datatype body
 */
function extractAttributes(body) {
  if (!body || !Array.isArray(body)) return [];

  return body
    .filter((item) => item.node_type === "attribute")
    .map((attr) => ({
      name: attr.attribute_name,
      type: attr.attribute_type,
      cardinality: formatCardinality(attr.cardinality),
    }));
}

/**
 * Extract internal relations from class body
 */
function extractInternalRelations(body) {
  if (!body || !Array.isArray(body)) return [];

  return body
    .filter((item) => item.node_type === "internal_relation")
    .map((rel) => ({
      name: rel.relation_name,
      stereotype: rel.relation_stereotype,
      secondEnd: rel.second_end,
      firstCardinality: formatCardinality(rel.first_cardinality),
      secondCardinality: formatCardinality(rel.second_cardinality),
    }));
}

/**
 * Build genset lookup map for labeling generalization edges
 * Returns a map of genset general -> { gensetName, disjoint, complete, specifics, label }
 */
function buildGensetMap(content) {
  const gensetMap = new Map(); // Map<general, { gensetName, specifics, label }>

  content.forEach((item) => {
    if (item.node_type === "genset_definition") {
      const label = buildGensetLabel(item);
      gensetMap.set(item.general, {
        gensetName: item.genset_name,
        specifics: item.specifics || [],
        label,
      });
    }
  });

  return gensetMap;
}

/**
 * Build genset label with markers
 * Format: GensetName {D, C} if present
 */
function buildGensetLabel(genset) {
  const markers = [];
  if (genset.disjoint) markers.push("D");
  if (genset.complete) markers.push("C");

  if (markers.length > 0) {
    return `${genset.genset_name} {${markers.join(", ")}}`;
  }
  return genset.genset_name;
}

/**
 * Collect all referenced class names from specializations and relations
 */
function collectReferencedClasses(content) {
  const referenced = new Set();

  content.forEach((item) => {
    // Collect from class specializations
    if (item.node_type === "class_definition" && item.specialization?.parents) {
      item.specialization.parents.forEach((p) => referenced.add(p));
    }
    // Collect from datatype specializations
    if (item.node_type === "datatype_definition" && item.specialization?.parents) {
      item.specialization.parents.forEach((p) => referenced.add(p));
    }
    // Collect from genset specifics (they might be external)
    if (item.node_type === "genset_definition") {
      (item.specifics || []).forEach((s) => referenced.add(s));
      if (item.general) referenced.add(item.general);
    }
    // Collect from external relations
    if (item.node_type === "external_relation") {
      if (item.first_end) referenced.add(item.first_end);
      if (item.second_end) referenced.add(item.second_end);
    }
    // Collect from internal relations
    if (item.body && Array.isArray(item.body)) {
      item.body.forEach((bodyItem) => {
        if (bodyItem.node_type === "internal_relation" && bodyItem.second_end) {
          referenced.add(bodyItem.second_end);
        }
      });
    }
  });

  return referenced;
}

/**
 * Collect all locally defined class/datatype/enum names
 */
function collectLocalClasses(content) {
  const local = new Set();

  content.forEach((item) => {
    if (item.node_type === "class_definition") {
      local.add(item.class_name);
    } else if (item.node_type === "datatype_definition") {
      local.add(item.datatype_name);
    } else if (item.node_type === "enum_definition") {
      local.add(item.enum_name);
    }
  });

  return local;
}

/**
 * Build a map of import module names
 */
function buildImportMap(imports) {
  const importMap = new Map(); // Map<moduleName, importInfo>
  (imports || []).forEach((imp) => {
    importMap.set(imp.module_name, {
      moduleName: imp.module_name,
    });
  });
  return importMap;
}

/**
 * Main transformer function
 * @param {Object} ast - The AST from the parser
 * @param {Object} options - Transform options
 * @param {boolean} options.showExternalClasses - Whether to show ghost nodes for external classes
 * @returns {{ nodes: Array, edges: Array }}
 */
export function transformAstToOntoUml(ast, options = {}) {
  const { showExternalClasses = true } = options;

  if (!ast || ast.node_type !== "tonto_file") {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];
  const content = ast.content || [];
  const imports = ast.imports || [];

  // Build lookup maps
  const gensetMap = buildGensetMap(content);
  const importMap = buildImportMap(imports);
  const localClasses = collectLocalClasses(content);
  const referencedClasses = collectReferencedClasses(content);

  // Track which gensets have had their label shown (to avoid duplicates)
  const gensetLabelShown = new Set();

  // Track edge index per source node (for label offset)
  const edgeIndexBySource = new Map();

  // Process all content items
  content.forEach((item) => {
    switch (item.node_type) {
      case "class_definition":
        processClass(item, nodes, edges, gensetMap, gensetLabelShown, edgeIndexBySource);
        break;
      case "datatype_definition":
        processDatatype(item, nodes, edges, gensetMap, gensetLabelShown);
        break;
      case "enum_definition":
        processEnum(item, nodes, edges);
        break;
      case "external_relation":
        processExternalRelation(item, edges, edgeIndexBySource);
        break;
      // genset_definition is handled via gensetMap for edge labels
    }
  });

  // Create ghost nodes for external classes (if enabled)
  if (showExternalClasses) {
    referencedClasses.forEach((className) => {
      if (!localClasses.has(className)) {
        // This is an external reference - create a ghost node
        const importInfo = importMap.get(className);
        const nodeId = `class-${className}`;

        // Check if we already have a node for this (shouldn't happen, but be safe)
        if (!nodes.find((n) => n.id === nodeId)) {
          nodes.push({
            id: nodeId,
            type: "ontoUmlGhost",
            data: {
              name: className,
              isExternal: true,
              sourceModule: importInfo?.moduleName || className,
            },
            position: { x: 0, y: 0 },
          });
        }
      }
    });
  }

  return { nodes, edges };
}

/**
 * Process a class definition
 */
function processClass(item, nodes, edges, gensetMap, gensetLabelShown, edgeIndexBySource) {
  const nodeId = `class-${item.class_name}`;
  const stereotype = item.class_stereotype || "class";
  const attributes = extractAttributes(item.body);
  const internalRelations = extractInternalRelations(item.body);

  // Create class node
  nodes.push({
    id: nodeId,
    type: "ontoUmlClass",
    data: {
      name: item.class_name,
      stereotype,
      attributes,
      attributeDisplay: "shown", // Default, can be controlled by settings
    },
    position: { x: 0, y: 0 },
  });

  // Create generalization edges (specializes)
  if (item.specialization?.parents) {
    item.specialization.parents.forEach((parentName, idx) => {
      const parentId = `class-${parentName}`;
      
      // Check if this parent has a genset and if we should show the label
      const gensetInfo = gensetMap.get(parentName);
      let gensetLabel = null;
      
      if (gensetInfo && gensetInfo.specifics.includes(item.class_name)) {
        // This class is part of a genset - only show label on first edge
        if (!gensetLabelShown.has(parentName)) {
          gensetLabel = gensetInfo.label;
          gensetLabelShown.add(parentName);
        }
      }

      edges.push({
        id: `${nodeId}-specializes-${parentId}-${idx}`,
        source: nodeId,
        target: parentId,
        type: "generalization",
        data: {
          gensetLabel,
        },
      });
    });
  }

  // Create edges for internal relations
  internalRelations.forEach((rel, idx) => {
    const targetId = `class-${rel.secondEnd}`;
    const edgeType = getEdgeType(rel.stereotype);

    // Get and increment edge index for this source node
    const currentIndex = edgeIndexBySource.get(nodeId) || 0;
    edgeIndexBySource.set(nodeId, currentIndex + 1);

    edges.push({
      id: `${nodeId}-rel-${targetId}-${idx}`,
      source: nodeId,
      target: targetId,
      type: edgeType,
      data: {
        name: rel.name,
        stereotype: rel.stereotype,
        sourceCardinality: rel.firstCardinality,
        targetCardinality: rel.secondCardinality,
        edgeIndex: currentIndex,
      },
    });
  });
}

/**
 * Process a datatype definition
 */
function processDatatype(item, nodes, edges, gensetMap, gensetLabelShown) {
  const nodeId = `datatype-${item.datatype_name}`;
  const attributes = extractAttributes(item.body);

  nodes.push({
    id: nodeId,
    type: "ontoUmlDatatype",
    data: {
      name: item.datatype_name,
      attributes,
      attributeDisplay: "shown",
    },
    position: { x: 0, y: 0 },
  });

  // Create generalization edges
  if (item.specialization?.parents) {
    item.specialization.parents.forEach((parentName, idx) => {
      // Parent could be datatype or class
      let parentId = `datatype-${parentName}`;
      
      // Check if this parent has a genset
      const gensetInfo = gensetMap.get(parentName);
      let gensetLabel = null;
      
      if (gensetInfo && gensetInfo.specifics.includes(item.datatype_name)) {
        if (!gensetLabelShown.has(parentName)) {
          gensetLabel = gensetInfo.label;
          gensetLabelShown.add(parentName);
        }
      }

      edges.push({
        id: `${nodeId}-specializes-${parentId}-${idx}`,
        source: nodeId,
        target: parentId,
        type: "generalization",
        data: {
          gensetLabel,
        },
      });
    });
  }
}

/**
 * Process an enum definition
 */
function processEnum(item, nodes, edges) {
  const nodeId = `enum-${item.enum_name}`;

  nodes.push({
    id: nodeId,
    type: "ontoUmlEnum",
    data: {
      name: item.enum_name,
      values: item.values || [],
    },
    position: { x: 0, y: 0 },
  });

  // Enums can also specialize
  if (item.specialization?.parents) {
    item.specialization.parents.forEach((parentName, idx) => {
      const parentId = `enum-${parentName}`;

      edges.push({
        id: `${nodeId}-specializes-${parentId}-${idx}`,
        source: nodeId,
        target: parentId,
        type: "generalization",
        data: {},
      });
    });
  }
}

/**
 * Process an external relation
 */
function processExternalRelation(item, edges, edgeIndexBySource) {
  const sourceId = `class-${item.first_end}`;
  const targetId = `class-${item.second_end}`;
  const edgeType = getEdgeType(item.relation_stereotype);
  const relationName = item.relation_name || "";

  // Get and increment edge index for this source node
  const currentIndex = edgeIndexBySource.get(sourceId) || 0;
  edgeIndexBySource.set(sourceId, currentIndex + 1);

  edges.push({
    id: `extrel-${item.first_end}-${item.second_end}-${relationName}`,
    source: sourceId,
    target: targetId,
    type: edgeType,
    data: {
      name: relationName,
      stereotype: item.relation_stereotype,
      sourceCardinality: formatCardinality(item.first_cardinality),
      targetCardinality: formatCardinality(item.second_cardinality),
      edgeIndex: currentIndex,
    },
  });
}
