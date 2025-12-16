import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import "./menu.css";

/**
 * Details popup showing full node information.
 * Auto-dismisses after 2s of no hover, on click outside, or on Escape.
 */
export default function NodeDetailsPopup({ node, position, onClose }) {
  const popupRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const dismissTimeoutRef = useRef(null);

  // Handle auto-dismiss after 2s of no hover
  useEffect(() => {
    const startDismissTimer = () => {
      dismissTimeoutRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    };

    const clearDismissTimer = () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };

    if (!isHovering) {
      startDismissTimer();
    } else {
      clearDismissTimer();
    }

    return () => clearDismissTimer();
  }, [isHovering, onClose]);

  // Handle click outside and Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = { ...position };
  if (typeof window !== "undefined") {
    const popupWidth = 300;
    const popupHeight = 350;

    if (position.x + popupWidth > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - popupWidth - 10;
    }
    if (position.y + popupHeight > window.innerHeight) {
      adjustedPosition.y = Math.max(10, window.innerHeight - popupHeight - 10);
    }
  }

  const data = node?.data || {};
  const nodeType = node?.type || "";

  // Determine what to show based on node type
  const isClass = nodeType === "ontoUmlClass" || nodeType === "ontoUmlRelator";
  const isEnum = nodeType === "ontoUmlEnum";
  const isGhost = nodeType === "ontoUmlGhost";

  const attributes = data.attributes || [];
  const values = data.values || [];
  const gensetInfo = data.gensetInfo || null;

  return (
    <div
      ref={popupRef}
      className="node-details-popup"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="node-details-popup__header">
        <div>
          <span className="node-details-popup__title">{data.name}</span>
          {data.stereotype && (
            <span className="node-details-popup__stereotype">
              {`\u00AB${data.stereotype}\u00BB`}
            </span>
          )}
        </div>
        <button className="node-details-popup__close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <div className="node-details-popup__content">
        {/* Attributes section for classes/relators */}
        {isClass && (
          <div className="node-details-popup__section">
            <div className="node-details-popup__section-title">Attributes</div>
            {attributes.length > 0 ? (
              <ul className="node-details-popup__list">
                {attributes.map((attr, idx) => (
                  <li key={idx} className="node-details-popup__list-item">
                    <span className="node-details-popup__attr-name">
                      +{attr.name}
                    </span>
                    <span>:</span>
                    <span className="node-details-popup__attr-type">
                      {attr.type}
                    </span>
                    {attr.cardinality && (
                      <span className="node-details-popup__attr-card">
                        [{attr.cardinality}]
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="node-details-popup__empty">No attributes</div>
            )}
          </div>
        )}

        {/* Genset section for classes that are generals */}
        {isClass && gensetInfo && (
          <div className="node-details-popup__section">
            <div className="node-details-popup__section-title">
              Generalization Set
              {gensetInfo.name && (
                <span className="node-details-popup__genset-name"> ({gensetInfo.name})</span>
              )}
            </div>
            <div className="node-details-popup__genset-badges">
              {gensetInfo.isDisjoint && (
                <span className="node-details-popup__badge node-details-popup__badge--disjoint">
                  disjoint
                </span>
              )}
              {gensetInfo.isComplete && (
                <span className="node-details-popup__badge node-details-popup__badge--complete">
                  complete
                </span>
              )}
              {!gensetInfo.isDisjoint && !gensetInfo.isComplete && (
                <span className="node-details-popup__badge node-details-popup__badge--default">
                  overlapping, incomplete
                </span>
              )}
            </div>
            {gensetInfo.specifics?.length > 0 && (
              <>
                <div className="node-details-popup__subsection-title">Specifics</div>
                <ul className="node-details-popup__list">
                  {gensetInfo.specifics.map((specific, idx) => (
                    <li key={idx} className="node-details-popup__list-item node-details-popup__specific">
                      {specific}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Values section for enums */}
        {isEnum && (
          <div className="node-details-popup__section">
            <div className="node-details-popup__section-title">Values</div>
            {values.length > 0 ? (
              <ul className="node-details-popup__list">
                {values.map((value, idx) => (
                  <li key={idx} className="node-details-popup__list-item">
                    <span className="node-details-popup__enum-value">
                      {value}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="node-details-popup__empty">No values</div>
            )}
          </div>
        )}

        {/* External reference info for ghost nodes */}
        {isGhost && data.sourceModule && (
          <div className="node-details-popup__section">
            <div className="node-details-popup__section-title">Source</div>
            <div className="node-details-popup__empty">
              Imported from: {data.sourceModule}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
