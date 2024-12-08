<script lang="ts">
  let { isSortedAsc = false, isSortedDesc = false, onSort } = $props();
</script>

<button class="relative inline-block cursor-pointer" onclick={onSort} aria-label="Sort">
  <div class="absolute -translate-y-4 transform">
    <svg
      class="h-2.5 w-2 {isSortedAsc ? 'text-les-gray-400' : 'text-les-gray-300'}"
      viewBox="0 0 24 24">
      <path
        id="Triangle-2"
        data-name="Triangle"
        d="M10.2,3.1l-8,16A2,2,0,0,0,4,22H20a2,2,0,0,0,1.8-2.9l-8-16A2,2,0,0,0,10.2,3.1Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2" />
    </svg>

    <svg
      class="h-2.5 w-2 {isSortedDesc ? 'text-les-gray-400' : 'text-les-gray-300'}"
      viewBox="0 0 24 24">
      <path
        id="Triangle-2"
        data-name="Triangle"
        d="M10.2 20.9l-8-16A2 2 0 0 1 4 2H20a2 2 0 0 1 1.8 2.9l-8 16A2 2 0 0 1 10.2 20.9Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2" />
    </svg>
  </div>
</button>
