import { useCallback, useState, useEffect } from "react";
import { Lightbulb, Code, ChevronDown, ChevronRight, Copy, Check, Wand2 } from "lucide-react";
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

function WarningItem({ warning, onWarningClick, index, isHighlighted }) {
  const { activeTab, updateTabContent, parseContent } = useApp();
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [implemented, setImplemented] = useState(false);
  
  const suggestion = warning.recommendation || getSuggestion(warning);
  const codeSuggestion = warning.suggestion?.code_suggestion;

  const handleCopyCode = async (e) => {
    e.stopPropagation();
    if (!codeSuggestion) return;

    // Helper to show success feedback
    const showCopiedFeedback = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(codeSuggestion);
      showCopiedFeedback();
    } catch {
      // Fallback for pywebview/restricted contexts using execCommand
      try {
        const textArea = document.createElement("textarea");
        textArea.value = codeSuggestion;
        // Position off-screen to avoid visual flicker
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (success) {
          showCopiedFeedback();
        } else {
          console.error("Failed to copy: execCommand returned false");
        }
      } catch (fallbackErr) {
        console.error("Failed to copy with fallback:", fallbackErr);
      }
    }
  };

  const handleImplementCode = async (e) => {
    e.stopPropagation();
    if (!codeSuggestion || !activeTab) return;

    // Append code suggestion to end of file with proper spacing
    const newContent = activeTab.content.trimEnd() + "\n\n" + codeSuggestion + "\n";
    
    // Update the tab content (marks as dirty)
    updateTabContent(activeTab.path, newContent);
    
    // Re-parse to update analysis results
    await parseContent(newContent);
    
    // Show success feedback
    setImplemented(true);
    setTimeout(() => setImplemented(false), 2000);
  };

  return (
    <div
      className={`warning-list__item ${isHighlighted ? "warning-list__item--highlighted" : ""}`}
      onClick={() => onWarningClick(warning)}
      title={warning.line ? `Click to go to line ${warning.line}` : undefined}
      data-warning-index={index}
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
                <div className="warning-list__code-actions">
                  <button
                    className="warning-list__action-btn warning-list__implement-btn"
                    onClick={handleImplementCode}
                    title="Append to file"
                  >
                    {implemented ? <Check size={12} /> : <Wand2 size={12} />}
                  </button>
                  <button
                    className="warning-list__action-btn warning-list__copy-btn"
                    onClick={handleCopyCode}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
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
  const { setHighlightRequest, focusedWarningFilter, setFocusedWarningFilter } = useApp();
  const [highlightedIndex, setHighlightedIndex] = useState(null);

  // Handle navigation from SummaryPanel (incomplete pattern click)
  useEffect(() => {
    if (!focusedWarningFilter || !warnings?.length) return;

    // Find first matching warning
    const matchIndex = warnings.findIndex(
      (w) =>
        w.anchor_class === focusedWarningFilter.anchor_class &&
        w.pattern_type === focusedWarningFilter.pattern_type
    );

    if (matchIndex >= 0) {
      // Use setTimeout to avoid synchronous setState in effect (React lint rule)
      // This also ensures the DOM is ready after view switch
      setTimeout(() => {
        setHighlightedIndex(matchIndex);

        // Scroll to the warning element
        const element = document.querySelector(`[data-warning-index="${matchIndex}"]`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        // Clear highlight after animation
        setTimeout(() => setHighlightedIndex(null), 2500);
      }, 100);
    }

    // Clear the filter (consumed)
    setFocusedWarningFilter(null);
  }, [focusedWarningFilter, warnings, setFocusedWarningFilter]);

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
          index={index}
          isHighlighted={highlightedIndex === index}
        />
      ))}
    </div>
  );
}
