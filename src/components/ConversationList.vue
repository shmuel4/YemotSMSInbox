<script setup>
// נוסיף watcher כדי לדבג את הבחירה
import { format, isToday, isThisYear, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  FunnelIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from "@heroicons/vue/24/outline";
import {
  checkGoogleAuthStatus,
  initiateGoogleLogin,
  logoutFromGoogle
} from '../services/google.service';

const props = defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  selectedId: {
    type: String,
    default: null
  },
});

const emit = defineEmits(['select', 'refreshMessages', 'filter']);

const newMessageDialogVisible = ref(false);
const filter = ref(false);
const loading = ref(false);
const phoneToSend = ref('');
const messageToSend = ref('');
const searchQuery = ref('');
const googleStatus = ref({
  isAuthenticated: false,
  userEmail: '',
  contactCount: 0
});

// האזנה לאירוע העדכון מהאפליקציה הראשית
const handleGoogleStatusUpdate = async () => {
  console.log('Received googleAuthStatusUpdated event in ConversationList');
  await checkGoogleStatus();
};

// רישום והסרת האזנה לאירועים
onMounted(() => {
  // מיד בדוק סטטוס התחברות
  checkGoogleStatus();

  // הוסף האזנה לאירוע העדכון
  window.addEventListener('googleAuthStatusUpdated', handleGoogleStatusUpdate);

  // בנוסף, הוסף האזנה לאירוע שינוי סטטוס התחברות
  window.addEventListener('googleAuthStatusChanged', handleGoogleStatusUpdate);
});

onUnmounted(() => {
  // הסר האזנות בעת הריסת הקומפוננטה
  window.removeEventListener('googleAuthStatusUpdated', handleGoogleStatusUpdate);
  window.removeEventListener('googleAuthStatusChanged', handleGoogleStatusUpdate);
});

// Function to check Google Auth status
async function checkGoogleStatus() {
  try {
    const status = await checkGoogleAuthStatus();
    googleStatus.value = status;
    console.log('Google Auth Status updated in ConversationList:', status);
  } catch (error) {
    console.error('Error checking Google auth status in ConversationList:', error);
  }
}

// Function to handle Google login
async function handleGoogleLogin() {
  console.log('Initiating Google login...');
  try {

    await initiateGoogleLogin();

    // פול מחזורי לבדיקת סטטוס ההתחברות
    let attempts = 0;
    const maxAttempts = 20; // בדיקה למשך כ-10 שניות

    const checkLoginStatus = async () => {
      attempts++;
      const status = await checkGoogleAuthStatus();
      console.log(`Login status check attempt ${attempts}:`, status);

      if (status.isAuthenticated) {
        // התחברות הצליחה
        googleStatus.value = status;

        // רענון הודעות מיידי
        emit('refreshMessages');

        // הסרת ההודעה אחרי כמה שניות
        setTimeout(() => {
          document.body.removeChild(successMessage);
        }, 3000);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(checkLoginStatus, 500); // בדיקה כל חצי שנייה
      }
    };

    // התחל בדיקות פול
    setTimeout(checkLoginStatus, 1000);
  } catch (error) {
    console.error('Error during Google login:', error);
    // הצג הודעת שגיאה למשתמש
    alert('שגיאה בתהליך ההתחברות לגוגל. אנא נסה שוב.');
  }
}

// Function to handle Google logout
async function handleGoogleLogout() {
  const confirmLogout = confirm('האם אתה בטוח שברצונך להפסיק את הסנכרון עם גוגל?');
  if (!confirmLogout) return;
  console.log('Logging out from Google...');
  await logoutFromGoogle();
  await checkGoogleStatus();
  emit('refreshMessages');
}

const filteredConversations = computed(() => {
  if (!searchQuery.value) return props.conversations;

  const query = searchQuery.value.toLowerCase();
  return props.conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(query) ||
    conversation.lastMessage.content.toLowerCase().includes(query)
  );
});

const formatTime = (date) => {
  const now = new Date();
  const messageDate = new Date(date);

  if (isToday(messageDate)) {
    return format(messageDate, 'HH:mm');
  }

  const daysDifference = differenceInDays(now, messageDate);

  if (daysDifference <= 7) {
    switch (daysDifference) {
      case 0:
        return 'אתמול';
      case 1:
        return 'לפני יומיים';
      default:
        return `לפני ${daysDifference + 1} ימים`;
    }
  }

  if (isThisYear(messageDate)) {
    return format(messageDate, 'd בMMMM', { locale: he });
  }

  return format(messageDate, 'd בMMMM yyyy', { locale: he });
};

const hasUnreadMessages = computed(() => {
  return props.conversations.some(conversation => conversation.unreadCount > 0);
});

const resetNewMessageForm = () => {
  phoneToSend.value = '';
  messageToSend.value = '';
  loading.value = false;
  newMessageDialogVisible.value = false;
};

async function sendNewMessage() {
  if (!phoneToSend.value || !messageToSend.value) return;

  loading.value = true;

  try {
    const response = await fetch(
      `https://www.call2all.co.il/ym/api/SendSms?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&phones=${phoneToSend.value}&message=${messageToSend.value}`
    );

    const data = await response.json();

    if (data.responseStatus === 'OK') {
      emit('refreshMessages');
      resetNewMessageForm();
    } else {
      alert('שגיאה בשליחת ההודעה!\n' + data.message);
      loading.value = false;
    }
  } catch (error) {
    alert('שגיאה בשליחת ההודעה: ' + error.message);
    loading.value = false;
  }
}

const toggleFilter = () => {
  filter.value = !filter.value;
  emit('filter', filter.value);
};

// נוסיף console.log לבדיקה
watch(() => props.selectedId, (newVal) => {
  if (newVal) {
    console.log('Selected ID in ConversationList:', newVal);
    console.log('All conversation IDs:', props.conversations.map(c => c.id));
  }
});

// נוסיף בדיקה גם בעת רנדור המרכיב
onMounted(() => {
  if (props.selectedId) {
    console.log('Initial selectedId:', props.selectedId);
    console.log('Initial conversations:', props.conversations.map(c => c.id));
  }
});
</script>

<template>
  <div :class="[
    selectedId ? 'hidden md:block md:w-96' : 'w-full md:w-96',
    'border-l border-gray-200 h-full overflow-y-auto fixed top-0 right-0 bg-white z-30 transition-all'
  ]">
    <!-- Header -->
    <div
      class="px-5 py-4 sticky top-0 z-10 bg-white backdrop-blur-sm bg-opacity-95 border-b border-gray-100 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">
        הודעות
      </h1>
      <div class="flex items-center gap-2">
        <!-- Google Auth Button -->
        <button @click="googleStatus.isAuthenticated ? handleGoogleLogout() : handleGoogleLogin()"
          class="p-1.5 rounded-full border transition-all hover:bg-gray-100 hover:border-gray-300"
          :class="googleStatus.isAuthenticated ? 'border-green-500 bg-green-50 hover:bg-green-50 hover:border-green-500' : 'border-transparent'"
          title="התחבר עם Google לסנכרון אנשי קשר">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" class="w-6 h-6">
            <path fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z">
            </path>
            <path fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z">
            </path>
            <path fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z">
            </path>
            <path fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z">
            </path>
          </svg>
        </button>
        <button v-if="hasUnreadMessages" class="p-2 rounded-full hover:bg-gray-100 text-indigo-600 transition"
          @click="toggleFilter" :class="{ 'bg-indigo-50': filter }">
          <FunnelIcon class="w-5 h-5" />
        </button>
        <button class="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm"
          @click="newMessageDialogVisible = true">
          <PencilSquareIcon class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Google Status Info (if authenticated) -->
    <div v-if="googleStatus.isAuthenticated" class="bg-indigo-50 py-2 px-3 border-b border-indigo-100">
      <div class="flex justify-between text-xs">
        <a :href="`https://contacts.google.com/?authuser=${googleStatus.userEmail}`" target="_blank" class="font-semibold text-indigo-700">
          {{ googleStatus.userEmail }}
        </a>
        <span class="text-gray-600">
          {{ googleStatus.contactCount }} אנשי קשר
        </span>
      </div>
    </div>

    <!-- Search Bar -->
    <div class="px-4 py-3 sticky top-16 z-10 bg-white bg-opacity-95 backdrop-blur-sm">
      <div
        class="relative flex items-center rounded-lg border border-gray-200 bg-gray-50 hover:bg-white focus-within:bg-white transition-all shadow-sm">
        <MagnifyingGlassIcon class="absolute right-3 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="חפש בהודעות..."
          class="w-full py-2.5 pr-10 pl-4 text-sm rounded-lg focus:outline-none bg-transparent" v-model="searchQuery"
          dir="rtl" />
        <button v-if="searchQuery" @click="searchQuery = ''"
          class="absolute left-3 p-1 rounded-full hover:bg-gray-200 text-gray-400">
          <XMarkIcon class="w-3 h-3" />
        </button>
      </div>
    </div>

    <!-- Conversation List -->
    <div v-if="filteredConversations.length">
      <div v-for="conversation in filteredConversations" :key="conversation.id" @click="emit('select', conversation.id)"
        :class="[
          'p-4 hover:bg-gray-50 cursor-pointer transition-colors',
          String(conversation.id) === String(selectedId) ? 'bg-indigo-50 hover:bg-indigo-50 border-r-4 border-indigo-500' : ''
        ]">
        <div class="flex items-center space-x-3 space-x-reverse">
          <div class="relative">
            <img :src="conversation.avatar" alt=""
              class="h-12 w-12 rounded-full object-cover border border-gray-200 shadow-sm" />
            <div v-if="conversation.unreadCount > 0"
              class="absolute -top-1 -right-1 flex-shrink-0 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center ring-2 ring-white">
              <span class="text-xs text-white font-medium">
                {{ conversation.unreadCount }}
              </span>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900 truncate"
                :class="{ 'font-bold': conversation.unreadCount > 0 }">
                {{ conversation.name }}
              </p>
              <p class="text-xs text-gray-500 flex-shrink-0">
                {{ formatTime(conversation.lastMessage.timestamp) }}
              </p>
            </div>
            <p class="text-sm text-gray-500 truncate mt-0.5"
              :class="{ 'font-medium text-gray-700': conversation.unreadCount > 0 }">
              {{ conversation.lastMessage.content }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="searchQuery && !filteredConversations.length"
      class="flex flex-col items-center justify-center h-64 text-gray-500">
      <MagnifyingGlassIcon class="w-10 h-10 text-gray-300 mb-2" />
      <p>לא נמצאו תוצאות ל-"{{ searchQuery }}"</p>
    </div>

    <div v-else-if="!props.conversations.length"
      class="flex-1 flex flex-col items-center justify-center text-gray-500 h-64">
      <svg class="animate-spin h-8 w-8 text-indigo-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none"
        viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
        </path>
      </svg>
      טוען שיחות...
    </div>

  </div>

  <!-- New Message Dialog -->
  <transition name="fade">
    <div v-if="newMessageDialogVisible" @click="newMessageDialogVisible = false"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4"
      style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">

      <div class="bg-white p-6 rounded-xl shadow-xl w-full max-w-md" @click.stop="" style="transform-origin: center">
        <div class="flex justify-between items-center mb-5">
          <h3 class="text-xl font-bold text-gray-800">שלח הודעה חדשה</h3>
          <button @click="newMessageDialogVisible = false" class="p-1.5 rounded-full hover:bg-gray-100 text-gray-500">
            <XMarkIcon class="w-5 h-5" />
          </button>
        </div>

        <div class="space-y-4">
          <label for="phone"
            class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors bg-white">
            <input v-model="phoneToSend" type="text" id="phone" placeholder="מספר הטלפון של הנמען"
              class="peer h-10 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm text-gray-900"
              dir="rtl" />
            <span
              class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              מספר טלפון
            </span>
          </label>

          <label for="message"
            class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors bg-white">
            <textarea v-model="messageToSend" id="message" placeholder="הודעה"
              class="peer h-32 w-full border-none bg-transparent p-0 pt-2 placeholder-transparent focus:placeholder-gray-400 focus:outline-none focus:ring-0 sm:text-sm text-gray-900"
              dir="rtl"></textarea>
            <span
              class="absolute start-3 top-1 text-xs text-gray-500 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs">
              הודעה
            </span>
          </label>

          <button :disabled="loading || !phoneToSend || !messageToSend" @click="sendNewMessage()" :class="[
            loading || !phoneToSend || !messageToSend ? 'bg-opacity-70 cursor-not-allowed' : 'hover:bg-indigo-500',
            'mt-2 transition-all w-full px-4 py-3 text-white bg-indigo-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 font-medium'
          ]">
            <span v-if="!loading">שלח הודעה</span>
            <span v-else class="flex justify-center items-center">
              <svg class="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4">
                </circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              שולח הודעה...
            </span>
          </button>
        </div>
      </div>
    </div>
  </transition>
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