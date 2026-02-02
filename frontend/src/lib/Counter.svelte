<script lang="ts">
	import { client } from './api';

	let status = $state('');
	let loading = $state(false);

	async function startPlaywright() {
		loading = true;
		const res = await client.api.start.$get();

		if (res.ok) {
			const data = await res.json();
			status = data.status;
		} else {
			const error = await res.json();
			status = `Error: ${error.error}`;
		}
		loading = false;
	}

	let count: number = $state(0);
	const increment = () => {
		count += 1;
	};
</script>

<button onclick={startPlaywright} disabled={loading}>
	{loading ? 'Starting...' : 'Start Playwright'}
</button>

{#if status}
	<p>{status}</p>
{/if}

<button onclick={increment}>
	count is {count}
</button>
