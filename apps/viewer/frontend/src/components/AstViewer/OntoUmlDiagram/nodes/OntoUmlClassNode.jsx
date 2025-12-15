import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import "./nodes.css";

/**
 * OntoUML Class Node for kinds, subkinds, roles, phases, categories, mixins, etc.
 * Pink background with stereotype header, name, and optional attribute indicator.
 */
function OntoUmlClassNode({ data }) {
  const { name, stereotype, attributes = [], isAbstract = false } = data;
  const attrCount = attributes.length;

  return (
    <div className="ontouml-node ontouml-node--class ontouml-node--clickable">
      {/* Bidirectional handles - each position has both source and target */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
      <Handle type="target" position={Position.Left} id="left-target" />
      <Handle type="source" position={Position.Left} id="left-source" />
      <Handle type="target" position={Position.Right} id="right-target" />
      <Handle type="source" position={Position.Right} id="right-source" />

      <div className="ontouml-node__header">
        {isAbstract && <span className="ontouml-node__abstract-marker">a</span>}
        <span className="ontouml-node__stereotype">
          {stereotype ? `\u00AB${stereotype}\u00BB` : ""}
        </span>
      </div>

      <div className="ontouml-node__name">{name}</div>

      {attrCount > 0 && (
        <div className="ontouml-node__attrs-indicator">
          <span className="ontouml-node__attrs-indicator-icon">A</span>
          <span>{attrCount}</span>
        </div>
      )}

    </div>
  );
}

export default memo(OntoUmlClassNode);
