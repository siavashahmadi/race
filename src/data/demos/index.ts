import frontendEngineer from "./frontend-engineer.json";
import backendPython from "./backend-python.json";
import fullstackAi from "./fullstack-ai.json";
import type { AnalyzeResponse } from "../../types";

export interface DemoScenario {
  title: string;
  jobDescription: string;
  result: AnalyzeResponse;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  frontendEngineer as DemoScenario,
  backendPython as DemoScenario,
  fullstackAi as DemoScenario,
];
