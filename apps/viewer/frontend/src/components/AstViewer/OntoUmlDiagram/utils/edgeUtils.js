import { Position } from "@xyflow/react";

/**
 * Calculate effective source and target positions based on relative node positions.
 * This ensures edges route correctly when nodes are horizontally or vertically arranged.
 *
 * @param {number} sourceX - Source node X coordinate
 * @param {number} sourceY - Source node Y coordinate
 * @param {number} targetX - Target node X coordinate
 * @param {number} targetY - Target node Y coordinate
 * @param {Position} sourcePosition - Original source position (from React Flow)
 * @param {Position} targetPosition - Original target position (from React Flow)
 * @returns {{ effectiveSourcePosition: Position, effectiveTargetPosition: Position }}
 */
export function getEffectivePositions(
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition
) {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Determine if the arrangement is mostly horizontal or vertical
  // Use a threshold to avoid edge cases where they're nearly equal
  const isMostlyHorizontal = absDx > absDy * 1.2;
  const isMostlyVertical = absDy > absDx * 1.2;

  let effectiveSourcePosition = sourcePosition;
  let effectiveTargetPosition = targetPosition;

  if (isMostlyHorizontal) {
    // Nodes are horizontally arranged - use Left/Right handles
    if (dx > 0) {
      // Target is to the right of source
      effectiveSourcePosition = Position.Right;
      effectiveTargetPosition = Position.Left;
    } else {
      // Target is to the left of source
      effectiveSourcePosition = Position.Left;
      effectiveTargetPosition = Position.Right;
    }
  } else if (isMostlyVertical) {
    // Nodes are vertically arranged - use Top/Bottom handles
    if (dy > 0) {
      // Target is below source
      effectiveSourcePosition = Position.Bottom;
      effectiveTargetPosition = Position.Top;
    } else {
      // Target is above source
      effectiveSourcePosition = Position.Top;
      effectiveTargetPosition = Position.Bottom;
    }
  }
  // If neither mostly horizontal nor vertical (diagonal), keep original positions

  return { effectiveSourcePosition, effectiveTargetPosition };
}

/**
 * Check if two nodes are at approximately the same Y level (horizontal arrangement)
 * @param {number} sourceY - Source node Y coordinate
 * @param {number} targetY - Target node Y coordinate
 * @param {number} threshold - Y difference threshold (default 30px)
 * @returns {boolean}
 */
export function isSameYLevel(sourceY, targetY, threshold = 30) {
  return Math.abs(sourceY - targetY) < threshold;
}

/**
 * Check if two nodes are at approximately the same X level (vertical arrangement)
 * @param {number} sourceX - Source node X coordinate
 * @param {number} targetX - Target node X coordinate
 * @param {number} threshold - X difference threshold (default 30px)
 * @returns {boolean}
 */
export function isSameXLevel(sourceX, targetX, threshold = 30) {
  return Math.abs(sourceX - targetX) < threshold;
}
