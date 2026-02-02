// playwright.ts
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

	start(): { ok: true } | { ok: false; error: string } {
		if (this.proc) {
			console.log('[playwright] already running');
			return { ok: false, error: 'Already running' };
		}

		console.log('[playwright] starting process');

		this.proc = Bun.spawn(['npx', 'playwright', 'test', '--reporter', 'list'], {
			cwd: this.projectDir,
			stdout: 'pipe'
		});

		console.log('[playwright] spawned pid:', this.proc.pid);

		this.handler.onStateChange('running');
		this.streamOutput(this.proc.stdout);

		// Await the promise for when the process exits and then cleanup state.
		this.proc.exited.then((code) => {
			console.log('[playwright] exited with code:', code);
			this.handler.onStateChange('idle', code);
			this.proc = null;
		});

		return { ok: true };
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
