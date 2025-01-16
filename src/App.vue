<script setup>
import { ref, watchEffect, nextTick } from 'vue';
import ConversationList from './components/ConversationList.vue';
import MessageView from './components/MessageView.vue';

const conversations = ref([]);

const selectedConversationId = ref(null);
const selectedConversation = ref(null);

const loginDialogVisible = ref(false);
const username = ref(localStorage.getItem('username') || '');
const password = ref('');
const usernameFocus = ref(false);
const loading = ref(false);

const setRead = ref(null);

const handleConversationSelect = (id) => {
  setRead.value = null;

  selectedConversationId.value = id;
  selectedConversation.value = conversations.value.find(c => c.id === id) || null;
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
        readedArray.push({ phone: message.sender, message: message.content, server_date: new Date(message.timestamp).getTime() })
      }
    });

    if (readedArray.length > 0) {
      const readedMessagesFetch = await fetch(`https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini`);
      const readedMessagesRes = await readedMessagesFetch.json();

      let readedMessages = [];

      if (readedMessagesRes.message === "file does not exist") {
        await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini&contents=${JSON.stringify(readedArray)}`);
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
    }
  }, 1000);
};

async function init() {
  if (!localStorage.getItem('username') || !localStorage.getItem('password')) {
    loginDialogVisible.value = true;
    usernameFocus.value = true;
  } else {
    document.title = 'מערכת סמסים - ' + localStorage.getItem('username');
    await getMessages();
    setInterval(checkNewMessages, 5000);
  }
}

async function checkNewMessages() {
  try {
    const username = localStorage.getItem('username');
    const password = localStorage.getItem('password');

    const response = await fetch(`https://www.call2all.co.il/ym/api/GetSmsIncomingLog?token=${username}:${password}&limit=1`);
    const data = await response.json();
    const message = data.rows[0];

    const lastMessage = localStorage.getItem('lastMessage');
    if (lastMessage === JSON.stringify(message)) {
      return;
    }

    new Notification(message.phone.startsWith('972') ? '0' + message.phone.substring(3) : message.phone, {
      body: message.message,
    });

    localStorage.setItem('lastMessage', JSON.stringify(message));

    await refreshMessages();
  } catch (error) {
    console.error('Error in performTask:', error);
  }
}

async function getMessages() {
  const incoming = await fetch(`https://www.call2all.co.il/ym/api/GetSmsIncomingLog?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&limit=999999`);
  const outgoing = await fetch(`https://www.call2all.co.il/ym/api/GetSmsOutLog?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&limit=999999`);

  const contactsFetch = await fetch(`https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxContacts.ini`);
  const contactsRes = await contactsFetch.json();

  let contacts = [];

  if (contactsRes.message === "file does not exist") {
    await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxContacts.ini&contents=${JSON.stringify({})}`);
  } else {
    const contactsData = contactsRes.contents;
    const contactsObj = JSON.parse(contactsData);

    contacts = contactsObj;
  }

  const readedMessagesFetch = await fetch(`https://www.call2all.co.il/ym/api/GetTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini`);
  const readedMessagesRes = await readedMessagesFetch.json();

  let readedMessages = [];

  if (readedMessagesRes.message === "file does not exist") {
    await fetch(`https://www.call2all.co.il/ym/api/UploadTextFile?token=${localStorage.getItem('username')}:${localStorage.getItem('password')}&what=ivr2:YemotSMSInboxReadedMessages.ini&contents=${JSON.stringify([])}`);
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

  let messages = incomingMessages.concat(outgoingMessages);

  messages.sort((a, b) => new Date(b.server_date) - new Date(a.server_date));

  const messagesBySender = messages.reduce((acc, message) => {
    const sender = message.phone;
    if (!acc[sender]) {
      acc[sender] = [];
    }
    acc[sender].push(message);
    return acc;
  }, {});

  function removeDuplicates(array, key) {
    return Array.from(
      new Map(array.map((item) => [item[key], item])).values()
    );
  }

  for (let conversation of removeDuplicates(messages, 'phone')) {
    const lastMessageData = messagesBySender[conversation.phone][0];

    const messages = messagesBySender[conversation.phone].reverse().map((message) => {
      return {
        id: crypto.randomUUID(),
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

    conversations.value.push({
      id: crypto.randomUUID(),
      contact: conversation.phone,
      name: contacts[conversation.phone] || conversation.phone,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + conversation.phone,
      lastMessage: {
        id: crypto.randomUUID(),
        sender: lastMessageData.phone,
        content: lastMessageData.message,
        timestamp: new Date(lastMessageData.server_date),
        read: readedMessages.some(readedMessage =>
          readedMessage.phone === lastMessageData.phone &&
          readedMessage.message === lastMessageData.message &&
          readedMessage.server_date === new Date(lastMessageData.server_date).getTime()
        ),
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + lastMessageData.phone,
        type: lastMessageData.type,
        status: lastMessageData.status,
      },
      messages,
      unreadCount: messages.filter((message) => message.type == 'incoming' && message.read == false).length,
    });
  }
}

async function login() {
  loading.value = true;

  if (!username.value || !password.value) {
    alert('כל השדות הינם שדות חובה!');
    return;
  }

  const response = await fetch(`https://www.call2all.co.il/ym/api/GetSession?token=${username.value}:${password.value}`);
  const data = await response.json();

  if (data.responseStatus === 'OK') {
    localStorage.setItem('username', username.value);
    localStorage.setItem('password', password.value);

    loginDialogVisible.value = false;
    init();
  } else {
    alert('שגיאה בהתחברות!\n' + data.message);
  }

  loading.value = false;
}

init();

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
</script>

<template>
  <div class="flex h-full bg-white">
    <ConversationList :conversations="conversations" :selected-id="selectedConversationId"
      @select="handleConversationSelect" @refresh-messages="refreshMessages" @filter="filterConversations" />
    <MessageView :conversation="selectedConversation" @refresh-messages="refreshMessages" :username="username"
      :selected-id="selectedConversationId" @back="selectedConversation = null, selectedConversationId = null" />
  </div>

  <!-- דיאלוג להזנת שם משתמש וסיסמה -->
  <div v-if="loginDialogVisible" class="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50"
    style="backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);">
    <div class="bg-white p-6 rounded shadow-md w-96">
      <h3 class="text-lg font-semibold mb-4">התחברות למערכת</h3>
      <label for="username"
        class="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-colors cursor-text mt-3">
        <input @keydown.enter="login()" v-model="username" type="text" id="username" placeholder="מה מספר המערכת שלך?"
          :autofocus="usernameFocus"
          class="peer h-9 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900" />
        <span
          class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
          מספר מערכת
        </span>
      </label>
      <label for="password"
        class="relative block overflow-hidden rounded-md border border-gray-200 px-3 pt-3 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 transition-colors cursor-text mt-3">
        <input @keydown.enter="login()" v-model="password" type="password" id="password" placeholder="מה הסיסמא שלך?"
          class="peer h-9 w-full border-none bg-transparent p-0 placeholder-transparent focus:placeholder-gray-400 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm text-gray-900" />
        <span
          class="absolute start-3 top-3 -translate-y-1/2 text-xs text-gray-500 transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-3 peer-focus:text-xs">
          סיסמא
        </span>
      </label>
      <button :disabled="loading" @click="login()"
        :class="[loading ? 'bg-opacity-80' : 'hover:bg-blue-500', 'mt-4 transition-all w-full px-4 py-2 tracking-wide text-white duration-200 transform bg-blue-600 rounded-md focus:outline-none focus:bg-blue-500 focus:ring-blue-400 focus:ring-offset-2 focus:ring-2']">
        <span v-if="!loading">כניסה למערכת</span>
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
