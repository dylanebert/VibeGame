const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args: string[]) => {
  if (
    args[0]?.includes &&
    args[0].includes(
      'using deprecated parameters for the initialization function'
    )
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

console.error = (...args: string[]) => {
  if (
    args[0]?.includes &&
    args[0].includes(
      'using deprecated parameters for the initialization function'
    )
  ) {
    return;
  }
  originalError.apply(console, args);
};
