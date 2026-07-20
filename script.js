"use strict";

// Guardamos referências aos elementos usados várias vezes para evitar buscas repetidas no HTML.
const form = document.getElementById("bmi-form");
const clearButton = document.getElementById("clear-btn");
const idleState = document.getElementById("idle-state");
const resultCard = document.getElementById("result-card");
const formAlert = document.getElementById("form-alert");

const fields = {
  name: document.getElementById("name"),
  age: document.getElementById("age"),
  weight: document.getElementById("weight"),
  height: document.getElementById("height")
};

const resultElements = {
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

// Cada faixa reúne o limite do IMC e os textos/cores mostrados no resultado.
const ranges = [
  { max: 18.5, label: "Abaixo do peso", short: "Atenção", color: "#4f91df", soft: "rgba(79,145,223,.13)", message: "Seu resultado está abaixo da faixa de referência. Uma orientação profissional pode ajudar a cuidar da sua nutrição." },
  { max: 25, label: "Peso normal", short: "Faixa saudável", color: "#2eaa78", soft: "rgba(46,170,120,.13)", message: "Você está na faixa considerada saudável. Continue cultivando hábitos que fazem bem para você!" },
  { max: 30, label: "Sobrepeso", short: "Atenção", color: "#d9a514", soft: "rgba(217,165,20,.14)", message: "Seu resultado está um pouco acima da faixa de referência. Pequenos hábitos consistentes podem fazer diferença." },
  { max: 35, label: "Obesidade grau I", short: "Cuidado", color: "#eb8438", soft: "rgba(235,132,56,.14)", message: "Vale conversar com um profissional de saúde para receber uma avaliação completa e orientação personalizada." },
  { max: 40, label: "Obesidade grau II", short: "Cuidado", color: "#e56445", soft: "rgba(229,100,69,.14)", message: "Buscar acompanhamento médico ou nutricional é um passo importante para cuidar da sua saúde com segurança." },
  { max: Infinity, label: "Obesidade grau III", short: "Atenção especial", color: "#d94b5b", soft: "rgba(217,75,91,.14)", message: "Recomendamos procurar acompanhamento profissional para uma avaliação cuidadosa e um plano seguro para você." }
];

function parseNumber(value) {
  // Aceita tanto vírgula quanto ponto como separador decimal.
  return Number(String(value).trim().replace(",", "."));
}

function setError(fieldName, message) {
  const input = fields[fieldName];
  input.closest(".field").classList.toggle("invalid", Boolean(message));
  document.getElementById(`${fieldName}-error`).textContent = message;
  input.setAttribute("aria-invalid", Boolean(message));
}

function clearErrors() {
  Object.keys(fields).forEach((key) => setError(key, ""));
  formAlert.classList.remove("show");
  formAlert.textContent = "";
}

function validate() {
  clearErrors();
  const name = fields.name.value.trim();
  const age = parseNumber(fields.age.value);
  const weight = parseNumber(fields.weight.value);
  const rawHeight = parseNumber(fields.height.value);
  let valid = true;

  if (!name) { setError("name", "Conte para nós o seu nome."); valid = false; }
  else if (name.length < 2) { setError("name", "Digite um nome com pelo menos 2 caracteres."); valid = false; }

  if (!fields.age.value.trim()) { setError("age", "Informe sua idade."); valid = false; }
  else if (!Number.isFinite(age) || !Number.isInteger(age) || age <= 0 || age > 120) { setError("age", "Informe uma idade válida entre 1 e 120 anos."); valid = false; }

  if (!fields.weight.value.trim()) { setError("weight", "Informe seu peso."); valid = false; }
  else if (!Number.isFinite(weight) || weight <= 0 || weight > 700) { setError("weight", "Informe um peso válido, maior que zero."); valid = false; }

  if (!fields.height.value.trim()) { setError("height", "Informe sua altura."); valid = false; }
  else if (!Number.isFinite(rawHeight) || rawHeight <= 0) { setError("height", "Informe uma altura válida, maior que zero."); valid = false; }

  // Valores acima de 3 são interpretados como centímetros: 175 se torna 1,75 m.
  const height = rawHeight > 3 ? rawHeight / 100 : rawHeight;
  if (Number.isFinite(height) && (height < 0.5 || height > 2.8)) {
    setError("height", "Use metros (ex.: 1,75) ou centímetros (ex.: 175).");
    valid = false;
  }

  if (!valid) {
    formAlert.textContent = "Revise os campos destacados para calcular seu IMC.";
    formAlert.classList.add("show");
    // Leva o foco ao primeiro erro para facilitar a correção e melhorar a acessibilidade.
    const firstInvalid = form.querySelector("[aria-invalid='true']");
    if (firstInvalid) firstInvalid.focus();
    return null;
  }

  return { name, age, weight, height };
}

function markerPosition(bmi) {
  // Converte a escala de IMC (16 a 42) em porcentagem e mantém o ponto dentro da barra.
  const min = 16;
  const max = 42;
  return Math.min(98, Math.max(2, ((bmi - min) / (max - min)) * 100));
}

function showResult(data) {
  // Fórmula do IMC: peso em quilogramas dividido pela altura em metros ao quadrado.
  const bmi = data.weight / (data.height ** 2);
  // find retorna a primeira faixa cujo limite é maior que o IMC calculado.
  const range = ranges.find((item) => bmi < item.max);

  // As variáveis CSS permitem trocar a cor do cartão sem criar uma classe para cada faixa.
  document.documentElement.style.setProperty("--result", range.color);
  document.documentElement.style.setProperty("--result-soft", range.soft);
  resultElements.greeting.textContent = `Tudo certo, ${data.name}! Seu IMC é`;
  resultElements.value.textContent = bmi.toFixed(2).replace(".", ",");
  resultElements.classification.textContent = range.label;
  resultElements.message.textContent = range.message;
  resultElements.chip.textContent = range.short;
  resultElements.age.textContent = data.age;
  resultElements.weight.textContent = data.weight.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
  resultElements.height.textContent = data.height.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  idleState.hidden = true;
  resultCard.hidden = false;
  // Espera o cartão aparecer antes de mover o marcador, permitindo que a transição seja animada.
  requestAnimationFrame(() => { resultElements.marker.style.left = `${markerPosition(bmi)}%`; });

  if (window.innerWidth < 851) {
    document.getElementById("insight-panel").scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

form.addEventListener("submit", (event) => {
  // Impede o recarregamento padrão do formulário para exibir o resultado na mesma página.
  event.preventDefault();
  const data = validate();
  if (data) showResult(data);
});

clearButton.addEventListener("click", () => {
  form.reset();
  clearErrors();
  resultCard.hidden = true;
  idleState.hidden = false;
  resultElements.marker.style.left = "0";
  fields.name.focus();
});

Object.entries(fields).forEach(([key, input]) => {
  // Assim que o usuário corrige um campo marcado, removemos seu aviso visual.
  input.addEventListener("input", () => {
    if (input.closest(".field").classList.contains("invalid")) setError(key, "");
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
