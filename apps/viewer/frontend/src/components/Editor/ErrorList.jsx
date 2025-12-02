import { useCallback } from "react";
import { useApp } from "../AppShell";
import "./ErrorList.css";

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
      {errors.map((error, index) => (
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
          </div>
        </div>
      ))}
    </div>
  );
}
