import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  Position,
} from "@xyflow/react";
import { getEffectivePositions, isSameYLevel } from "../utils/edgeUtils";
import "./edges.css";

/**
 * Association Edge - for material relations, mediations, and other associations.
 * Shows stereotype label in center, cardinalities at endpoints.
 *
 * Uses dynamic position calculation to determine optimal edge routing
 * based on relative node positions (horizontal vs vertical arrangement).
 *
 * Material relations between nodes at the same Y level are rendered
 * as orthogonal stepped paths (90-degree turns) that route above the nodes.
 */
function AssociationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data = {},
}) {
  const { stereotype, name, sourceCardinality, targetCardinality } = data;

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

  // Check if this is a horizontal material relation (nodes at same Y level)
  // These should curve above the nodes, not use smooth step path
  const sameYLevel = isSameYLevel(sourceY, targetY);
  const isMaterial = stereotype === "material";
  const usesCurvedPath = sameYLevel && isMaterial;

  // Calculate edge path
  let finalPath;
  let finalLabelX;
  let finalLabelY;

  if (usesCurvedPath) {
    // Create an orthogonal stepped path that goes above the nodes (90-degree turns)
    const STEP_HEIGHT = 80; // How high above the nodes the path goes
    const topY = Math.min(sourceY, targetY) - STEP_HEIGHT;

    // Orthogonal path: up from source, across, down to target
    finalPath = `M ${sourceX} ${sourceY} L ${sourceX} ${topY} L ${targetX} ${topY} L ${targetX} ${targetY}`;

    // Position label at the horizontal segment
    finalLabelX = (sourceX + targetX) / 2;
    finalLabelY = topY - 10; // Above the horizontal segment
  } else {
    // Use smooth step path with effective positions for correct routing
    const [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: effectiveSourcePosition,
      targetX,
      targetY,
      targetPosition: effectiveTargetPosition,
      borderRadius: 0,
      offset: 20,
    });

    finalPath = edgePath;
    finalLabelX = labelX;
    finalLabelY = labelY;
  }

  // Calculate cardinality positions based on effective edge direction
  const ALONG_OFFSET = 25; // Distance along edge from node
  const PERP_OFFSET = 15; // Perpendicular offset

  let sourceCardX = sourceX;
  let sourceCardY = sourceY;
  let targetCardX = targetX;
  let targetCardY = targetY;

  if (usesCurvedPath) {
    // For horizontal material relations with curved path,
    // position cardinalities at the sides, slightly above
    sourceCardX = sourceX + PERP_OFFSET;
    sourceCardY = sourceY - ALONG_OFFSET;
    targetCardX = targetX - PERP_OFFSET;
    targetCardY = targetY - ALONG_OFFSET;
  } else {
    // Position based on effective source position
    if (effectiveSourcePosition === Position.Bottom) {
      sourceCardX = sourceX + PERP_OFFSET;
      sourceCardY = sourceY + ALONG_OFFSET;
    } else if (effectiveSourcePosition === Position.Top) {
      sourceCardX = sourceX + PERP_OFFSET;
      sourceCardY = sourceY - ALONG_OFFSET;
    } else if (effectiveSourcePosition === Position.Right) {
      sourceCardX = sourceX + ALONG_OFFSET;
      sourceCardY = sourceY - PERP_OFFSET;
    } else if (effectiveSourcePosition === Position.Left) {
      sourceCardX = sourceX - ALONG_OFFSET;
      sourceCardY = sourceY - PERP_OFFSET;
    }

    // Position based on effective target position
    if (effectiveTargetPosition === Position.Top) {
      targetCardX = targetX + PERP_OFFSET;
      targetCardY = targetY - ALONG_OFFSET;
    } else if (effectiveTargetPosition === Position.Bottom) {
      targetCardX = targetX + PERP_OFFSET;
      targetCardY = targetY + ALONG_OFFSET;
    } else if (effectiveTargetPosition === Position.Left) {
      targetCardX = targetX - ALONG_OFFSET;
      targetCardY = targetY - PERP_OFFSET;
    } else if (effectiveTargetPosition === Position.Right) {
      targetCardX = targetX + ALONG_OFFSET;
      targetCardY = targetY - PERP_OFFSET;
    }
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={finalPath}
        style={{ stroke: "#000", strokeWidth: 1 }}
      />

      <EdgeLabelRenderer>
        {/* Center label: stereotype + name */}
        {(stereotype || name) && (
          <div
            className="ontouml-edge-label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${finalLabelX}px, ${finalLabelY}px)`,
              pointerEvents: "none",
            }}
          >
            {stereotype && (
              <span className="ontouml-edge-label__stereotype">
                {`\u00AB${stereotype}\u00BB`}
              </span>
            )}
            {name && <span className="ontouml-edge-label__name">{name}</span>}
          </div>
        )}

        {/* Source cardinality */}
        {sourceCardinality && (
          <div
            className="ontouml-edge-cardinality-label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceCardX}px, ${sourceCardY}px)`,
              pointerEvents: "none",
            }}
          >
            {sourceCardinality}
          </div>
        )}

        {/* Target cardinality */}
        {targetCardinality && (
          <div
            className="ontouml-edge-cardinality-label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetCardX}px, ${targetCardY}px)`,
              pointerEvents: "none",
            }}
          >
            {targetCardinality}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(AssociationEdge);
