<script setup>
import { ref } from 'vue';
import { format, isToday, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';

defineProps({
  conversation: {
    type: Object,
    default: null
  },
  username: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['refreshMessages']);

const message = ref(null);

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const time = format(date, 'HH:mm');

  if (isToday(date)) {
    return `היום, ${time}`;
  }

  const daysDifference = differenceInDays(new Date(), date);

  if (daysDifference <= 7) {
    const daysInHebrew = ['ימים', 'יום', 'יומיים', 'שלושה ימים', 'ארבעה ימים', 'חמישה ימים', 'שישה ימים', 'שבעה ימים'];
    return `לפני ${daysInHebrew[daysDifference + 1]}, ${time}`;
  }

  return format(date, "d בMMMM yyyy', 'HH:mm", { locale: he });
};

function scrollToBottom() {
  window.scrollTo(0, document.body.scrollHeight);
}

const formatMessageContent = (content) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return content.replace(
    urlRegex,
    (url) => `<a href="${url}" target="_blank" class="underline">${url}</a>`
  );
};

async function sendMessage(phone) {
  const response = await fetch(`https://www.call2all.co.il/ym/api/SendSms?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&phones=${phone}&message=${message.value}`);
  const data = await response.json();
  if (data.responseStatus === 'OK') {
    message.value = '';
    emit('refreshMessages');
  } else {
    alert('שגיאה בשליחת ההודעה!\n' + data.message);
  }
}

async function addToContacts(phone, oldName) {
  const name = prompt('הכנס את שם איש הקשר:', oldName || '');

  const contactsFetch = await fetch(`https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxContacts.ini`);
  const contactsRes = await contactsFetch.json();

  const contacts = JSON.parse(contactsRes.contents);
  contacts[phone] = name;

  await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxContacts.ini&contents=${JSON.stringify(contacts)}`);
  emit('refreshMessages');
}

function logout() {
  localStorage.clear();
  location.reload();
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full pr-[320px]">
    <div v-if="conversation" class="flex-1 flex flex-col">
      <div class="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white z-10">
        <div class="space-x-3 space-x-reverse flex items-center">
          <img :src="conversation.avatar" alt="" class="h-10 w-10 rounded-full" />
          <div class="-my-1">
            <h2 class="text-lg font-medium text-gray-900">
              {{ conversation.name }}
            </h2>
            <h3 v-if="conversation.name !== conversation.contact" class="text-xs text-gray-500">
              {{ conversation.contact }}
            </h3>
          </div>
          <div v-if="conversation.name == conversation.contact" @click="addToContacts(conversation.contact)"
            class="w-[22px] text-gray-800 cursor-pointer" title="הוסף לאנשי הקשר">
            <svg data-slot="icon" fill="none" stroke-width="1.8" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z">
              </path>
            </svg>
          </div>
          <div v-else @click="addToContacts(conversation.contact, conversation.name)"
            class="w-4 h-4 -mt-4 text-gray-800 cursor-pointer" title="ערוך איש קשר">
            <svg data-slot="icon" fill="none" stroke-width="1.8" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10">
              </path>
            </svg>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <span class="h-6 w-6 text-gray-800 cursor-pointer" title="רענן הודעות" @click="emit('refreshMessages')">
            <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99">
              </path>
            </svg>
          </span>
          <span class="h-6 w-6 text-gray-800 cursor-pointer" title="התנתק" @click="logout()">
            <svg data-slot="icon" fill="none" stroke-width="1.5" stroke="currentColor" viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"></path>
            </svg>
          </span>
        </div>
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
          <button @click="sendMessage(conversation.contact)"
            class="bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600">
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
    <div v-else class="flex-1 flex flex-col items-center justify-between text-gray-500 py-4">
      <div></div>

      בחר שיחה בכדי להתחיל לשוחח

      <div class="text-sm text-gray-600">
        מחובר כ{{ username }} |
        <button @click="logout()" class="text-blue-500 underline">התנתק</button>
      </div>
    </div>
  </div>
</template>