import { describe, it, expect, beforeEach } from "vitest";
import { toneClass, formatDate, initials, auth, ApiError } from "./api.js";

describe("toneClass", () => {
it("status-success para in", () => {
expect(toneClass("in")).toBe("status-success");
});

it("status-danger para expired", () => {
expect(toneClass("expired")).toBe("status-danger");
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
expect(formatDate("2026-08-12")).toContain("2026");
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

it("limita para duas iniciais", () => {
expect(initials("Ana Maria Silva")).toBe("AM");
});
});

describe("ApiError", () => {
it("cria erro corretamente", () => {
const error = new ApiError(404, "Not Found");

expect(error.status).toBe(404);
expect(error.message).toBe("Not Found");
expect(error.name).toBe("ApiError");


});
});

describe("auth", () => {
beforeEach(() => {
localStorage.clear();
sessionStorage.clear();
});

it("salva sessão no localStorage", () => {
auth.save(
{
token: "abc123",
user: { name: "Admin" }
},
true
);


expect(auth.token).toBe("abc123");
expect(auth.user.name).toBe("Admin");


});

it("salva sessão no sessionStorage", () => {
auth.save(
{
token: "xyz999",
user: { name: "User" }
},
false
);

expect(auth.token).toBe("xyz999");
expect(auth.user.name).toBe("User");


});

it("limpa sessão", () => {
auth.save(
{
token: "abc123",
user: { name: "Admin" }
},
true
);


auth.clear();

expect(auth.token).toBeNull();


});

it("retorna null sem sessão", () => {
auth.clear();


expect(auth.session).toBeNull();


});

it("retorna token null sem sessão", () => {
auth.clear();


expect(auth.token).toBeNull();


});

it("retorna user null sem sessão", () => {
auth.clear();


expect(auth.user).toBeNull();


});

it("ignora JSON inválido", () => {
localStorage.setItem(
"ca_pharmacy_session",
"invalid-json"
);


expect(auth.session).toBeNull();


});
});
