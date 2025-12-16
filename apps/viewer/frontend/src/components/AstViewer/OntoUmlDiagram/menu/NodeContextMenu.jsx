import { useEffect, useRef } from "react";
import { Code, Info } from "lucide-react";
import "./menu.css";

/**
 * Context menu that appears when clicking on a node.
 * Shows "Show in code" and "Show details" options.
 */
export default function NodeContextMenu({
  node,
  position,
  onShowInCode,
  onShowDetails,
  onClose,
}) {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Delay adding listener to avoid immediate close from the triggering click
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Adjust position to stay within viewport
  const adjustedPosition = { ...position };
  if (typeof window !== "undefined") {
    const menuWidth = 160;
    const menuHeight = 80;
    
    if (position.x + menuWidth > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - menuWidth - 10;
    }
    if (position.y + menuHeight > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - menuHeight - 10;
    }
  }

  const handleShowInCode = () => {
    onShowInCode(node);
    onClose();
  };

  const handleShowDetails = () => {
    onShowDetails(node);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="node-context-menu"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
      }}
    >
      <div className="node-context-menu__item" onClick={handleShowInCode}>
        <Code className="node-context-menu__item-icon" size={16} />
        <span>Show in code</span>
      </div>
      <div className="node-context-menu__item" onClick={handleShowDetails}>
        <Info className="node-context-menu__item-icon" size={16} />
        <span>Show details</span>
      </div>
    </div>
  );
}
