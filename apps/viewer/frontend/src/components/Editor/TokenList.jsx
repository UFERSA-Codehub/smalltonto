import { useEffect, useRef } from "react";
import { useApp } from "../AppShell";
import "./TokenList.css";

export default function TokenList({ tokens }) {
  const { selectedTokenIndex, setHighlightRequest } = useApp();
  const listRef = useRef(null);
  const selectedRowRef = useRef(null);

  const handleTokenClick = (token) => {
    setHighlightRequest({
      line: token.line,
      column: token.column,
      length: token.value?.length || 1,
      type: "token",
    });
  };

  const isElementVisible = (element, container) => {
    if (!element || !container) return true;
    
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    return (
      elementRect.top >= containerRect.top &&
      elementRect.bottom <= containerRect.bottom
    );
  };

  useEffect(() => {
    if (selectedTokenIndex !== null && selectedRowRef.current && listRef.current) {
      if (!isElementVisible(selectedRowRef.current, listRef.current)) {
        selectedRowRef.current.scrollIntoView({
          behavior: "instant",
          block: "nearest",
        });
      }
    }
  }, [selectedTokenIndex]);

  if (!tokens || tokens.length === 0) {
    return (
      <div className="token-list token-list--empty">
        <p>No tokens</p>
      </div>
    );
  }

  return (
    <div className="token-list" ref={listRef}>
      <table className="token-list__table">
        <thead>
          <tr>
            <th>Type</th>
            <th>Value</th>
            <th>Pos</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token, index) => (
            <tr
              key={index}
              ref={index === selectedTokenIndex ? selectedRowRef : null}
              className={`token-list__row ${index === selectedTokenIndex ? "token-list__row--selected" : ""}`}
              onClick={() => handleTokenClick(token)}
              title={`Click to highlight in editor`}
            >
              <td className="token-list__type">{token.type}</td>
              <td className="token-list__value">
                <code>{token.value}</code>
              </td>
              <td className="token-list__pos">
                {token.line}:{token.column}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
