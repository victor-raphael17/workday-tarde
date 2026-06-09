import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { toneClass, formatDate, initials, auth, ApiError, api } from "./api.js";

const originalFetch = globalThis.fetch;

beforeAll(() => {
  globalThis.fetch = vi.fn();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("toneClass", () => {
  it("status-success para in", () => {
    expect(toneClass("in")).toBe("status-success");
  });

  it("status-danger para expired", () => {
    expect(toneClass("expired")).toBe("status-danger");
  });

  it("status-warning para low", () => {
    expect(toneClass("low")).toBe("status-warning");
  });

  it("status-neutral para desconhecido", () => {
    expect(toneClass("xyz")).toBe("status-neutral");
  });
});

describe("formatDate", () => {
  it("retorna — para vazio", () => {
    expect(formatDate("")).toBe("—");
  });

  it("formata data válida", () => {
    expect(formatDate("2026-08-12")).toBe("12 Aug 2026");
  });

  it("retorna valor original para data inválida", () => {
    expect(formatDate("abc")).toBe("abc");
  });
});

describe("initials", () => {
  it("nome completo", () => {
    expect(initials("Amara Okafor")).toBe("AO");
  });

  it("nome simples", () => {
    expect(initials("Maria")).toBe("M");
  });

  it("string vazia", () => {
    expect(initials("")).toBe("");
  });

  it("null retorna vazio", () => {
    expect(initials(null)).toBe("");
  });

  it("limita para duas iniciais", () => {
    expect(initials("Ana Maria Silva")).toBe("AM");
  });
});

describe("ApiError", () => {
  it("cria erro com status e message", () => {
    const error = new ApiError(404, "Not Found");
    expect(error.status).toBe(404);
    expect(error.message).toBe("Not Found");
    expect(error.name).toBe("ApiError");
  });

  it("usa mensagem default quando omitida", () => {
    const error = new ApiError(500);
    expect(error.message).toBe("Request failed (500)");
    expect(error.fields).toBeNull();
  });

  it("aceita fields opcionais", () => {
    const error = new ApiError(422, "Invalid", { name: "required" });
    expect(error.fields).toEqual({ name: "required" });
  });
});

describe("auth", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("salva sessão no localStorage", () => {
    auth.save({ token: "abc123", user: { name: "Admin" } }, true);
    expect(auth.token).toBe("abc123");
    expect(auth.user.name).toBe("Admin");
  });

  it("salva sessão no sessionStorage", () => {
    auth.save({ token: "xyz999", user: { name: "User" } }, false);
    expect(auth.token).toBe("xyz999");
    expect(auth.user.name).toBe("User");
  });

  it("limpa sessão", () => {
    auth.save({ token: "abc123", user: { name: "Admin" } }, true);
    auth.clear();
    expect(auth.token).toBeNull();
  });

  it("retorna null após clear", () => {
    auth.clear();
    expect(auth.session).toBeNull();
    expect(auth.token).toBeNull();
    expect(auth.user).toBeNull();
  });

  it("ignora JSON inválido", () => {
    localStorage.setItem("ca_pharmacy_session", "invalid-json");
    expect(auth.session).toBeNull();
  });
});

describe("auth.redirectToLogin", () => {
  it("redireciona para login.html", () => {
    const origLocation = window.location;
    const replace = vi.fn();
    delete window.location;
    window.location = { replace, ancestorOrigins: null, href: "" };
    auth.redirectToLogin();
    expect(replace).toHaveBeenCalledWith("login.html");
    window.location = origLocation;
  });
});

describe("api client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it("login bem-sucedido", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { token: "t", user: { name: "A" } } }),
    });
    const result = await api.login("a@b.com", "123");
    expect(result.token).toBe("t");
  });

  it("login 401 não redireciona (rota /login)", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "bad" } }),
    });
    await expect(api.login("x@y.z", "w")).rejects.toThrow(ApiError);
  });

  it("204 retorna null", async () => {
    fetch.mockResolvedValueOnce({ ok: true, status: 204 });
    const result = await api.logout();
    expect(result).toBeNull();
  });

  it("erro de rede", async () => {
    fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(api.me()).rejects.toThrow("Cannot reach the API");
  });

  it("envia token quando autenticado", async () => {
    auth.save({ token: "abc", user: { name: "X" } }, true);
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 1 } }),
    });
    await api.me();
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer abc" }),
      }),
    );
  });

  it("envia Content-Type em POST", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: { id: 99 } }),
    });
    await api.createMedication({ name: "Test" });
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: expect.any(String),
      }),
    );
  });

  it("401 em rota não-login redireciona", async () => {
    const origLocation = window.location;
    const replace = vi.fn();
    delete window.location;
    window.location = { replace, ancestorOrigins: null, href: "" };
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: { message: "unauthorized" } }),
    });
    await expect(api.dashboard()).rejects.toThrow(ApiError);
    expect(replace).toHaveBeenCalledWith("login.html");
    window.location = origLocation;
  });

  it("GET com query params", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: 1 }] }),
    });
    await api.medications({ status: "active" });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("status=active"),
      expect.any(Object),
    );
  });

  it("GET request simples", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: ["sup1", "sup2"] }),
    });
    const result = await api.suppliers();
    expect(result).toEqual(["sup1", "sup2"]);
  });

  it("payload sem data retorna undefined", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });
    const result = await api.me();
    expect(result).toBeUndefined();
  });
});
