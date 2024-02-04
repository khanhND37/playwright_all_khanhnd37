/*
 * Waits for the given `timeout` in milliseconds.
 */
export function waitTimeout(miliseconds: number): Promise<void> {
  return new Promise(r => {
    setTimeout(() => r(), miliseconds);
  });
}
