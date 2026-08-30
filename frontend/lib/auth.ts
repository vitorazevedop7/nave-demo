export interface Usuario {
  id: string;
  nome: string;
  email: string;
  especialidade: string | null;
  perfis: string[];
}

export function getUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("usuario");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Usuario;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("usuario");
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
