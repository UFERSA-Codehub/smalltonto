import { useState, useRef, useCallback, useEffect } from "react";
import { useApp } from "../AppShell";
import FileTree from "../FileExplorer/FileTree";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import "./Sidebar.css";

const MIN_WIDTH = 150;
const MAX_WIDTH = 500;
const DEFAULT_WIDTH = 250;

export default function Sidebar() {
  const { rootFolder } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  useKeyboardShortcuts({
    "ctrl+b": toggleCollapse,
  });

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing) return;

      const sidebarRect = sidebarRef.current?.getBoundingClientRect();
      if (!sidebarRect) return;

      const newWidth = e.clientX - sidebarRect.left;
      const clampedWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth));
      setWidth(clampedWidth);
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const sidebarStyle = isCollapsed
    ? { width: "40px", minWidth: "40px" }
    : { width: `${width}px`, minWidth: `${width}px` };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""} ${isResizing ? "sidebar--resizing" : ""}`}
      style={sidebarStyle}
    >
      <div className="sidebar__header">
        {!isCollapsed && <span className="sidebar__title">Explorer</span>}
        <button
          className="sidebar__toggle"
          onClick={toggleCollapse}
          title={isCollapsed ? "Expand (Ctrl+B)" : "Collapse (Ctrl+B)"}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>

      <div
        className={`sidebar__content ${isCollapsed ? "sidebar__content--hidden" : ""}`}
      >
        {rootFolder && <FileTree rootPath={rootFolder} />}
      </div>

      {!isCollapsed && (
        <div
          className="sidebar__resize-handle"
          onMouseDown={handleMouseDown}
          title="Drag to resize"
        />
      )}
    </aside>
  );
}
