"use strict";

export const LIMITS = Object.freeze({
  nameMinLength: 2,
  ageMin: 20,
  ageMax: 120,
  weightMinExclusive: 0,
  weightMax: 700,
  heightMinMeters: 0.5,
  heightMaxMeters: 2.8,
  centimetersThreshold: 3
});

export const BMI_RANGES = Object.freeze([
  { maxExclusive: 18.5, label: "Abaixo do peso", short: "Atenção", color: "#366fae", soft: "rgba(54,111,174,.13)", message: "Seu resultado está abaixo da faixa de referência. Uma orientação profissional pode ajudar a cuidar da sua nutrição." },
  { maxExclusive: 25, label: "Peso normal", short: "Faixa saudável", color: "#187a55", soft: "rgba(24,122,85,.13)", message: "Você está na faixa considerada saudável. Continue cultivando hábitos que fazem bem para você!" },
  { maxExclusive: 30, label: "Sobrepeso", short: "Atenção", color: "#856400", soft: "rgba(133,100,0,.14)", message: "Seu resultado está um pouco acima da faixa de referência. Pequenos hábitos consistentes podem fazer diferença." },
  { maxExclusive: 35, label: "Obesidade grau I", short: "Cuidado", color: "#a64b16", soft: "rgba(166,75,22,.14)", message: "Vale conversar com um profissional de saúde para receber uma avaliação completa e orientação personalizada." },
  { maxExclusive: 40, label: "Obesidade grau II", short: "Cuidado", color: "#a33d27", soft: "rgba(163,61,39,.14)", message: "Buscar acompanhamento médico ou nutricional é um passo importante para cuidar da sua saúde com segurança." },
  { maxExclusive: Infinity, label: "Obesidade grau III", short: "Atenção especial", color: "#a92f43", soft: "rgba(169,47,67,.14)", message: "Recomendamos procurar acompanhamento profissional para uma avaliação cuidadosa e um plano seguro para você." }
]);

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

export function classifyBmi(bmi) {
  return BMI_RANGES.find((range) => bmi < range.maxExclusive);
}

export function validateFormValues(values) {
  const name = String(values.name ?? "").trim();
  const age = normalizeDecimal(values.age);
  const weight = normalizeDecimal(values.weight);
  const height = normalizeHeight(values.height);
  const errors = {};

  if (name.length < LIMITS.nameMinLength) {
    errors.name = "Informe seu nome com pelo menos 2 caracteres.";
  }

  if (!Number.isInteger(age) || age < LIMITS.ageMin || age > LIMITS.ageMax) {
    errors.age = "Informe uma idade inteira entre 20 e 120 anos.";
  }

  if (!Number.isFinite(weight) || weight <= LIMITS.weightMinExclusive || weight > LIMITS.weightMax) {
    errors.weight = "Informe um peso maior que 0 e de no máximo 700 kg.";
  }

  if (!Number.isFinite(height) || height < LIMITS.heightMinMeters || height > LIMITS.heightMaxMeters) {
    errors.height = "Informe uma altura entre 0,50 e 2,80 m (50 a 280 cm).";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { name, age, weight, height }
  };
}

export function markerPosition(bmi) {
  const gaugeMin = 16;
  const gaugeMax = 42;
  return Math.min(98, Math.max(2, ((bmi - gaugeMin) / (gaugeMax - gaugeMin)) * 100));
}

function initializeApp() {
  const form = document.getElementById("bmi-form");
  if (!form) return;

  const clearButton = document.getElementById("clear-btn");
  const idleState = document.getElementById("idle-state");
  const resultCard = document.getElementById("result-card");
  const formAlert = document.getElementById("form-alert");
  const insightPanel = document.getElementById("insight-panel");
  const gauge = document.getElementById("gauge");

  const fields = {
    name: document.getElementById("name"),
    age: document.getElementById("age"),
    weight: document.getElementById("weight"),
    height: document.getElementById("height")
  };

  const resultElements = {
    summary: document.getElementById("result-summary"),
    greeting: document.getElementById("result-greeting"),
    value: document.getElementById("bmi-value"),
    classification: document.getElementById("result-classification"),
    message: document.getElementById("result-message"),
    chip: document.getElementById("chip-text"),
    marker: document.getElementById("gauge-marker"),
    age: document.getElementById("meta-age"),
    weight: document.getElementById("meta-weight"),
    height: document.getElementById("meta-height")
  };

  function readValues() {
    return Object.fromEntries(Object.entries(fields).map(([name, input]) => [name, input.value]));
  }

  function setFieldError(fieldName, message) {
    const input = fields[fieldName];
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

  function validateForm() {
    const validation = validateFormValues(readValues());
    clearErrors();
    Object.entries(validation.errors).forEach(([fieldName, message]) => setFieldError(fieldName, message));

    if (!validation.valid) {
      formAlert.textContent = "Revise os campos destacados. Cada mensagem informa os limites aceitos.";
      formAlert.classList.add("show");
      form.querySelector("[aria-invalid='true']")?.focus();
      return null;
    }

    return validation.data;
  }

  function showResult(data) {
    const bmi = calculateBmi(data.weight, data.height);
    const range = classifyBmi(bmi);
    const formattedBmi = bmi.toFixed(2).replace(".", ",");

    document.documentElement.style.setProperty("--result", range.color);
    document.documentElement.style.setProperty("--result-soft", range.soft);
    resultElements.greeting.textContent = `Tudo certo, ${data.name}! Seu IMC é`;
    resultElements.value.textContent = formattedBmi;
    resultElements.classification.textContent = range.label;
    resultElements.message.textContent = range.message;
    resultElements.chip.textContent = range.short;
    resultElements.age.textContent = String(data.age);
    resultElements.weight.textContent = data.weight.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
    resultElements.height.textContent = data.height.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    resultElements.summary.textContent = `${data.name}, seu IMC é ${formattedBmi}. Classificação: ${range.label}.`;
    gauge.setAttribute("aria-label", `Indicador da faixa de IMC: ${range.label}`);

    idleState.hidden = true;
    resultCard.hidden = false;
    requestAnimationFrame(() => {
      resultElements.marker.style.left = `${markerPosition(bmi)}%`;
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = validateForm();
    if (data) showResult(data);
  });

  clearButton.addEventListener("click", () => {
    form.reset();
    clearErrors();
    resultCard.hidden = true;
    idleState.hidden = false;
    resultElements.summary.textContent = "";
    resultElements.marker.style.left = "0";
    gauge.setAttribute("aria-label", "Indicador visual da faixa de IMC, sem resultado calculado");
    fields.name.focus();
  });

  Object.entries(fields).forEach(([fieldName, input]) => {
    input.addEventListener("input", () => {
      if (input.getAttribute("aria-invalid") !== "true") return;
      const validation = validateFormValues(readValues());
      setFieldError(fieldName, validation.errors[fieldName] ?? "");
      if (!form.querySelector("[aria-invalid='true']")) {
        formAlert.classList.remove("show");
        formAlert.textContent = "";
      }
    });
  });

  document.querySelectorAll("svg[aria-hidden='true']").forEach((svg) => svg.setAttribute("focusable", "false"));
  document.getElementById("year").textContent = String(new Date().getFullYear());
  insightPanel.setAttribute("aria-label", "Resultado da calculadora de IMC");
}

if (typeof document !== "undefined") initializeApp();
