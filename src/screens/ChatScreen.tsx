import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import { RootStackParamList } from '../types/navigation';
import {
  ChatMessage,
  sendMessage,
  subscribeToMessages,
} from '../services/chatService';
import { getFirestoreErrorMessage } from '../config/firebase';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

type ChatRouteProp = RouteProp<RootStackParamList, 'Chat'>;

const ChatScreen = ({ route }: { route: ChatRouteProp }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { conversationId, otherUserName } = route.params;
  const currentUserId = auth().currentUser?.uid;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(
      conversationId,
      setMessages,
      listenerError => setError(getFirestoreErrorMessage(listenerError)),
    );
    return unsubscribe;
  }, [conversationId]);

  const handleSend = async () => {
    if (!currentUserId || !text.trim()) {
      return;
    }

    try {
      await sendMessage(conversationId, currentUserId, text);
      setText('');
    } catch (sendError) {
      setError(getFirestoreErrorMessage(sendError));
    }
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title={otherUserName} onBack={() => navigation.goBack()} />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          data={messages}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isMine = item.senderId === currentUserId;
            return (
              <View
                style={[
                  styles.bubble,
                  isMine ? styles.myBubble : styles.theirBubble,
                ]}
              >
                <Text style={[styles.bubbleText, isMine && styles.myBubbleText]}>
                  {item.text}
                </Text>
              </View>
            );
          }}
        />

        <View style={styles.inputRow}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton} activeOpacity={0.85}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  error: {
    color: colors.warning,
    textAlign: 'center',
    padding: wp('2%'),
    backgroundColor: colors.warningBg,
  },
  container: { flex: 1, backgroundColor: colors.background },
  listContent: {
    padding: screenPadding,
    paddingBottom: hp('1%'),
    flexGrow: 1,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.2%'),
    borderRadius: 18,
    marginBottom: hp('1%'),
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { ...typography.body, color: colors.text },
  myBubbleText: { color: '#fff' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    marginRight: 10,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  sendButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  sendText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});

export default ChatScreen;
