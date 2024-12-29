<script setup lang="ts">
import { ref } from 'vue';
import type { Conversation } from '../types/message';
import { format, isToday, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

defineProps<{
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  (e: 'refreshMessages'): void;
}>();

const message = ref<string | null>(null);

const formatMessageTime = (timestamp: Date) => {
  const date = new Date(timestamp);
  const time = format(date, 'HH:mm');

  if (isToday(date)) {
    return `היום, ${time}`;
  }

  const daysDifference = differenceInDays(new Date(), date);

  if (daysDifference <= 7) {
    const daysInHebrew = ['ימים', 'יום', 'יומיים', 'שלושה ימים', 'ארבעה ימים', 'חמישה ימים', 'שישה ימים', 'שבעה ימים'];
    return `לפני ${daysInHebrew[daysDifference]}, ${time}`;
  }

  return format(date, "d בMMMM yyyy', 'HH:mm", { locale: he });
};

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
}

const formatMessageContent = (content: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.replace(
    urlRegex,
    (url) => `<a href="${url}" target="_blank" class="underline">${url}</a>`
  );
};

async function sendMessage(phone: string) {
  const response = await fetch(`https://www.call2all.co.il/ym/api/SendSms?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&phones=${phone}&message=${message.value}`);
  const data = await response.json();
  if (data.responseStatus === 'OK') {
    message.value = '';
    emit('refreshMessages');
  } else {
    alert('שגיאה בשליחת ההודעה!\n' + data.message);
  }
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full pr-[320px]">
    <div v-if="conversation" class="flex-1 flex flex-col">
      <div class="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white z-10">
        <div class="space-x-3 space-x-reverse flex items-center">
          <img :src="conversation.avatar" alt="" class="h-10 w-10 rounded-full" />
          <div>
            <h2 class="text-lg font-medium text-gray-900">
              {{ conversation.contact }}
            </h2>
          </div>
        </div>

        <span class="h-6 w-6 text-gray-800 cursor-pointer" title="רענן הודעות" @click="emit('refreshMessages')">
          <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99">
            </path>
          </svg>
        </span>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div v-for="message in conversation.messages" :key="message.id" :class="[
          'flex',
          message.type === 'outgoing' ? 'justify-end' : 'justify-start'
        ]">
          <div :class="[
            'max-w-[70%] rounded-lg p-3',
            message.type === 'outgoing'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-900'
          ]">
            <p class="whitespace-pre-line" v-html="formatMessageContent(message.content)"></p>
            <p :class="[
              'text-xs mt-1 text-left',
              message.type === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
            ]">
              {{ formatMessageTime(message.timestamp) }}
            </p>
          </div>
        </div>
      </div>


      <div class="border-t border-gray-200 p-4 sticky bottom-0 bg-white" v-if="conversation.contact.startsWith('0')">
        <div class="flex items-center space-x-2 space-x-reverse">
          <textarea v-model="message" type="text" placeholder="הקלד הודעה..." rows="1"
            class="flex-1 rounded-full border border-gray-300 px-4 py-2 focus:outline-none focus:border-blue-500" />
          <button @click="sendMessage(conversation.contact)" class="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex items-center justify-center">
        <button v-if="false" @click="scrollToBottom"
          class="fixed bottom-24 z-20 text-blue-500 border-gray-300 text-sm px-4 py-0.5 border rounded-full cursor-pointer">
          חזור להודעה האחרונה
        </button>
      </div>
    </div>
    <div v-else class="flex-1 flex items-center justify-center text-gray-500">
      בחר שיחה בכדי להתחיל לשוחח
    </div>
  </div>
</template>