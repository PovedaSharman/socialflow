console.error(`Combined development startup is disabled for workstation safety.

Start only the service needed for the current task in its own terminal:
  pnpm dev:frontend
  pnpm dev:backend
  pnpm dev:orchestrator

Start the browser extension separately with pnpm dev:extension.
Stop each process before starting another on a memory-constrained machine.`);

process.exitCode = 1;
