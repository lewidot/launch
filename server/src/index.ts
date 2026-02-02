// index.ts
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { SSEBroker } from './sse';
import { PlaywrightRunner } from './playwright';

const sseBroker = new SSEBroker();

const runner = new PlaywrightRunner({
	onOutput: (chunk) => sseBroker.sendEvent('output', chunk),
	onStateChange: (state, code) => sseBroker.sendEvent('status', JSON.stringify({ state, code }))
});

const app = new Hono()
	.use(logger())
	.get('/api/output', (c) => {
		const { readable, unsubscribe } = sseBroker.subscribe();

		c.req.raw.signal.onabort = unsubscribe;

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache'
			}
		});
	})
	.get('/api/start', (c) => {
		const result = runner.start();
		if (!result.ok) {
			return c.json({ error: result.error }, 409);
		}
		return c.json({ status: 'started' });
	});

export default {
	port: 3000,
	idleTimeout: 60,
	fetch: app.fetch
};
