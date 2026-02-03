<script lang="ts">
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { client } from '$lib/api';

	let outputLines = $state<string[]>([]);
	let isRunning = $state(false);

	function connectToSSE() {
		const eventSource = new EventSource('/api/output');

		eventSource.addEventListener('status', (e) => {
			const status = JSON.parse(e.data);
			isRunning = status.state === 'running';
			if (isRunning) {
				outputLines = [];
			}
		});

		eventSource.addEventListener('output', (e) => {
			outputLines = [...outputLines, e.data];
		});

		eventSource.onerror = () => eventSource.close();

		return () => eventSource.close();
	}

	const startTests = createMutation(() => ({
		mutationFn: async () => {
			const res = await client.api.start.$get();
			const data = await res.json();

			if ('error' in data) {
				throw new Error(data.error);
			}
			return data;
		},
		onError: (error) => {
			toast.error(`Cannot run tests: ${error.message}`);
		}
	}));

	$effect(() => {
		return connectToSSE();
	});

	const isBusy = $derived(isRunning || startTests.isPending);
</script>

<div class="space-y-6">
	<Button onclick={() => startTests.mutate()} disabled={isBusy}>
		{#if isBusy}
			<Loader2Icon class="animate-spin" />
			Running...
		{:else}
			Run Tests
		{/if}
	</Button>

	<div class="relative">
		<div class="mb-2 flex items-center justify-between">
			<code class="font-mono text-xs text-muted-foreground/60">{outputLines.length} lines</code>
			<div class="flex items-center gap-2">
				<span class="relative h-1.5 w-1.5 shrink-0">
					{#if isRunning}
						<span class="absolute inset-0 animate-ping rounded-full bg-amber-500 opacity-75"></span>
						<span class="absolute inset-0 rounded-full bg-amber-500"></span>
					{:else}
						<span class="absolute inset-0 rounded-full bg-emerald-500"></span>
					{/if}
				</span>
				<span class="font-mono text-xs text-muted-foreground">
					{isRunning ? 'running' : 'idle'}
				</span>
			</div>
		</div>

		<div class="relative overflow-hidden rounded-lg border">
			<div
				class="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-size-[14px_14px] opacity-50"
			></div>
			<pre
				class="relative h-[500px] overflow-auto p-4 font-mono text-sm leading-relaxed">{#if outputLines.length === 0}<span
						class="text-muted-foreground">$ waiting for test run...</span
					>{:else}{outputLines.join('')}{/if}</pre>
		</div>
	</div>
</div>
