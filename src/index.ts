// index.ts
import { Hono } from 'hono';
import { SSEBroker } from './sse';
import { PlaywrightRunner } from './playwright';

const sseBroker = new SSEBroker();

const runner = new PlaywrightRunner({
	onOutput: (chunk) => sseBroker.sendEvent('output', chunk),
	onStateChange: (state, code) => sseBroker.sendEvent('status', JSON.stringify({ state, code }))
});

const app = new Hono()
	.get('/events', (c) => {
		console.log('[http] GET /events');
		const { readable, unsubscribe } = sseBroker.subscribe();

		c.req.raw.signal.onabort = unsubscribe;

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache'
			}
		});
	})
	.get('/start', (c) => {
		console.log('[http] GET /start');
		const result = runner.start();
		if (!result.ok) {
			console.log('[http] start failed:', result.error);
			return c.json({ error: result.error }, 409);
		}
		console.log('[http] start ok');
		return c.json({ status: 'started' });
	});

export default {
	port: 3000,
	idleTimeout: 60,
	fetch: app.fetch
};
