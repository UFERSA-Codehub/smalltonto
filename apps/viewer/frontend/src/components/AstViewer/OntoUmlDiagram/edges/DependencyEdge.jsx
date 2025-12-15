import { memo } from "react";
import { BaseEdge, getSmoothStepPath } from "@xyflow/react";
import { getEffectivePositions } from "../utils/edgeUtils";
import "./edges.css";

/**
 * Dependency Edge - dashed line with open arrowhead.
 * Used for class-to-enum dependencies (attribute type references).
 *
 * Uses dynamic position calculation for optimal edge routing.
 */
function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}) {
  // Calculate effective positions based on relative node arrangement
  const { effectiveSourcePosition, effectiveTargetPosition } =
    getEffectivePositions(
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition
    );

  // Use smooth step path with effective positions for correct routing
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: effectiveSourcePosition,
    targetX,
    targetY,
    targetPosition: effectiveTargetPosition,
    borderRadius: 0,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd="url(#dependency-arrow)"
      style={{
        stroke: "#666",
        strokeWidth: 1,
        strokeDasharray: "5,3",
      }}
    />
  );
}

export default memo(DependencyEdge);
