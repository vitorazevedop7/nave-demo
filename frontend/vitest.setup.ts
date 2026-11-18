// Datas são exibidas no fuso da ONG; fixar o fuso evita teste que muda com a máquina.
process.env.TZ = "America/Sao_Paulo";

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
