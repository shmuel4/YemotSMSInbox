<script setup>
import { format, isToday, isThisYear, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { ref } from 'vue';

defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['select', 'refreshMessages']);

const newMessageDialogVisible = ref(false);
const loading = ref(false);
const phoneToSend = ref('');
const messageToSend = ref('');

const formatTime = (date) => {
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

async function sendNewMessage() {
  loading.value = true;

  const response = await fetch(`https://www.call2all.co.il/ym/api/SendSms?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&phones=${phoneToSend.value}&message=${messageToSend.value}`);
  const data = await response.json();
  if (data.responseStatus === 'OK') {
    message.value = '';
    emit('refreshMessages');
  } else {
    alert('שגיאה בשליחת ההודעה!\n' + data.message);
  }

  phoneToSend.value = '';
  messageToSend.value = '';

  loading.value = false;
  newMessageDialogVisible.value = false;
}
</script>

<template>
  <div class="w-80 border-l border-gray-200 h-full overflow-y-auto fixed top-0 right-0 bg-white z-10">
    <div class="px-4 py-4 sticky top-0 z-10 bg-white flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">
        Messages
      </h1>
      <button class="p-2 rounded-full bg-blue-500 text-white" @click="newMessageDialogVisible = true">
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
                {{ conversation.name }}
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

  <div v-if="newMessageDialogVisible" @click="newMessageDialogVisible = false"
    class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50"
    style="backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);">
    <div class="bg-white p-6 rounded shadow-md w-96" @click.stop="">
      <h3 class="text-lg font-semibold mb-4">שלח הודעה חדשה</h3>
      <label for="phone"
        class="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-colors cursor-text mt-3">
        <input v-model="phoneToSend" type="text" id="phone" placeholder="מספר הטלפון של הנמען"
          class="peer h-9 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900" />
        <span
          class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
          מספר טלפון
        </span>
      </label>
      <label for="message"
        class="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-colors cursor-text mt-3">
        <textarea v-model="messageToSend" id="message" placeholder="הודעה"
          class="peer h-24 w-full border-none bg-transparent p-0 pt-2 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900"></textarea>
        <span
          class="absolute start-3 top-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
          הודעה
        </span>
      </label>
      <button :disabled="loading" @click="sendNewMessage()"
        :class="[loading ? 'bg-opacity-80' : 'hover:bg-blue-500', 'mt-4 transition-all w-full px-4 py-2 tracking-wide text-white duration-200 transform bg-blue-600 rounded-md focus:outline-none focus:bg-blue-500 focus:ring-blue-400 focus:ring-offset-2 focus:ring-2']">
        <span v-if="!loading">שלח הודעה</span>
        <span v-if="loading" class="flex justify-center items-center">
          <svg class="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
            viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
            </circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          רק דקה, אנחנו בודקים את זה..
        </span>
      </button>
    </div>
  </div>
</template>