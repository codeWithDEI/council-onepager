import { validateBrief, type Brief } from './brief';

export const MAX_FILE_BYTES = 256 * 1024;

export function parseBrief(text: string): Brief {
  if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES)
    throw new Error('Die Datei ist größer als 256 KB.');
  return validateBrief(JSON.parse(text));
}

export function serializeBrief(brief: Brief): string {
  return JSON.stringify(validateBrief(brief), null, 2) + '\n';
}

export function briefFilename(brief: Brief): string {
  return `council-onepager-${brief.id}.json`;
}

export function downloadBrief(brief: Brief): void {
  const blob = new Blob([serializeBrief(brief)], {
    type: 'application/json;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = briefFilename(brief);
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
