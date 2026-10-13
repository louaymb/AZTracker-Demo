import type { Application, ApplicationResearch } from "@/types";
import { buildResearch } from "./fixtures";

export function buildResearchFixture(
  application: Application,
): ApplicationResearch {
  return buildResearch(application);
}
