import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { WHO_BMI_LMS } from "./growth-data.js";
import {
  assessNutritionalStatus,
  calculateCompletedMonths,
  calculateWhoZScore,
  classifyAdultBmi,
  classifyOlderAdultBmi,
  classifyPediatricZ,
  getAgeGroup,
  getLmsParameters,
  lmsMeasurementAtZ,
  parseIsoDate
} from "./who-growth.js";
import {
  adjustPediatricHeight,
  calculateBmi,
  normalizeDecimal,
  normalizeHeight,
  validateFormValues
} from "./script.js";

test("calcula IMC e normaliza vírgula, ponto, metros e centímetros", () => {
  assert.equal(calculateBmi(70, 1.75).toFixed(2), "22.86");
  assert.equal(normalizeDecimal("70,5"), 70.5);
  assert.equal(normalizeHeight("1,75"), 1.75);
  assert.equal(normalizeHeight("175"), 1.75);
});

test("calcula idade em meses completos sem arredondar para anos", () => {
  assert.equal(calculateCompletedMonths("2020-01-15", "2025-01-14"), 59);
  assert.equal(calculateCompletedMonths("2020-01-15", "2025-01-15"), 60);
  assert.equal(calculateCompletedMonths("2020-01-31", "2020-02-29"), 0);
  assert.equal(calculateCompletedMonths("2020-01-31", "2020-03-31"), 2);
});

test("muda corretamente as referências em 60/61 meses e 19a11m/20a", () => {
  assert.equal(getAgeGroup(60), "child2006");
  assert.equal(getAgeGroup(61), "child2007");
  assert.equal(getAgeGroup(239), "child2007");
  assert.equal(getAgeGroup(240), "adult");
});

test("muda de adulto para idoso em 59a11m/60a", () => {
  assert.equal(getAgeGroup(719), "adult");
  assert.equal(getAgeGroup(720), "olderAdult");
});

test("tabelas oficiais estão completas para ambos os sexos", () => {
  for (const sex of ["female", "male"]) {
    assert.equal(WHO_BMI_LMS[sex].who2006.length, 61);
    assert.equal(WHO_BMI_LMS[sex].who2006[0][0], 0);
    assert.equal(WHO_BMI_LMS[sex].who2006.at(-1)[0], 60);
    assert.equal(WHO_BMI_LMS[sex].who2007.length, 168);
    assert.equal(WHO_BMI_LMS[sex].who2007[0][0], 61);
    assert.equal(WHO_BMI_LMS[sex].who2007.at(-1)[0], 228);
  }
});

test("curvas feminina e masculina usam parâmetros diferentes", () => {
  assert.notDeepEqual(getLmsParameters("female", 61), getLmsParameters("male", 61));
  assert.notDeepEqual(getLmsParameters("female", 120), getLmsParameters("male", 120));
});

test("usa os parâmetros de 228 meses dos 19a1m aos 19a11m", () => {
  const expected = getLmsParameters("female", 228);
  for (let month = 229; month <= 239; month += 1) {
    assert.deepEqual(getLmsParameters("female", month), expected);
  }
});

test("fórmula LMS reproduz escores exatos e limites pediátricos", () => {
  const p = getLmsParameters("female", 120);
  for (const z of [-3, -2, 1, 2, 3]) {
    const bmi = lmsMeasurementAtZ(p, z);
    assert.ok(Math.abs(calculateWhoZScore(bmi, p) - z) < 1e-10);
  }
  assert.equal(classifyPediatricZ(-3, "who2007"), "Magreza");
  assert.equal(classifyPediatricZ(-2, "who2007"), "Eutrofia");
  assert.equal(classifyPediatricZ(1, "who2007"), "Eutrofia");
  assert.equal(classifyPediatricZ(2, "who2007"), "Sobrepeso");
  assert.equal(classifyPediatricZ(3, "who2007"), "Obesidade");
  assert.equal(classifyPediatricZ(1.01, "who2006"), "Risco de sobrepeso");
});

test("aplica o tratamento oficial da OMS além de ±3 escores-z", () => {
  const p = getLmsParameters("male", 132);
  const high = calculateWhoZScore(lmsMeasurementAtZ(p, 3) + (lmsMeasurementAtZ(p, 3) - lmsMeasurementAtZ(p, 2)), p);
  const low = calculateWhoZScore(lmsMeasurementAtZ(p, -3) - (lmsMeasurementAtZ(p, -2) - lmsMeasurementAtZ(p, -3)), p);
  assert.ok(Math.abs(high - 4) < 1e-10);
  assert.ok(Math.abs(low + 4) < 1e-10);
});

test("confere casos conhecidos do documento oficial OMS 2007", () => {
  assert.ok(Math.abs(calculateWhoZScore(30, getLmsParameters("male", 132)) - 3.35) < 0.02);
  assert.ok(Math.abs(calculateWhoZScore(14, getLmsParameters("male", 192)) - (-3.80)) < 0.02);
  assert.ok(Math.abs(calculateWhoZScore(19, getLmsParameters("male", 108)) - 1.47) < 0.02);
});

test("confere medianas oficiais OMS 2006", () => {
  assert.ok(Math.abs(calculateWhoZScore(13.3363, getLmsParameters("female", 0))) < 1e-12);
  assert.ok(Math.abs(calculateWhoZScore(13.4069, getLmsParameters("male", 0))) < 1e-12);
  assert.ok(Math.abs(calculateWhoZScore(15.1916, getLmsParameters("male", 60))) < 1e-12);
});

test("classifica todos os limites adultos", () => {
  const cases = [[18.5, "Peso adequado ou eutrofia"], [25, "Sobrepeso"], [30, "Obesidade grau I"], [35, "Obesidade grau II"], [40, "Obesidade grau III"]];
  for (const [bmi, label] of cases) assert.equal(classifyAdultBmi(bmi), label);
});

test("classifica idosos exatamente em 22 e 27 com SISVAN", () => {
  assert.equal(classifyOlderAdultBmi(22), "Baixo peso");
  assert.equal(classifyOlderAdultBmi(22.01), "Peso adequado ou eutrofia");
  assert.equal(classifyOlderAdultBmi(27), "Sobrepeso");
});

test("menores de 20 e idosos nunca usam as faixas adultas", () => {
  assert.equal(assessNutritionalStatus({ bmi: 24, completedMonths: 239, sex: "female" }).group, "child2007");
  assert.equal(assessNutritionalStatus({ bmi: 30, completedMonths: 720 }).classification, "Sobrepeso");
});

test("gestação não recebe classificação comum de IMC", () => {
  const result = assessNutritionalStatus({ bmi: 24, completedMonths: 360, pregnant: true });
  assert.equal(result.group, "pregnancy");
  assert.equal(result.classification, null);
});

test("valida datas futuras, inválidas e ordem cronológica", () => {
  const base = { name: "", sex: "female", measurement: "standing", weight: "70", height: "175" };
  assert.ok(validateFormValues({ ...base, birthDate: "2999-01-01", assessmentDate: "2999-02-01" }).errors.birthDate);
  assert.ok(validateFormValues({ ...base, birthDate: "2020-02-30", assessmentDate: "2025-01-01" }).errors.birthDate);
  assert.ok(validateFormValues({ ...base, birthDate: "2020-01-02", assessmentDate: "2020-01-01" }).errors.assessmentDate);
});

test("valida peso, altura, sexo pediátrico e método de medição", () => {
  const base = { name: "", birthDate: "2023-01-01", assessmentDate: "2024-01-01", weight: "10", height: "75", sex: "female", measurement: "lying" };
  assert.equal(validateFormValues(base).valid, true);
  assert.ok(validateFormValues({ ...base, weight: "0" }).errors.weight);
  assert.ok(validateFormValues({ ...base, height: "abc" }).errors.height);
  assert.ok(validateFormValues({ ...base, sex: "" }).errors.sex);
  assert.ok(validateFormValues({ ...base, measurement: "" }).errors.measurement);
});

test("aplica conversão OMS de 0,7 cm quando necessária", () => {
  assert.equal(adjustPediatricHeight(0.7, 12, "standing"), 0.707);
  assert.equal(adjustPediatricHeight(1, 36, "lying"), 0.993);
  assert.equal(adjustPediatricHeight(1, 61, "lying"), 1);
});

test("não transmite nem armazena dados pessoais", async () => {
  const source = await readFile(fileURLToPath(new URL("./script.js", import.meta.url)), "utf8");
  for (const forbidden of ["localStorage", "sessionStorage", "fetch(", "XMLHttpRequest", "sendBeacon", "innerHTML"]) {
    assert.equal(source.includes(forbidden), false, `não deve conter ${forbidden}`);
  }
});

test("parser rejeita datas impossíveis", () => {
  assert.equal(parseIsoDate("2024-02-30"), null);
  assert.equal(parseIsoDate("texto"), null);
});
