"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "@/components/Button";

function SectionCheckbox({ checked, indeterminate, onChange }: { checked: boolean; indeterminate: boolean; onChange: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      type="checkbox"
      ref={ref}
      checked={checked}
      onChange={onChange}
      style={{ cursor: "pointer", accentColor: "#E07A6E", width: "14px", height: "14px", flexShrink: 0 }}
    />
  );
}

export interface SecaoPdf {
  key: string;
  label: string;
  fields: Array<{ key: string; label: string }>;
}

const todosOsCampos = (sections: SecaoPdf[], marcados: boolean) => {
  const campos: Record<string, Set<string>> = {};
  sections.forEach((s) => {
    campos[s.key] = new Set(marcados ? s.fields.map((f) => f.key) : []);
  });
  return campos;
};

/** Abre com tudo marcado; a seleção vive aqui e só sai no onConfirm. */
export default function PdfSelectorModal({ sections, onConfirm, onCancel }: {
  sections: SecaoPdf[];
  onConfirm: (selectedSections: Set<string>, selectedFields: Record<string, Set<string>>) => void;
  onCancel: () => void;
}) {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(
    () => new Set(sections.map((s) => s.key)),
  );
  const [selectedFields, setSelectedFields] = useState<Record<string, Set<string>>>(
    () => todosOsCampos(sections, true),
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const onToggleSection = (key: string) => {
    const isSelected = selectedSections.has(key);
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (isSelected) { next.delete(key); } else { next.add(key); }
      return next;
    });
    if (!isSelected) {
      const section = sections.find((s) => s.key === key);
      if (section) {
        setSelectedFields((prev) => ({
          ...prev,
          [key]: new Set(section.fields.map((f) => f.key)),
        }));
      }
    }
  };

  const onToggleField = (sKey: string, fKey: string) => {
    setSelectedFields((prev) => {
      const fieldSet = new Set(prev[sKey] || []);
      if (fieldSet.has(fKey)) { fieldSet.delete(fKey); } else { fieldSet.add(fKey); }
      return { ...prev, [sKey]: fieldSet };
    });
    if (!selectedSections.has(sKey)) {
      setSelectedSections((prev) => new Set([...prev, sKey]));
    }
  };

  const onToggleAll = (all: boolean) => {
    setSelectedSections(all ? new Set(sections.map((s) => s.key)) : new Set());
    setSelectedFields(todosOsCampos(sections, all));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  const allSelected = sections.length > 0 && sections.every((s) => {
    if (!selectedSections.has(s.key)) return false;
    const flds = selectedFields[s.key] || new Set<string>();
    return s.fields.length === 0 || s.fields.every((f) => flds.has(f.key));
  });
  const noneSelected = sections.every((s) => !selectedSections.has(s.key));

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label="Selecionar conteúdo do PDF" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 }}>
      <div style={{ background: "#fff", borderRadius: "16px", width: "90%", maxWidth: "520px", maxHeight: "85vh", display: "flex", flexDirection: "column", boxShadow: "0 12px 40px rgba(0,0,0,0.22)" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "20px 24px", borderBottom: "0.5px solid #e0dbd2" }}>
          <h2 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#2B1F14" }}>Selecionar conteúdo para impressão</h2>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#9B8E84" }}>Escolha seções e campos específicos para o PDF</p>
        </div>
        <div style={{ padding: "14px 24px", borderBottom: "0.5px solid #f0ece4", display: "flex", gap: "8px" }}>
          <button onClick={() => onToggleAll(true)} style={{ fontSize: "11px", padding: "4px 12px", border: "0.5px solid #d6d0c4", borderRadius: "6px", cursor: "pointer", background: allSelected ? "#E07A6E" : "#fff", color: allSelected ? "#fff" : "#2B1F14", fontWeight: 600 }}>
            Selecionar tudo
          </button>
          <button onClick={() => onToggleAll(false)} style={{ fontSize: "11px", padding: "4px 12px", border: "0.5px solid #d6d0c4", borderRadius: "6px", cursor: "pointer", background: noneSelected ? "#E07A6E" : "#fff", color: noneSelected ? "#fff" : "#2B1F14", fontWeight: 600 }}>
            Remover tudo
          </button>
        </div>
        <div style={{ padding: "10px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
          {sections.map((section) => {
            const isSel = selectedSections.has(section.key);
            const sFields = selectedFields[section.key] || new Set<string>();
            const allFieldsSel = section.fields.length === 0 || section.fields.every((f) => sFields.has(f.key));
            const someFieldsSel = section.fields.some((f) => sFields.has(f.key));
            const isExpanded = expanded.has(section.key);
            const hasFields = section.fields.length > 0;
            return (
              <div key={section.key}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", border: `0.5px solid ${isSel ? "#E07A6E" : "#e0dbd2"}`, borderRadius: isExpanded && hasFields ? "8px 8px 0 0" : "8px", background: isSel ? "#fef6f5" : "#fff", transition: "all 0.15s" }}>
                  <SectionCheckbox
                    checked={isSel && allFieldsSel}
                    indeterminate={isSel && !allFieldsSel && someFieldsSel}
                    onChange={() => onToggleSection(section.key)}
                  />
                  <span style={{ flex: 1, fontSize: "12px", fontWeight: 600, color: isSel ? "#2B1F14" : "#6B5E54", cursor: "pointer" }} onClick={() => onToggleSection(section.key)}>
                    {section.label}
                  </span>
                  {hasFields && (
                    <button onClick={() => toggleExpand(section.key)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "#9B8E84", padding: "0 4px", lineHeight: 1, fontWeight: 700 }}>
                      {isExpanded ? "▾" : "▸"}
                    </button>
                  )}
                </div>
                {isExpanded && hasFields && (
                  <div style={{ padding: "8px 12px 8px 36px", border: "0.5px solid #E07A6E", borderTop: "none", borderRadius: "0 0 8px 8px", background: "#fffaf9", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {section.fields.map((field) => {
                      const isFieldSel = sFields.has(field.key);
                      return (
                        <label key={field.key} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", cursor: "pointer", padding: "5px 8px", borderRadius: "6px", background: isFieldSel ? "#fef0ee" : "transparent" }}>
                          <input
                            type="checkbox"
                            checked={isFieldSel}
                            onChange={() => onToggleField(section.key, field.key)}
                            style={{ cursor: "pointer", accentColor: "#E07A6E", width: "12px", height: "12px", flexShrink: 0 }}
                          />
                          <span style={{ color: isFieldSel ? "#2B1F14" : "#9B8E84", fontWeight: isFieldSel ? 600 : 400 }}>{field.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: "16px 24px", borderTop: "0.5px solid #e0dbd2", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button variant="ghost" size="sm" onClick={onCancel} style={{ padding: "8px 16px", fontSize: "12px" }}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={() => onConfirm(selectedSections, selectedFields)}
            disabled={noneSelected}
            style={{ padding: "8px 16px", fontSize: "12px" }}
          >
            Gerar PDF ({selectedSections.size} {selectedSections.size === 1 ? "seção" : "seções"})
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
