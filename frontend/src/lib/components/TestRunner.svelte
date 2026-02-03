<script lang="ts">
	import type { ProjectState } from '../../../../server/src/types';
	import ControlPanel from './ControlPanel.svelte';
	import OutputPanel from './OutputPanel.svelte';

	let status = $state<ProjectState>('idle');

	const isBusy = $derived(status !== 'idle');
</script>

<div class="flex gap-6">
	<ControlPanel {status} {isBusy} />
	<OutputPanel bind:status {isBusy} />
</div>
