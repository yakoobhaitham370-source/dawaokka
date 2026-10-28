// Use installed Edge on Windows without downloads or machine-wide installation.
// Other platforms retain Playwright's bundled Chromium default.
export const browserOptions = {
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? {}
    : { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : undefined) }),
  launchOptions: {
    chromiumSandbox: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {}),
  },
};
