import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import "./OntoUmlNodes.css";

/**
 * Get the background color based on OntoUML stereotype
 */
function getStereotypeColor(stereotype) {
  switch (stereotype) {
    // Ultimate Sortals - Pink/Red
    case "kind":
      return "#FFCDD2";
    // Base Sortals - Lighter Pink
    case "subkind":
    case "role":
    case "phase":
      return "#F8BBD0";
    // Relators - Light Green
    case "relator":
      return "#C8E6C9";
    // Non-Sortals - White
    case "category":
    case "roleMixin":
    case "mixin":
    case "phaseMixin":
      return "#FFFFFF";
    // Collectives - Light Blue
    case "collective":
      return "#E1F5FE";
    // Quality/Mode - Blue
    case "quality":
    case "mode":
      return "#B3E5FC";
    // Datatype - Light Yellow
    case "datatype":
      return "#FFF9C4";
    // Enum - Light Gray
    case "enum":
      return "#F5F5F5";
    default:
      return "#E0E0E0";
  }
}

/**
 * OntoUML Class Node - Represents a class with stereotype, name, and optional attributes
 */
export const OntoUmlClassNode = memo(function OntoUmlClassNode({ data, selected }) {
  const [isHovered, setIsHovered] = useState(false);
  const backgroundColor = getStereotypeColor(data.stereotype);
  const hasAttributes = data.attributes && data.attributes.length > 0;
  
  // Determine if attributes should be shown based on display mode
  const showAttributes = data.attributeDisplay === "shown" || 
    (data.attributeDisplay === "collapsible" && data.attributesExpanded) ||
    (data.attributeDisplay === "hover" && isHovered);

  return (
    <div
      className={`ontouml-node ontouml-node--class ${selected ? "ontouml-node--selected" : ""}`}
      style={{ backgroundColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* For UP layout: source at top (children point up), target at bottom (parents receive from below) */}
      <Handle type="source" position={Position.Top} className="ontouml-node__handle" />
      <Handle type="target" position={Position.Bottom} className="ontouml-node__handle" />
      <Handle type="target" position={Position.Left} id="left" className="ontouml-node__handle" />
      <Handle type="source" position={Position.Right} id="right" className="ontouml-node__handle" />

      {/* Stereotype Header */}
      <div className="ontouml-node__header">
        <span className="ontouml-node__stereotype">&laquo;{data.stereotype}&raquo;</span>
        <span className="ontouml-node__name">{data.name}</span>
      </div>

      {/* Attributes Section */}
      {hasAttributes && showAttributes && (
        <div className="ontouml-node__attributes">
          {data.attributes.map((attr, idx) => (
            <div key={idx} className="ontouml-node__attribute">
              -{attr.name}: {attr.type}
              {attr.cardinality && <span className="ontouml-node__cardinality">{attr.cardinality}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * OntoUML Datatype Node - Represents a datatype with stereotype and attributes
 */
export const OntoUmlDatatypeNode = memo(function OntoUmlDatatypeNode({ data, selected }) {
  const [isHovered, setIsHovered] = useState(false);
  const backgroundColor = getStereotypeColor("datatype");
  const hasAttributes = data.attributes && data.attributes.length > 0;

  const showAttributes = data.attributeDisplay === "shown" || 
    (data.attributeDisplay === "collapsible" && data.attributesExpanded) ||
    (data.attributeDisplay === "hover" && isHovered);

  return (
    <div
      className={`ontouml-node ontouml-node--datatype ${selected ? "ontouml-node--selected" : ""}`}
      style={{ backgroundColor }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* For UP layout: source at top, target at bottom */}
      <Handle type="source" position={Position.Top} className="ontouml-node__handle" />
      <Handle type="target" position={Position.Bottom} className="ontouml-node__handle" />

      {/* Stereotype Header */}
      <div className="ontouml-node__header">
        <span className="ontouml-node__stereotype">&laquo;datatype&raquo;</span>
        <span className="ontouml-node__name">{data.name}</span>
      </div>

      {/* Attributes Section */}
      {hasAttributes && showAttributes && (
        <div className="ontouml-node__attributes">
          {data.attributes.map((attr, idx) => (
            <div key={idx} className="ontouml-node__attribute">
              -{attr.name}: {attr.type}
              {attr.cardinality && <span className="ontouml-node__cardinality">{attr.cardinality}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * OntoUML Enum Node - Represents an enumeration with values
 */
export const OntoUmlEnumNode = memo(function OntoUmlEnumNode({ data, selected }) {
  const backgroundColor = getStereotypeColor("enum");

  return (
    <div
      className={`ontouml-node ontouml-node--enum ${selected ? "ontouml-node--selected" : ""}`}
      style={{ backgroundColor }}
    >
      {/* For UP layout: source at top, target at bottom */}
      <Handle type="source" position={Position.Top} className="ontouml-node__handle" />
      <Handle type="target" position={Position.Bottom} className="ontouml-node__handle" />

      {/* Stereotype Header */}
      <div className="ontouml-node__header">
        <span className="ontouml-node__stereotype">&laquo;enumeration&raquo;</span>
        <span className="ontouml-node__name">{data.name}</span>
      </div>

      {/* Enum Values */}
      {data.values && data.values.length > 0 && (
        <div className="ontouml-node__enum-values">
          {data.values.map((value, idx) => (
            <div key={idx} className="ontouml-node__enum-value">
              {value}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * OntoUML Ghost Node - Represents an external/imported class
 * Shown with dashed border and lighter styling
 */
export const OntoUmlGhostNode = memo(function OntoUmlGhostNode({ data, selected }) {
  return (
    <div
      className={`ontouml-node ontouml-node--ghost ${selected ? "ontouml-node--selected" : ""}`}
    >
      {/* For UP layout: source at top, target at bottom */}
      <Handle type="source" position={Position.Top} className="ontouml-node__handle" />
      <Handle type="target" position={Position.Bottom} className="ontouml-node__handle" />
      <Handle type="target" position={Position.Left} id="left" className="ontouml-node__handle" />
      <Handle type="source" position={Position.Right} id="right" className="ontouml-node__handle" />

      {/* External indicator */}
      <div className="ontouml-node__header">
        <span className="ontouml-node__stereotype ontouml-node__stereotype--external">&laquo;external&raquo;</span>
        <span className="ontouml-node__name">{data.name}</span>
        {data.sourceModule && data.sourceModule !== data.name && (
          <span className="ontouml-node__source-module">from {data.sourceModule}</span>
        )}
      </div>
    </div>
  );
});

/**
 * Node types registry for React Flow
 */
export const nodeTypes = {
  ontoUmlClass: OntoUmlClassNode,
  ontoUmlDatatype: OntoUmlDatatypeNode,
  ontoUmlEnum: OntoUmlEnumNode,
  ontoUmlGhost: OntoUmlGhostNode,
};
