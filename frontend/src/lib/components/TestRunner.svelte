<script lang="ts">
	import ControlPanel from './ControlPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';

	let status = $state<'idle' | 'running-start' | 'running-pull'>('idle');

	const isBusy = $derived(status !== 'idle');
</script>

<div class="flex gap-6">
	<ControlPanel {status} {isBusy} />
	<OutputPanel bind:status {isBusy} />
</div>
