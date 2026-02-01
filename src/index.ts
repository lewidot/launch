// index.ts
import { Elysia, status } from 'elysia';
import { SSEBroker } from './sse';
import { PlaywrightRunner } from './playwright';

const sseBroker = new SSEBroker();

const runner = new PlaywrightRunner({
	onOutput: (chunk) => sseBroker.sendEvent('output', chunk),
	onStateChange: (state, code) => sseBroker.sendEvent('status', JSON.stringify({ state, code }))
});

new Elysia()
	.get('/events', ({ request }) => {
		console.log('[http] GET /events');
		const { readable, unsubscribe } = sseBroker.subscribe();
		request.signal.addEventListener('abort', unsubscribe);

		return new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache'
			}
		});
	})
	.get('/start', () => {
		console.log('[http] GET /start');
		const result = runner.start();
		if (!result.ok) {
			console.log('[http] start failed:', result.error);
			return status(409, { error: result.error });
		}
		console.log('[http] start ok');
		return { status: 'started' };
	})
	.listen(3000);

console.log('http://localhost:3000');
