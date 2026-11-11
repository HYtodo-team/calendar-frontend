import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const suites = ['auth-api', 'auth-session', 'field-feedback', 'home', 'timetable'];
const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });

try {
  await server.listen();
  const appUrl = server.resolvedUrls.local[0];
  for (const suite of suites) {
    console.log(`Running ${suite}`);
    const child = spawn(process.execPath, [`tests/${suite}-browser.mjs`], {
      stdio: 'inherit',
      env: {
        ...process.env,
        APP_URL: appUrl,
        PLAYWRIGHT_CHANNEL: process.env.PLAYWRIGHT_CHANNEL ||
          (process.platform === 'win32' ? 'msedge' : 'chromium'),
      },
    });
    const code = await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', resolve);
    });
    if (code !== 0) {
      process.exitCode = code ?? 1;
      break;
    }
  }
} finally {
  await server.close();
}
