import { useEffect, useRef } from "react";
import { X, Box, Database, List, GitBranch, Link, ArrowRight } from "lucide-react";
import "./DetailPanel.css";

/**
 * Floating Detail Panel - Shows complete information about a selected AST node
 */
export default function DetailPanel({ node, position, onClose }) {
  const panelRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    // Delay to avoid closing immediately on the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!node) return null;

  // Calculate panel position (offset from node)
  const style = {
    left: position?.x ?? 100,
    top: position?.y ?? 100,
  };

  return (
    <div ref={panelRef} className="detail-panel" style={style}>
      <div className="detail-panel__header">
        <span className="detail-panel__title">{getNodeTitle(node)}</span>
        <button className="detail-panel__close" onClick={onClose}>
          <X size={14} />
        </button>
      </div>
      <div className="detail-panel__content">
        {renderNodeDetails(node)}
      </div>
    </div>
  );
}

/**
 * Get title for the detail panel based on node type
 */
function getNodeTitle(node) {
  const type = node.type;
  const name = node.data?.name || "Unknown";
  
  switch (type) {
    case "package":
      return `Package: ${name}`;
    case "class":
      return `Class: ${name}`;
    case "datatype":
      return `Datatype: ${name}`;
    case "enum":
      return `Enum: ${name}`;
    case "genset":
      return `Genset: ${name}`;
    default:
      return name;
  }
}

/**
 * Render detailed content based on node type
 */
function renderNodeDetails(node) {
  const type = node.type;
  const data = node.data || {};

  switch (type) {
    case "package":
      return <PackageDetails data={data} />;
    case "class":
      return <ClassDetails data={data} />;
    case "datatype":
      return <DatatypeDetails data={data} />;
    case "enum":
      return <EnumDetails data={data} />;
    case "genset":
      return <GensetDetails data={data} />;
    default:
      return <GenericDetails data={data} />;
  }
}

/**
 * Package details
 */
function PackageDetails({ data }) {
  return (
    <div className="detail-panel__sections">
      {data.imports && data.imports.length > 0 && (
        <DetailSection title="Imports" icon={<Link size={12} />}>
          <ul className="detail-list">
            {data.imports.map((imp, idx) => (
              <li key={idx} className="detail-list__item">
                {imp.module_name}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
      {(!data.imports || data.imports.length === 0) && (
        <p className="detail-panel__empty">No imports</p>
      )}
    </div>
  );
}

/**
 * Class details
 */
function ClassDetails({ data }) {
  return (
    <div className="detail-panel__sections">
      {/* Stereotype */}
      <DetailRow label="Stereotype">
        <span className={`detail-badge detail-badge--${data.stereotype}`}>
          {data.stereotype}
        </span>
      </DetailRow>

      {/* Specialization */}
      {data.specialization?.parents && (
        <DetailRow label="Specializes">
          {data.specialization.parents.map((parent, idx) => (
            <span key={idx} className="detail-ref">
              {parent}
              {idx < data.specialization.parents.length - 1 && ", "}
            </span>
          ))}
        </DetailRow>
      )}

      {/* Attributes */}
      {data.attributes && data.attributes.length > 0 && (
        <DetailSection title="Attributes" icon={<Database size={12} />}>
          <table className="detail-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {data.attributes.map((attr, idx) => (
                <tr key={idx}>
                  <td className="detail-table__name">{attr.name}</td>
                  <td className="detail-table__type">{attr.type}</td>
                  <td className="detail-table__card">{attr.cardinality || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailSection>
      )}

      {/* Relations */}
      {data.relations && data.relations.length > 0 && (
        <DetailSection title="Relations" icon={<ArrowRight size={12} />}>
          <ul className="detail-list detail-list--relations">
            {data.relations.map((rel, idx) => (
              <li key={idx} className="detail-list__item detail-list__item--relation">
                <span className="detail-rel__stereotype">@{rel.stereotype}</span>
                <span className="detail-rel__name">{rel.name || "(unnamed)"}</span>
                <span className="detail-rel__arrow">→</span>
                <span className="detail-rel__target">{rel.secondEnd}</span>
                <span className="detail-rel__cards">
                  {rel.firstCardinality || "*"} : {rel.secondCardinality || "*"}
                </span>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {/* Empty state */}
      {(!data.attributes || data.attributes.length === 0) && 
       (!data.relations || data.relations.length === 0) && (
        <p className="detail-panel__empty">No attributes or relations</p>
      )}
    </div>
  );
}

/**
 * Datatype details
 */
function DatatypeDetails({ data }) {
  return (
    <div className="detail-panel__sections">
      {/* Specialization */}
      {data.specialization?.parents && (
        <DetailRow label="Specializes">
          {data.specialization.parents.map((parent, idx) => (
            <span key={idx} className="detail-ref">
              {parent}
              {idx < data.specialization.parents.length - 1 && ", "}
            </span>
          ))}
        </DetailRow>
      )}

      {/* Attributes */}
      {data.attributes && data.attributes.length > 0 && (
        <DetailSection title="Attributes" icon={<Database size={12} />}>
          <table className="detail-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {data.attributes.map((attr, idx) => (
                <tr key={idx}>
                  <td className="detail-table__name">{attr.name}</td>
                  <td className="detail-table__type">{attr.type}</td>
                  <td className="detail-table__card">{attr.cardinality || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DetailSection>
      )}

      {(!data.attributes || data.attributes.length === 0) && (
        <p className="detail-panel__empty">No attributes</p>
      )}
    </div>
  );
}

/**
 * Enum details
 */
function EnumDetails({ data }) {
  return (
    <div className="detail-panel__sections">
      {/* Specialization */}
      {data.specialization?.parents && (
        <DetailRow label="Specializes">
          {data.specialization.parents.map((parent, idx) => (
            <span key={idx} className="detail-ref">
              {parent}
              {idx < data.specialization.parents.length - 1 && ", "}
            </span>
          ))}
        </DetailRow>
      )}

      {/* Values */}
      {data.values && data.values.length > 0 && (
        <DetailSection title="Values" icon={<List size={12} />}>
          <div className="detail-enum-values">
            {data.values.map((value, idx) => (
              <span key={idx} className="detail-enum-value">
                {value}
              </span>
            ))}
          </div>
        </DetailSection>
      )}

      {(!data.values || data.values.length === 0) && (
        <p className="detail-panel__empty">No values defined</p>
      )}
    </div>
  );
}

/**
 * Genset details
 */
function GensetDetails({ data }) {
  return (
    <div className="detail-panel__sections">
      {/* Constraints */}
      <DetailRow label="Constraints">
        <div className="detail-badges">
          {data.disjoint && <span className="detail-badge detail-badge--disjoint">disjoint</span>}
          {data.complete && <span className="detail-badge detail-badge--complete">complete</span>}
          {!data.disjoint && !data.complete && <span className="detail-muted">none</span>}
        </div>
      </DetailRow>

      {/* General */}
      <DetailRow label="General">
        <span className="detail-ref">{data.general}</span>
      </DetailRow>

      {/* Categorizer */}
      {data.categorizer && (
        <DetailRow label="Categorizer">
          <span className="detail-ref">{data.categorizer}</span>
        </DetailRow>
      )}

      {/* Specifics */}
      {data.specifics && data.specifics.length > 0 && (
        <DetailSection title="Specifics" icon={<GitBranch size={12} />}>
          <div className="detail-specifics">
            {data.specifics.map((specific, idx) => (
              <span key={idx} className="detail-specific">
                {specific}
              </span>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  );
}

/**
 * Generic details for unknown node types
 */
function GenericDetails({ data }) {
  return (
    <div className="detail-panel__sections">
      <pre className="detail-panel__json">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

/**
 * Detail section with title and icon
 */
function DetailSection({ title, icon, children }) {
  return (
    <div className="detail-section">
      <div className="detail-section__header">
        {icon}
        <span className="detail-section__title">{title}</span>
      </div>
      <div className="detail-section__content">
        {children}
      </div>
    </div>
  );
}

/**
 * Simple label: value row
 */
function DetailRow({ label, children }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}:</span>
      <span className="detail-row__value">{children}</span>
    </div>
  );
}
