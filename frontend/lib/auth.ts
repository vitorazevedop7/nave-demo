export interface Usuario {
  id: string;
  nome: string;
  email: string;
  especialidade: string | null;
  perfis: string[];
}

export function parseUsuario(raw: string | null): Usuario | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function getUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  return parseUsuario(localStorage.getItem("usuario"));
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("usuario");
  // Rascunhos de anamnese contêm dados sensíveis: não podem sobreviver ao logout.
  for (const storage of [sessionStorage, localStorage]) {
    Object.keys(storage)
      .filter((k) => k.startsWith("anamnese_draft_"))
      .forEach((k) => storage.removeItem(k));
  }
  window.location.href = "/login";
}

export async function fetchAuth(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const token = localStorage.getItem("access_token");

  const res = await fetch(input, {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (res.status === 401) {
    logout();
  }

  return res;
}
