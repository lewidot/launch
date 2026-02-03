<script lang="ts">
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { client } from '$lib/api';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';

	let outputLines = $state<string[]>([]);
	let status = $state<'idle' | 'running-start' | 'running-pull'>('idle');
	let filter = $state('');

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

	const startTests = createMutation(() => ({
		mutationFn: async () => {
			const res = await client.api.start.$post({ json: { filter } });
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

	const pullChanges = createMutation(() => ({
		mutationFn: async () => {
			const res = await client.api.pull.$get();
			const data = await res.json();

			if ('error' in data) {
				throw new Error(data.error);
			}
			return data;
		},
		onError: (error) => {
			toast.error(`Cannot pull changes: ${error.message}`);
		}
	}));

	$effect(() => {
		return connectToSSE();
	});

	const isBusy = $derived(status !== 'idle' || startTests.isPending || pullChanges.isPending);
</script>

<div class="flex gap-6">
	<Tabs.Root value="run" class="w-64 shrink-0">
		<Tabs.List>
			<Tabs.Trigger value="run">Tests</Tabs.Trigger>
			<Tabs.Trigger value="pull">Updates</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="run">
			<Card.Root>
				<Card.Content>
					<div class="grid gap-2">
						<Label for="filter">Filter</Label>
						<Input id="filter" type="text" placeholder="e.g. @smoke" bind:value={filter} />
					</div>
				</Card.Content>
				<Card.Footer>
					<Button onclick={() => startTests.mutate()} disabled={isBusy}>
						{#if status === 'running-start'}
							<Loader2Icon class="animate-spin" />
							Running...
						{:else}
							Run Tests
						{/if}
					</Button>
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
		<Tabs.Content value="pull">
			<Card.Root>
				<Card.Content>
					<p class="text-sm text-muted-foreground">
						Pull the latest changes and update dependencies.
					</p>
				</Card.Content>
				<Card.Footer>
					<Button onclick={() => pullChanges.mutate()} disabled={isBusy} variant="outline">
						{#if status === 'running-pull'}
							<Loader2Icon class="animate-spin" />
							Pulling changes...
						{:else}
							Pull Changes
						{/if}
					</Button>
				</Card.Footer>
			</Card.Root>
		</Tabs.Content>
	</Tabs.Root>

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
</div>
