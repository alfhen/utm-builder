<script setup lang="ts">
import type { ParsedUTMParams } from '../lib/types';
import { UTM_PARAM_KEYS } from '../lib/types';

defineProps<{
  params: ParsedUTMParams;
}>();
</script>

<template>
  <div class="overflow-hidden rounded-lg border border-surface-600">
    <table class="w-full text-sm">
      <thead class="bg-surface-700">
        <tr>
          <th class="px-4 py-2.5 text-left font-medium text-zinc-300">Parameter</th>
          <th class="px-4 py-2.5 text-left font-medium text-zinc-300">Value</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-surface-600">
        <tr
          v-for="(key, index) in UTM_PARAM_KEYS"
          :key="key"
          class="bg-surface-800 hover:bg-surface-700 transition-colors"
          :style="{ animationDelay: `${index * 50}ms` }"
        >
          <td class="px-4 py-2.5 font-mono text-accent-cyan">{{ key }}</td>
          <td class="px-4 py-2.5 font-mono">
            <span v-if="params[key]" class="text-zinc-100">{{ params[key] }}</span>
            <span v-else class="text-zinc-500 italic">not set</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

