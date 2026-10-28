// Read-only launch diagnostic. No environment variables or credentials are logged.
const { spawn, fork } = require('node:child_process');
const path = require('node:path');

function probe(name, launch) {
  return new Promise(resolve => {
    let child, timer, settled = false;
    const finish = result => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.log(JSON.stringify({ test: name, executable: process.execPath, ...result }));
      if (!result.ok) process.exitCode = 1;
      resolve();
    };
    try {
      child = launch();
      child.stdout?.resume();
      child.stderr?.resume();
      child.once('error', error => finish({ ok: false, code: error.code, syscall: error.syscall }));
      child.once('exit', code => finish({ ok: code === 0, exitCode: code }));
      timer = setTimeout(() => { child.kill(); finish({ ok: false, error: 'Timed out after 5 seconds' }); }, 5000);
    } catch (error) {
      finish({ ok: false, code: error.code, syscall: error.syscall });
    }
  });
}

(async () => {
  for (const stdio of ['pipe', 'inherit', 'ignore']) {
    await probe('spawn with ' + stdio, () => spawn(process.execPath, ['--version'], { stdio, windowsHide: true }));
  }
  await probe('fork with pipes and IPC', () => fork(path.join(__dirname, 'worker-fixture.cjs'), [], {
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true,
  }));
})();
