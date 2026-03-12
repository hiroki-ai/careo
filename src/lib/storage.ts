import { Company, ES, Interview } from "@/types";
import { dummyCompanies, dummyEsList, dummyInterviews } from "@/data/dummy";

const KEYS = {
  companies: "careo_companies",
  esList: "careo_es_list",
  interviews: "careo_interviews",
} as const;

function load<T>(key: string, fallback: T[]): T[] {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
  return JSON.parse(raw) as T[];
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Companies
export function getCompanies(): Company[] {
  return load<Company>(KEYS.companies, dummyCompanies);
}
export function saveCompanies(companies: Company[]): void {
  save(KEYS.companies, companies);
}

// ES
export function getEsList(): ES[] {
  return load<ES>(KEYS.esList, dummyEsList);
}
export function saveEsList(esList: ES[]): void {
  save(KEYS.esList, esList);
}

// Interviews
export function getInterviews(): Interview[] {
  return load<Interview>(KEYS.interviews, dummyInterviews);
}
export function saveInterviews(interviews: Interview[]): void {
  save(KEYS.interviews, interviews);
}

export function resetAllData(): void {
  saveCompanies(dummyCompanies);
  saveEsList(dummyEsList);
  saveInterviews(dummyInterviews);
}
