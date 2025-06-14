<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { format, isToday, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { ArrowUturnLeftIcon, ArrowPathIcon, PowerIcon, PlusCircleIcon, PencilIcon, ClipboardIcon } from '@heroicons/vue/24/outline';
import { CheckIcon } from '@heroicons/vue/24/solid';
import CopyMessageButton from './CopyMessageButton.vue';
const baseUrl = import.meta.env.VITE_YEMOT_BASE_API_URL;

const props = defineProps({
  conversation: {
    type: Object,
    default: null
  },
  username: {
    type: String,
    default: ''
  },
  selectedId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['refreshMessages', 'back']);

const message = ref('');
const messagesContainer = ref(null);
const showScrollButton = ref(false);
const copiedCodeId = ref(null);

const callerIds = ref([]);
let selectedCid = ref(localStorage.getItem('username'));

const setFirtsCallerId = () => {
  selectedCid = ref(callerIds.value[0]);
};

watch(() => props.conversation, () => {
  nextTick(() => {
    scrollToBottom();
  });

  const messages = props.conversation?.messages || [];
  const lastOutgoing = [...messages].reverse().find(m => m.type === 'outgoing');
  if (!lastOutgoing) return setFirtsCallerId();
  //console.log(`the last caller id is: ${lastOutgoing.source}. check if in `, callerIds.value, lastOutgoing)
  if (lastOutgoing && lastOutgoing.source) {
    let src = lastOutgoing.source.startsWith('0') ? `+972${lastOutgoing.source.substring(1)}` : lastOutgoing.source;
    // אם קיים בקרלר־איידי עם + לפני המספר
    if (callerIds.value.includes(src)) {
      console.log(callerIds.value.indexOf(src));
      selectedCid = ref(callerIds.value[callerIds.value.indexOf(src)]);
    } else {
      return setFirtsCallerId();
    }
  } else {
    return setFirtsCallerId();
  }

}, { deep: true });


onMounted(async () => {
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll);
  }

  // מכין זיהויים לשליחה
  const response = await fetch(`${baseUrl}/GetApprovedCallerIDs?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}`);
  const data = await response.json();
  if (data?.call?.callerIds) callerIds.value.push(...data?.call?.callerIds);
  if (data?.call?.secondaryDids) callerIds.value.push(...data?.call?.secondaryDids);
  if (data?.sms?.smsId?.length > 0) callerIds.value.push(...data?.sms?.smsId);
});

const openPrivacyPolicy = () => {
  window.openPrivacyPolicy()
};

function handleScroll() {
  if (!messagesContainer.value) return;

  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value;
  // Show button when scrolled up more than 200px from bottom
  showScrollButton.value = scrollHeight - scrollTop - clientHeight > 200;
}

const formatMessageTime = (timestamp) => {
  const date = new Date(timestamp);
  const time = format(date, 'HH:mm');

  if (isToday(date)) {
    return `היום, ${time}`;
  }

  const daysDifference = differenceInDays(new Date(), date);

  if (daysDifference <= 6) {
    const daysInHebrew = ['ימים', 'יום', 'יומיים', 'שלושה ימים', 'ארבעה ימים', 'חמישה ימים', 'שישה ימים', 'שבעה ימים'];
    return `לפני ${daysInHebrew[daysDifference + 1]}, ${time}`;
  }

  return format(date, "d בMMMM yyyy', 'HH:mm", { locale: he });
};

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

const formatMessageContent = (content, type) => {
  if (type === 'incoming') {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(
      urlRegex,
      (url) => `<a href="${url}" target="_blank" class="text-indigo-600 hover:text-indigo-500 underline">${url}</a>`
    );
  } else if (type === 'outgoing') {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.replace(
      urlRegex,
      (url) => `<a href="${url}" target="_blank" class="underline">${url}</a>`
    );
  }
};

async function sendMessage(phone) {
  if (!phone || !message.value) return;

  try {
    const response = await fetch(`${baseUrl}/SendSms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: `${localStorage.getItem('username')}:${localStorage.getItem('password')}`,
        phones: phone,
        message: message.value,
        from: selectedCid?.value || null
      })
    })
    const data = await response.json();

    if (data.responseStatus === 'OK') {
      message.value = '';
      emit('refreshMessages');
      nextTick(() => {
        scrollToBottom();
      });
    } else {
      alert('שגיאה בשליחת ההודעה!\n' + data.message);
    }
  } catch (error) {
    alert('שגיאה בשליחת ההודעה: ' + error.message);
  }
}

function logout() {
  if (confirm('האם אתה בטוח שברצונך להתנתק?')) {
    localStorage.clear();
    location.reload();
  }
}

// הוסף את הפונקציה הזו אחרי הפונקציות הקיימות
const extractVerificationCode = (content) => {
  // בדיקה שהתוכן קיים ואינו null או undefined
  if (!content || typeof content !== 'string') {
    return null;
  }
  
  const numbers = content.match(/\b\d{4,8}\b/g);
  
  if (!numbers) return null;
  
  for (const number of numbers) {
    const numberIndex = content.indexOf(number);
    const beforeChar = content.charAt(numberIndex - 1);
    const afterChar = content.charAt(numberIndex + number.length);
    
    if (beforeChar === '-' || beforeChar === ' ') {
      const beforeText = content.substring(Math.max(0, numberIndex - 5), numberIndex);
      if (/\d+[-\s]$/.test(beforeText)) {
        continue;
      }
    }
    
    if (number.length >= 7 && (
      number.startsWith('05') || 
      number.startsWith('02') || 
      number.startsWith('03') || 
      number.startsWith('04') || 
      number.startsWith('08') || 
      number.startsWith('09') ||
      number.startsWith('077') ||
      number.startsWith('072') ||
      number.startsWith('073')
    )) {
      continue;
    }
    
    if (number.length >= 5 && number.length <= 8) {
      return number;
    }
    
    if (number.length === 4) {
      if (/(?:קוד|הקוד|code|pin|otp|verification|אימות)/i.test(content)) {
        return number;
      }
    }
  }
  
  return null;
};

const copyVerificationCode = (code, messageId) => {
  navigator.clipboard.writeText(code).then(() => {
    copiedCodeId.value = messageId;
    setTimeout(() => {
      copiedCodeId.value = null;
    }, 2000);
    console.log('קוד אימות הועתק:', code);
  }).catch(err => {
    console.error('שגיאה בהעתקת קוד האימות:', err);
  });
};

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Text copied to clipboard');
  }).catch(err => {
    console.error('Error copying text: ', err);
  });
};
</script>

<template>
  <div :class="[
    !selectedId ? 'pr-0 md:pr-96' : 'pr-0 md:pr-96',
    'flex-1 flex flex-col h-full z-20 relative'
  ]">
    <div v-if="conversation" class="flex-1 flex flex-col">
      <!-- Header -->
      <div class="border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 bg-white z-10 shadow-sm">
        <div class="space-x-3 space-x-reverse flex items-center">
          <button class="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 md:hidden transition" title="חזור"
            @click="emit('back')">
            <ArrowUturnLeftIcon class="h-5 w-5" />
          </button>

          <div class="relative">
            <img :src="conversation.avatar" alt="" class="h-10 w-10 rounded-full border border-gray-200 shadow-sm" />
            <div v-if="conversation.unreadCount > 0"
              class="absolute -top-1 -right-1 flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <span class="text-xs text-white font-medium">
                {{ conversation.unreadCount }}
              </span>
            </div>
          </div>

          <div class="-my-1">
            <h2 class="text-lg font-medium text-gray-900">
              {{ conversation.name }}
            </h2>
            <h3 v-if="conversation.name !== conversation.contact" class="text-xs text-gray-500">
              {{ conversation.contact }}
            </h3>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button class="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition" title="רענן הודעות"
            @click="emit('refreshMessages')">
            <ArrowPathIcon class="h-5 w-5" />
          </button>

          <button class="p-1.5 rounded-full text-gray-500 hover:bg-gray-100 transition" title="התנתק" @click="logout()">
            <PowerIcon class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
        <div v-for="msg in conversation.messages" :key="msg.id" :class="[
          'flex group',
          msg.type === 'outgoing' ? 'justify-end' : 'justify-start'
        ]">
          <div v-if="msg.type === 'outgoing'" class="group-hover:flex items-center ml-2 hidden">
            <button @click="copyToClipboard(msg.content)"
              class="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              title="העתק הודעה">
              <ClipboardIcon class="h-5 w-5" />
            </button>
          </div>

          <div :class="[
            'max-w-[70%] rounded-2xl p-3 shadow-sm',
            msg.type === 'outgoing'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-50 text-gray-900 border border-gray-100'
          ]">
            <p class="whitespace-pre-line text-[16px]" v-html="formatMessageContent(msg.content, msg.type)"></p>
              <p v-if="msg.type === 'outgoing'" :class="[
                'text-xs',
                'text-indigo-300'
              ]">
                נשלח באמצעות {{ msg.source }}
              </p>
              <p v-if="msg.type !== 'outgoing'" :class="[
                'text-xs',
                'text-indigo-300'
              ]">
                התקבל ל {{ msg.phone }}
              </p>

            <div class="flex items-center justify-between gap-2 mt-1">
              <!-- כפתור העתקת קוד אימות -->
              <div>
                <button 
                  v-if="msg.type === 'incoming' && extractVerificationCode(msg.content)"
                  @click="copyVerificationCode(extractVerificationCode(msg.content), msg.id)"
                  class="flex items-center gap-1 text-xs bg-indigo-600 text-white px-2 py-1 rounded-full hover:bg-indigo-700 transition-colors"
                  title="העתק קוד אימות">
                  <ClipboardIcon class="h-3 w-3" />
                  <span v-if="copiedCodeId === msg.id">הועתק!</span>
                  <span v-else>{{ extractVerificationCode(msg.content) }}</span>
                </button>
              </div>
              
              <div class="flex items-center gap-1">
                <p :class="[
                  'text-xs',
                  msg.type === 'outgoing' ? 'text-indigo-200' : 'text-gray-500'
                ]">
                  {{ formatMessageTime(msg.timestamp) }}
                </p>

                <span v-if="msg.type === 'outgoing'" :class="[
                  msg.status === 'DELIVRD' ? 'text-indigo-200' : 'text-indigo-300'
                ]">
                  <div v-if="msg.status === 'DELIVRD'" class="flex" title="נמסר">
                    <CheckIcon class="h-4 w-4" />
                    <CheckIcon class="h-4 w-4 -mr-3" />
                  </div>
                  <CheckIcon v-else class="h-4 w-4" title="נשלח" />
                </span>
              </div>
            </div>
          </div>

          <div v-if="msg.type === 'incoming'" class="group-hover:flex items-center mr-2 hidden">
            <CopyMessageButton :text="msg.content" />
          </div>
        </div>
      </div>

      <!-- Message Input -->
      <div class="border-t border-gray-200 p-4 sticky bottom-0 bg-white shadow-sm"
        v-if="conversation.contact.startsWith('0')">
        <div class="mb-2">
          <label for="cid-select" class="block text-sm font-medium text-gray-700 mb-1">
            זיהוי יוצא
          </label>
          <select dir="ltr" id="cid-select" v-model="selectedCid"
            class="block w-full rounded-md border-gray-300 bg-white py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm">
            <option v-for="cid in callerIds" :key="cid" :value="cid">
              {{ cid }}
            </option>
          </select>
        </div>

        <div class="flex items-center space-x-2 space-x-reverse">
          <textarea v-model="message" placeholder="הקלד הודעה..." rows="1"
            class="flex-1 rounded-full bg-gray-50 border border-gray-300 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
            @keydown.enter.meta.prevent="sendMessage(conversation.contact)"
            @keydown.enter.ctrl.prevent="sendMessage(conversation.contact)" />

          <button @click="sendMessage(conversation.contact)"
            class="bg-indigo-600 text-white rounded-full p-2.5 hover:bg-indigo-500 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Scroll to bottom button -->
      <transition name="fade">
        <button v-if="showScrollButton" @click="scrollToBottom"
          class="fixed bottom-24 right-1/2 transform translate-x-1/2 z-20 bg-indigo-600 text-white border-gray-300 text-sm px-4 py-2 border rounded-full shadow-md hover:bg-indigo-500 transition-all">
          חזור למטה
        </button>
      </transition>
    </div>

    <!-- Empty state -->
    <div v-else class="flex-1 flex flex-col items-center justify-between text-gray-500 py-16">
      <div></div>

      <div class="flex flex-col items-center">
        <svg class="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z">
          </path>
        </svg>
        <h3 class="text-lg font-medium text-gray-700 mb-1">הודעות SMS</h3>
        <p class="text-gray-500 text-center mb-4">בחר שיחה בכדי להתחיל לשוחח</p>
      </div>

      <div class="text-sm text-gray-600 bg-gray-100 py-2 px-4 rounded-lg">
        מחובר כ{{ username }} |
        <button @click="logout()" class="text-indigo-600 hover:text-indigo-800 transition">התנתק</button>
        |
        <button @click="openPrivacyPolicy()" class="text-indigo-600 hover:text-indigo-800 transition">מדיניות
          פרטיות</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
