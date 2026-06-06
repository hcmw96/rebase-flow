/** June 2-week unlimited communal contrast pass — keep in sync with contrastPassOffer.ts */
export const JUNE_CONTRAST_PASS_NAME = "Unlimited 2 Week Contrast Pass";
export const JUNE_CONTRAST_PASS_PATTERN = /unlimited\s*2\s*week\s*contrast\s*pass/i;

export function isJuneContrastPassName(name: string | null | undefined): boolean {
  if (!name?.trim()) return false;
  return name.trim() === JUNE_CONTRAST_PASS_NAME || JUNE_CONTRAST_PASS_PATTERN.test(name);
}

type NamedService = { Id?: number; Name?: string };

/** Prefer the June unlimited pass when multiple contrast credits exist. */
export function pickJuneContrastPassServiceId(services: NamedService[]): number | null {
  const june = services.find((s) => isJuneContrastPassName(s.Name));
  if (june?.Id != null) return Number(june.Id);
  return null;
}
