<script lang="ts">
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import { createMutation } from '@tanstack/svelte-query';
	import { toast } from 'svelte-sonner';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import { client } from '$lib/api';

	type Props = {
		status: 'idle' | 'running-start' | 'running-pull';
		isBusy: boolean;
	};

	let { status, isBusy }: Props = $props();

	let filter = $state('');

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
</script>

<Tabs.Root value="tests" class="w-64 shrink-0">
	<Tabs.List>
		<Tabs.Trigger value="tests">Tests</Tabs.Trigger>
		<Tabs.Trigger value="updates">Updates</Tabs.Trigger>
	</Tabs.List>
	<Tabs.Content value="tests">
		<Card.Root>
			<Card.Content>
				<div class="grid gap-2">
					<Label for="filter">Filter</Label>
					<Input
						id="filter"
						type="text"
						placeholder="e.g. @smoke"
						bind:value={filter}
						disabled={isBusy}
					/>
				</div>
			</Card.Content>
			<Card.Footer>
				<Button onclick={() => startTests.mutate()} disabled={isBusy} class="w-full">
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
	<Tabs.Content value="updates">
		<Card.Root>
			<Card.Content>
				<p class="text-sm text-muted-foreground">
					Pull the latest changes and update dependencies.
				</p>
			</Card.Content>
			<Card.Footer>
				<Button
					onclick={() => pullChanges.mutate()}
					disabled={isBusy}
					variant="outline"
					class="w-full"
				>
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
