import { useCallback } from "react";
import { Lightbulb } from "lucide-react";
import { useApp } from "../AppShell";
import "./ErrorList.css";

/**
 * Generates a suggestion for fixing common errors based on error message patterns.
 * @param {Object} error - The error object with message and other details
 * @returns {string|null} A suggestion string or null if no suggestion available
 */
function getSuggestion(error) {
  const msg = error.message || "";

  // Missing relation keyword for external relations
  if (msg.includes("Unexpected token '@'") && msg.includes("Expected one of:")) {
    return "External relations require the 'relation' keyword after the stereotype. Example: @material relation ClassName [1..*] -- name -- [1] OtherClass";
  }

  // Unknown stereotype
  if (msg.includes("Unexpected token") && msg.includes("RELATION_")) {
    const match = msg.match(/Unexpected token '(\w+)'/);
    if (match) {
      return `'${match[1]}' may not be a recognized stereotype. Check spelling or verify it's a valid OntoUML relation stereotype.`;
    }
  }

  // Missing class stereotype
  if (msg.includes("Expected one of:") && msg.includes("CLASS_")) {
    return "Class declarations require a stereotype (kind, subkind, role, phase, relator, etc.) before the class name.";
  }

  // Unexpected identifier after package
  if (msg.includes("Unexpected token") && msg.includes("type: IDENTIFIER")) {
    return "Check for missing keywords or punctuation. Declarations need proper stereotypes or keywords.";
  }

  // Missing closing brace
  if (msg.includes("Unexpected end of file") || msg.includes("EOF")) {
    return "The file may be missing closing braces '}' or other required syntax elements.";
  }

  // Illegal character
  if (msg.includes("Illegal character")) {
    const match = msg.match(/Illegal character '(.+?)'/);
    if (match) {
      return `Character '${match[1]}' is not allowed in Tonto. Check for typos or encoding issues.`;
    }
  }

  // Cardinality issues
  if (msg.includes("[") && msg.includes("]") && msg.includes("Unexpected")) {
    return "Check cardinality syntax. Valid formats: [1], [*], [0..*], [1..*], [0..1]";
  }

  // Generic suggestion for syntax errors
  if (error.type === "SyntaxError") {
    return "Check for missing punctuation, incorrect keyword order, or typos in the code.";
  }

  return null;
}

export default function ErrorList({ errors }) {
  const { setHighlightRequest } = useApp();

  const handleErrorClick = useCallback(
    (error) => {
      if (error.line) {
        setHighlightRequest({
          line: error.line,
          column: error.column || 1,
          length: 1,
          type: "error",
        });
      }
    },
    [setHighlightRequest]
  );

  if (!errors || errors.length === 0) {
    return (
      <div className="error-list error-list--empty">
        <div className="error-list__success">
          <span className="error-list__success-icon">✓</span>
          <p>No errors</p>
        </div>
      </div>
    );
  }

  return (
    <div className="error-list">
      {errors.map((error, index) => {
        const suggestion = getSuggestion(error);
        return (
          <div
            key={index}
            className="error-list__item"
            onClick={() => handleErrorClick(error)}
            title={error.line ? `Click to go to line ${error.line}` : undefined}
          >
            <span className="error-list__icon">✕</span>
            <div className="error-list__content">
              <span className="error-list__message">{error.message}</span>
              {error.line && (
                <span className="error-list__location">
                  Line {error.line}
                  {error.column && `, Col ${error.column}`}
                </span>
              )}
              {suggestion && (
                <span className="error-list__suggestion">
                  <Lightbulb className="error-list__suggestion-icon" size={14} />
                  {suggestion}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
