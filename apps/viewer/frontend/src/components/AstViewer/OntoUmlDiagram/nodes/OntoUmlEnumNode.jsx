import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import "./nodes.css";

/**
 * OntoUML Enum Node - White background with dashed border.
 * Shows enumeration stereotype and a collapsed indicator with value count.
 */
function OntoUmlEnumNode({ data }) {
  const { name, values = [] } = data;
  const valueCount = values.length;

  return (
    <div className="ontouml-node ontouml-node--enum ontouml-node--clickable">
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
        <span className="ontouml-node__stereotype">{"\u00ABenumeration\u00BB"}</span>
      </div>

      <div className="ontouml-node__name">{name}</div>

      {valueCount > 0 && (
        <div className="ontouml-node__attrs-indicator">
          <span className="ontouml-node__attrs-indicator-icon">V</span>
          <span>{valueCount}</span>
        </div>
      )}

    </div>
  );
}

export default memo(OntoUmlEnumNode);
