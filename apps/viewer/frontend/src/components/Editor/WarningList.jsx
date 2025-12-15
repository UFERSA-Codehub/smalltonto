import { useCallback, useState } from "react";
import { Lightbulb, Code, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useApp } from "../AppShell";
import "./WarningList.css";

/**
 * Generates a user-friendly explanation for warning codes.
 * @param {Object} warning - The warning object with code and other details
 * @returns {string|null} A suggestion string or null if no suggestion available
 */
function getSuggestion(warning) {
  const code = warning.code || "";

  if (code === "MISSING_GENSET") {
    return "A genset formalizes the generalization relationship between a kind and its subkinds, ensuring proper classification.";
  }

  if (code === "INCOMPLETE_GENSET_SPECIFICS") {
    return "The genset should include all subkinds that specialize the general class to maintain model consistency.";
  }

  if (code === "MISSING_DISJOINT") {
    return "Subkinds of a kind are typically mutually exclusive. Adding 'disjoint' ensures an instance cannot belong to multiple subkinds.";
  }

  // Pattern-specific suggestions
  if (warning.pattern_type) {
    return `This is part of a ${warning.pattern_type.replace("_", " ")} that may need attention.`;
  }

  return null;
}

function WarningItem({ warning, onWarningClick }) {
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const suggestion = warning.recommendation || getSuggestion(warning);
  const codeSuggestion = warning.suggestion?.code_suggestion;

  const handleCopyCode = async (e) => {
    e.stopPropagation();
    if (codeSuggestion) {
      try {
        await navigator.clipboard.writeText(codeSuggestion);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div
      className="warning-list__item"
      onClick={() => onWarningClick(warning)}
      title={warning.line ? `Click to go to line ${warning.line}` : undefined}
    >
      <span className="warning-list__icon">⚠</span>
      <div className="warning-list__content">
        <span className="warning-list__message">{warning.message}</span>
        {warning.anchor_class && (
          <span className="warning-list__context">
            in {warning.pattern_type?.replace("_", " ") || "pattern"}: {warning.anchor_class}
          </span>
        )}
        {warning.line && (
          <span className="warning-list__location">
            Line {warning.line}
            {warning.column && `, Col ${warning.column}`}
          </span>
        )}
        {suggestion && (
          <span className="warning-list__suggestion">
            <Lightbulb className="warning-list__suggestion-icon" size={14} />
            {suggestion}
          </span>
        )}
        {codeSuggestion && (
          <div className="warning-list__code-fix">
            <button
              className="warning-list__code-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setIsCodeExpanded(!isCodeExpanded);
              }}
            >
              {isCodeExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <Code size={14} />
              <span>Suggested fix</span>
            </button>
            {isCodeExpanded && (
              <div className="warning-list__code-block">
                <button
                  className="warning-list__copy-btn"
                  onClick={handleCopyCode}
                  title="Copy to clipboard"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                </button>
                <pre>{codeSuggestion}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WarningList({ warnings }) {
  const { setHighlightRequest } = useApp();

  const handleWarningClick = useCallback(
    (warning) => {
      if (warning.line) {
        setHighlightRequest({
          line: warning.line,
          column: warning.column || 1,
          length: 1,
          type: "warning",
        });
      }
    },
    [setHighlightRequest]
  );

  if (!warnings || warnings.length === 0) {
    return (
      <div className="warning-list warning-list--empty">
        <div className="warning-list__success">
          <span className="warning-list__success-icon">✓</span>
          <p>No warnings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="warning-list">
      {warnings.map((warning, index) => (
        <WarningItem
          key={index}
          warning={warning}
          onWarningClick={handleWarningClick}
        />
      ))}
    </div>
  );
}
