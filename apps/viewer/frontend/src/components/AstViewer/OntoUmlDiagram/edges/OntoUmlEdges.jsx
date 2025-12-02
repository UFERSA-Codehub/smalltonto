import { memo } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, getBezierPath } from "@xyflow/react";
import "./OntoUmlEdges.css";

/**
 * Generalization Edge - Line with hollow triangle arrowhead
 * Used for class specialization (child → parent)
 */
export const GeneralizationEdge = memo(function GeneralizationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 0,
  });

  // For orthogonal paths, arrow direction is based on target handle position
  // With UP layout: target handle is at BOTTOM, so arrow points DOWN (into parent)
  const arrowSize = 12;
  
  // Calculate arrow angle based on target position (handle side)
  // targetPosition: 'top' | 'bottom' | 'left' | 'right'
  let angle;
  switch (targetPosition) {
    case "top":
      angle = -Math.PI / 2; // Arrow points up
      break;
    case "bottom":
      angle = Math.PI / 2; // Arrow points down
      break;
    case "left":
      angle = Math.PI; // Arrow points left
      break;
    case "right":
      angle = 0; // Arrow points right
      break;
    default:
      // Fallback: calculate from coordinates
      angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  }

  // Arrow points for hollow triangle - pointing INTO the target node
  const arrowPoints = `
    ${targetX - arrowSize * Math.cos(angle - Math.PI / 6)},${targetY - arrowSize * Math.sin(angle - Math.PI / 6)}
    ${targetX},${targetY}
    ${targetX - arrowSize * Math.cos(angle + Math.PI / 6)},${targetY - arrowSize * Math.sin(angle + Math.PI / 6)}
  `;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`ontouml-edge ontouml-edge--generalization ${selected ? "ontouml-edge--selected" : ""}`}
      />
      {/* Hollow Triangle Arrowhead */}
      <polygon
        points={arrowPoints}
        fill="white"
        stroke="#333"
        strokeWidth={1.5}
        className="ontouml-edge__arrow--generalization"
      />
      {/* Genset Label if present */}
      {data?.gensetLabel && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__genset-label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            {data.gensetLabel}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

/**
 * Association Edge - Line with stereotype and cardinality labels
 * Used for relations like mediation, material, formal, etc.
 * Uses Bezier curves for better visual separation when multiple edges exist
 */
export const AssociationEdge = memo(function AssociationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Build the label: <<stereotype>> name
  const stereotypeLabel = data?.stereotype ? `<<${data.stereotype}>>` : "";
  const nameLabel = data?.name || "";
  const fullLabel = [stereotypeLabel, nameLabel].filter(Boolean).join(" ");

  // Label offset based on edge index to prevent overlapping
  const labelOffsetY = (data?.edgeIndex || 0) * 18;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`ontouml-edge ontouml-edge--association ${selected ? "ontouml-edge--selected" : ""}`}
      />
      {/* Center Label (stereotype + name) */}
      {fullLabel && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + labelOffsetY}px)`,
              pointerEvents: "all",
            }}
          >
            {fullLabel}
          </div>
        </EdgeLabelRenderer>
      )}
      {/* Source Cardinality */}
      {data?.sourceCardinality && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__cardinality"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceX + 20}px, ${sourceY - 15}px)`,
              pointerEvents: "all",
            }}
          >
            {data.sourceCardinality}
          </div>
        </EdgeLabelRenderer>
      )}
      {/* Target Cardinality */}
      {data?.targetCardinality && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__cardinality"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetX - 20}px, ${targetY - 15}px)`,
              pointerEvents: "all",
            }}
          >
            {data.targetCardinality}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

/**
 * Composition Edge - Line with filled diamond at source
 * Used for componentOf, subCollectionOf, subQuantityOf
 * Uses Bezier curves for better visual separation
 */
export const CompositionEdge = memo(function CompositionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Calculate diamond position at source using Bezier direction
  const diamondSize = 10;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const diamondX = sourceX + ux * diamondSize;
  const diamondY = sourceY + uy * diamondSize;

  const diamondPoints = `
    ${sourceX},${sourceY}
    ${diamondX - uy * diamondSize / 2},${diamondY + ux * diamondSize / 2}
    ${sourceX + ux * diamondSize * 2},${sourceY + uy * diamondSize * 2}
    ${diamondX + uy * diamondSize / 2},${diamondY - ux * diamondSize / 2}
  `;

  const stereotypeLabel = data?.stereotype ? `<<${data.stereotype}>>` : "";
  const nameLabel = data?.name || "";
  const fullLabel = [stereotypeLabel, nameLabel].filter(Boolean).join(" ");

  // Label offset based on edge index to prevent overlapping
  const labelOffsetY = (data?.edgeIndex || 0) * 18;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`ontouml-edge ontouml-edge--composition ${selected ? "ontouml-edge--selected" : ""}`}
      />
      {/* Filled Diamond at source (whole side) */}
      <polygon
        points={diamondPoints}
        fill="#333"
        stroke="#333"
        strokeWidth={1}
        className="ontouml-edge__diamond--filled"
      />
      {/* Center Label */}
      {fullLabel && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + labelOffsetY}px)`,
              pointerEvents: "all",
            }}
          >
            {fullLabel}
          </div>
        </EdgeLabelRenderer>
      )}
      {/* Cardinalities */}
      {data?.sourceCardinality && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__cardinality"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceX + 25}px, ${sourceY - 15}px)`,
              pointerEvents: "all",
            }}
          >
            {data.sourceCardinality}
          </div>
        </EdgeLabelRenderer>
      )}
      {data?.targetCardinality && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__cardinality"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetX - 20}px, ${targetY - 15}px)`,
              pointerEvents: "all",
            }}
          >
            {data.targetCardinality}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

/**
 * Aggregation Edge - Line with hollow diamond at source
 * Used for memberOf
 * Uses Bezier curves for better visual separation
 */
export const AggregationEdge = memo(function AggregationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  // Calculate diamond position at source using Bezier direction
  const diamondSize = 10;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;

  const diamondX = sourceX + ux * diamondSize;
  const diamondY = sourceY + uy * diamondSize;

  const diamondPoints = `
    ${sourceX},${sourceY}
    ${diamondX - uy * diamondSize / 2},${diamondY + ux * diamondSize / 2}
    ${sourceX + ux * diamondSize * 2},${sourceY + uy * diamondSize * 2}
    ${diamondX + uy * diamondSize / 2},${diamondY - ux * diamondSize / 2}
  `;

  const stereotypeLabel = data?.stereotype ? `<<${data.stereotype}>>` : "";
  const nameLabel = data?.name || "";
  const fullLabel = [stereotypeLabel, nameLabel].filter(Boolean).join(" ");

  // Label offset based on edge index to prevent overlapping
  const labelOffsetY = (data?.edgeIndex || 0) * 18;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={`ontouml-edge ontouml-edge--aggregation ${selected ? "ontouml-edge--selected" : ""}`}
      />
      {/* Hollow Diamond at source (whole side) */}
      <polygon
        points={diamondPoints}
        fill="white"
        stroke="#333"
        strokeWidth={1.5}
        className="ontouml-edge__diamond--hollow"
      />
      {/* Center Label */}
      {fullLabel && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__label"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + labelOffsetY}px)`,
              pointerEvents: "all",
            }}
          >
            {fullLabel}
          </div>
        </EdgeLabelRenderer>
      )}
      {/* Cardinalities */}
      {data?.sourceCardinality && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__cardinality"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${sourceX + 25}px, ${sourceY - 15}px)`,
              pointerEvents: "all",
            }}
          >
            {data.sourceCardinality}
          </div>
        </EdgeLabelRenderer>
      )}
      {data?.targetCardinality && (
        <EdgeLabelRenderer>
          <div
            className="ontouml-edge__cardinality"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${targetX - 20}px, ${targetY - 15}px)`,
              pointerEvents: "all",
            }}
          >
            {data.targetCardinality}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

/**
 * Edge types registry for React Flow
 */
export const edgeTypes = {
  generalization: GeneralizationEdge,
  association: AssociationEdge,
  composition: CompositionEdge,
  aggregation: AggregationEdge,
};
