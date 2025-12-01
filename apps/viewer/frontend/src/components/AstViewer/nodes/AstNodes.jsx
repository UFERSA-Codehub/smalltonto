import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Package, Box, Database, List, GitBranch, ArrowRight } from "lucide-react";
import "./AstNodes.css";

/**
 * Package Node - Root container for the AST
 */
export const PackageNode = memo(function PackageNode({ data, selected }) {
  return (
    <div className={`ast-node ast-node--package ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />
      <div className="ast-node__header ast-node__header--package">
        <Package size={16} className="ast-node__icon" />
        <span className="ast-node__title">{data.name}</span>
      </div>
      {data.imports && data.imports.length > 0 && (
        <div className="ast-node__imports">
          {data.imports.map((imp, idx) => (
            <span key={idx} className="ast-node__import">
              {imp.module_name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

/**
 * Class Node - Represents a class definition with stereotype, attributes, and relations
 */
export const ClassNode = memo(function ClassNode({ data, selected }) {
  const stereotypeClass = `ast-node__stereotype--${data.stereotype || "class"}`;

  return (
    <div className={`ast-node ast-node--class ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <span className={`ast-node__stereotype ${stereotypeClass}`}>{data.stereotype}</span>
        <Box size={14} className="ast-node__icon" />
        <span className="ast-node__title">{data.name}</span>
      </div>

      {data.specialization && (
        <div className="ast-node__specialization">
          specializes {data.specialization.parents.join(", ")}
        </div>
      )}

      {data.attributes && data.attributes.length > 0 && (
        <div className="ast-node__section">
          <div className="ast-node__section-title">Attributes</div>
          <ul className="ast-node__list">
            {data.attributes.map((attr, idx) => (
              <li key={idx} className="ast-node__attribute">
                <span className="ast-node__attr-name">{attr.name}</span>
                <span className="ast-node__attr-type">: {attr.type}</span>
                {attr.cardinality && (
                  <span className="ast-node__attr-card">{attr.cardinality}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.relations && data.relations.length > 0 && (
        <div className="ast-node__section">
          <div className="ast-node__section-title">Relations</div>
          <ul className="ast-node__list">
            {data.relations.map((rel, idx) => (
              <li key={idx} className="ast-node__relation">
                {rel.stereotype && (
                  <span className="ast-node__rel-stereotype">@{rel.stereotype}</span>
                )}
                <span className="ast-node__rel-name">{rel.name}</span>
                <ArrowRight size={12} className="ast-node__rel-arrow" />
                <span className="ast-node__rel-target">{rel.targetClass}</span>
                {rel.cardinality && (
                  <span className="ast-node__rel-card">{rel.cardinality}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

/**
 * Datatype Node - Represents a datatype definition
 */
export const DatatypeNode = memo(function DatatypeNode({ data, selected }) {
  return (
    <div className={`ast-node ast-node--datatype ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <span className="ast-node__stereotype ast-node__stereotype--datatype">datatype</span>
        <Database size={14} className="ast-node__icon" />
        <span className="ast-node__title">{data.name}</span>
      </div>

      {data.specialization && (
        <div className="ast-node__specialization">
          specializes {data.specialization.parents.join(", ")}
        </div>
      )}

      {data.attributes && data.attributes.length > 0 && (
        <div className="ast-node__section">
          <ul className="ast-node__list">
            {data.attributes.map((attr, idx) => (
              <li key={idx} className="ast-node__attribute">
                <span className="ast-node__attr-name">{attr.name}</span>
                <span className="ast-node__attr-type">: {attr.type}</span>
                {attr.cardinality && (
                  <span className="ast-node__attr-card">{attr.cardinality}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

/**
 * Enum Node - Represents an enum definition
 */
export const EnumNode = memo(function EnumNode({ data, selected }) {
  return (
    <div className={`ast-node ast-node--enum ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <span className="ast-node__stereotype ast-node__stereotype--enum">enum</span>
        <List size={14} className="ast-node__icon" />
        <span className="ast-node__title">{data.name}</span>
      </div>

      {data.specialization && (
        <div className="ast-node__specialization">
          specializes {data.specialization.parents.join(", ")}
        </div>
      )}

      {data.values && data.values.length > 0 && (
        <div className="ast-node__section">
          <div className="ast-node__enum-values">
            {data.values.map((value, idx) => (
              <span key={idx} className="ast-node__enum-value">
                {value}
                {idx < data.values.length - 1 && ","}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Genset Node - Represents a generalization set
 */
export const GensetNode = memo(function GensetNode({ data, selected }) {
  return (
    <div className={`ast-node ast-node--genset ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <GitBranch size={14} className="ast-node__icon" />
        <span className="ast-node__title">{data.name}</span>
      </div>

      <div className="ast-node__badges">
        {data.disjoint && <span className="ast-node__badge ast-node__badge--disjoint">disjoint</span>}
        {data.complete && <span className="ast-node__badge ast-node__badge--complete">complete</span>}
      </div>

      <div className="ast-node__section">
        <div className="ast-node__genset-info">
          <div className="ast-node__genset-row">
            <span className="ast-node__genset-label">general:</span>
            <span className="ast-node__genset-value">{data.general}</span>
          </div>
          {data.categorizer && (
            <div className="ast-node__genset-row">
              <span className="ast-node__genset-label">categorizer:</span>
              <span className="ast-node__genset-value">{data.categorizer}</span>
            </div>
          )}
          <div className="ast-node__genset-row">
            <span className="ast-node__genset-label">specifics:</span>
            <span className="ast-node__genset-value">{data.specifics.join(", ")}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * Node types registry for React Flow
 */
export const nodeTypes = {
  package: PackageNode,
  class: ClassNode,
  datatype: DatatypeNode,
  enum: EnumNode,
  genset: GensetNode,
};
