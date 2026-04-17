export function formatCarSubtitle(year: number, model: string): string {
  const match = model.match(/^(.*?)\s*\((\d{4})\)\s*$/);
  if (match && Number(match[2]) === year) {
    return `${year} ${match[1]}`;
  }
  return `${year} ${model}`;
}
