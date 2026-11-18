import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  initialAcupuntura,
  initialAnamnese,
  initialCrianca,
  initialFisio,
} from "@/app/prontuarios/_lib/formularios";
import { escapeHtml, gerarHtmlProntuario, type DadosProntuarioPdf } from "./prontuario-pdf";

const dados = (parcial: Partial<DadosProntuarioPdf> = {}): DadosProntuarioPdf => ({
  anamneseAdulto: initialAnamnese,
  anamneseCrianca: initialCrianca,
  moradores: [],
  fisioterapia: initialFisio,
  acupuntura: initialAcupuntura,
  ...parcial,
});

describe("escapeHtml", () => {
  it("escapa todos os caracteres que abrem tag ou atributo", () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&\``)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;&#96;",
    );
  });

  it("trata nulos como texto vazio", () => {
    expect(escapeHtml(null)).toBe("");
  });
});

describe("gerarHtmlProntuario", () => {
  const ataque = '<script>alert("xss")</script>';

  it("não deixa texto clínico virar HTML no documento de impressão", () => {
    const html = gerarHtmlProntuario(
      "anamnese_adulto",
      dados({ anamneseAdulto: { ...initialAnamnese, queixa_principal: ataque } }),
      `Paciente ${ataque}`,
      "Profissional",
    );
    expect(html).not.toContain(ataque);
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
  });

  it("libera na CSP só o script que dispara a impressão", () => {
    const html = gerarHtmlProntuario("fisioterapia", dados(), "Paciente", "Profissional");
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
    expect(scripts).toHaveLength(1);

    const hashNaCsp = html.match(/script-src '(sha256-[^']+)'/)?.[1];
    const hashReal = "sha256-" + createHash("sha256").update(scripts[0]).digest("base64");
    expect(hashNaCsp).toBe(hashReal);
  });

  it("omite campos vazios e mantém os preenchidos", () => {
    const html = gerarHtmlProntuario(
      "fisioterapia",
      dados({ fisioterapia: { ...initialFisio, queixa_principal: "Dor lombar" } }),
      "Paciente",
      "Profissional",
    );
    expect(html).toContain("Dor lombar");
    expect(html).not.toContain(">Medicamentos<");
  });

  it("traduz a seleção do seletor de PDF em CSS, sem script", () => {
    const html = gerarHtmlProntuario(
      "acupuntura",
      dados({ acupuntura: { ...initialAcupuntura, nome: "Paciente", historia: "Insônia" } }),
      "Paciente",
      "Profissional",
      ["dados"],
      { dados: ["nome"] },
    );
    expect(html).toContain('[data-key]:not([data-key="dados"]) { display:none; }');
    expect(html).toContain('[data-key="dados"] [data-field]:not([data-field="nome"]) { display:none; }');
  });

  it("não deixa a seleção injetar CSS ou atributos", () => {
    const html = gerarHtmlProntuario("acupuntura", dados(), "Paciente", "Profissional", ['dados"] {} body{x:1']);
    expect(html).toContain('[data-key]:not([data-key="dadosbodyx1"])');
  });
});
