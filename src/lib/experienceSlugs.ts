/** URL hash slug for an experience category (e.g. "Communal Contrast" → "communal-contrast"). */
export function experienceSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function experiencesPathWithSlug(name: string): string {
  return `/experiences#${experienceSlug(name)}`;
}
