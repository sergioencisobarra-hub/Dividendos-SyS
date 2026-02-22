
import { GoogleGenAI, Type } from "@google/genai";
import { Stock, DividendResult, AnalysisSummary } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const analyzeDividends = async (
  month: string,
  year: number,
  portfolio: Stock[]
): Promise<AnalysisSummary> => {
  const portfolioStr = portfolio
    .map((s) => `${s.name} (${s.ticker}) - Acciones: ${s.shares}`)
    .join("\n");

  const prompt = `
    Eres un analista financiero experto en fiscalidad española y mercados internacionales. Tu tarea es generar un informe de dividendos EXTREMADAMENTE PRECISO.

    CONTEXTO TEMPORAL: Mes de ${month} de ${year}.
    
    REGLAS DE VALIDACIÓN DE CALENDARIO:
    1. Solo incluye empresas que tengan una FECHA DE PAGO confirmada o históricamente recurrente en el mes de ${month}.
    2. Ejemplo Crítico: Enagás (ENG) NO paga en enero. Solo paga en julio y diciembre. Si el mes es enero, Enagás NO debe aparecer.
    3. Verifica los calendarios de dividendos de 2024/2025 para cada ticker.

    REGLAS DE CONVERSIÓN DE DIVISA (FX):
    1. Para dividendos en USD o GBP, utiliza el tipo de cambio (EUR/USD o EUR/GBP) correspondiente al DÍA POSTERIOR a la fecha de pago del dividendo.
    2. Indica el tipo de cambio usado en exchangeRate.

    REGLAS FISCALES (Residente en España):
    1. Retención en ORIGEN (originTaxRate): USA (15%), UK (0%), España (19%), Alemania (26.375%).
    2. Retención en ESPAÑA (spanishTaxRate): 19% adicional para extranjeras sobre el bruto en EUR.

    FORMATO DE SALIDA:
    - paymentDate y exDividendDate DEBEN estar en formato AAAA-MM-DD.

    CARTERA A ANALIZAR:
    ${portfolioStr}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          results: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                ticker: { type: Type.STRING },
                exDividendDate: { type: Type.STRING },
                paymentDate: { type: Type.STRING },
                grossDivOriginal: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                exchangeRate: { type: Type.NUMBER },
                grossDivEur: { type: Type.NUMBER },
                totalGrossEur: { type: Type.NUMBER },
                originTaxRate: { type: Type.NUMBER },
                spanishTaxRate: { type: Type.NUMBER },
                netAmountEur: { type: Type.NUMBER },
              },
              required: ["company", "ticker", "exDividendDate", "paymentDate", "grossDivOriginal", "currency", "exchangeRate", "grossDivEur", "totalGrossEur", "originTaxRate", "spanishTaxRate", "netAmountEur"],
            },
          },
          summary: {
            type: Type.OBJECT,
            properties: {
              totalCompanies: { type: Type.NUMBER },
              totalGrossEur: { type: Type.NUMBER },
              totalNetEur: { type: Type.NUMBER },
            },
            required: ["totalCompanies", "totalGrossEur", "totalNetEur"],
          },
        },
        required: ["results", "summary"],
      },
    },
  });

  const parsed = JSON.parse(response.text);
  return {
    results: parsed.results,
    totalCompanies: parsed.summary.totalCompanies,
    totalGrossEur: parsed.summary.totalGrossEur,
    totalNetEur: parsed.summary.totalNetEur,
  };
};
