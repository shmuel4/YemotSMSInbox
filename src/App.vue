<script setup>
import { ref, watchEffect, nextTick } from 'vue';
import { XMarkIcon } from "@heroicons/vue/24/outline";
import ConversationList from './components/ConversationList.vue';
import MessageView from './components/MessageView.vue';
// Import the Google service methods
import { 
  getGoogleContacts, 
  initiateGoogleLogin, 
  logoutFromGoogle, 
  checkGoogleAuthStatus 
} from './services/google.service';

const conversations = ref([]);

const selectedConversationId = ref(null);
const selectedConversation = ref(null);

const loginDialogVisible = ref(false);
const username = ref(localStorage.getItem('username') || '');
const password = ref('');
const usernameFocus = ref(false);
const loading = ref(false);
const error = ref('');

const setRead = ref(null);

// Google auth status for the UI
const googleAuthStatus = ref({
  isAuthenticated: false,
  userEmail: '',
  contactCount: 0
});

const handleConversationSelect = (id) => {
  console.log('Selected conversation ID:', id);

  setRead.value = null;

  // נוודא שהמשתנה מקבל את הערך כמחרוזת (string)
  selectedConversationId.value = String(id);
  selectedConversation.value = conversations.value.find(c => String(c.id) === String(id)) || null;

  console.log('After select - selectedId:', selectedConversationId.value);
  console.log('Found conversation:', selectedConversation.value ? selectedConversation.value.id : 'none');

  watchEffect(() => {
    nextTick(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }, {
    flush: 'post'
  });

  setRead.value = setTimeout(async () => {
    const readedArray = [];
    const incomingMessages = selectedConversation.value.messages.filter(message => message.type === 'incoming');

    incomingMessages.forEach((message) => {
      if (!message.read) {
        readedArray.push({
          phone: message.sender,
          message: message.content,
          server_date: new Date(message.timestamp).getTime()
        });
      }
    });

    if (readedArray.length > 0) {
      try {
        const readedMessagesFetch = await fetch(
          `https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini`
        );

        const readedMessagesRes = await readedMessagesFetch.json();
        let readedMessages = [];

        if (readedMessagesRes.message === "file does not exist") {
          await fetch(
            `https://www.call2all.co.il/ym/api/UploadTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini&contents=${JSON.stringify(readedArray)}`
          );
        } else {
          const readedMessagesData = readedMessagesRes.contents;
          const readedMessagesObj = JSON.parse(readedMessagesData);

          readedMessages = readedMessagesObj;
          readedMessages = readedMessages.concat(readedArray);

          await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              token: `${localStorage.getItem('username')}:${localStorage.getItem('password')}`,
              what: 'ivr2:YemotSMSInboxReadedMessages.ini',
              contents: JSON.stringify(readedMessages)
            })
          });

          conversations.value = conversations.value.map(conversation => {
            if (conversation.id === id) {
              conversation.unreadCount = 0;
            }
            return conversation;
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
  }, 1000);
};

async function init() {
  if (!localStorage.getItem('username') || !localStorage.getItem('password')) {
    loginDialogVisible.value = true;
    usernameFocus.value = true;
  } else {
    document.title = 'מערכת סמסים - ' + localStorage.getItem('username');
    
    // חשוב: בדוק סטטוס התחברות גוגל לפני קריאה ל-getMessages
    // כך שהטוקן יהיה מוכן כאשר getMessages יבקש אנשי קשר
    try {
      console.log('Checking Google auth status during initialization...');
      const status = await checkGoogleAuthStatus();
      googleAuthStatus.value = status;
      console.log('Initial Google auth status:', status);
      
      // הודע לרכיבים על סטטוס האימות
      window.dispatchEvent(new CustomEvent('googleAuthStatusUpdated'));
    } catch (error) {
      console.error('Error checking Google auth status during init:', error);
    }
    
    // עכשיו קבל הודעות עם מידע אנשי הקשר מעודכן (אם קיים)
    await getMessages();
    
    // הגדר בדיקות תקופתיות להודעות חדשות
    setInterval(checkNewMessages, 5000);
  }
}

async function checkNewMessages() {
  try {
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');

    const response = await fetch(
      `https://www.call2all.co.il/ym/api/GetSmsIncomingLog?token=${username}:${password}&limit=1`
    );

    const data = await response.json();
    const message = data.rows[0];

    const lastMessage = localStorage.getItem('lastMessage');
    if (lastMessage === JSON.stringify(message)) {
      return;
    }

    new Notification(
      message.phone.startsWith('972') ? '0' + message.phone.substring(3) : message.phone,
      { body: message.message }
    );

    localStorage.setItem('lastMessage', JSON.stringify(message));
    await refreshMessages();
  } catch (error) {
    console.error('Error checking for new messages:', error);
  }
}

// Update getMessages to use only Google contacts from the service
async function getMessages() {
  try {
    console.log('Getting messages and refreshing data...');
    
    const incoming = await fetch(
      `https://www.call2all.co.il/ym/api/GetSmsIncomingLog?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&limit=999999`
    );

    const outgoing = await fetch(
      `https://www.call2all.co.il/ym/api/GetSmsOutLog?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&limit=999999`
    );

    // Get contacts directly from Google
    let contacts = {};

    // Fetch Google contacts using the service
    const googleContactsResult = await getGoogleContacts();

    if (googleContactsResult.isAuthenticated && googleContactsResult.contacts) {
      // Create a mapping of phone numbers to names from Google contacts
      googleContactsResult.contacts.forEach(contact => {
        if (contact.phone && contact.name) {
          contacts[contact.phone] = contact.name;
        }
      });

      // Update Google auth status
      googleAuthStatus.value = {
        isAuthenticated: true,
        userEmail: googleContactsResult.userData?.email || '',
        contactCount: googleContactsResult.contacts.length
      };
    } else {
      // If not authenticated with Google, show empty contacts
      googleAuthStatus.value = {
        isAuthenticated: false,
        userEmail: '',
        contactCount: 0
      };
    }

    const readedMessagesFetch = await fetch(
      `https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini`
    );

    const readedMessagesRes = await readedMessagesFetch.json();
    let readedMessages = [];

    if (readedMessagesRes.message === "file does not exist") {
      await fetch(
        `https://www.call2all.co.il/ym/api/UploadTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini&contents=${JSON.stringify([])}`
      );
    } else {
      const readedMessagesData = readedMessagesRes.contents;
      const readedMessagesObj = JSON.parse(readedMessagesData);
      readedMessages = readedMessagesObj;
    }

    const incomingMsgs = (await incoming.json()).rows || [];
    const outgoingMsgs = (await outgoing.json()).rows || [];

    const incomingMessages = incomingMsgs.map((message) => {
      const phone = message.phone.startsWith('972') ? '0' + message.phone.substring(3) : message.phone;
      return {
        ...message,
        phone: phone,
        type: 'incoming',
        status: 'DELIVRD'
      };
    });

    const outgoingMessages = outgoingMsgs.map((message) => {
      return {
        dest: message.CallerId,
        phone: message.To,
        message: message.Message,
        server_date: message.Time,
        status: message.DeliveryReport,
        type: 'outgoing'
      };
    });

    localStorage.setItem('lastMessage', JSON.stringify(incomingMsgs[0]));
    conversations.value = [];

    // יצירת רשימת ההודעות המלאה
    let messages = incomingMessages.concat(outgoingMessages);
    messages.sort((a, b) => new Date(b.server_date) - new Date(a.server_date));

    // יצירת מיפוי של הודעות לפי מספר טלפון
    const messagesBySender = messages.reduce((acc, message) => {
      const sender = message.phone;
      if (!acc[sender]) {
        acc[sender] = [];
      }
      acc[sender].push(message);
      return acc;
    }, {});

    // וודא שאין ID זהים
    const usedIds = new Set();

    for (let conversation of removeDuplicates(messages, 'phone')) {
      const lastMessageData = messagesBySender[conversation.phone][0];

      // יצירת ID ייחודי
      let uniqueId = crypto.randomUUID();
      while (usedIds.has(uniqueId)) {
        uniqueId = crypto.randomUUID();
      }
      usedIds.add(uniqueId);

      const msgs = messagesBySender[conversation.phone].reverse().map((message) => {
        // כאן גם ניצור ID ייחודי לכל הודעה
        let msgUniqueId = crypto.randomUUID();
        while (usedIds.has(msgUniqueId)) {
          msgUniqueId = crypto.randomUUID();
        }
        usedIds.add(msgUniqueId);

        return {
          id: msgUniqueId,
          // יתר השדות נשארים כפי שהם
          sender: message.phone,
          content: message.message,
          timestamp: new Date(message.server_date),
          read: readedMessages.some(readedMessage =>
            readedMessage.phone === message.phone &&
            readedMessage.message === message.message &&
            readedMessage.server_date === new Date(message.server_date).getTime()
          ),
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + message.phone,
          type: message.type,
          status: message.status,
        };
      });

      // יצירת ID ייחודי להודעה האחרונה
      let lastMsgUniqueId = crypto.randomUUID();
      while (usedIds.has(lastMsgUniqueId)) {
        lastMsgUniqueId = crypto.randomUUID();
      }
      usedIds.add(lastMsgUniqueId);

      conversations.value.push({
        id: String(uniqueId), // הבטחה שה-ID הוא מחרוזת
        contact: conversation.phone,
        name: contacts[conversation.phone] || conversation.phone,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + conversation.phone,
        lastMessage: {
          id: lastMsgUniqueId,
          // יתר השדות נשארים כפי שהם
          sender: lastMessageData.phone,
          content: lastMessageData.message,
          timestamp: new Date(lastMessageData.server_date),
          read: readedMessages.some(readedMessage =>
            readedMessages.phone === lastMessageData.phone &&
            readedMessages.message === lastMessageData.message &&
            readedMessages.server_date === new Date(lastMessageData.server_date).getTime()
          ),
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + lastMessageData.phone,
          type: lastMessageData.type,
          status: lastMessageData.status,
        },
        messages: msgs,
        unreadCount: msgs.filter((message) => message.type == 'incoming' && message.read == false).length,
      });
    }

    console.log('Created conversations:', conversations.value.map(c => ({ id: c.id, name: c.name })));

    // בסוף הפונקציה
    // שולח אירוע שמציין שסטטוס האימות עודכן
    window.dispatchEvent(new CustomEvent('googleAuthStatusUpdated'));
  } catch (err) {
    console.error('Error getting messages:', err);
  }
}

async function login() {
  loading.value = true;
  error.value = '';

  if (!username.value || !password.value) {
    error.value = 'כל השדות הינם שדות חובה!';
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(`https://www.call2all.co.il/ym/api/GetSession?token=${username.value}:${password.value}`);
    const data = await response.json();

    if (data.responseStatus === 'OK') {
      // שמור פרטי התחברות
      localStorage.setItem('username', username.value);
      localStorage.setItem('password', password.value);
      loginDialogVisible.value = false;
      
      // האם להחליף את init בתהליך התחברות ספציפי יותר?
      // בדוק סטטוס גוגל לפני קבלת הודעות
      console.log('Successfully logged in, checking Google auth status...');
      
      try {
        const status = await checkGoogleAuthStatus();
        googleAuthStatus.value = status;
        console.log('Google auth status after login:', status);
        
        // הודע לכל הרכיבים על עדכון סטטוס האימות
        window.dispatchEvent(new CustomEvent('googleAuthStatusUpdated'));
      } catch (googleError) {
        console.error('Error checking Google status after login:', googleError);
      }
      
      // קבל הודעות וחוזר לשגרה
      await getMessages();
      setInterval(checkNewMessages, 5000);
      
    } else {
      error.value = 'שגיאה בהתחברות: ' + data.message;
    }
  } catch (err) {
    error.value = 'שגיאת התחברות. אנא נסה שוב מאוחר יותר.';
    console.error('Login error:', err);
  } finally {
    loading.value = false;
  }
}

async function refreshMessages() {
  const phone = selectedConversation.value?.contact;
  await getMessages();

  if (phone) {
    handleConversationSelect(conversations.value.find(c => c.contact === phone)?.id || '');
  }
}

function filterConversations(filter) {
  const filtered = conversations.value.filter(conversation => conversation.unreadCount > 0);

  if (!filtered.length) return;

  if (filter) {
    conversations.value = filtered;
  } else {
    getMessages();
  }
}

// Request notification permissions
if ('Notification' in window && Notification.requestPermission) {
  Notification.requestPermission().then((permission) => {
    if (permission === 'granted') {
      console.log('Notification permission granted.');
    } else {
      console.error('Notification permission denied.');
    }
  });
} else {
  console.error('Notifications are not supported by this browser.');
}

// Initialize the application
init();

// הוספת פונקציית removeDuplicates
function removeDuplicates(array, key) {
  return Array.from(
    new Map(array.map((item) => [item[key], item])).values()
  );
}

// Listen for authentication status changes
window.addEventListener('googleAuthStatusChanged', async () => {
  console.log('Google auth status changed, refreshing data...');
  await getMessages();
});
</script>

<template>
  <div class="flex h-full bg-gray-50 relative">
    <MessageView :conversation="selectedConversation" @refresh-messages="refreshMessages" :username="username"
      :selected-id="selectedConversationId" @back="selectedConversation = null, selectedConversationId = null" />

    <ConversationList :conversations="conversations" :selected-id="selectedConversationId"
      @select="handleConversationSelect" @refresh-messages="refreshMessages" @filter="filterConversations" />
  </div>

  <!-- <Google /> -->

  <!-- Login Dialog -->
  <transition name="fade">
    <div v-if="loginDialogVisible"
      class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50 p-4"
      style="backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);">

      <div class="bg-white p-8 rounded-xl shadow-xl w-full max-w-md" @click.stop>
        <div class="flex flex-col items-center mb-6">
          <div class="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-gray-800">התחברות למערכת</h3>
          <p class="text-gray-500 mt-1 text-center">הזן את פרטי ההתחברות שלך כדי להתחיל</p>
        </div>

        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {{ error }}
        </div>

        <div class="space-y-4">
          <label for="username"
            class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors cursor-text">
            <input v-model="username" type="text" id="username" placeholder="מה מספר המערכת שלך?"
              :autofocus="usernameFocus" @keydown.enter="login()"
              class="peer h-10 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900" />
            <span
              class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              מספר מערכת
            </span>
          </label>

          <label for="password"
            class="relative block overflow-hidden rounded-lg border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition-colors cursor-text">
            <input v-model="password" type="password" id="password" placeholder="מה הסיסמא שלך?"
              @keydown.enter="login()"
              class="peer h-10 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900" />
            <span
              class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
              סיסמא
            </span>
          </label>

          <button :disabled="loading" @click="login()" :class="[
            loading ? 'bg-opacity-70 cursor-not-allowed' : 'hover:bg-indigo-500',
            'mt-6 transition-all w-full px-4 py-3 text-white bg-indigo-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 font-medium'
          ]">
            <span v-if="!loading">כניסה למערכת</span>
            <span v-else class="flex justify-center items-center">
              <svg class="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                </path>
              </svg>
              בודק את הפרטים...
            </span>
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&display=swap');

html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Heebo', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
  direction: rtl;
  font-size: 16px;
  /* הגדלת גודל הפונט הכללי ב-1px */
}

#app {
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>