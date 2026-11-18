export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p role="alert" style={{ fontSize: "11px", color: "#e07a6e", marginTop: "5px" }}>
      {msg}
    </p>
  );
}

export function Required() {
  return <span style={{ color: "#e07a6e" }}> *</span>;
}
