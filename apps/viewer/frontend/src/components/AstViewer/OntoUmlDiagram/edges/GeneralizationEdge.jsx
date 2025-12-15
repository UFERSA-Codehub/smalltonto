import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from "@xyflow/react";
import "./edges.css";

/**
 * Generalization Edge - hollow triangle arrowhead at target (parent).
 * Shows "specializes" label and optionally genset label (e.g., {disjoint, complete}).
 *
 * For generalization edges:
 * - Source = child class (arrow comes FROM here)
 * - Target = parent class (arrow points TO here)
 * - Edge goes from child (bottom of child) to parent (bottom of parent)
 */
function GeneralizationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
}) {
  // Use smooth step path - positions come from assigned handles
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 0,
  });

  // Show genset label (e.g., {disjoint, complete}) if present
  const { gensetLabel } = data;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd="url(#generalization-arrow)"
        style={{ stroke: "#000", strokeWidth: 1.5 }}
      />

      {/* Relationship label - "specializes" near the middle */}
      <EdgeLabelRenderer>
        <div
          className="ontouml-edge-label"
          style={{
            position: "absolute",
            transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY - 8}px)`,
            pointerEvents: "none",
          }}
        >
          <span className="ontouml-edge-label__name">specializes</span>
        </div>
      </EdgeLabelRenderer>

      {/* Genset label below the "specializes" label */}
      {gensetLabel && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge-label ontouml-edge-label--genset"
            style={{
              position: "absolute",
              transform: `translate(-50%, 0%) translate(${labelX}px, ${labelY + 8}px)`,
              pointerEvents: "none",
            }}
          >
            {gensetLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(GeneralizationEdge);
