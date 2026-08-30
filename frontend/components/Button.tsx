"use client";

import React, { useState } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
};

type ButtonAsButton = BaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
    as?: "button";
  };

type ButtonAsLink = BaseProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
    as: "a";
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

// ── Tokens de cor (paleta "Soft Bloom" — ver app/globals.css) ──────────────
const COLORS = {
  salmon: "var(--salmon-primary)", // #E07A6E
  salmonDark: "#C05A48",
  salmonTint: "rgba(224, 122, 110, 0.15)",
  salmonTintHover: "rgba(224, 122, 110, 0.28)",
  salmonLight: "var(--salmon-light)",
  danger: "#DC2626",
  dangerHover: "#B91C1C",
  textSecondary: "var(--text-secondary)",
  borderCard: "var(--border-card)",
  ghostHover: "rgba(0, 0, 0, 0.04)",
};

function variantStyle(variant: ButtonVariant): {
  base: React.CSSProperties;
  hoverBg: string;
} {
  switch (variant) {
    case "secondary":
      return {
        base: {
          background: COLORS.salmonTint,
          color: COLORS.salmon,
          border: `1.5px solid ${COLORS.salmonLight}`,
          fontWeight: 600,
        },
        hoverBg: COLORS.salmonTintHover,
      };
    case "ghost":
      return {
        base: {
          background: "transparent",
          color: COLORS.textSecondary,
          border: `1px solid ${COLORS.borderCard}`,
          fontWeight: 600,
        },
        hoverBg: COLORS.ghostHover,
      };
    case "danger":
      return {
        base: {
          background: COLORS.danger,
          color: "#fff",
          border: "none",
          fontWeight: 700,
        },
        hoverBg: COLORS.dangerHover,
      };
    case "primary":
    default:
      return {
        base: {
          background: COLORS.salmon,
          color: "#fff",
          border: "none",
          fontWeight: 700,
        },
        hoverBg: COLORS.salmonDark,
      };
  }
}

const sizeStyle: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "9px 20px", fontSize: "13px" },
  md: { padding: "11px 22px", fontSize: "14px" },
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  children,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = useState(false);
  const { base, hoverBg } = variantStyle(variant);

  const disabled = "disabled" in rest ? rest.disabled : false;

  const style: React.CSSProperties = {
    ...base,
    ...sizeStyle[size],
    borderRadius: "10px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    lineHeight: 1.2,
    transition: "background 0.15s ease, opacity 0.15s ease, color 0.15s ease",
    opacity: disabled ? 0.6 : 1,
    width: fullWidth ? "100%" : undefined,
    ...(hovered && !disabled
      ? variant === "ghost"
        ? { background: hoverBg, color: COLORS.textSecondary }
        : { background: hoverBg }
      : null),
    // permite override pelo chamador
    ...(("style" in rest ? rest.style : undefined) as React.CSSProperties),
  };

  const interaction = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };

  if (rest.as === "a") {
    const { as: _as, style: _style, ...anchorProps } = rest;
    return (
      <a {...anchorProps} style={style} {...interaction}>
        {children}
      </a>
    );
  }

  const { as: _as, style: _style, ...buttonProps } =
    rest as ButtonAsButton;
  return (
    <button {...buttonProps} style={style} {...interaction}>
      {children}
    </button>
  );
}
