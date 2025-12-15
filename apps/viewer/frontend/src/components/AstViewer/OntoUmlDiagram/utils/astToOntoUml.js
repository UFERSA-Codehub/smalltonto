/**
 * Transforms parser AST and semantic data to OntoUML-style React Flow nodes and edges.
 * 
 * This transformer creates a UML-like diagram matching OntoUML visual conventions:
 * - Classes with stereotype colors (pink for sortals, green for relators, white for enums)
 * - Generalization edges with hollow triangle arrowheads
 * - Material/Mediation edges with stereotype labels
 * - Enum dependency edges (dashed)
 */

// Stereotype mappings for filtering
const SORTAL_STEREOTYPES = ["kind", "subkind", "role", "phase", "historicalRole"];
const NON_SORTAL_STEREOTYPES = ["category", "mixin", "roleMixin", "phaseMixin", "historicalRoleMixin"];
const RELATOR_STEREOTYPES = ["relator"];

// Relation stereotypes that use composition (filled diamond)
const COMPOSITION_STEREOTYPES = ["componentOf", "subCollectionOf", "subQuantityOf"];

// Relation stereotypes that use aggregation (hollow diamond)
const AGGREGATION_STEREOTYPES = ["memberOf"];

/**
 * Check if a stereotype should be visible based on filters
 */
function isStereotypeVisible(stereotype, filters) {
  if (!stereotype) return true;
  
  const st = stereotype.toLowerCase();
  
  // Check sortals
  if (st === "kind") return filters.showKinds;
  if (st === "subkind") return filters.showSubkinds;
  if (st === "role" || st === "historicalrole") return filters.showRoles;
  if (st === "phase") return filters.showPhases;
  if (st === "relator") return filters.showRelators;
  
  // Check non-sortals
  if (st === "category") return filters.showCategories;
  if (st === "mixin") return filters.showMixins;
  if (st === "rolemixin" || st === "historicalrolemixin") return filters.showRoleMixins;
  if (st === "phasemixin") return filters.showPhaseMixins;
  
  // Other stereotypes are always visible
  return true;
}

/**
 * Format cardinality object to string (without brackets, matching reference images)
 */
function formatCardinality(card) {
  if (!card) return null;
  const min = card.min ?? "0";
  const max = card.max ?? "*";
  if (min === max) {
    return `${min}`;
  }
  return `${min}..${max}`;
}

/**
 * Determine edge type based on relation stereotype
 */
function getEdgeType(stereotype) {
  if (!stereotype) return "association";
  if (COMPOSITION_STEREOTYPES.includes(stereotype)) return "composition";
  if (AGGREGATION_STEREOTYPES.includes(stereotype)) return "aggregation";
  if (stereotype === "mediation") return "mediation";
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
 * Build genset lookup map for labeling generalization edges
 * Returns a map of general class -> { gensetName, disjoint, complete, specifics, label }
 */
function buildGensetMap(gensets) {
  const gensetMap = new Map();

  (gensets || []).forEach((item) => {
    // Support both property naming conventions (is_disjoint vs disjoint)
    const isDisjoint = item.is_disjoint ?? item.disjoint;
    const isComplete = item.is_complete ?? item.complete;
    
    const markers = [];
    if (isDisjoint) markers.push("disjoint");
    if (isComplete) markers.push("complete");
    const label = markers.length > 0 ? `{${markers.join(", ")}}` : null;
    
    gensetMap.set(item.general, {
      gensetName: item.genset_name,
      specifics: item.specifics || [],
      disjoint: isDisjoint,
      complete: isComplete,
      label,
    });
  });

  return gensetMap;
}

/**
 * Collect all referenced class names that are not defined locally (external/imported)
 */
function collectExternalReferences(symbols, localClasses) {
  const external = new Set();

  // From class specializations
  (symbols.classes || []).forEach((cls) => {
    if (cls.specialization?.parents) {
      cls.specialization.parents.forEach((p) => {
        if (!localClasses.has(p)) external.add(p);
      });
    }
  });

  // From relations
  (symbols.relations || []).forEach((rel) => {
    const src = rel.source_class || rel.first_end;
    const tgt = rel.second_end;
    if (src && !localClasses.has(src)) external.add(src);
    if (tgt && !localClasses.has(tgt)) external.add(tgt);
  });

  // From gensets
  (symbols.gensets || []).forEach((gs) => {
    if (gs.general && !localClasses.has(gs.general)) external.add(gs.general);
    (gs.specifics || []).forEach((s) => {
      if (!localClasses.has(s)) external.add(s);
    });
  });

  return external;
}

/**
 * Collect all locally defined class names
 */
function collectLocalClasses(symbols) {
  const local = new Set();

  (symbols.classes || []).forEach((cls) => {
    local.add(cls.class_name);
  });

  (symbols.datatypes || []).forEach((dt) => {
    local.add(dt.datatype_name);
  });

  (symbols.enums || []).forEach((en) => {
    local.add(en.enum_name);
  });

  return local;
}

/**
 * Collect enum types used by class attributes (for dependency edges)
 */
function collectEnumDependencies(symbols) {
  const dependencies = []; // Array of { className, enumName }
  const enumNames = new Set((symbols.enums || []).map((e) => e.enum_name));

  (symbols.classes || []).forEach((cls) => {
    const attrs = extractAttributes(cls.body);
    attrs.forEach((attr) => {
      if (attr.type && enumNames.has(attr.type)) {
        dependencies.push({
          className: cls.class_name,
          enumName: attr.type,
        });
      }
    });
  });

  return dependencies;
}

/**
 * Main transformer function
 * @param {Object} ast - The AST from the parser
 * @param {Object} semantic - The semantic analysis result (optional)
 * @param {Object} filters - Filter options for visibility
 * @returns {{ nodes: Array, edges: Array }}
 */
export function transformAstToOntoUml(ast, semantic = null, filters = {}) {
  // Merge with default filters
  const effectiveFilters = {
    showKinds: true,
    showSubkinds: true,
    showRoles: true,
    showPhases: true,
    showRelators: true,
    showCategories: true,
    showMixins: true,
    showRoleMixins: true,
    showPhaseMixins: true,
    showGeneralizations: true,
    showMaterialRelations: true,
    showMediations: true,
    showEnums: true,
    showDatatypes: true,
    showExternalClasses: true,
    ...filters,
  };

  // Use semantic symbols if available, otherwise fall back to AST
  const symbols = semantic?.symbols || extractSymbolsFromAst(ast);
  
  if (!symbols || (!symbols.classes?.length && !symbols.enums?.length && !symbols.datatypes?.length)) {
    return { nodes: [], edges: [] };
  }

  const nodes = [];
  const edges = [];

  // Build lookup maps
  const gensetMap = buildGensetMap(symbols.gensets);
  const localClasses = collectLocalClasses(symbols);
  const externalClasses = collectExternalReferences(symbols, localClasses);
  const enumDependencies = collectEnumDependencies(symbols);

  // Track which gensets have had their label shown (to avoid duplicates)
  const gensetLabelShown = new Set();

  // Track edge index per source node (for label offset)
  const edgeIndexBySource = new Map();

  // Track visible nodes for edge filtering
  const visibleNodeIds = new Set();

  // Process classes
  (symbols.classes || []).forEach((cls) => {
    if (!isStereotypeVisible(cls.class_stereotype, effectiveFilters)) return;
    
    const nodeId = `class-${cls.class_name}`;
    visibleNodeIds.add(nodeId);

    // Determine node type based on stereotype
    const stereotype = (cls.class_stereotype || "").toLowerCase();
    const isRelator = stereotype === "relator";
    const nodeType = isRelator ? "ontoUmlRelator" : "ontoUmlClass";

    nodes.push({
      id: nodeId,
      type: nodeType,
      data: {
        name: cls.class_name,
        stereotype: cls.class_stereotype || "class",
        attributes: extractAttributes(cls.body),
        attributeDisplay: "shown",
        line: cls.line,
        column: cls.column,
      },
      position: { x: 0, y: 0 },
    });

    // Create generalization edges (specializes)
    if (effectiveFilters.showGeneralizations && cls.specialization?.parents) {
      cls.specialization.parents.forEach((parentName, idx) => {
        const parentId = `class-${parentName}`;

        // Check if this parent has a genset and if we should show the label
        const gensetInfo = gensetMap.get(parentName);
        let gensetLabel = null;

        if (gensetInfo && gensetInfo.specifics.includes(cls.class_name)) {
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
  });

  // Process enums
  if (effectiveFilters.showEnums) {
    (symbols.enums || []).forEach((en) => {
      const nodeId = `enum-${en.enum_name}`;
      visibleNodeIds.add(nodeId);

      nodes.push({
        id: nodeId,
        type: "ontoUmlEnum",
        data: {
          name: en.enum_name,
          values: en.values || [],
        },
        position: { x: 0, y: 0 },
      });
    });

    // Create dependency edges from classes to enums
    enumDependencies.forEach((dep, idx) => {
      const sourceId = `class-${dep.className}`;
      const targetId = `enum-${dep.enumName}`;

      // Only create edge if both nodes are visible
      if (visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)) {
        edges.push({
          id: `dependency-${dep.className}-${dep.enumName}-${idx}`,
          source: sourceId,
          target: targetId,
          type: "dependency",
          data: {},
        });
      }
    });
  }

  // Process datatypes
  if (effectiveFilters.showDatatypes) {
    (symbols.datatypes || []).forEach((dt) => {
      const nodeId = `datatype-${dt.datatype_name}`;
      visibleNodeIds.add(nodeId);

      nodes.push({
        id: nodeId,
        type: "ontoUmlDatatype",
        data: {
          name: dt.datatype_name,
          attributes: extractAttributes(dt.body),
          attributeDisplay: "shown",
        },
        position: { x: 0, y: 0 },
      });
    });
  }

  // Process relations
  (symbols.relations || []).forEach((rel) => {
    const isMaterial = rel.relation_stereotype === "material";
    const isMediation = rel.relation_stereotype === "mediation";

    // Filter based on relation type
    if (isMaterial && !effectiveFilters.showMaterialRelations) return;
    if (isMediation && !effectiveFilters.showMediations) return;

    const sourceClass = rel.source_class || rel.first_end;
    const targetClass = rel.second_end;
    
    if (!sourceClass || !targetClass) return;

    const sourceId = `class-${sourceClass}`;
    const targetId = `class-${targetClass}`;
    const edgeType = getEdgeType(rel.relation_stereotype);

    // Get and increment edge index for this source node
    const currentIndex = edgeIndexBySource.get(sourceId) || 0;
    edgeIndexBySource.set(sourceId, currentIndex + 1);

    const edgeId = rel.node_type === "external_relation"
      ? `extrel-${sourceClass}-${targetClass}-${rel.relation_name || currentIndex}`
      : `${sourceId}-rel-${targetId}-${currentIndex}`;

    edges.push({
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: edgeType,
      data: {
        name: rel.relation_name,
        stereotype: rel.relation_stereotype,
        sourceCardinality: formatCardinality(rel.first_cardinality),
        targetCardinality: formatCardinality(rel.second_cardinality),
        edgeIndex: currentIndex,
      },
    });
  });

  // Create ghost nodes for external classes (if enabled)
  if (effectiveFilters.showExternalClasses) {
    externalClasses.forEach((className) => {
      const nodeId = `class-${className}`;

      // Only create if not already present
      if (!nodes.find((n) => n.id === nodeId)) {
        visibleNodeIds.add(nodeId);
        nodes.push({
          id: nodeId,
          type: "ontoUmlGhost",
          data: {
            name: className,
            isExternal: true,
            sourceModule: className,
          },
          position: { x: 0, y: 0 },
        });
      }
    });
  }

  return { nodes, edges };
}

/**
 * Extract symbols from AST when semantic data is not available
 * (Fallback for backwards compatibility)
 */
function extractSymbolsFromAst(ast) {
  if (!ast || ast.node_type !== "tonto_file") {
    return { classes: [], relations: [], gensets: [], enums: [], datatypes: [] };
  }

  const content = ast.content || [];
  const symbols = {
    classes: [],
    relations: [],
    gensets: [],
    enums: [],
    datatypes: [],
  };

  content.forEach((item) => {
    switch (item.node_type) {
      case "class_definition":
        symbols.classes.push(item);
        // Extract internal relations
        if (item.body) {
          item.body.forEach((bodyItem) => {
            if (bodyItem.node_type === "internal_relation") {
              symbols.relations.push({
                ...bodyItem,
                source_class: item.class_name,
              });
            }
          });
        }
        break;
      case "datatype_definition":
        symbols.datatypes.push(item);
        break;
      case "enum_definition":
        symbols.enums.push(item);
        break;
      case "genset_definition":
        symbols.gensets.push(item);
        break;
      case "external_relation":
        symbols.relations.push(item);
        break;
    }
  });

  return symbols;
}

/**
 * Transform AST to summary format for SummaryPanel
 * @param {Object} ast - The parsed AST
 * @returns {{ summary: Object }}
 */
export function transformAstToSummary(ast) {
  if (!ast || ast.node_type !== "tonto_file") {
    return {
      summary: {
        packages: [],
        imports: [],
        classes: { list: [], byStereotype: {} },
        datatypes: [],
        enums: [],
        gensets: [],
        externalRelations: [],
        internalRelations: [],
        attributes: [],
      },
    };
  }

  const summary = {
    packages: [],
    imports: [],
    classes: { list: [], byStereotype: {} },
    datatypes: [],
    enums: [],
    gensets: [],
    externalRelations: [],
    internalRelations: [],
    attributes: [],
  };

  // Extract package info
  if (ast.package) {
    summary.packages.push({
      id: `package-${ast.package.package_name}`,
      name: ast.package.package_name,
    });
  }

  // Extract imports
  (ast.imports || []).forEach((imp, idx) => {
    summary.imports.push({
      id: `import-${idx}`,
      name: imp.module_name || imp.imported_name || "unknown",
    });
  });

  // Process content
  const content = ast.content || [];
  content.forEach((item, idx) => {
    switch (item.node_type) {
      case "class_definition": {
        summary.classes.list.push({
          id: `class-${item.class_name}`,
          name: item.class_name,
          stereotype: item.class_stereotype || "class",
        });
        // Count by stereotype
        const st = item.class_stereotype || "class";
        summary.classes.byStereotype[st] = (summary.classes.byStereotype[st] || 0) + 1;

        // Extract attributes and internal relations from class body
        if (item.body && Array.isArray(item.body)) {
          item.body.forEach((bodyItem, bodyIdx) => {
            if (bodyItem.node_type === "attribute") {
              const card = bodyItem.cardinality;
              summary.attributes.push({
                id: `attr-${item.class_name}-${bodyItem.attribute_name}`,
                parentClass: item.class_name,
                name: bodyItem.attribute_name,
                type: bodyItem.attribute_type,
                cardinality: card ? `[${card.min}${card.min !== card.max ? `..${card.max}` : ""}]` : null,
              });
            } else if (bodyItem.node_type === "internal_relation") {
              const srcCard = bodyItem.first_cardinality;
              const tgtCard = bodyItem.second_cardinality;
              summary.internalRelations.push({
                id: `intrel-${item.class_name}-${bodyIdx}`,
                parentClass: item.class_name,
                targetClass: bodyItem.second_end,
                stereotype: bodyItem.relation_stereotype,
                sourceCardinality: srcCard ? `${srcCard.min}..${srcCard.max}` : null,
                targetCardinality: tgtCard ? `${tgtCard.min}..${tgtCard.max}` : null,
              });
            }
          });
        }
        break;
      }
      case "datatype_definition":
        summary.datatypes.push({
          id: `datatype-${item.datatype_name}`,
          name: item.datatype_name,
        });
        break;
      case "enum_definition":
        summary.enums.push({
          id: `enum-${item.enum_name}`,
          name: item.enum_name,
        });
        break;
      case "genset_definition":
        summary.gensets.push({
          id: `genset-${item.genset_name || idx}`,
          name: item.genset_name || `${item.general} genset`,
          disjoint: item.disjoint,
          complete: item.complete,
        });
        break;
      case "external_relation":
        summary.externalRelations.push({
          id: `extrel-${idx}`,
          name: item.relation_name,
          stereotype: item.relation_stereotype,
          firstEnd: item.first_end,
          secondEnd: item.second_end,
          firstCardinality: item.first_cardinality
            ? `${item.first_cardinality.min}..${item.first_cardinality.max}`
            : null,
          secondCardinality: item.second_cardinality
            ? `${item.second_cardinality.min}..${item.second_cardinality.max}`
            : null,
        });
        break;
    }
  });

  return { summary };
}

/**
 * Get summary statistics from the summary object
 * @param {Object} summary - The summary from transformAstToSummary
 * @returns {Object} Statistics object
 */
export function getSummaryStats(summary) {
  return {
    packageCount: summary.packages?.length || 0,
    importCount: summary.imports?.length || 0,
    classCount: summary.classes?.list?.length || 0,
    datatypeCount: summary.datatypes?.length || 0,
    enumCount: summary.enums?.length || 0,
    gensetCount: summary.gensets?.length || 0,
    externalRelationCount: summary.externalRelations?.length || 0,
    internalRelationCount: summary.internalRelations?.length || 0,
    attributeCount: summary.attributes?.length || 0,
  };
}

export default transformAstToOntoUml;
