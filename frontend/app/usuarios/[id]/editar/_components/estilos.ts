import type { CSSProperties } from "react";

export const inputBase: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  border: "0.5px solid #d6d0c4",
  borderRadius: "10px",
  fontSize: "13px",
  color: "#2B1F14",
  background: "#faf9f6",
  outline: "none",
  transition: "border-color 0.15s, background 0.15s",
  fontFamily: "inherit",
};

export const labelStyle: CSSProperties = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#6B5E54",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "6px",
};

export const sectionDivider: CSSProperties = {
  fontSize: "11px",
  fontWeight: 700,
  color: "#9B8E84",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  paddingBottom: "10px",
  borderBottom: "0.5px solid #e0dbd2",
  marginBottom: "20px",
};
