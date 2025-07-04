export function formatOutput(message: string): string {
  return `[CodeCheck] ${message}`;
}

export function getTimestamp(): string {
  return new Date().toISOString();
}
