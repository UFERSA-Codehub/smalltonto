import { useState, useRef, useEffect } from "react";
import { Package, Box, Database, List, GitBranch, Link, FileText, Import, ArrowRightLeft, Puzzle, AlertTriangle, CheckCircle, ChevronRight } from "lucide-react";
import { useApp } from "../AppShell";
import { transformAstToSummary, getSummaryStats } from "./OntoUmlDiagram/utils/astToOntoUml";
import "./SummaryPanel.css";

const MIN_WIDTH = 280;
const MAX_WIDTH = 450;
const DEFAULT_WIDTH = 320;

export default function SummaryPanel({ ast }) {
  const { selectedAstNode, setSelectedAstNode, parseResult } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef(null);
  const isResizingRef = useRef(false);

  // Get semantic data if available (API flattens files array to single object)
  const semantic = parseResult?.semantic;
  const symbols = semantic?.symbols;
  const patterns = semantic?.patterns || [];
  const incompletePatterns = semantic?.incomplete_patterns || [];
  const patternCounts = semantic?.summary?.pattern_counts || {};

  // Transform AST to get summary (fallback for when semantic data isn't available)
  const { summary } = transformAstToSummary(ast);

  // Build summary from semantic symbols if available, otherwise use AST
  const stats = symbols
    ? {
        packageCount: summary.packages?.length || 0,
        importCount: summary.imports?.length || 0,
        classCount: (symbols.classes || []).length,
        datatypeCount: (symbols.datatypes || []).length,
        enumCount: (symbols.enums || []).length,
        gensetCount: (symbols.gensets || []).length,
        externalRelationCount: (symbols.relations || []).filter(r => r.node_type === "external_relation").length,
        internalRelationCount: (symbols.relations || []).filter(r => r.node_type === "internal_relation").length,
        attributeCount: (symbols.classes || []).reduce((acc, cls) => acc + ((cls.body || []).filter(item => item.node_type === "attribute")).length, 0),
      }
    : getSummaryStats(summary);

  // Build class list from semantic data with nested details
  const classList = symbols?.classes
    ? symbols.classes.map((cls) => {
        // Extract attributes and internal relations from class body
        const attributes = (cls.body || [])
          .filter((item) => item.node_type === "attribute")
          .map((attr) => {
            const card = attr.cardinality;
            return {
              name: attr.attribute_name,
              type: attr.attribute_type,
              cardinality: card ? `[${card.min}${card.min !== card.max ? `..${card.max}` : ""}]` : null,
            };
          });

        const internalRelations = (cls.body || [])
          .filter((item) => item.node_type === "internal_relation")
          .map((rel) => ({
            stereotype: rel.relation_stereotype,
            target: rel.second_end,
          }));

        return {
          id: `class-${cls.class_name}`,
          name: cls.class_name,
          stereotype: cls.class_stereotype,
          specialization: cls.specialization?.parents || [],
          attributes,
          internalRelations,
        };
      })
    : summary.classes?.list || [];

  // Build stereotype breakdown
  const classByStereotype = symbols?.classes
    ? symbols.classes.reduce((acc, cls) => {
        const st = cls.class_stereotype || "unknown";
        acc[st] = (acc[st] || 0) + 1;
        return acc;
      }, {})
    : summary.classes?.byStereotype || {};

  // Build internal relations list from semantic data or AST summary
  const internalRelationsList = symbols?.relations
    ? symbols.relations
        .filter(r => r.node_type === "internal_relation")
        .map((rel, idx) => ({
          id: `intrel-${rel.source_class}-${idx}`,
          parentClass: rel.source_class,
          targetClass: rel.second_end,
          stereotype: rel.relation_stereotype,
        }))
    : summary.internalRelations || [];

  // Build attributes list from semantic data or AST summary
  const attributesList = symbols?.classes
    ? symbols.classes.flatMap(cls =>
        (cls.body || [])
          .filter(item => item.node_type === "attribute")
          .map(attr => {
            const card = attr.cardinality;
            return {
              id: `attr-${cls.class_name}-${attr.attribute_name}`,
              parentClass: cls.class_name,
              name: attr.attribute_name,
              type: attr.attribute_type,
              cardinality: card ? `[${card.min}${card.min !== card.max ? `..${card.max}` : ""}]` : null,
            };
          })
      )
    : summary.attributes || [];

  const handleMouseDown = (e) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
  };

  // Resize handlers using refs to avoid stale closures
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current || !panelRef.current) return;
      const panelRect = panelRef.current.getBoundingClientRect();
      const newWidth = panelRect.right - e.clientX;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Handle cursor style during resize
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  }, [isResizing]);

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

        {/* Classes Section - with expandable items */}
        <ClassSection
          classList={classList}
          classByStereotype={classByStereotype}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
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

        {/* Patterns Section */}
        <PatternsSection
          patterns={patterns}
          incompletePatterns={incompletePatterns}
          patternCounts={patternCounts}
        />

        {/* Internal Relations Section */}
        <SummarySection
          icon={<Link size={14} />}
          title="Internal Relations"
          count={stats.internalRelationCount}
          items={internalRelationsList}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(rel) => (
            <>
              <span className="summary-item__stereotype summary-item__stereotype--relation">
                @{rel.stereotype}
              </span>
              <span className="summary-item__relation-ends">
                {rel.parentClass} → {rel.targetClass}
              </span>
            </>
          )}
        />

        {/* Attributes Section */}
        <SummarySection
          icon={<FileText size={14} />}
          title="Attributes"
          count={stats.attributeCount}
          items={attributesList}
          selectedId={selectedAstNode}
          onItemClick={handleItemClick}
          renderItem={(attr) => (
            <>
              <span className="summary-item__attr-parent">{attr.parentClass}.</span>
              <span>{attr.name}</span>
              <span className="summary-item__attr-type">: {attr.type}</span>
              {attr.cardinality && <span className="summary-item__cardinality">{attr.cardinality}</span>}
            </>
          )}
        />
      </div>
    </aside>
  );
}

/**
 * Specialized section for Classes with expandable items showing
 * specialization, attributes, and internal relations.
 */
function ClassSection({ classList, classByStereotype, selectedId, onItemClick }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedClasses, setExpandedClasses] = useState(new Set());

  const count = classList.length;

  const toggleClassExpansion = (classId, e) => {
    e.stopPropagation();
    setExpandedClasses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(classId)) {
        newSet.delete(classId);
      } else {
        newSet.add(classId);
      }
      return newSet;
    });
  };

  const hasNestedContent = (cls) => {
    return (
      cls.specialization?.length > 0 ||
      cls.attributes?.length > 0 ||
      cls.internalRelations?.length > 0
    );
  };

  if (count === 0) {
    return (
      <div className="summary-section summary-section--empty">
        <div className="summary-section__header" onClick={() => setIsExpanded(!isExpanded)}>
          <Box size={14} />
          <span className="summary-section__title">Classes</span>
          <span className="summary-section__count">{count}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-section">
      <div className="summary-section__header" onClick={() => setIsExpanded(!isExpanded)}>
        <Box size={14} />
        <span className="summary-section__title">Classes</span>
        <span className="summary-section__count">{count}</span>
        <span className={`summary-section__chevron ${isExpanded ? "summary-section__chevron--expanded" : ""}`}>
          ▶
        </span>
      </div>

      {isExpanded && (
        <div className="summary-section__content">
          {/* Show stereotype breakdown */}
          {Object.keys(classByStereotype).length > 0 && (
            <div className="summary-section__groups">
              {Object.entries(classByStereotype).map(([key, value]) => (
                <span key={key} className="summary-section__group">
                  {key}: <strong>{value}</strong>
                </span>
              ))}
            </div>
          )}

          {/* List classes with expandable nested content */}
          <ul className="summary-section__list">
            {classList.map((cls) => {
              const isClassExpanded = expandedClasses.has(cls.id);
              const hasNested = hasNestedContent(cls);

              return (
                <li key={cls.id} className="summary-item-wrapper">
                  <div
                    className={`summary-item summary-item--class ${selectedId === cls.id ? "summary-item--selected" : ""}`}
                    onClick={() => onItemClick(cls.id)}
                  >
                    {hasNested && (
                      <span
                        className={`summary-item__expand ${isClassExpanded ? "summary-item__expand--expanded" : ""}`}
                        onClick={(e) => toggleClassExpansion(cls.id, e)}
                      >
                        <ChevronRight size={12} />
                      </span>
                    )}
                    {!hasNested && <span className="summary-item__expand-placeholder" />}
                    <span className={`summary-item__stereotype summary-item__stereotype--${cls.stereotype}`}>
                      {cls.stereotype}
                    </span>
                    {cls.name}
                  </div>

                  {/* Nested content when expanded */}
                  {isClassExpanded && hasNested && (
                    <div className="summary-item__nested">
                      {/* Specialization */}
                      {cls.specialization?.length > 0 && (
                        <div className="summary-item__nested-group">
                          <span className="summary-item__nested-label">specializes</span>
                          {cls.specialization.map((parent, idx) => (
                            <span key={idx} className="summary-item__nested-value summary-item__nested-value--parent">
                              {parent}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Attributes */}
                      {cls.attributes?.length > 0 && (
                        <div className="summary-item__nested-group">
                          <span className="summary-item__nested-label">attributes</span>
                          {cls.attributes.map((attr, idx) => (
                            <div key={idx} className="summary-item__nested-attr">
                              <span className="summary-item__nested-attr-name">{attr.name}</span>
                              <span className="summary-item__nested-attr-type">: {attr.type}</span>
                              {attr.cardinality && (
                                <span className="summary-item__nested-attr-card">{attr.cardinality}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Internal Relations */}
                      {cls.internalRelations?.length > 0 && (
                        <div className="summary-item__nested-group">
                          <span className="summary-item__nested-label">relations</span>
                          {cls.internalRelations.map((rel, idx) => (
                            <div key={idx} className="summary-item__nested-rel">
                              <span className="summary-item__nested-rel-stereo">@{rel.stereotype}</span>
                              <span className="summary-item__nested-rel-target">→ {rel.target}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
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

function PatternsSection({ patterns, incompletePatterns, patternCounts }) {
  const { setMode, setAnalysisView, setFocusedWarningFilter } = useApp();
  const [isExpanded, setIsExpanded] = useState(true);

  const totalPatterns = patterns.length + incompletePatterns.length;
  const hasPatterns = totalPatterns > 0;

  // Get non-zero pattern counts for display
  const activePatternTypes = Object.entries(patternCounts)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({ type: type.replace("_Pattern", ""), count }));

  // Handler for clicking incomplete patterns - navigate to related warning
  const handleIncompletePatternClick = (pattern, e) => {
    e.stopPropagation(); // Prevent section collapse
    setMode("ide");
    setAnalysisView("warnings");
    setFocusedWarningFilter({
      anchor_class: pattern.anchor_class,
      pattern_type: pattern.pattern_type,
    });
  };

  if (!hasPatterns) {
    return (
      <div className="summary-section summary-section--empty">
        <div className="summary-section__header" onClick={() => setIsExpanded(!isExpanded)}>
          <Puzzle size={14} />
          <span className="summary-section__title">Patterns</span>
          <span className="summary-section__count">0</span>
        </div>
      </div>
    );
  }

  return (
    <div className="summary-section summary-section--patterns">
      <div className="summary-section__header" onClick={() => setIsExpanded(!isExpanded)}>
        <Puzzle size={14} />
        <span className="summary-section__title">Patterns</span>
        <span className="summary-section__count">{totalPatterns}</span>
        <span className={`summary-section__chevron ${isExpanded ? "summary-section__chevron--expanded" : ""}`}>
          ▶
        </span>
      </div>

      {isExpanded && (
        <div className="summary-section__content">
          {/* Pattern type breakdown */}
          <div className="summary-section__groups">
            {activePatternTypes.map(({ type, count }) => (
              <span key={type} className="summary-section__group">
                {type}: <strong>{count}</strong>
              </span>
            ))}
          </div>

          {/* Complete patterns */}
          {patterns.length > 0 && (
            <div className="patterns-list">
              <div className="patterns-list__header patterns-list__header--complete">
                <CheckCircle size={12} />
                <span>Complete ({patterns.length})</span>
              </div>
              <ul className="summary-section__list">
                {patterns.map((pattern, idx) => (
                  <li key={`complete-${idx}`} className="summary-item summary-item--pattern-complete">
                    <span className="summary-item__pattern-type">{pattern.pattern_type?.replace("_", " ")}</span>
                    <span className="summary-item__pattern-anchor">{pattern.anchor_class}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Incomplete patterns */}
          {incompletePatterns.length > 0 && (
            <div className="patterns-list">
              <div className="patterns-list__header patterns-list__header--incomplete">
                <AlertTriangle size={12} />
                <span>Incomplete ({incompletePatterns.length})</span>
              </div>
              <ul className="summary-section__list">
                {incompletePatterns.map((pattern, idx) => (
                  <li
                    key={`incomplete-${idx}`}
                    className="summary-item summary-item--pattern-incomplete summary-item--clickable"
                    onClick={(e) => handleIncompletePatternClick(pattern, e)}
                    title="Click to view warnings"
                  >
                    <span className="summary-item__pattern-type">{pattern.pattern_type?.replace("_", " ")}</span>
                    <span className="summary-item__pattern-anchor">{pattern.anchor_class}</span>
                    <span className="summary-item__pattern-issues">
                      {pattern.violations?.length || 0} issue{pattern.violations?.length !== 1 ? "s" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
