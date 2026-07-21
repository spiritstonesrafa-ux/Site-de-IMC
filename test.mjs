import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateBmi,
  classifyBmi,
  normalizeDecimal,
  normalizeHeight,
  validateFormValues
} from "./script.js";

test("calcula 70 kg e 1,75 m com a fórmula peso / altura²", () => {
  assert.equal(calculateBmi(70, 1.75), 70 / (1.75 ** 2));
  assert.equal(calculateBmi(70, 1.75).toFixed(2), "22.86");
});

test("normaliza vírgula, ponto e centímetros", () => {
  assert.equal(normalizeDecimal("70,5"), 70.5);
  assert.equal(normalizeHeight("1,75"), 1.75);
  assert.equal(normalizeHeight("1.75"), 1.75);
  assert.equal(normalizeHeight("175"), 1.75);
});

test("classifica corretamente os limites exatos", () => {
  assert.equal(classifyBmi(18.5).label, "Peso normal");
  assert.equal(classifyBmi(25).label, "Sobrepeso");
  assert.equal(classifyBmi(30).label, "Obesidade grau I");
  assert.equal(classifyBmi(35).label, "Obesidade grau II");
  assert.equal(classifyBmi(40).label, "Obesidade grau III");
});

test("classifica valores imediatamente abaixo e acima dos limites", () => {
  const epsilon = 0.0001;
  const cases = [
    [18.5 - epsilon, "Abaixo do peso"], [18.5 + epsilon, "Peso normal"],
    [25 - epsilon, "Peso normal"], [25 + epsilon, "Sobrepeso"],
    [30 - epsilon, "Sobrepeso"], [30 + epsilon, "Obesidade grau I"],
    [35 - epsilon, "Obesidade grau I"], [35 + epsilon, "Obesidade grau II"],
    [40 - epsilon, "Obesidade grau II"], [40 + epsilon, "Obesidade grau III"]
  ];
  cases.forEach(([bmi, expected]) => assert.equal(classifyBmi(bmi).label, expected));
});

test("aceita somente adultos de 20 a 120 anos", () => {
  const base = { name: "Ana", weight: "70", height: "1,75" };
  assert.equal(validateFormValues({ ...base, age: "19" }).valid, false);
  assert.equal(validateFormValues({ ...base, age: "20" }).valid, true);
  assert.equal(validateFormValues({ ...base, age: "120" }).valid, true);
  assert.equal(validateFormValues({ ...base, age: "121" }).valid, false);
});

test("recusa campos vazios, zero, negativos e valores não numéricos", () => {
  const empty = validateFormValues({ name: "", age: "", weight: "", height: "" });
  assert.deepEqual(Object.keys(empty.errors).sort(), ["age", "height", "name", "weight"]);

  for (const invalid of ["0", "-1", "abc"]) {
    assert.ok(validateFormValues({ name: "Ana", age: "30", weight: invalid, height: "1,75" }).errors.weight);
    assert.ok(validateFormValues({ name: "Ana", age: "30", weight: "70", height: invalid }).errors.height);
  }
});

test("aplica os limites exatos de peso e altura", () => {
  const base = { name: "Ana", age: "30" };
  assert.equal(validateFormValues({ ...base, weight: "700", height: "0,50" }).valid, true);
  assert.equal(validateFormValues({ ...base, weight: "700,01", height: "1,75" }).valid, false);
  assert.equal(validateFormValues({ ...base, weight: "70", height: "280" }).valid, true);
  assert.equal(validateFormValues({ ...base, weight: "70", height: "49,9" }).valid, false);
  assert.equal(validateFormValues({ ...base, weight: "70", height: "281" }).valid, false);
});

test("aceita nomes com acentos e caracteres especiais", () => {
  for (const name of ["Álvaro", "João D'Ávila", "Ana-Lúcia", "李 雷"]) {
    assert.equal(validateFormValues({ name, age: "30", weight: "70", height: "175" }).valid, true);
  }
});
