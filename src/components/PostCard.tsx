import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LikeButton from './LikeButton';
import { RootStackParamList } from '../types/navigation';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

interface PostCardProps {
  item: {
    id: string;
    userId: string;
    text: string;
    imageUrl?: string;
    authorName?: string;
    authorPhotoUrl?: string;
  };
  showOwnerActions?: boolean;
}

const PostCard = ({ item, showOwnerActions = false }: PostCardProps) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const userId = auth().currentUser?.uid;
  const isOwner = userId === item.userId;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = firestore()
      .collection('likes')
      .where('postId', '==', item.id)
      .onSnapshot(snapshot => {
        setLikeCount(snapshot.size);
        setLiked(snapshot.docs.some(doc => doc.data().userId === userId));
      });

    return unsubscribe;
  }, [item.id, userId]);

  const toggleLike = useCallback(async () => {
    if (!userId) {
      return;
    }

    const snapshot = await firestore()
      .collection('likes')
      .where('postId', '==', item.id)
      .where('userId', '==', userId)
      .get();

    if (snapshot.empty) {
      await firestore().collection('likes').add({
        postId: item.id,
        userId,
      });
    } else {
      await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
    }
  }, [item.id, userId]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete post', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await firestore().collection('posts').doc(item.id).delete();
        },
      },
    ]);
  }, [item.id]);

  const header = useMemo(
    () => (
      <TouchableOpacity
        style={styles.postHeader}
        onPress={() => navigation.navigate('UserProfile', { userId: item.userId })}
      >
        {item.authorPhotoUrl ? (
          <Image source={{ uri: item.authorPhotoUrl }} style={styles.avatarSmall} />
        ) : (
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarInitial}>
              {(item.authorName ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.postAuthor}>{item.authorName ?? 'User'}</Text>
      </TouchableOpacity>
    ),
    [item.authorName, item.authorPhotoUrl, item.userId, navigation],
  );

  return (
    <View style={styles.postCard}>
      <View style={styles.topRow}>
        {header}
        {(showOwnerActions || isOwner) && (
          <View style={styles.ownerActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditPost', { postId: item.id, text: item.text, imageUrl: item.imageUrl })}
              hitSlop={8}
            >
              <Ionicons name="create-outline" size={wp('5%')} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} hitSlop={8}>
              <Ionicons name="trash-outline" size={wp('5%')} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.postText}>{item.text}</Text>

      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.footer}>
        <LikeButton liked={liked} likeCount={likeCount} onToggle={toggleLike} />
        <TouchableOpacity
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
          style={styles.commentButton}
        >
          <Ionicons name="chatbubble-outline" size={wp('6%')} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    padding: screenPadding,
    marginBottom: hp('1.5%'),
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1.2%'),
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ownerActions: { flexDirection: 'row', gap: wp('3%') },
  avatarSmall: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: colors.primary,
    marginRight: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: wp('3.5%') },
  postAuthor: { fontWeight: '700', color: colors.text, fontSize: 15 },
  postText: { ...typography.body, color: '#374151', marginBottom: hp('1.2%'), lineHeight: 22 },
  postImage: {
    width: '100%',
    height: hp('22%'),
    borderRadius: 12,
    marginBottom: hp('1.2%'),
    backgroundColor: colors.borderLight,
  },
  footer: { flexDirection: 'row', alignItems: 'center' },
  commentButton: { marginLeft: wp('5%') },
});

export default React.memo(PostCard);
