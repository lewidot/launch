// playwright.ts

import { ok, err, Result } from 'neverthrow';

type OutputHandler = {
	onOutput: (chunk: string) => void;
	onStateChange: (state: 'running' | 'idle', exitCode?: number) => void;
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

	start(): Result<void, string> {
		if (this.proc) {
			console.log('[playwright] already running');
			return err('Already running');
		}

		console.log('[playwright] starting process');
		const args = ['npx', 'playwright', 'test', '--reporter', 'list'];
		this.proc = Bun.spawn(args, {
			cwd: this.projectDir,
			stdout: 'pipe',
			stderr: 'pipe'
		});

		console.log('[playwright] spawned pid:', this.proc.pid);
		this.handler.onStateChange('running');
		this.handler.onOutput(args.join(' '));
		this.streamOutput(this.proc.stdout);
		this.streamOutput(this.proc.stderr);

		// Await the promise for when the process exits and then cleanup state.
		this.proc.exited.then((code) => {
			console.log('[playwright] exited with code:', code);
			this.handler.onStateChange('idle', code);
			this.proc = null;
		});

		return ok();
	}

	private async streamOutput(stream: ReadableStream<Uint8Array>) {
		console.log('[playwright] starting to read stdout');
		const reader = stream.getReader();
		const decoder = new TextDecoder();

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				console.log('[playwright] stdout done');
				break;
			}
			if (value) {
				const text = decoder.decode(value, { stream: true });
				this.handler.onOutput(text);
			}
		}
	}
}
