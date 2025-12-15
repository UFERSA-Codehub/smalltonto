import { memo } from "react";
import { Handle, Position, useNodeId, useStore } from "@xyflow/react";
import "./nodes.css";

/**
 * OntoUML Ghost Node - Grey background with dashed border.
 * Represents external/imported classes that are referenced but not defined locally.
 */
function OntoUmlGhostNode({ data }) {
  const { name, sourceModule } = data;
  const nodeId = useNodeId();
  const node = useStore((s) => s.nodeLookup.get(nodeId));
  const posY = node?.position?.y;
  const height = node?.measured?.height;

  return (
    <div className="ontouml-node ontouml-node--ghost">
      {/* Debug overlay */}
      <div style={{ position: 'absolute', top: -20, left: 0, fontSize: 10, background: 'yellow', padding: '2px 4px' }}>
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
        <span className="ontouml-node__stereotype">{"\u00ABexternal\u00BB"}</span>
      </div>

      <div className="ontouml-node__name" title={sourceModule ? `From: ${sourceModule}` : undefined}>
        {name}
      </div>

    </div>
  );
}

export default memo(OntoUmlGhostNode);
