import type { CSSProperties } from "react";

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#7a7a70",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "0.5px solid #d6d0c4",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#3a3a35",
  background: "#faf9f6",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

export const textareaStyle: CSSProperties = {
  ...inputStyle,
  resize: "none",
};
