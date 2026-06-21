import firestore from '@react-native-firebase/firestore';

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

export interface Conversation {
  id: string;
  participantIds: string[];
  lastMessage?: string;
  updatedAt?: { seconds: number; nanoseconds: number } | null;
}

export function getConversationId(userA: string, userB: string): string {
  return [userA, userB].sort().join('_');
}

export function subscribeToConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError: (error: unknown) => void,
) {
  return firestore()
    .collection('conversations')
    .where('participantIds', 'array-contains', userId)
    .orderBy('updatedAt', 'desc')
    .onSnapshot(
      snapshot => {
        onUpdate(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Conversation, 'id'>),
          })),
        );
      },
      onError,
    );
}

export function subscribeToMessages(
  conversationId: string,
  onUpdate: (messages: ChatMessage[]) => void,
  onError: (error: unknown) => void,
) {
  return firestore()
    .collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'asc')
    .onSnapshot(
      snapshot => {
        onUpdate(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<ChatMessage, 'id'>),
          })),
        );
      },
      onError,
    );
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed) {
    return;
  }

  const conversationRef = firestore().collection('conversations').doc(conversationId);
  const batch = firestore().batch();
  const messageRef = conversationRef.collection('messages').doc();

  batch.set(messageRef, {
    text: trimmed,
    senderId,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });

  batch.set(
    conversationRef,
    {
      participantIds: conversationId.split('_'),
      lastMessage: trimmed,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await batch.commit();
}

export async function startConversation(
  currentUserId: string,
  otherUserId: string,
): Promise<string> {
  const conversationId = getConversationId(currentUserId, otherUserId);
  await firestore()
    .collection('conversations')
    .doc(conversationId)
    .set(
      {
        participantIds: [currentUserId, otherUserId].sort(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

  return conversationId;
}
