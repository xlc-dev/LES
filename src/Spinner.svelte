<script lang="ts">
  interface Props {
    size?: string;
    borderWidth?: string;
  }

  const { size = "w-16 h-16", borderWidth = "border-2" }: Props = $props();
</script>

<div
  class={`animate-spin rounded-full ${size} ${borderWidth} border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent`}
  role="status"
  aria-label="Loading...">
  <span class="sr-only">Loading...</span>
</div>
