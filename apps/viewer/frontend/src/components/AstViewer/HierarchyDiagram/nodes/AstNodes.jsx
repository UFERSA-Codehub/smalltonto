import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { Package, GitBranch } from "lucide-react";
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
 * Class Node - Compact view with stereotype, name, and count badges
 * Click to see full details in DetailPanel
 */
export const ClassNode = memo(function ClassNode({ data, selected }) {
  const stereotypeClass = `ast-node__stereotype--${data.stereotype || "class"}`;
  const attrCount = data.attributes?.length || 0;
  const relCount = data.relations?.length || 0;

  return (
    <div className={`ast-node ast-node--class ast-node--compact ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <span className={`ast-node__stereotype ${stereotypeClass}`}>{data.stereotype}</span>
        <span className="ast-node__title">{data.name}</span>
      </div>

      {(attrCount > 0 || relCount > 0 || data.specialization) && (
        <div className="ast-node__counts">
          {data.specialization && (
            <span className="ast-node__count ast-node__count--spec" title={`specializes ${data.specialization.parents.join(", ")}`}>
              ↑ {data.specialization.parents.length}
            </span>
          )}
          {attrCount > 0 && (
            <span className="ast-node__count ast-node__count--attr" title={`${attrCount} attribute${attrCount > 1 ? "s" : ""}`}>
              A:{attrCount}
            </span>
          )}
          {relCount > 0 && (
            <span className="ast-node__count ast-node__count--rel" title={`${relCount} relation${relCount > 1 ? "s" : ""}`}>
              R:{relCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Datatype Node - Compact view with name and attribute count
 */
export const DatatypeNode = memo(function DatatypeNode({ data, selected }) {
  const attrCount = data.attributes?.length || 0;

  return (
    <div className={`ast-node ast-node--datatype ast-node--compact ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <span className="ast-node__stereotype ast-node__stereotype--datatype">datatype</span>
        <span className="ast-node__title">{data.name}</span>
      </div>

      {(attrCount > 0 || data.specialization) && (
        <div className="ast-node__counts">
          {data.specialization && (
            <span className="ast-node__count ast-node__count--spec" title={`specializes ${data.specialization.parents.join(", ")}`}>
              ↑ {data.specialization.parents.length}
            </span>
          )}
          {attrCount > 0 && (
            <span className="ast-node__count ast-node__count--attr" title={`${attrCount} attribute${attrCount > 1 ? "s" : ""}`}>
              A:{attrCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Enum Node - Compact view with name and value count
 */
export const EnumNode = memo(function EnumNode({ data, selected }) {
  const valueCount = data.values?.length || 0;

  return (
    <div className={`ast-node ast-node--enum ast-node--compact ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <span className="ast-node__stereotype ast-node__stereotype--enum">enum</span>
        <span className="ast-node__title">{data.name}</span>
      </div>

      {(valueCount > 0 || data.specialization) && (
        <div className="ast-node__counts">
          {data.specialization && (
            <span className="ast-node__count ast-node__count--spec" title={`specializes ${data.specialization.parents.join(", ")}`}>
              ↑ {data.specialization.parents.length}
            </span>
          )}
          {valueCount > 0 && (
            <span className="ast-node__count ast-node__count--val" title={`${valueCount} value${valueCount > 1 ? "s" : ""}`}>
              V:{valueCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/**
 * Genset Node - Compact view with badges and counts
 */
export const GensetNode = memo(function GensetNode({ data, selected }) {
  const specificCount = data.specifics?.length || 0;

  return (
    <div className={`ast-node ast-node--genset ast-node--compact ${selected ? "ast-node--selected" : ""}`}>
      <Handle type="target" position={Position.Top} className="ast-node__handle" />
      <Handle type="source" position={Position.Bottom} className="ast-node__handle" />

      <div className="ast-node__header">
        <GitBranch size={12} className="ast-node__icon" />
        <span className="ast-node__title">{data.name}</span>
      </div>

      <div className="ast-node__counts">
        {data.disjoint && <span className="ast-node__badge ast-node__badge--disjoint">D</span>}
        {data.complete && <span className="ast-node__badge ast-node__badge--complete">C</span>}
        <span className="ast-node__count ast-node__count--gen" title={`general: ${data.general}`}>
          G:{data.general}
        </span>
        {specificCount > 0 && (
          <span className="ast-node__count ast-node__count--spec" title={`${specificCount} specific${specificCount > 1 ? "s" : ""}: ${data.specifics.join(", ")}`}>
            S:{specificCount}
          </span>
        )}
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
