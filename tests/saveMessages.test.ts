// The save panel speaks plainly (R3.5 step 1): field names in the sheet's own
// words, what went wrong and what to do, never a stored path, a code or JSON.
import { test } from "node:test";
import assert from "node:assert/strict";

import { describeValue, errorText, fieldLabel, problemText, retryable } from "../src/account/saveMessages";
import { API_SCHEMA } from "../src/contracts/fieldRegistry.generated";

test("every top-level field of both sheets has a plain label", () => {
  for (const kind of ["character", "familiar"] as const) {
    for (const path of Object.keys(API_SCHEMA.entities[kind])) {
      const label = fieldLabel(kind, path, "es");
      assert.notEqual(label, "La ficha", `${kind}.${path} has no label`);
      assert.notEqual(label, path, `${kind}.${path} shows its stored name`);
      assert.doesNotMatch(label, /[a-z][A-Z]/, `${kind}.${path} looks like a stored name: ${label}`);
    }
  }
});

test("list entries are named by their section and field, never by their ID", () => {
  assert.equal(fieldLabel("character", "camposPersonalizados/custom-1/nombre", "es"), "Campos Personalizados (nombre)");
  assert.equal(fieldLabel("character", "notasList/abc123/contenido", "es"), "Bitácora Celestial (texto)");
  assert.equal(fieldLabel("familiar", "notasList/abc123/contenido", "es"), "Bitácora del Familiar (texto)");
  assert.equal(fieldLabel("familiar", "nombre", "es"), "Nombre del Familiar");
  assert.equal(fieldLabel("character", "adultWizardProfile/role", "es"), "Rol / Título");
});

test("problems and refusals read as sentences with what to fix", () => {
  assert.equal(problemText({ path: "camposPersonalizados/custom-1/nombre", rule: "required" }, "character", "es"),
    "Campos Personalizados (nombre): no puede quedar vacío.");
  assert.equal(errorText({ code: "field_too_long", path: "notasList/x/contenido", rule: "maxLength", limit: 50000 }, "character", "es"),
    "Bitácora Celestial (texto): admite como máximo 50000 caracteres.");
  assert.equal(errorText({ code: "field_out_of_range", path: "edad", rule: "range", limit: [0, 999] }, "character", "es"),
    "Edad: debe estar entre 0 y 999.");
  assert.equal(errorText({ code: "field_out_of_range", path: "estresFisico", rule: "notAboveMaximum", limit: "estresFisicoMax" }, "character", "es"),
    "Estrés Físico: no puede superar su máximo.");
  assert.equal(errorText({ code: "network_error" }, "character", "es"), "No hay conexión con el servidor. Se reintentará solo.");
  assert.equal(errorText({ code: "something_new" }, "character", "es"), "El servidor no aceptó el cambio.");
  for (const text of [errorText({ code: "duplicate_skill", path: "habilidades/x/nombre" }, "character", "es")])
    assert.doesNotMatch(text, /_|\//, "no codes or paths in a message");
});

test("values show as the viewer typed them", () => {
  assert.equal(describeValue("Rastreadora", "es"), "Rastreadora");
  assert.equal(describeValue(3, "es"), "3");
  assert.equal(describeValue(true, "es"), "Sí");
  assert.equal(describeValue(undefined, "es"), "(vacío)");
  assert.equal(describeValue({ nombre: "Patronus", value: "Ciervo" }, "es"), "Patronus");
  assert.equal(describeValue({ cantidad: 2 }, "es"), "una entrada");
});

test("«Reintentar» is offered only where retrying can help", () => {
  assert.ok(retryable("network_error") && retryable("server_error") && retryable("rate_limited"));
  assert.ok(!retryable("field_too_long") && !retryable("forbidden"));
});
