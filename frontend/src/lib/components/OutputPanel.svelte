<script lang="ts">
	type Props = {
		status: 'idle' | 'running-start' | 'running-pull';
		isBusy: boolean;
	};

	let { status = $bindable(), isBusy }: Props = $props();

	let outputLines = $state<string[]>([]);

	function connectToSSE() {
		const eventSource = new EventSource('/api/output');

		eventSource.addEventListener('status', (e) => {
			const data = JSON.parse(e.data);
			status = data.state;
			if (status !== 'idle') {
				outputLines = [];
			}
		});

		eventSource.addEventListener('output', (e) => {
			outputLines = [...outputLines, e.data];
		});

		eventSource.onerror = () => eventSource.close();

		return () => eventSource.close();
	}

	$effect(() => {
		return connectToSSE();
	});
</script>

<div class="relative flex-1 pt-5">
	<div class="mb-2 flex items-center justify-between">
		<code class="font-mono text-xs text-muted-foreground/60">{outputLines.length} lines</code>
		<div class="flex items-center gap-2">
			<span class="relative h-1.5 w-1.5 shrink-0">
				{#if isBusy}
					<span class="absolute inset-0 animate-ping rounded-full bg-amber-500 opacity-75"></span>
					<span class="absolute inset-0 rounded-full bg-amber-500"></span>
				{:else}
					<span class="absolute inset-0 rounded-full bg-emerald-500"></span>
				{/if}
			</span>
			<span class="font-mono text-xs text-muted-foreground">
				{isBusy ? 'running' : 'idle'}
			</span>
		</div>
	</div>

	<div class="relative overflow-hidden rounded-lg border">
		<div
			class="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted))_1px,transparent_1px)] bg-size-[14px_14px] opacity-50"
		></div>
		<pre
			class="relative h-[70vh] overflow-auto p-4 font-mono text-sm leading-relaxed">{#if outputLines.length === 0}<span
					class="text-muted-foreground">$ waiting for test run...</span
				>{:else}{outputLines.join('')}{/if}</pre>
	</div>
</div>
