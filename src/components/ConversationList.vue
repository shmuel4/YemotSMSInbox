<script setup lang="ts">
import type { Conversation } from '../types/message';
import { format, isToday, isThisYear, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

defineProps<{
  conversations: Conversation[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
}>();

const formatTime = (date: Date) => {
  const now = new Date();
  const messageDate = new Date(date);

  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  }

  const daysDifference = differenceInDays(now, messageDate);

  if (daysDifference <= 7) {
    switch (daysDifference) {
      case 1:
        return 'אתמול';
      case 2:
        return 'לפני יומיים';
      default:
        return `לפני ${daysDifference} ימים`;
    }
  }

  if (isThisYear(messageDate)) {
    return format(messageDate, 'd בMMMM', { locale: he });
  }

  return format(messageDate, 'd בMMMM yyyy', { locale: he });
};
</script>

<template>
  <div class="w-80 border-l border-gray-200 h-full overflow-y-auto fixed top-0 right-0 bg-white z-10">
    <div class="px-4 py-4 sticky top-0 z-10 bg-white flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">
        Messages
      </h1>
      <button class="p-2 rounded-full bg-blue-500 text-white" @click="emit('refresh')">
        <svg class="w-6 h-6" data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10">
          </path>
        </svg>
      </button>
    </div>
    <div v-if="conversations.length" class="divide-y divide-gray-200">
      <div v-for="conversation in conversations" :key="conversation.id" :class="[
        'p-4 hover:bg-gray-50 cursor-pointer',
        selectedId === conversation.id ? 'bg-blue-50' : ''
      ]" @click="emit('select', conversation.id)">
        <div class="flex items-center space-x-3 space-x-reverse">
          <img :src="conversation.avatar" alt="" class="h-12 w-12 rounded-full" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900 truncate">
                {{ conversation.contact }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatTime(conversation.lastMessage.timestamp) }}
              </p>
            </div>
            <p class="text-sm text-gray-500 truncate" :class="{ 'font-semibold': conversation.unreadCount > 0 }">
              {{ conversation.lastMessage.content }}
            </p>
          </div>
          <div v-if="conversation.unreadCount > 0"
            class="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <span class="text-xs text-white">
              {{ conversation.unreadCount }}
            </span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center text-gray-500 h-full">
      טוען שיחות...
    </div>
  </div>
</template>