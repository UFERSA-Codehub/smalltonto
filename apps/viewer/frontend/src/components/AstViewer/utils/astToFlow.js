/**
 * Transforms parser AST to React Flow nodes and edges format.
 * Also generates summary statistics for the SummaryPanel.
 */

/**
 * @param {Object} ast - The AST from the parser
 * @returns {{ nodes: Array, edges: Array, summary: Object }}
 */
export function transformAstToFlow(ast) {
  if (!ast || ast.node_type !== "tonto_file") {
    return { nodes: [], edges: [], summary: createEmptySummary() };
  }

  const nodes = [];
  const edges = [];
  const summary = createEmptySummary();

  const packageName = ast.package?.package_name || "unnamed";
  const packageId = `pkg-${packageName}`;

  // Add package node
  nodes.push({
    id: packageId,
    type: "package",
    data: {
      name: packageName,
      imports: ast.imports || [],
    },
    position: { x: 0, y: 0 },
  });

  summary.packages.push({ id: packageId, name: packageName });

  // Process content (classes, datatypes, enums, gensets)
  const content = ast.content || [];

  content.forEach((item, index) => {
    const result = processContentItem(item, packageId, index, summary);
    if (result) {
      nodes.push(...result.nodes);
      edges.push(...result.edges);
    }
  });

  // Process specialization edges (class -> parent class)
  const specializationEdges = createSpecializationEdges(nodes);
  edges.push(...specializationEdges);

  return { nodes, edges, summary };
}

function createEmptySummary() {
  return {
    packages: [],
    classes: {
      byStereotype: {},
      list: [],
    },
    datatypes: [],
    enums: [],
    gensets: [],
    relationCount: 0,
    attributeCount: 0,
  };
}

function processContentItem(item, parentId, index, summary) {
  const nodes = [];
  const edges = [];

  switch (item.node_type) {
    case "class_definition": {
      const nodeId = `class-${item.class_name}`;
      const stereotype = item.class_stereotype || "class";
      const attributes = extractAttributes(item.body);
      const relations = extractRelations(item.body);

      nodes.push({
        id: nodeId,
        type: "class",
        data: {
          name: item.class_name,
          stereotype: stereotype,
          attributes: attributes,
          relations: relations,
          specialization: item.specialization,
        },
        position: { x: 0, y: 0 },
      });

      // Containment edge from package to class
      edges.push({
        id: `${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        type: "containment",
      });

      // Update summary
      summary.classes.list.push({ id: nodeId, name: item.class_name, stereotype });
      summary.classes.byStereotype[stereotype] = (summary.classes.byStereotype[stereotype] || 0) + 1;
      summary.attributeCount += attributes.length;
      summary.relationCount += relations.length;

      // Create edges for internal relations
      relations.forEach((rel, relIndex) => {
        const targetClassId = `class-${rel.targetClass}`;
        edges.push({
          id: `${nodeId}->${targetClassId}-rel-${relIndex}`,
          source: nodeId,
          target: targetClassId,
          type: "relation",
          data: {
            name: rel.name,
            stereotype: rel.stereotype,
            cardinality: rel.cardinality,
          },
        });
      });

      break;
    }

    case "datatype_definition": {
      const nodeId = `datatype-${item.datatype_name}`;
      const attributes = extractAttributes(item.body);

      nodes.push({
        id: nodeId,
        type: "datatype",
        data: {
          name: item.datatype_name,
          attributes: attributes,
          specialization: item.specialization,
        },
        position: { x: 0, y: 0 },
      });

      edges.push({
        id: `${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        type: "containment",
      });

      summary.datatypes.push({ id: nodeId, name: item.datatype_name });
      summary.attributeCount += attributes.length;
      break;
    }

    case "enum_definition": {
      const nodeId = `enum-${item.enum_name}`;

      nodes.push({
        id: nodeId,
        type: "enum",
        data: {
          name: item.enum_name,
          values: item.values || [],
          specialization: item.specialization,
        },
        position: { x: 0, y: 0 },
      });

      edges.push({
        id: `${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        type: "containment",
      });

      summary.enums.push({ id: nodeId, name: item.enum_name });
      break;
    }

    case "genset_definition": {
      const nodeId = `genset-${item.genset_name}`;

      nodes.push({
        id: nodeId,
        type: "genset",
        data: {
          name: item.genset_name,
          disjoint: item.disjoint,
          complete: item.complete,
          general: item.general,
          categorizer: item.categorizer,
          specifics: item.specifics || [],
        },
        position: { x: 0, y: 0 },
      });

      edges.push({
        id: `${parentId}->${nodeId}`,
        source: parentId,
        target: nodeId,
        type: "containment",
      });

      summary.gensets.push({
        id: nodeId,
        name: item.genset_name,
        disjoint: item.disjoint,
        complete: item.complete,
      });

      // Create edges from genset to general and specifics
      if (item.general) {
        const generalId = `class-${item.general}`;
        edges.push({
          id: `${nodeId}->${generalId}-general`,
          source: nodeId,
          target: generalId,
          type: "genset-general",
          data: { label: "general" },
        });
      }

      (item.specifics || []).forEach((specific, idx) => {
        const specificId = `class-${specific}`;
        edges.push({
          id: `${nodeId}->${specificId}-specific-${idx}`,
          source: nodeId,
          target: specificId,
          type: "genset-specific",
          data: { label: "specific" },
        });
      });

      break;
    }

    default:
      console.warn("Unknown node type:", item.node_type);
  }

  return { nodes, edges };
}

function extractAttributes(body) {
  if (!body || !Array.isArray(body)) return [];

  return body
    .filter((item) => item.node_type === "attribute")
    .map((attr) => ({
      name: attr.attribute_name,
      type: attr.attribute_type,
      cardinality: formatCardinality(attr.cardinality),
      metaAttributes: attr.meta_attributes?.attributes || [],
    }));
}

function extractRelations(body) {
  if (!body || !Array.isArray(body)) return [];

  return body
    .filter((item) => item.node_type === "internal_relation")
    .map((rel) => ({
      name: rel.relation_name,
      stereotype: rel.relation_stereotype,
      targetClass: rel.target_class,
      cardinality: formatCardinality(rel.second_cardinality),
      operatorLeft: rel.operator_left,
      operatorRight: rel.operator_right,
    }));
}

function formatCardinality(card) {
  if (!card) return null;
  if (card.min === card.max) {
    return `[${card.min}]`;
  }
  return `[${card.min}..${card.max}]`;
}

function createSpecializationEdges(nodes) {
  const edges = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  nodes.forEach((node) => {
    if (node.data?.specialization?.parents) {
      node.data.specialization.parents.forEach((parentName, idx) => {
        // Try to find parent as class first, then datatype
        let parentId = `class-${parentName}`;
        if (!nodeMap.has(parentId)) {
          parentId = `datatype-${parentName}`;
        }

        edges.push({
          id: `${node.id}->${parentId}-specializes-${idx}`,
          source: node.id,
          target: parentId,
          type: "specialization",
          data: { label: "specializes" },
        });
      });
    }
  });

  return edges;
}

export function getSummaryStats(summary) {
  return {
    packageCount: summary.packages.length,
    classCount: summary.classes.list.length,
    datatypeCount: summary.datatypes.length,
    enumCount: summary.enums.length,
    gensetCount: summary.gensets.length,
    relationCount: summary.relationCount,
    attributeCount: summary.attributeCount,
  };
}
