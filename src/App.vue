<script setup lang="ts">
import { ref, watchEffect, nextTick } from 'vue';
import type { Conversation } from './types/message';
import ConversationList from './components/ConversationList.vue';
import MessageView from './components/MessageView.vue';

const conversations = ref<Conversation[]>([]);

const selectedConversationId = ref<string | null>(null);
const selectedConversation = ref<Conversation | null>(null);

const handleConversationSelect = (id: string) => {
  selectedConversationId.value = id;
  selectedConversation.value = conversations.value.find(c => c.id === id) || null;
  watchEffect(() => {
    nextTick(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
  }, {
    flush: 'post'
  });
};

async function getMessages() {
  const incoming = await fetch(`https://www.call2all.co.il/ym/api/GetSmsIncomingLog?token=${import.meta.env.VITE_YEMOT_API_USERNAME}:${import.meta.env.VITE_YEMOT_API_PASSWORD}&limit=999999`);
  const outgoing = await fetch(`https://www.call2all.co.il/ym/api/GetSmsOutLog?token=${import.meta.env.VITE_YEMOT_API_USERNAME}:${import.meta.env.VITE_YEMOT_API_PASSWORD}&limit=999999`);

  const incomingMessages = (await incoming.json()).rows.map(message => {
    return {
      ...message,
      phone: message.phone.startsWith('972') ? '0' + message.phone.substring(3) : message.phone,
      type: 'incoming'
    }
  });
  const outgoingMessages = (await outgoing.json()).rows.map(message => {
    return {
      dest: message.CallerId,
      phone: message.To,
      message: message.Message,
      server_date: message.Time,
      type: 'outgoing'
    }
  });

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
      new Map(array.map(item => [item[key], item])).values()
    );
  }

  for (let conversation of removeDuplicates(messages, 'phone')) {
    conversations.value.push({
      id: crypto.randomUUID(),
      contact: conversation.phone,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + conversation.phone,
      unreadCount: 0,
      lastMessage: {
        id: crypto.randomUUID(),
        sender: messagesBySender[conversation.phone][0].phone,
        content: messagesBySender[conversation.phone][0].message,
        timestamp: new Date(messagesBySender[conversation.phone][0].server_date),
        read: true,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + messagesBySender[conversation.phone][0].phone,
        type: messagesBySender[conversation.phone][0].type
      },
      messages: messagesBySender[conversation.phone].reverse().map(message => {
        return {
          id: crypto.randomUUID(),
          sender: message.phone,
          content: message.message,
          timestamp: new Date(message.server_date),
          read: true,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + message.phone,
          type: message.type
        }
      })
    })
  }
}

getMessages();

async function refreshMessages() {
  const phone = selectedConversation.value.contact;

  await getMessages();
  handleConversationSelect(conversations.value.find(c => c.contact === phone).id);
}
</script>

<template>
  <div class="flex h-full bg-white">
    <ConversationList :conversations="conversations" :selected-id="selectedConversationId"
      @select="handleConversationSelect" />
    <MessageView :conversation="selectedConversation" @refresh-messages="refreshMessages" />
  </div>
</template>