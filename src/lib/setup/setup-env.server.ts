/** Overrides temporários durante o POST /setup (sem AsyncLocalStorage — compatível com bundle). */
let temporaryEnv: Record<string, string> | null = null;

export function withSetupEnv<T>(vars: Record<string, string>, fn: () => T): T {
  const prev = temporaryEnv;
  temporaryEnv = { ...prev, ...vars };
  try {
    return fn();
  } finally {
    temporaryEnv = prev;
  }
}

export async function withSetupEnvAsync<T>(
  vars: Record<string, string>,
  fn: () => Promise<T>,
): Promise<T> {
  const prev = temporaryEnv;
  temporaryEnv = { ...prev, ...vars };
  try {
    return await fn();
  } finally {
    temporaryEnv = prev;
  }
}

export function getSetupEnvOverride(name: string): string | undefined {
  return temporaryEnv?.[name]?.trim();
}
