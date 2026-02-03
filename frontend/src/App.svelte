<script lang="ts">
	import './app.css';
	import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
	import TestRunner from '$lib/components/TestRunner.svelte';
	import { Toaster } from '$lib/components/ui/sonner';

	const queryClient = new QueryClient();
</script>

<Toaster richColors theme="light" />
<QueryClientProvider client={queryClient}>
	<div class="min-h-screen bg-background">
		<div class="mx-auto max-w-6xl px-6 py-12">
			<header class="mb-8">
				<h1 class="text-xl font-semibold tracking-tight">launch.</h1>
				<p class="font-mono text-sm text-muted-foreground">Test automation platform</p>
			</header>

			<TestRunner />
		</div>
	</div>
</QueryClientProvider>
