import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { RootStackParamList } from '../types/navigation';
import {
  Conversation,
  subscribeToConversations,
} from '../services/chatService';
import { getFirestoreErrorMessage } from '../config/firebase';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

interface ConversationRow extends Conversation {
  otherUserName?: string;
}

const ChatListScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const currentUserId = auth().currentUser?.uid;
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const unsubscribe = subscribeToConversations(
      currentUserId,
      async rows => {
        const enriched = await Promise.all(
          rows.map(async row => {
            const otherUserId = row.participantIds.find(id => id !== currentUserId);
            if (!otherUserId) {
              return row;
            }
            const userDoc = await firestore().collection('users').doc(otherUserId).get();
            return {
              ...row,
              otherUserName: userDoc.data()?.name ?? 'User',
            };
          }),
        );
        setConversations(enriched);
        setLoading(false);
      },
      listenerError => {
        setError(getFirestoreErrorMessage(listenerError));
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [currentUserId]);

  return (
    <Screen>
      <ScreenHeader title="Messages" />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : undefined}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No conversations yet. Message someone from their profile.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  otherUserName: item.otherUserName ?? 'User',
                })
              }
              activeOpacity={0.7}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.otherUserName ?? 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{item.otherUserName ?? 'User'}</Text>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage ?? 'Start chatting'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  error: {
    color: colors.warning,
    textAlign: 'center',
    padding: wp('3%'),
    backgroundColor: colors.warningBg,
  },
  loader: { marginTop: hp('5%') },
  emptyList: { flexGrow: 1 },
  empty: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: hp('8%'),
    paddingHorizontal: screenPadding,
    ...typography.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp('3%'),
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: wp('4.5%') },
  rowContent: { flex: 1 },
  rowTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  preview: { ...typography.caption, marginTop: 3 },
});

export default ChatListScreen;
