import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import PostCard from '../components/PostCard';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { RootStackParamList } from '../types/navigation';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { setPosts, setPostsError, setPostsLoading } from '../store/slices/postsSlice';
import { useNetworkStatus, isOnline } from '../hooks/useNetworkStatus';
import { getFirestoreErrorMessage } from '../config/firebase';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

type FeedPost = {
  id: string;
  userId: string;
  text: string;
  imageUrl?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
};

const HomeScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const { items: posts, loading, error } = useAppSelector(state => state.posts);
  const network = useNetworkStatus();
  const [refreshing, setRefreshing] = useState(false);
  const currentUserId = auth().currentUser?.uid;
  const postsUnsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!currentUserId || !isOnline(network)) {
      postsUnsubscribeRef.current?.();
      postsUnsubscribeRef.current = null;
      if (!isOnline(network)) {
        dispatch(setPostsError('Offline — showing cached posts when available.'));
        dispatch(setPostsLoading(false));
      }
      return;
    }

    dispatch(setPostsLoading(true));

    const unsubscribeFollows = firestore()
      .collection('follows')
      .where('followerId', '==', currentUserId)
      .onSnapshot(
        followSnapshot => {
          postsUnsubscribeRef.current?.();

          const followingIds = followSnapshot.docs.map(
            doc => doc.data().followingId as string,
          );
          const idsToFetch = Array.from(new Set([...followingIds, currentUserId])).slice(
            0,
            30,
          );

          postsUnsubscribeRef.current = firestore()
            .collection('posts')
            .where('userId', 'in', idsToFetch)
            .orderBy('createdAt', 'desc')
            .onSnapshot(
              async postsSnapshot => {
                const basePosts = postsSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...(doc.data() as Omit<FeedPost, 'id'>),
                }));

                const uniqueUserIds = Array.from(
                  new Set(basePosts.map(post => post.userId)),
                );
                const userMap = new Map<string, { name?: string; photoUrl?: string }>();

                await Promise.all(
                  uniqueUserIds.map(async uid => {
                    const userDoc = await firestore().collection('users').doc(uid).get();
                    if (userDoc.exists()) {
                      userMap.set(uid, userDoc.data() as { name?: string; photoUrl?: string });
                    }
                  }),
                );

                const enrichedPosts = basePosts.map(post => ({
                  ...post,
                  authorName: userMap.get(post.userId)?.name,
                  authorPhotoUrl: userMap.get(post.userId)?.photoUrl,
                }));

                dispatch(setPosts(enrichedPosts));
                setRefreshing(false);
              },
              postsError => {
                dispatch(setPostsError(getFirestoreErrorMessage(postsError)));
                setRefreshing(false);
              },
            );
        },
        followError => {
          dispatch(setPostsError(getFirestoreErrorMessage(followError)));
          dispatch(setPostsLoading(false));
          setRefreshing(false);
        },
      );

    return () => {
      unsubscribeFollows();
      postsUnsubscribeRef.current?.();
      postsUnsubscribeRef.current = null;
    };
  }, [currentUserId, dispatch, network.isConnected, network.isInternetReachable]);

  const listHeader = useMemo(
    () => (
      <TouchableOpacity
        style={styles.createPostBar}
        onPress={() => navigation.navigate('Post')}
        activeOpacity={0.85}
      >
        <View style={styles.avatarMini} />
        <Text style={styles.createPostText}>What's on your mind?</Text>
      </TouchableOpacity>
    ),
    [navigation],
  );

  const emptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          No posts yet. Follow people or create your first post!
        </Text>
      </View>
    ),
    [],
  );

  return (
    <Screen backgroundColor={colors.background}>
      <ScreenHeader
        title="Home Feed"
        rightAction={
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Text style={styles.searchLink}>Search</Text>
          </TouchableOpacity>
        }
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {loading && posts.length === 0 ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={emptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => <PostCard item={item} />}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  searchLink: { ...typography.label },
  errorText: {
    color: colors.warning,
    backgroundColor: colors.warningBg,
    padding: wp('3%'),
    textAlign: 'center',
    fontSize: wp('3.4%'),
  },
  loader: { marginTop: hp('6%') },
  listContainer: {
    padding: screenPadding,
    paddingBottom: hp('2%'),
  },
  createPostBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: wp('3.5%'),
    borderRadius: 14,
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: colors.border,
  },
  createPostText: { ...typography.body, color: colors.textSecondary, marginLeft: wp('3%') },
  avatarMini: {
    width: wp('9%'),
    height: wp('9%'),
    borderRadius: wp('4.5%'),
    backgroundColor: colors.borderLight,
  },
  emptyContainer: { marginTop: hp('6%'), alignItems: 'center', paddingHorizontal: screenPadding },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});

export default HomeScreen;
