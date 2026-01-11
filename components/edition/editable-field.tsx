"use client";

import { useRef, useEffect, useCallback } from "react";

interface EditableFieldProps {
  value: string | number | undefined;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  suffix?: string;
  multiline?: boolean;
}

export function EditableField({
  value,
  onSave,
  className = "",
  placeholder = "",
  suffix = "",
  multiline = false,
}: EditableFieldProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const savedValue = useRef(String(value ?? ""));

  useEffect(() => {
    savedValue.current = String(value ?? "");
  }, [value]);

  const handleBlur = useCallback(() => {
    if (spanRef.current) {
      const newValue = spanRef.current.textContent || "";
      if (newValue !== savedValue.current) {
        onSave(newValue);
        savedValue.current = newValue;
      }
    }
  }, [onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        spanRef.current?.blur();
      }
      if (e.key === "Escape") {
        if (spanRef.current) {
          spanRef.current.textContent = savedValue.current;
          spanRef.current.blur();
        }
      }
    },
    [multiline],
  );

  const isEmpty = value === undefined || value === "";
  const displayValue = isEmpty ? placeholder : value;

  return (
    <span className={className}>
      <span
        ref={spanRef}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`outline-none cursor-text ${isEmpty ? "text-muted-foreground/50 italic" : ""}`}
      >
        {displayValue}
      </span>
      {suffix && !isEmpty ? suffix : ""}
    </span>
  );
}
