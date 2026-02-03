// sse.ts
export class SSEBroker {
	private clients = new Map<string, WritableStreamDefaultWriter<Uint8Array>>();
	private encoder = new TextEncoder();
	private seq = 0;
	private heartbeatInterval: Timer;

	constructor() {
		this.heartbeatInterval = setInterval(() => {
			this.sendHeartbeat();
		}, 30_000);
	}

	subscribe(): {
		readable: ReadableStream<Uint8Array>;
		unsubscribe: () => void;
	} {
		const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
		const id = String(++this.seq);
		const writer = writable.getWriter();

		this.clients.set(id, writer);
		console.log(`[sse] client ${id} connected (${this.clients.size} total)`);

		return {
			readable,
			unsubscribe: () => {
				this.clients.delete(id);
				writer.close().catch(() => {});
				console.log(`[sse] client ${id} disconnected (${this.clients.size} remaining)`);
			}
		};
	}

	sendEvent(event: string, data: string) {
		// SSE requires each line of data to be prefixed with "data:"
		const lines = data
			.split('\n')
			.map((line) => `data: ${line}`)
			.join('\n');
		const msg = this.encoder.encode(`event: ${event}\n${lines}\n\n`);
		this.broadcast(msg);
	}

	sendHeartbeat() {
		if (this.clients.size === 0) return;
		console.log(`[sse] heartbeat to ${this.clients.size} clients`);
		const msg = this.encoder.encode(`: heartbeat\n\n`);
		this.broadcast(msg);
	}

	private broadcast(msg: Uint8Array) {
		for (const [id, writer] of this.clients) {
			writer.write(msg).catch(() => {
				console.log(`[sse] client ${id} write failed, removing`);
				this.clients.delete(id);
			});
		}
	}
}
