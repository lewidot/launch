// playwright.ts

import { ok, err, Result } from 'neverthrow';
import { ProjectState } from './types';

type OutputHandler = {
	onOutput: (chunk: string) => void;
	onStateChange: (state: ProjectState, exitCode?: number) => void;
};

export class PlaywrightRunner {
	private proc: Bun.ReadableSubprocess | null = null;

	constructor(
		private handler: OutputHandler,
		private projectDir = './pw-project'
	) {}

	get isRunning() {
		return this.proc !== null;
	}

	start(filter?: string): Result<void, string> {
		if (this.proc) {
			console.log('[playwright] already running');
			return err('Already running');
		}

		console.log('[playwright] starting process');
		const args = [
			'npx',
			'playwright',
			'test',
			'--reporter',
			'list',
			...(filter ? ['--grep', filter] : [])
		];
		this.proc = Bun.spawn(args, {
			cwd: this.projectDir,
			stdout: 'pipe',
			stderr: 'pipe'
		});

		console.log('[playwright] spawned pid:', this.proc.pid);
		this.handler.onStateChange('running-start');
		this.handler.onOutput(`${args.join(' ')}\n`);
		this.streamOutput('stdout', this.proc.stdout);
		this.streamOutput('stderr', this.proc.stderr);

		// Await the promise for when the process exits and then cleanup state.
		this.proc.exited.then((code) => {
			console.log('[playwright] exited with code:', code);
			this.handler.onStateChange('idle', code);
			this.proc = null;
		});

		return ok();
	}

	pull() {
		if (this.proc) {
			console.log('[playwright] already running');
			return err('Already running');
		}

		console.log('[playwright] pulling latest changes');
		const args = ['sh', '-c', 'git pull && npm install --include=dev && npx playwright install'];
		this.proc = Bun.spawn(args, {
			cwd: this.projectDir,
			stdout: 'pipe',
			stderr: 'pipe',
			env: { ...process.env, CI: 'true' }
		});

		this.handler.onStateChange('running-pull');
		this.handler.onOutput(`${args.join(' ')}\n`);
		this.streamOutput('stdout', this.proc.stdout);
		this.streamOutput('stderr', this.proc.stderr);

		// Await the promise for when the process exits and then cleanup state.
		this.proc.exited.then((code) => {
			console.log('[playwright] exited with code:', code);
			this.handler.onStateChange('idle', code);
			this.proc = null;
		});

		return ok();
	}

	private async streamOutput(name: string, stream: ReadableStream<Uint8Array>) {
		console.log(`[playwright] starting to read ${name}`);
		const reader = stream.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				console.log(`[playwright] ${name} done`);
				break;
			}
			if (value) {
				const text = decoder.decode(value, { stream: true });
				this.handler.onOutput(text);
			}
		}
	}
}
