import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useApp } from "../AppShell";
import "./SettingsModal.css";

export default function SettingsModal({ isOpen, onClose }) {
  const { settings, updateSetting, resetSettings } = useApp();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleDelayChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 100 && value <= 5000) {
      updateSetting("autoSaveDelay", value);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal__backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal" ref={modalRef} role="dialog" aria-modal="true">
        <div className="settings-modal__header">
          <h2 className="settings-modal__title">Settings</h2>
          <button
            className="settings-modal__close"
            onClick={onClose}
            aria-label="Close settings"
          >
            <X size={18} />
          </button>
        </div>

        <div className="settings-modal__content">
          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">Saving</h3>

            <div className="settings-modal__option">
              <div className="settings-modal__option-info">
                <label className="settings-modal__label">Auto-save to disk</label>
                <span className="settings-modal__description">
                  Automatically save files to disk after changes
                </span>
              </div>
              <label className="settings-modal__toggle">
                <input
                  type="checkbox"
                  checked={settings.autoSaveToDisk}
                  onChange={(e) => updateSetting("autoSaveToDisk", e.target.checked)}
                />
                <span className="settings-modal__toggle-slider" />
              </label>
            </div>

            <div className="settings-modal__option">
              <div className="settings-modal__option-info">
                <label className="settings-modal__label">Auto-reparse</label>
                <span className="settings-modal__description">
                  Automatically re-parse file after changes
                </span>
              </div>
              <label className="settings-modal__toggle">
                <input
                  type="checkbox"
                  checked={settings.autoSaveToReparse}
                  onChange={(e) => updateSetting("autoSaveToReparse", e.target.checked)}
                />
                <span className="settings-modal__toggle-slider" />
              </label>
            </div>

            <div className="settings-modal__option">
              <div className="settings-modal__option-info">
                <label className="settings-modal__label">Auto-save delay</label>
                <span className="settings-modal__description">
                  Delay before auto-save triggers (100-5000ms)
                </span>
              </div>
              <div className="settings-modal__input-group">
                <input
                  type="number"
                  className="settings-modal__input"
                  value={settings.autoSaveDelay}
                  onChange={handleDelayChange}
                  min={100}
                  max={5000}
                  step={100}
                />
                <span className="settings-modal__input-suffix">ms</span>
              </div>
            </div>

            <div className="settings-modal__option settings-modal__option--column">
              <div className="settings-modal__option-info">
                <label className="settings-modal__label">On close unsaved file</label>
                <span className="settings-modal__description">
                  What to do when closing a file with unsaved changes
                </span>
              </div>
              <div className="settings-modal__radio-group">
                <label className="settings-modal__radio">
                  <input
                    type="radio"
                    name="onCloseUnsaved"
                    value="confirm"
                    checked={settings.onCloseUnsaved === "confirm"}
                    onChange={(e) => updateSetting("onCloseUnsaved", e.target.value)}
                  />
                  <span className="settings-modal__radio-label">Show confirmation dialog</span>
                </label>
                <label className="settings-modal__radio">
                  <input
                    type="radio"
                    name="onCloseUnsaved"
                    value="save"
                    checked={settings.onCloseUnsaved === "save"}
                    onChange={(e) => updateSetting("onCloseUnsaved", e.target.value)}
                  />
                  <span className="settings-modal__radio-label">Save automatically</span>
                </label>
                <label className="settings-modal__radio">
                  <input
                    type="radio"
                    name="onCloseUnsaved"
                    value="discard"
                    checked={settings.onCloseUnsaved === "discard"}
                    onChange={(e) => updateSetting("onCloseUnsaved", e.target.value)}
                  />
                  <span className="settings-modal__radio-label">Discard changes</span>
                </label>
              </div>
            </div>
          </section>

          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">Editor</h3>

            <div className="settings-modal__option">
              <div className="settings-modal__option-info">
                <label className="settings-modal__label">Keep token highlight</label>
                <span className="settings-modal__description">
                  Keep token highlighted until another is selected
                </span>
              </div>
              <label className="settings-modal__toggle">
                <input
                  type="checkbox"
                  checked={settings.keepTokenHighlight}
                  onChange={(e) => updateSetting("keepTokenHighlight", e.target.checked)}
                />
                <span className="settings-modal__toggle-slider" />
              </label>
            </div>
          </section>

          <section className="settings-modal__section">
            <h3 className="settings-modal__section-title">Diagram</h3>

            <div className="settings-modal__option">
              <div className="settings-modal__option-info">
                <label className="settings-modal__label">Show external classes</label>
                <span className="settings-modal__description">
                  Display imported classes as ghost nodes in the diagram
                </span>
              </div>
              <label className="settings-modal__toggle">
                <input
                  type="checkbox"
                  checked={settings.showExternalClasses}
                  onChange={(e) => updateSetting("showExternalClasses", e.target.checked)}
                />
                <span className="settings-modal__toggle-slider" />
              </label>
            </div>

            <div className="settings-modal__option settings-modal__option--column">
              <div className="settings-modal__option-info">
                <label className="settings-modal__label">Attribute display</label>
                <span className="settings-modal__description">
                  How to display class attributes in the OntoUML diagram
                </span>
              </div>
              <div className="settings-modal__radio-group">
                <label className="settings-modal__radio">
                  <input
                    type="radio"
                    name="attributeDisplay"
                    value="shown"
                    checked={settings.attributeDisplay === "shown"}
                    onChange={(e) => updateSetting("attributeDisplay", e.target.value)}
                  />
                  <span className="settings-modal__radio-label">Always shown</span>
                </label>
                <label className="settings-modal__radio">
                  <input
                    type="radio"
                    name="attributeDisplay"
                    value="collapsible"
                    checked={settings.attributeDisplay === "collapsible"}
                    onChange={(e) => updateSetting("attributeDisplay", e.target.value)}
                  />
                  <span className="settings-modal__radio-label">Collapsible</span>
                </label>
                <label className="settings-modal__radio">
                  <input
                    type="radio"
                    name="attributeDisplay"
                    value="hover"
                    checked={settings.attributeDisplay === "hover"}
                    onChange={(e) => updateSetting("attributeDisplay", e.target.value)}
                  />
                  <span className="settings-modal__radio-label">Show on hover</span>
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="settings-modal__footer">
          <button
            className="settings-modal__btn settings-modal__btn--secondary"
            onClick={resetSettings}
          >
            Reset to defaults
          </button>
          <button
            className="settings-modal__btn settings-modal__btn--primary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
