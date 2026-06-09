import { describe, it, expect, beforeEach } from "vitest";
import { statusBadge, placeholder, toast, openForm } from "./ui.js";

describe("statusBadge", () => {
  it("in status", () => {
    expect(statusBadge("in", "Available")).toContain("status-success");
  });

  it("out status", () => {
    expect(statusBadge("out", "Unavailable")).toContain("status-danger");
  });

  it("inclui label", () => {
    expect(statusBadge("in", "Available")).toContain("Available");
  });
});

describe("placeholder", () => {
  it("default", () => {
    expect(placeholder("Nenhum dado")).toContain("Nenhum dado");
  });

  it("error", () => {
    expect(placeholder("Erro", "error")).toContain("text-danger");
  });

  it("default class", () => {
    expect(placeholder("Teste")).toContain("text-body-secondary");
  });
});

describe("toast", () => {
  afterEach(() => {
    document.querySelectorAll(".toast-host").forEach((el) => el.remove());
  });

  it("cria container e reusa em chamadas consecutivas", () => {
    toast("Primeiro");
    const host = document.querySelector(".toast-host");
    expect(host).not.toBeNull();
    expect(host.children.length).toBe(1);

    toast("Segundo");
    expect(host.children.length).toBe(2);
  });
});

describe("openForm", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("abre modal", () => {
    openForm({
      title: "Medicamento",
      fields: [],
    });
    expect(document.querySelector(".modal-card")).not.toBeNull();
  });

  it("cancelar retorna null", async () => {
    const promise = openForm({ title: "Teste", fields: [] });
    document.querySelector("[data-cancel]").click();
    const result = await promise;
    expect(result).toBeNull();
  });

  it("submit retorna dados", async () => {
    const promise = openForm({
      title: "Teste",
      fields: [{ name: "nome", label: "Nome" }],
    });
    const input = document.querySelector("#f_nome");
    input.value = "João";
    document.querySelector("button[type='submit']").click();
    const result = await promise;
    expect(result.nome).toBe("João");
  });

  it("Escape cancela", async () => {
    const promise = openForm({ title: "X", fields: [] });
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    const result = await promise;
    expect(result).toBeNull();
  });

  it("renderiza campo select", () => {
    openForm({
      title: "Teste",
      fields: [{ name: "tipo", label: "Tipo", type: "select", options: ["A", "B"] }],
    });
    expect(document.querySelector("select")).not.toBeNull();
    expect(document.querySelector("option[value='A']")).not.toBeNull();
  });

  it("renderiza e submete campo checkbox", async () => {
    const promise = openForm({
      title: "Teste",
      fields: [{ name: "ativo", label: "Ativo", type: "checkbox", value: true }],
    });
    document.querySelector("button[type='submit']").click();
    const result = await promise;
    expect(result.ativo).toBe(true);
  });
});