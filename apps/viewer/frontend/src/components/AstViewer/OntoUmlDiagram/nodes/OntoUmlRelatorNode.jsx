import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import "./nodes.css";

/**
 * OntoUML Relator Node - Green background.
 * Same structure as class node but with relator-specific styling.
 */
function OntoUmlRelatorNode({ data }) {
  const { name, stereotype = "relator", attributes = [], isAbstract = false, gensetInfo } = data;
  const attrCount = attributes.length;
  const specificCount = gensetInfo?.specifics?.length || 0;

  // Determine if we have any indicators to show
  const hasIndicators = attrCount > 0 || gensetInfo;

  return (
    <div className="ontouml-node ontouml-node--relator ontouml-node--clickable">
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
        <span className="ontouml-node__stereotype">{`\u00AB${stereotype}\u00BB`}</span>
      </div>

      <div className="ontouml-node__name">{name}</div>

      {hasIndicators && (
        <div className="ontouml-node__indicators">
          {attrCount > 0 && (
            <span className="ontouml-node__indicator ontouml-node__indicator--attrs" title={`${attrCount} attribute${attrCount > 1 ? 's' : ''}`}>
              <span className="ontouml-node__indicator-icon">A</span>
              <span>{attrCount}</span>
            </span>
          )}
          {gensetInfo && (
            <span className="ontouml-node__indicator ontouml-node__indicator--genset" title={`General in genset with ${specificCount} specific${specificCount > 1 ? 's' : ''}`}>
              <span className="ontouml-node__indicator-icon">G</span>
              <span>{specificCount}</span>
            </span>
          )}
        </div>
      )}

    </div>
  );
}

export default memo(OntoUmlRelatorNode);
