"use strict";

import {
  assessNutritionalStatus,
  calculateCompletedMonths,
  formatAge,
  getAgeGroup,
  parseIsoDate
} from "./who-growth.js";

export const LIMITS = Object.freeze({
  weightMin: 0.3,
  weightMax: 700,
  heightMinMeters: 0.25,
  heightMaxMeters: 2.8,
  centimetersThreshold: 3
});

export function normalizeDecimal(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  return normalized === "" ? NaN : Number(normalized);
}

export function normalizeHeight(value) {
  const numericHeight = normalizeDecimal(value);
  if (!Number.isFinite(numericHeight)) return NaN;
  return numericHeight > LIMITS.centimetersThreshold ? numericHeight / 100 : numericHeight;
}

export function calculateBmi(weight, heightMeters) {
  return weight / (heightMeters ** 2);
}

export function adjustPediatricHeight(height, completedMonths, measurement) {
  if (completedMonths < 24 && measurement === "standing") return height + 0.007;
  if (completedMonths >= 24 && completedMonths <= 60 && measurement === "lying") return height - 0.007;
  return height;
}

export function validateFormValues(values) {
  const name = String(values.name ?? "").trim();
  const birthDate = parseIsoDate(values.birthDate);
  const assessmentDate = parseIsoDate(values.assessmentDate);
  const weight = normalizeDecimal(values.weight);
  const rawHeight = normalizeHeight(values.height);
  const sex = String(values.sex ?? "");
  const measurement = String(values.measurement ?? "");
  const pregnant = Boolean(values.pregnant);
  const premature = Boolean(values.premature);
  const errors = {};
  const today = new Date();
  const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

  if (!birthDate) errors.birthDate = "Informe uma data de nascimento válida.";
  if (!assessmentDate) errors.assessmentDate = "Informe uma data de avaliação válida.";
  if (birthDate && birthDate > todayUtc) errors.birthDate = "A data de nascimento não pode estar no futuro.";
  if (assessmentDate && assessmentDate > todayUtc) errors.assessmentDate = "A data da avaliação não pode estar no futuro.";

  let completedMonths = NaN;
  if (birthDate && assessmentDate) {
    completedMonths = calculateCompletedMonths(birthDate, assessmentDate);
    if (assessmentDate < birthDate) errors.assessmentDate = "A avaliação deve ocorrer na data de nascimento ou depois dela.";
  }

  if (!Number.isFinite(weight) || weight < LIMITS.weightMin || weight > LIMITS.weightMax) {
    errors.weight = "Informe um peso plausível entre 0,3 e 700 kg.";
  }
  if (!Number.isFinite(rawHeight) || rawHeight < LIMITS.heightMinMeters || rawHeight > LIMITS.heightMaxMeters) {
    errors.height = "Informe altura ou comprimento entre 0,25 e 2,80 m (25 a 280 cm).";
  }
  if (Number.isFinite(completedMonths) && completedMonths < 240 && !["female", "male"].includes(sex)) {
    errors.sex = "Selecione o sexo de referência da curva pediátrica da OMS.";
  }
  if (Number.isFinite(completedMonths) && completedMonths <= 60 && !["lying", "standing"].includes(measurement)) {
    errors.measurement = "Informe se a medida foi feita deitada ou em pé.";
  }

  const adjustedHeight = Number.isFinite(rawHeight)
    ? adjustPediatricHeight(rawHeight, completedMonths, measurement)
    : rawHeight;

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { name, birthDate, assessmentDate, completedMonths, weight, height: adjustedHeight, rawHeight, sex, measurement, pregnant, premature }
  };
}

function todayLocalIso() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function resultTheme(classification) {
  if (!classification) return { color: "#6575d9", soft: "rgba(101,117,217,.13)", chip: "Avaliação específica" };
  if (/acentuada|grave|grau III/i.test(classification)) return { color: "#a92f43", soft: "rgba(169,47,67,.14)", chip: "Atenção especial" };
  if (/magreza|baixo|abaixo/i.test(classification)) return { color: "#366fae", soft: "rgba(54,111,174,.13)", chip: "Atenção" };
  if (/eutrofia|adequado/i.test(classification)) return { color: "#187a55", soft: "rgba(24,122,85,.13)", chip: "Faixa de referência" };
  if (/risco/i.test(classification)) return { color: "#856400", soft: "rgba(133,100,0,.14)", chip: "Acompanhamento" };
  return { color: "#a64b16", soft: "rgba(166,75,22,.14)", chip: "Atenção" };
}

function initializeApp() {
  const form = document.getElementById("bmi-form");
  if (!form) return;

  const fields = {
    name: document.getElementById("name"),
    birthDate: document.getElementById("birthDate"),
    assessmentDate: document.getElementById("assessmentDate"),
    sex: document.getElementById("sex"),
    measurement: document.getElementById("measurement"),
    weight: document.getElementById("weight"),
    height: document.getElementById("height")
  };
  const pregnant = document.getElementById("pregnant");
  const premature = document.getElementById("premature");
  const clearButton = document.getElementById("clear-btn");
  const idleState = document.getElementById("idle-state");
  const resultCard = document.getElementById("result-card");
  const formAlert = document.getElementById("form-alert");
  const pediatricFields = document.getElementById("pediatric-fields");

  const result = {
    summary: document.getElementById("result-summary"),
    greeting: document.getElementById("result-greeting"),
    value: document.getElementById("bmi-value"),
    classification: document.getElementById("result-classification"),
    message: document.getElementById("result-message"),
    chip: document.getElementById("chip-text"),
    age: document.getElementById("result-age"),
    z: document.getElementById("result-z"),
    reference: document.getElementById("result-reference"),
    notice: document.getElementById("result-notice")
  };

  fields.assessmentDate.value = todayLocalIso();

  function readValues() {
    return {
      ...Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value])),
      pregnant: pregnant.checked,
      premature: premature.checked
    };
  }

  function setFieldError(fieldName, message) {
    const input = fields[fieldName];
    if (!input) return;
    const hasError = Boolean(message);
    input.closest(".field").classList.toggle("invalid", hasError);
    document.getElementById(`${fieldName}-error`).textContent = message;
    input.setAttribute("aria-invalid", String(hasError));
  }

  function clearErrors() {
    Object.keys(fields).forEach((fieldName) => setFieldError(fieldName, ""));
    formAlert.classList.remove("show");
    formAlert.textContent = "";
  }

  function updateAgeDependentFields() {
    const birth = parseIsoDate(fields.birthDate.value);
    const assessment = parseIsoDate(fields.assessmentDate.value);
    const months = birth && assessment ? calculateCompletedMonths(birth, assessment) : NaN;
    const pediatric = Number.isFinite(months) && months < 240;
    pediatricFields.hidden = !pediatric;
    fields.sex.required = pediatric;
    const youngChild = Number.isFinite(months) && months <= 60;
    fields.measurement.closest(".field").hidden = !youngChild;
    fields.measurement.required = youngChild;
    premature.closest("label").hidden = !(Number.isFinite(months) && months < 24);
  }

  function validateForm() {
    const validation = validateFormValues(readValues());
    clearErrors();
    Object.entries(validation.errors).forEach(([fieldName, message]) => setFieldError(fieldName, message));
    if (!validation.valid) {
      formAlert.textContent = "Revise os campos destacados antes de calcular.";
      formAlert.classList.add("show");
      form.querySelector("[aria-invalid='true']")?.focus();
      return null;
    }
    return validation.data;
  }

  function showResult(data) {
    const bmi = calculateBmi(data.weight, data.height);
    const assessment = assessNutritionalStatus({
      bmi,
      completedMonths: data.completedMonths,
      sex: data.sex,
      pregnant: data.pregnant
    });
    const formattedBmi = bmi.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const theme = resultTheme(assessment.classification);
    const greetingName = data.name ? `${data.name}, o` : "O";
    const ageText = formatAge(data.completedMonths);

    document.documentElement.style.setProperty("--result", theme.color);
    document.documentElement.style.setProperty("--result-soft", theme.soft);
    result.greeting.textContent = `${greetingName} resultado de triagem é`;
    result.value.textContent = formattedBmi;
    result.classification.textContent = assessment.classification ?? "Gestação requer avaliação específica";
    result.message.textContent = assessment.message;
    result.chip.textContent = theme.chip;
    result.age.textContent = ageText;
    result.reference.textContent = assessment.reference;
    result.z.textContent = Number.isFinite(assessment.zScore)
      ? assessment.zScore.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "Não se aplica";

    const notices = [];
    if (assessment.group.startsWith("child")) notices.push("Resultado pediátrico informativo: não representa diagnóstico.");
    if (assessment.extreme) notices.push("Resultado pediátrico extremo: procure pediatra ou nutricionista para avaliação prioritária.");
    if (data.premature && data.completedMonths < 24) notices.push("Em crianças prematuras com menos de 2 anos, pode ser necessária idade corrigida e avaliação profissional.");
    if (assessment.referenceMonth === 228 && data.completedMonths > 228) notices.push("Foram mantidos os parâmetros da OMS referentes aos 19 anos completos, conforme orientação do SISVAN.");
    result.notice.textContent = notices.join(" ");
    result.notice.hidden = notices.length === 0;
    result.summary.textContent = `IMC ${formattedBmi}. ${result.classification.textContent}. ${assessment.reference}.`;

    idleState.hidden = true;
    resultCard.hidden = false;
    resultCard.focus({ preventScroll: true });
    if (window.matchMedia("(max-width: 850px)").matches) {
      requestAnimationFrame(() => resultCard.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateAgeDependentFields();
    try {
      const data = validateForm();
      if (data) showResult(data);
    } catch (error) {
      console.error("Falha ao calcular o resultado", error);
      formAlert.textContent = "Não foi possível calcular o resultado. Revise os dados e tente novamente.";
      formAlert.classList.add("show");
      formAlert.focus();
    }
  });

  clearButton.addEventListener("click", () => {
    form.reset();
    fields.assessmentDate.value = todayLocalIso();
    clearErrors();
    resultCard.hidden = true;
    idleState.hidden = false;
    result.summary.textContent = "";
    updateAgeDependentFields();
    fields.name.focus();
  });

  [fields.birthDate, fields.assessmentDate].forEach((input) => {
    input.addEventListener("input", updateAgeDependentFields);
    input.addEventListener("change", updateAgeDependentFields);
  });
  Object.entries(fields).forEach(([fieldName, input]) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") !== "true") return;
      const validation = validateFormValues(readValues());
      setFieldError(fieldName, validation.errors[fieldName] ?? "");
    });
  });

  document.querySelectorAll("svg[aria-hidden='true']").forEach((svg) => svg.setAttribute("focusable", "false"));
  document.getElementById("year").textContent = String(new Date().getFullYear());
  updateAgeDependentFields();
}

if (typeof document !== "undefined") initializeApp();
