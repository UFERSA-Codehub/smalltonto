import { useState, useCallback, useMemo } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import "./AstTreeView.css";

/**
 * AST Tree View - Displays raw AST as a collapsible JSON tree
 */
export default function AstTreeView({ ast, selectedNodeId, onNodeSelect }) {
  if (!ast) {
    return (
      <div className="ast-tree-view ast-tree-view--empty">
        <p>No AST to display</p>
      </div>
    );
  }

  return (
    <div className="ast-tree-view">
      <div className="ast-tree-view__content">
        <TreeNode
          name="root"
          value={ast}
          path="root"
          depth={0}
          selectedPath={selectedNodeId}
          onSelect={onNodeSelect}
          defaultExpanded={true}
        />
      </div>
    </div>
  );
}

/**
 * Recursive tree node component
 */
function TreeNode({ name, value, path, depth, selectedPath, onSelect, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || depth < 2);

  const valueType = getValueType(value);
  const isExpandable = valueType === "object" || valueType === "array";
  const isSelected = path === selectedPath;

  // Generate a unique ID for this node based on its content
  const nodeId = useMemo(() => {
    if (valueType === "object" && value?.node_type) {
      // For AST nodes, create ID based on node_type and name fields
      const nodeType = value.node_type;
      const nodeName = value.class_name || value.datatype_name || value.enum_name || 
                       value.genset_name || value.package_name || value.module_name ||
                       value.relation_name || value.attribute_name || null;
      if (nodeName) {
        return `${nodeType}-${nodeName}`;
      }
    }
    return path;
  }, [value, valueType, path]);

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    if (isExpandable) {
      setIsExpanded(!isExpanded);
    }
  }, [isExpandable, isExpanded]);

  const handleSelect = useCallback(() => {
    if (onSelect && nodeId) {
      onSelect(nodeId);
    }
  }, [onSelect, nodeId]);

  // Get display info for the node
  const displayInfo = getDisplayInfo(name, value, valueType);

  return (
    <div className="ast-tree-node" style={{ "--depth": depth }}>
      <div
        className={`ast-tree-node__row ${isSelected ? "ast-tree-node__row--selected" : ""} ${isExpandable ? "ast-tree-node__row--expandable" : ""}`}
        onClick={handleSelect}
      >
        {/* Expand/collapse toggle */}
        <span className="ast-tree-node__toggle" onClick={handleToggle}>
          {isExpandable ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="ast-tree-node__toggle-placeholder" />
          )}
        </span>

        {/* Property name */}
        <span className="ast-tree-node__name">{displayInfo.name}</span>

        {/* Type badge */}
        {displayInfo.badge && (
          <span className={`ast-tree-node__badge ast-tree-node__badge--${displayInfo.badgeType}`}>
            {displayInfo.badge}
          </span>
        )}

        {/* Value preview or count */}
        {displayInfo.preview && (
          <span className={`ast-tree-node__preview ast-tree-node__preview--${valueType}`}>
            {displayInfo.preview}
          </span>
        )}
      </div>

      {/* Children */}
      {isExpandable && isExpanded && (
        <div className="ast-tree-node__children">
          {renderChildren(value, valueType, path, depth, selectedPath, onSelect)}
        </div>
      )}
    </div>
  );
}

/**
 * Render children nodes for an object or array
 */
function renderChildren(value, valueType, parentPath, depth, selectedPath, onSelect) {
  if (valueType === "array") {
    return value.map((item, index) => (
      <TreeNode
        key={`${parentPath}[${index}]`}
        name={`[${index}]`}
        value={item}
        path={`${parentPath}[${index}]`}
        depth={depth + 1}
        selectedPath={selectedPath}
        onSelect={onSelect}
      />
    ));
  }

  if (valueType === "object") {
    // Preserve original key order from the AST (don't sort)
    // Just show node_type first if it exists
    const keys = Object.keys(value);
    const orderedKeys = keys.includes("node_type")
      ? ["node_type", ...keys.filter(k => k !== "node_type")]
      : keys;

    return orderedKeys.map((key) => (
      <TreeNode
        key={`${parentPath}.${key}`}
        name={key}
        value={value[key]}
        path={`${parentPath}.${key}`}
        depth={depth + 1}
        selectedPath={selectedPath}
        onSelect={onSelect}
      />
    ));
  }

  return null;
}

/**
 * Determine the type of a value
 */
function getValueType(value) {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  if (typeof value === "object") return "object";
  if (typeof value === "string") return "string";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  return "unknown";
}

/**
 * Get display information for a node
 */
function getDisplayInfo(name, value, valueType) {
  const info = {
    name: name,
    badge: null,
    badgeType: null,
    preview: null,
  };

  switch (valueType) {
    case "object":
      if (value.node_type) {
        info.badge = value.node_type;
        info.badgeType = getNodeTypeBadgeClass(value.node_type);
        // Show a descriptive name if available
        const nodeName = value.class_name || value.datatype_name || value.enum_name || 
                         value.genset_name || value.package_name || value.module_name ||
                         value.relation_name || value.attribute_name || value.attribute_type;
        if (nodeName) {
          info.preview = nodeName;
        }
      } else {
        const keyCount = Object.keys(value).length;
        info.preview = `{${keyCount} ${keyCount === 1 ? "key" : "keys"}}`;
      }
      break;

    case "array":
      info.preview = `[${value.length} ${value.length === 1 ? "item" : "items"}]`;
      break;

    case "string":
      info.preview = `"${value}"`;
      break;

    case "number":
    case "boolean":
      info.preview = String(value);
      break;

    case "null":
      info.preview = "null";
      break;

    case "undefined":
      info.preview = "undefined";
      break;
  }

  return info;
}

/**
 * Get badge CSS class based on node_type
 */
function getNodeTypeBadgeClass(nodeType) {
  switch (nodeType) {
    case "tonto_file":
      return "file";
    case "package_declaration":
      return "package";
    case "import_statement":
      return "import";
    case "class_definition":
      return "class";
    case "datatype_definition":
      return "datatype";
    case "enum_definition":
      return "enum";
    case "genset_definition":
      return "genset";
    case "external_relation":
    case "internal_relation":
      return "relation";
    case "attribute":
      return "attribute";
    case "cardinality":
      return "cardinality";
    case "specialization":
      return "specialization";
    default:
      return "default";
  }
}
