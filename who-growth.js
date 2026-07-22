"use strict";

import { WHO_BMI_LMS } from "./growth-data.js";

export const PEDIATRIC_MONTHS_MAX = 239;
export const WHO_2007_MONTHS_MAX = 228;

export function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ""))) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function calculateCompletedMonths(birthDate, assessmentDate) {
  const birth = birthDate instanceof Date ? birthDate : parseIsoDate(birthDate);
  const assessment = assessmentDate instanceof Date ? assessmentDate : parseIsoDate(assessmentDate);
  if (!birth || !assessment || assessment < birth) return NaN;
  let months = (assessment.getUTCFullYear() - birth.getUTCFullYear()) * 12
    + assessment.getUTCMonth() - birth.getUTCMonth();
  if (assessment.getUTCDate() < birth.getUTCDate()) months -= 1;
  return months;
}

export function formatAge(months) {
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const yearText = `${years} ${years === 1 ? "ano" : "anos"}`;
  const monthText = `${remainder} ${remainder === 1 ? "mês" : "meses"}`;
  return `${yearText} e ${monthText}`;
}

export function getAgeGroup(completedMonths) {
  if (completedMonths <= 60) return "child2006";
  if (completedMonths < 240) return "child2007";
  if (completedMonths < 720) return "adult";
  return "olderAdult";
}

export function getLmsParameters(sex, completedMonths) {
  const group = getAgeGroup(completedMonths);
  if (group !== "child2006" && group !== "child2007") return null;
  const reference = group === "child2006" ? "who2006" : "who2007";
  const referenceMonth = group === "child2007"
    ? Math.min(completedMonths, WHO_2007_MONTHS_MAX)
    : completedMonths;
  const row = WHO_BMI_LMS[sex]?.[reference]?.find(([month]) => month === referenceMonth);
  if (!row) return null;
  return { month: referenceMonth, L: row[1], M: row[2], S: row[3], reference };
}

export function lmsMeasurementAtZ({ L, M, S }, z) {
  return L === 0 ? M * Math.exp(S * z) : M * ((1 + L * S * z) ** (1 / L));
}

export function calculateWhoZScore(bmi, parameters) {
  const { L, M, S } = parameters;
  const raw = L === 0 ? Math.log(bmi / M) / S : (((bmi / M) ** L) - 1) / (L * S);
  if (raw > 3) {
    const sd2 = lmsMeasurementAtZ(parameters, 2);
    const sd3 = lmsMeasurementAtZ(parameters, 3);
    return 3 + (bmi - sd3) / (sd3 - sd2);
  }
  if (raw < -3) {
    const sdNeg2 = lmsMeasurementAtZ(parameters, -2);
    const sdNeg3 = lmsMeasurementAtZ(parameters, -3);
    return -3 + (bmi - sdNeg3) / (sdNeg2 - sdNeg3);
  }
  return raw;
}

export function classifyPediatricZ(z, reference) {
  if (z < -3) return "Magreza acentuada";
  if (z < -2) return "Magreza";
  if (z <= 1) return "Eutrofia";
  if (reference === "who2006") {
    if (z <= 2) return "Risco de sobrepeso";
    if (z <= 3) return "Sobrepeso";
    return "Obesidade";
  }
  if (z <= 2) return "Sobrepeso";
  if (z <= 3) return "Obesidade";
  return "Obesidade grave";
}

export function classifyAdultBmi(bmi) {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso adequado ou eutrofia";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade grau I";
  if (bmi < 40) return "Obesidade grau II";
  return "Obesidade grau III";
}

export function classifyOlderAdultBmi(bmi) {
  if (bmi <= 22) return "Baixo peso";
  if (bmi < 27) return "Peso adequado ou eutrofia";
  return "Sobrepeso";
}

export function assessNutritionalStatus({ bmi, completedMonths, sex, pregnant = false }) {
  if (pregnant) {
    return {
      group: "pregnancy",
      classification: null,
      reference: "Avaliação antropométrica específica da gestação",
      message: "A classificação comum de IMC não é aplicada durante a gestação. Procure acompanhamento pré-natal para avaliação individual."
    };
  }

  const group = getAgeGroup(completedMonths);
  if (group === "child2006" || group === "child2007") {
    const parameters = getLmsParameters(sex, completedMonths);
    if (!parameters) throw new Error("Parâmetros LMS oficiais não encontrados para idade e sexo informados.");
    const zScore = calculateWhoZScore(bmi, parameters);
    return {
      group,
      classification: classifyPediatricZ(zScore, parameters.reference),
      reference: parameters.reference === "who2006" ? "OMS 2006" : "OMS 2007",
      referenceMonth: parameters.month,
      zScore,
      extreme: zScore < -3 || zScore > 3,
      message: "Resultado de triagem informativa. Procure um profissional de saúde para avaliação individual."
    };
  }

  if (group === "adult") {
    return {
      group,
      classification: classifyAdultBmi(bmi),
      reference: "Ministério da Saúde / SISVAN — adultos de 20 a 59 anos",
      message: "Faixa de referência para triagem informativa; não substitui avaliação individual."
    };
  }

  return {
    group,
    classification: classifyOlderAdultBmi(bmi),
    reference: "Ministério da Saúde / SISVAN — pessoas com 60 anos ou mais",
    message: "Pontos de corte específicos para idosos, usados como triagem informativa."
  };
}
