import React, { useState, useEffect } from 'react';
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
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { RootStackParamList } from '../types/navigation';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

type CommentsScreenRouteProp = RouteProp<RootStackParamList, 'Comments'>;

const CommentsScreen = ({ route }: { route: CommentsScreenRouteProp }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { postId } = route.params;
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('comments')
      .where('postId', '==', postId)
      .orderBy('createdAt', 'asc')
      .onSnapshot(snapshot => {
        setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    return () => unsubscribe();
  }, [postId]);

  const addComment = async () => {
    if (!commentText.trim()) {
      return;
    }
    await firestore().collection('comments').add({
      postId,
      userId: auth().currentUser?.uid,
      text: commentText,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
    setCommentText('');
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScreenHeader title="Comments" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>No comments yet. Be the first!</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Text style={styles.commentText}>{item.text}</Text>
            </View>
          )}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <TouchableOpacity onPress={addComment} style={styles.postButton} activeOpacity={0.85}>
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: {
    paddingBottom: 12,
    flexGrow: 1,
  },
  empty: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  commentItem: {
    paddingHorizontal: screenPadding,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  commentText: { ...typography.body, color: colors.text },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: screenPadding,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
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
  postButton: { paddingHorizontal: 4, paddingVertical: 8 },
  postButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },
});

export default CommentsScreen;
