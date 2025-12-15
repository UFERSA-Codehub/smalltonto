import { memo } from "react";
import { Handle, Position, useNodeId, useStore } from "@xyflow/react";
import "./nodes.css";

/**
 * OntoUML Relator Node - Green background.
 * Same structure as class node but with relator-specific styling.
 */
function OntoUmlRelatorNode({ data }) {
  const { name, stereotype = "relator", attributes = [], isAbstract = false } = data;
  const attrCount = attributes.length;
  const nodeId = useNodeId();
  const node = useStore((s) => s.nodeLookup.get(nodeId));
  const posY = node?.position?.y;
  const height = node?.measured?.height;

  return (
    <div className="ontouml-node ontouml-node--relator ontouml-node--clickable">
      {/* Debug overlay */}
      <div style={{ position: 'absolute', top: -20, left: 0, fontSize: 10, background: 'lime', padding: '2px 4px' }}>
        Y={posY} H={height} C={posY + height/2}
      </div>

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

      {attrCount > 0 && (
        <div className="ontouml-node__attrs-indicator">
          <span className="ontouml-node__attrs-indicator-icon">A</span>
          <span>{attrCount}</span>
        </div>
      )}

    </div>
  );
}

export default memo(OntoUmlRelatorNode);
