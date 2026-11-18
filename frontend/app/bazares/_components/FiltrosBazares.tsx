"use client";

interface FiltrosBazaresProps {
  search: string;
  setSearch: (valor: string) => void;
  filterLocal: string;
  setFilterLocal: (valor: string) => void;
  locais: string[];
}

export default function FiltrosBazares({ search, setSearch, filterLocal, setFilterLocal, locais }: FiltrosBazaresProps) {
  return (
    <div
      style={{
        marginBottom: "24px",
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
        <svg
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9B8E84",
          }}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nome ou local..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "8px 12px 8px 34px",
            border: "0.5px solid #d6d0c4",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#2B1F14",
            background: "#ffffff",
            outline: "none",
          }}
        />
      </div>
      <select
        value={filterLocal}
        onChange={(e) => setFilterLocal(e.target.value)}
        style={{
          padding: "8px 12px",
          border: "0.5px solid #d6d0c4",
          borderRadius: "10px",
          fontSize: "13px",
          color: "#2B1F14",
          background: "#ffffff",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <option>Todos</option>
        {locais.map((local) => (
          <option key={local} value={local}>
            {local}
          </option>
        ))}
      </select>
    </div>
  );
}
