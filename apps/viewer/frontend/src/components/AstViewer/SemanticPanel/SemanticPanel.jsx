import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";
import "./SemanticPanel.css";

/**
 * Painel de Análise Semântica com visual estilo terminal.
 * Exibe padrões detectados, estereótipos e warnings.
 */
export default function SemanticPanel({ semantic, errors }) {
  const [verbose, setVerbose] = useState(false);

  const patterns = semantic?.patterns || [];
  const incompletePatterns = semantic?.incomplete_patterns || [];
  const patternCounts = semantic?.summary?.pattern_counts || {};
  const symbols = semantic?.symbols || {};

  const totalPatterns = patterns.length + incompletePatterns.length;
  const warningCount = incompletePatterns.reduce(
    (acc, p) => acc + (p.violations?.length || 0),
    0
  );

  return (
    <div className="semantic-panel">
      <div className="semantic-panel__box">
        {/* Header */}
        <div className="semantic-panel__header">
          <span className="semantic-panel__title">SEMANTIC ANALYSIS</span>
        </div>

        <div className="semantic-panel__separator" />

        <div className="semantic-panel__content">
          {/* File Summary */}
          <FileSummary
            errors={errors}
            warningCount={warningCount}
          />

          {/* Patterns Summary */}
          <PatternsSummary
            total={totalPatterns}
            complete={patterns.length}
            incomplete={incompletePatterns.length}
            patternCounts={patternCounts}
          />

          {/* Class Stereotypes */}
          <ClassStereotypes symbols={symbols} />

          {/* Relation Stereotypes */}
          <RelationStereotypes symbols={symbols} />

          {/* Verbose Toggle */}
          <div className="semantic-panel__toggle">
            <button
              className={`semantic-panel__toggle-btn ${verbose ? "semantic-panel__toggle-btn--active" : ""}`}
              onClick={() => setVerbose(!verbose)}
            >
              {verbose ? "Hide Details" : "Show Details (Verbose)"}
            </button>
          </div>

          {/* Warnings or Detailed Patterns */}
          {verbose ? (
            <>
              <CompletePatterns patterns={patterns} />
              <IncompletePatterns patterns={incompletePatterns} />
            </>
          ) : (
            <WarningsList incompletePatterns={incompletePatterns} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Resumo do arquivo com status de erros.
 */
function FileSummary({ errors, warningCount }) {
  const lexerErrors = errors?.lexer || [];
  const parserErrors = errors?.parser || [];

  return (
    <div className="semantic-panel__section">
      <div className="semantic-panel__section-title">File Summary</div>
      <div className="semantic-panel__summary-row">
        <span>Lexical Errors:</span>
        <StatusIcon count={lexerErrors.length} />
      </div>
      <div className="semantic-panel__summary-row">
        <span>Syntax Errors:</span>
        <StatusIcon count={parserErrors.length} />
      </div>
      <div className="semantic-panel__summary-row">
        <span>Semantic Warnings:</span>
        <StatusIcon count={warningCount} isWarning />
      </div>
    </div>
  );
}

/**
 * Ícone de status: ✓ verde, ✗ vermelho, ⚠ amarelo.
 */
function StatusIcon({ count, isWarning = false }) {
  if (count === 0) {
    return <span className="semantic-panel__status semantic-panel__status--ok">None ✓</span>;
  }
  if (isWarning) {
    return <span className="semantic-panel__status semantic-panel__status--warning">{count} ⚠</span>;
  }
  return <span className="semantic-panel__status semantic-panel__status--error">{count} ✗</span>;
}

/**
 * Resumo de padrões detectados com barras de progresso.
 */
function PatternsSummary({ total, complete, incomplete, patternCounts }) {
  if (total === 0) {
    return (
      <div className="semantic-panel__section">
        <div className="semantic-panel__section-title">PATTERNS DETECTED</div>
        <div className="semantic-panel__empty">No patterns detected</div>
      </div>
    );
  }

  // Ordenar por contagem (maior primeiro)
  const sortedPatterns = Object.entries(patternCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="semantic-panel__section">
      <div className="semantic-panel__section-title">PATTERNS DETECTED</div>
      <div className="semantic-panel__summary-row">
        <span>Total: {total}</span>
        <span>
          (Complete: <span className="semantic-panel__complete">{complete}</span>,
          Incomplete: <span className="semantic-panel__incomplete">{incomplete}</span>)
        </span>
      </div>

      <div className="semantic-panel__bars">
        {sortedPatterns.map(([patternType, count]) => (
          <ProgressBar
            key={patternType}
            label={patternType}
            count={count}
            total={total}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Barra de progresso estilo terminal.
 */
function ProgressBar({ label, count, total }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  const barWidth = 25;
  const filledWidth = Math.round((percentage / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;

  const bar = "█".repeat(filledWidth) + "░".repeat(emptyWidth);

  return (
    <div className="semantic-panel__bar-row">
      <span className="semantic-panel__bar-label">{label}</span>
      <span className="semantic-panel__bar">{bar}</span>
      <span className="semantic-panel__bar-value">
        {percentage.toFixed(1)}% ({count}/{total})
      </span>
    </div>
  );
}

/**
 * Distribuição de estereótipos de classes.
 */
function ClassStereotypes({ symbols }) {
  const classes = symbols?.classes || [];
  if (classes.length === 0) return null;

  // Contar estereótipos
  const stereoCounts = classes.reduce((acc, cls) => {
    const stereo = cls.class_stereotype || "unknown";
    acc[stereo] = (acc[stereo] || 0) + 1;
    return acc;
  }, {});

  const total = classes.length;
  const sortedStereos = Object.entries(stereoCounts).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="semantic-panel__section">
      <div className="semantic-panel__section-title">CLASS STEREOTYPES</div>
      <div className="semantic-panel__bars">
        {sortedStereos.map(([stereo, count]) => (
          <ProgressBar
            key={stereo}
            label={`@${stereo}`}
            count={count}
            total={total}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Distribuição de estereótipos de relações.
 */
function RelationStereotypes({ symbols }) {
  const relations = symbols?.relations || [];
  if (relations.length === 0) return null;

  // Contar estereótipos
  const stereoCounts = relations.reduce((acc, rel) => {
    const stereo = rel.relation_stereotype;
    if (stereo) {
      acc[stereo] = (acc[stereo] || 0) + 1;
    }
    return acc;
  }, {});

  if (Object.keys(stereoCounts).length === 0) return null;

  const total = Object.values(stereoCounts).reduce((a, b) => a + b, 0);
  const sortedStereos = Object.entries(stereoCounts).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="semantic-panel__section">
      <div className="semantic-panel__section-title">RELATION STEREOTYPES</div>
      <div className="semantic-panel__bars">
        {sortedStereos.map(([stereo, count]) => (
          <ProgressBar
            key={stereo}
            label={`@${stereo}`}
            count={count}
            total={total}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Lista de warnings (modo não-verbose).
 */
function WarningsList({ incompletePatterns }) {
  if (!incompletePatterns || incompletePatterns.length === 0) {
    return null;
  }

  return (
    <div className="semantic-panel__section">
      <div className="semantic-panel__section-title semantic-panel__section-title--warning">
        WARNINGS
      </div>
      <div className="semantic-panel__warnings">
        {incompletePatterns.map((pattern, idx) => (
          <WarningItem key={idx} pattern={pattern} />
        ))}
      </div>
    </div>
  );
}

/**
 * Item individual de warning.
 */
function WarningItem({ pattern }) {
  const patternType = pattern.pattern_type || "Unknown";
  const anchor = pattern.anchor_class || "?";
  const violations = pattern.violations || [];

  return (
    <>
      {violations.map((violation, idx) => {
        const message = truncateText(violation.message || "", 60);
        return (
          <div key={idx} className="semantic-panel__warning-item">
            <span className="semantic-panel__warning-arrow">→</span>
            <span className="semantic-panel__warning-type">[{patternType}]</span>
            <span className="semantic-panel__warning-anchor">{anchor}:</span>
            <span className="semantic-panel__warning-message">{message}</span>
          </div>
        );
      })}
    </>
  );
}

/**
 * Lista de padrões completos (modo verbose).
 */
function CompletePatterns({ patterns }) {
  const [expanded, setExpanded] = useState({});

  if (!patterns || patterns.length === 0) return null;

  const toggleExpand = (idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="semantic-panel__section">
      <div className="semantic-panel__section-title semantic-panel__section-title--complete">
        COMPLETE PATTERNS
      </div>
      <div className="semantic-panel__patterns">
        {patterns.map((pattern, idx) => (
          <PatternItem
            key={idx}
            pattern={pattern}
            isComplete
            isExpanded={expanded[idx]}
            onToggle={() => toggleExpand(idx)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Lista de padrões incompletos (modo verbose).
 */
function IncompletePatterns({ patterns }) {
  const [expanded, setExpanded] = useState({});

  if (!patterns || patterns.length === 0) return null;

  const toggleExpand = (idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="semantic-panel__section">
      <div className="semantic-panel__section-title semantic-panel__section-title--warning">
        INCOMPLETE PATTERNS
      </div>
      <div className="semantic-panel__patterns">
        {patterns.map((pattern, idx) => (
          <PatternItem
            key={idx}
            pattern={pattern}
            isComplete={false}
            isExpanded={expanded[`inc-${idx}`]}
            onToggle={() => toggleExpand(`inc-${idx}`)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Item individual de padrão (expandível).
 */
function PatternItem({ pattern, isComplete, isExpanded, onToggle }) {
  const patternType = pattern.pattern_type || "Unknown";
  const anchor = pattern.anchor_class || "?";
  const stereotype = pattern.anchor_stereotype || "?";
  const elements = pattern.elements || {};
  const constraints = pattern.constraints || {};
  const violations = pattern.violations || [];
  const suggestions = pattern.suggestions || [];

  const statusIcon = isComplete ? "+" : "!";
  const statusClass = isComplete ? "semantic-panel__status-icon--complete" : "semantic-panel__status-icon--incomplete";

  return (
    <div className="semantic-panel__pattern">
      <div className="semantic-panel__pattern-header" onClick={onToggle}>
        <span className={`semantic-panel__status-icon ${statusClass}`}>{statusIcon}</span>
        <span className="semantic-panel__pattern-type">{patternType}</span>
        <span className="semantic-panel__pattern-anchor">({anchor})</span>
        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>

      {isExpanded && (
        <div className="semantic-panel__pattern-details">
          <div className="semantic-panel__detail-row">
            <span className="semantic-panel__detail-label">Anchor:</span>
            <span>{anchor} (@{stereotype})</span>
          </div>

          {/* Elements */}
          <PatternElements patternType={patternType} elements={elements} constraints={constraints} />

          {/* Violations (para padrões incompletos) */}
          {!isComplete && violations.length > 0 && (
            <div className="semantic-panel__violations">
              <div className="semantic-panel__detail-label">Violations:</div>
              {violations.map((v, idx) => (
                <div key={idx} className="semantic-panel__violation-item">
                  <span className="semantic-panel__violation-severity">[{v.severity?.toUpperCase() || "WARNING"}]</span>
                  <span>{v.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Suggestions (para padrões incompletos) */}
          {!isComplete && suggestions.length > 0 && (
            <div className="semantic-panel__suggestions">
              <div className="semantic-panel__detail-label">Suggestions:</div>
              {suggestions.map((s, idx) => (
                <div key={idx} className="semantic-panel__suggestion-item">
                  <span>- {s.message}</span>
                  {s.code_suggestion && (
                    <pre className="semantic-panel__code-suggestion">
                      {s.code_suggestion.split("\n").slice(0, 3).join("\n")}
                      {s.code_suggestion.split("\n").length > 3 && "\n..."}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Renderiza elementos específicos de cada tipo de padrão.
 */
function PatternElements({ patternType, elements, constraints }) {
  switch (patternType) {
    case "Subkind_Pattern":
    case "Role_Pattern":
    case "Phase_Pattern":
      return (
        <>
          {elements.general && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">General:</span>
              <span>{elements.general}</span>
            </div>
          )}
          {elements.specifics?.length > 0 && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Specifics:</span>
              <span>{elements.specifics.join(", ")}</span>
            </div>
          )}
          {elements.genset && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Genset:</span>
              <span>
                {elements.genset}
                {" "}[{constraints.disjoint ? "disjoint" : ""}{constraints.complete ? " complete" : ""}]
              </span>
            </div>
          )}
        </>
      );

    case "Relator_Pattern":
      return (
        <>
          {elements.relator && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Relator:</span>
              <span>{elements.relator}</span>
            </div>
          )}
          {elements.mediations?.length > 0 && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Mediations:</span>
              <span>{elements.mediation_targets?.join(", ") || elements.mediations.length}</span>
            </div>
          )}
          {elements.material_relation && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Material:</span>
              <span>
                {elements.material_relation.first_end} -- {elements.material_relation.second_end}
              </span>
            </div>
          )}
        </>
      );

    case "Mode_Pattern":
      return (
        <>
          {elements.mode && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Mode:</span>
              <span>{elements.mode}</span>
            </div>
          )}
          {elements.characterizations?.length > 0 && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Characterizations:</span>
              <span>{elements.characterizations.map(c => c.target).join(", ")}</span>
            </div>
          )}
          {elements.external_dependences?.length > 0 && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">External Deps:</span>
              <span>{elements.external_dependences.map(d => d.target).join(", ")}</span>
            </div>
          )}
        </>
      );

    case "RoleMixin_Pattern":
      return (
        <>
          {elements.rolemixin && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">RoleMixin:</span>
              <span>{elements.rolemixin}</span>
            </div>
          )}
          {elements.role_specifics?.length > 0 && (
            <div className="semantic-panel__detail-row">
              <span className="semantic-panel__detail-label">Role Specifics:</span>
              <span>{elements.role_specifics.join(", ")}</span>
            </div>
          )}
        </>
      );

    default:
      return null;
  }
}

/**
 * Trunca texto adicionando '...' se exceder o tamanho máximo.
 */
function truncateText(text, maxLen = 60) {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}
