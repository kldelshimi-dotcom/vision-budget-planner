export type MacroGroup = "Necessità" | "Varie" | "Spese annuali" | "Risparmi/Investimenti";

export interface Category {
  name: string;
  group: MacroGroup;
  budget: number;
  color: string;
}

export interface Transaction {
  id: string;
  date: string; // yyyy-mm-dd
  amount: number;
  description: string;
  category: string;
  note?: string;
  highlight?: boolean;
}

export interface Income {
  id: string;
  source: string;
  amount: number;
  date: string;
}

export const CATEGORIES: Category[] = [
  { name: "Auto", group: "Necessità", budget: 442, color: "#ff8a70" },
  { name: "Assicurazione", group: "Necessità", budget: 120, color: "#e85a3f" },
  { name: "Benzina", group: "Necessità", budget: 175, color: "#c0392b" },
  { name: "Alimentazione", group: "Necessità", budget: 224, color: "#a02020" },
  { name: "Capelli", group: "Necessità", budget: 20, color: "#7d1f1f" },
  { name: "Beauty", group: "Varie", budget: 32, color: "#4a7c2a" },
  { name: "Sport", group: "Varie", budget: 92, color: "#6bbf3a" },
  { name: "Lavaggio auto", group: "Varie", budget: 40, color: "#8fd160" },
  { name: "Uscite", group: "Varie", budget: 329.5, color: "#3d8b3d" },
  { name: "Altro", group: "Varie", budget: 25, color: "#2d5f2d" },
  { name: "Abbonamenti", group: "Varie", budget: 58, color: "#1f4a1f" },
  { name: "Salute", group: "Spese annuali", budget: 30, color: "#c9a227" },
  { name: "Vestiti", group: "Spese annuali", budget: 40, color: "#8b6914" },
  { name: "Telefono", group: "Spese annuali", budget: 5, color: "#5c4a1f" },
  { name: "Risparmi liquidi", group: "Risparmi/Investimenti", budget: 88, color: "#3498db" },
  { name: "investimenti ETF", group: "Risparmi/Investimenti", budget: 30, color: "#2874a6" },
  { name: "Fondo pensione", group: "Risparmi/Investimenti", budget: 16, color: "#1b4f72" },
];

export const SAMPLE_INCOME: Income[] = [
  { id: "i1", source: "Stipendio lavoro", amount: 1766, date: "2026-07-01" },
];

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: "t1", date: "2026-07-01", amount: 42, description: "spesa iperal", category: "Alimentazione" },
  { id: "t2", date: "2026-07-01", amount: 16, description: "Cometa", category: "Fondo pensione" },
  { id: "t3", date: "2026-07-01", amount: 30, description: "Q8 (1,80€/L)", category: "Benzina" },
  { id: "t4", date: "2026-07-01", amount: 442, description: "Assicurazione auto", category: "Auto" },
  { id: "t5", date: "2026-07-01", amount: 5, description: "", category: "Telefono" },
  { id: "t6", date: "2026-07-01", amount: 30, description: "", category: "Salute" },
  { id: "t7", date: "2026-07-01", amount: 40, description: "", category: "Vestiti" },
  { id: "t8", date: "2026-07-01", amount: 23, description: "prodotti beauty", category: "Beauty" },
  { id: "t9", date: "2026-07-01", amount: 32, description: "Piscina", category: "Sport" },
  { id: "t10", date: "2026-07-01", amount: 20, description: "Autolavaggio", category: "Lavaggio auto" },
  { id: "t11", date: "2026-07-02", amount: 10, description: "chiavetta lavoro", category: "Uscite" },
  { id: "t12", date: "2026-07-02", amount: 7, description: "quota torneo mia", category: "Sport" },
  { id: "t13", date: "2026-07-02", amount: 14, description: "Cena con i ragazzi post partita", category: "Uscite", highlight: true },
  { id: "t14", date: "2026-07-03", amount: 10, description: "iliad", category: "Abbonamenti" },
  { id: "t15", date: "2026-07-04", amount: 120, description: "", category: "Assicurazione" },
  { id: "t16", date: "2026-07-04", amount: 20, description: "spesa iperal", category: "Alimentazione" },
  { id: "t17", date: "2026-07-05", amount: 25, description: "Paganoni (1,80€/L)", category: "Benzina" },
  { id: "t18", date: "2026-07-05", amount: 7, description: "calcetto a 5", category: "Sport" },
  { id: "t19", date: "2026-07-05", amount: 29, description: "cena con Gabri", category: "Uscite", highlight: true },
  { id: "t20", date: "2026-07-05", amount: 88, description: "", category: "Risparmi liquidi" },
  { id: "t21", date: "2026-07-05", amount: 16, description: "pranzo con Bea al Mc", category: "Uscite" },
  { id: "t22", date: "2026-07-07", amount: 10, description: "", category: "Capelli" },
  { id: "t23", date: "2026-07-07", amount: 12.5, description: "Dazn", category: "Altro" },
  { id: "t24", date: "2026-07-08", amount: 25, description: "Paganoni", category: "Benzina" },
  { id: "t25", date: "2026-07-08", amount: 18, description: "Cena con ragazzi torneo", category: "Uscite", highlight: true },
  { id: "t26", date: "2026-07-09", amount: 26, description: "pedaggi mese precedente", category: "Uscite" },
  { id: "t27", date: "2026-07-10", amount: 20, description: "pranzo Mc con Bea", category: "Uscite" },
  { id: "t28", date: "2026-07-10", amount: 24, description: "Cena con Ari e bea", category: "Uscite" },
  { id: "t29", date: "2026-07-12", amount: 25, description: "", category: "Benzina" },
  { id: "t30", date: "2026-07-12", amount: 40, description: "lettini lago", category: "Uscite" },
  { id: "t31", date: "2026-07-13", amount: 40, description: "spesa iperal", category: "Alimentazione" },
  { id: "t32", date: "2026-07-15", amount: 20, description: "Paganoni (1,85€/L)", category: "Benzina" },
  { id: "t33", date: "2026-07-15", amount: 24, description: "calcio a 7", category: "Sport" },
];
