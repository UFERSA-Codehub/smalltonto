import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Package, Box, Database, List, GitBranch, Link, FileText, Import, ArrowRightLeft } from "lucide-react";
import { useApp } from "../AppShell";
import { transformAstToFlow, getSummaryStats } from "./HierarchyDiagram/utils/astToFlow";
import "./SummaryPanel.css";

const MIN_WIDTH = 280;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 320;

export default function SummaryPanel({ ast }) {
  const { selectedAstNode, setSelectedAstNode } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);

  // Transform AST to get summary
  const { summary } = useMemo(() => {
    return transformAstToFlow(ast);
  }, [ast]);

  const stats = useMemo(() => getSummaryStats(summary), [summary]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isResizing || !panelRef.current) return;

      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
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

  const handleItemClick = (nodeId) => {
    setSelectedAstNode(nodeId);
  };

  const panelStyle = isCollapsed
    ? { width: "40px", minWidth: "40px" }
    : { width: `${width}px`, minWidth: `${width}px` };

  return (
    <aside
      ref={panelRef}
      className={`summary-panel ${isCollapsed ? "summary-panel--collapsed" : ""} ${isResizing ? "summary-panel--resizing" : ""}`}
      style={panelStyle}
    >
      {!isCollapsed && (
        <div className="summary-panel__resize-handle" onMouseDown={handleMouseDown} title="Drag to resize" />
      )}

      <div className="summary-panel__header">
        {!isCollapsed && <h3 className="summary-panel__title">Summary</h3>}
        <button
          className="summary-panel__toggle"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "←" : "→"}
        </button>
      </div>

      <div className={`summary-panel__content ${isCollapsed ? "summary-panel__content--hidden" : ""}`}>
        {/* Packages Section */}
        <SummarySection
          icon={<Package size={14} />}
          title="Packages"
          count={stats.packageCount}
          items={summary.packages}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(pkg) => pkg.name}
        />

        {/* Imports Section */}
        <SummarySection
          icon={<Import size={14} />}
          title="Imports"
          count={stats.importCount}
          items={summary.imports}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(imp) => imp.name}
        />

        {/* Classes Section */}
        <SummarySection
          icon={<Box size={14} />}
          title="Classes"
          count={stats.classCount}
          items={summary.classes.list}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(cls) => (
            <>
              <span className={`summary-item__stereotype summary-item__stereotype--${cls.stereotype}`}>
                {cls.stereotype}
              </span>
              {cls.name}
            </>
          )}
          groupBy={summary.classes.byStereotype}
        />

        {/* Datatypes Section */}
        <SummarySection
          icon={<Database size={14} />}
          title="Datatypes"
          count={stats.datatypeCount}
          items={summary.datatypes}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(dt) => dt.name}
        />

        {/* Enums Section */}
        <SummarySection
          icon={<List size={14} />}
          title="Enums"
          count={stats.enumCount}
          items={summary.enums}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(en) => en.name}
        />

        {/* Gensets Section */}
        <SummarySection
          icon={<GitBranch size={14} />}
          title="Gensets"
          count={stats.gensetCount}
          items={summary.gensets}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(gs) => (
            <>
              {gs.disjoint && <span className="summary-item__badge">D</span>}
              {gs.complete && <span className="summary-item__badge">C</span>}
              {gs.name}
            </>
          )}
        />

        {/* External Relations Section */}
        <SummarySection
          icon={<ArrowRightLeft size={14} />}
          title="External Relations"
          count={stats.externalRelationCount}
          items={summary.externalRelations}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(rel) => (
            <>
              {rel.stereotype && (
                <span className="summary-item__stereotype summary-item__stereotype--relation">
                  @{rel.stereotype}
                </span>
              )}
              <span className="summary-item__relation-ends">
                {rel.firstEnd} {rel.firstCardinality || ""} → {rel.secondCardinality || ""} {rel.secondEnd}
              </span>
            </>
          )}
        />

        {/* Statistics */}
        <div className="summary-panel__stats">
          <div className="summary-panel__stat">
            <Link size={12} />
            <span>Internal Relations:</span>
            <strong>{stats.internalRelationCount}</strong>
          </div>
          <div className="summary-panel__stat">
            <FileText size={12} />
            <span>Attributes:</span>
            <strong>{stats.attributeCount}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SummarySection({ icon, title, count, items, selectedId, onItemClick, renderItem, groupBy }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (count === 0) {
    return (
      <div className="summary-section summary-section--empty">
        <div className="summary-section__header" onClick={() => setIsExpanded(!isExpanded)}>
          {icon}
          <span className="summary-section__title">{title}</span>
          <span className="summary-section__count">{count}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-section">
      <div className="summary-section__header" onClick={() => setIsExpanded(!isExpanded)}>
        {icon}
        <span className="summary-section__title">{title}</span>
        <span className="summary-section__count">{count}</span>
        <span className={`summary-section__chevron ${isExpanded ? "summary-section__chevron--expanded" : ""}`}>
          ▶
        </span>
      </div>

      {isExpanded && (
        <div className="summary-section__content">
          {/* Show group breakdown if available */}
          {groupBy && Object.keys(groupBy).length > 0 && (
            <div className="summary-section__groups">
              {Object.entries(groupBy).map(([key, value]) => (
                <span key={key} className="summary-section__group">
                  {key}: <strong>{value}</strong>
                </span>
              ))}
            </div>
          )}

          {/* List items */}
          <ul className="summary-section__list">
            {items.map((item) => (
              <li
                key={item.id}
                className={`summary-item ${selectedId === item.id ? "summary-item--selected" : ""}`}
                onClick={() => onItemClick(item.id)}
              >
                {renderItem(item)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
