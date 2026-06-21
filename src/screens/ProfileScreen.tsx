import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';
import PostCard from '../components/PostCard';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { startConversation } from '../services/chatService';
import { pickImageFromLibrary, uploadImageToCloudinary } from '../services/imageUpload';
import { getFirestoreErrorMessage } from '../config/firebase';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

type ProfileScreenRouteProp = RouteProp<RootStackParamList, 'UserProfile' | 'Profile'>;

type ProfileNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList>,
  BottomTabNavigationProp<MainTabParamList>
>;

const ProfileScreen = ({ route }: { route?: ProfileScreenRouteProp }) => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const userId = route?.params?.userId || auth().currentUser?.uid;
  const currentUserId = auth().currentUser?.uid;

  const [userData, setUserData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = firestore()
      .collection('users')
      .doc(userId)
      .onSnapshot(doc => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
        setLoading(false);
      });

    return unsubscribe;
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribe = firestore()
      .collection('posts')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .onSnapshot(snapshot => {
        setUserPosts(
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            authorName: userData?.name,
            authorPhotoUrl: userData?.photoUrl,
          })),
        );
      });

    return unsubscribe;
  }, [userId, userData?.name, userData?.photoUrl]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const unsubscribeCount = firestore()
      .collection('follows')
      .where('followingId', '==', userId)
      .onSnapshot(snapshot => setFollowerCount(snapshot.size));

    let unsubscribeStatus = () => {};
    if (currentUserId && currentUserId !== userId) {
      unsubscribeStatus = firestore()
        .collection('follows')
        .where('followerId', '==', currentUserId)
        .where('followingId', '==', userId)
        .onSnapshot(snapshot => setIsFollowing(!snapshot.empty));
    }

    return () => {
      unsubscribeCount();
      unsubscribeStatus();
    };
  }, [userId, currentUserId]);

  const toggleFollow = async () => {
    if (!currentUserId || !userId) {
      return;
    }

    try {
      const snapshot = await firestore()
        .collection('follows')
        .where('followerId', '==', currentUserId)
        .where('followingId', '==', userId)
        .get();

      if (snapshot.empty) {
        await firestore().collection('follows').add({
          followerId: currentUserId,
          followingId: userId,
        });
      } else {
        await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
      }
    } catch (error) {
      Alert.alert('Error', getFirestoreErrorMessage(error));
    }
  };

  const openChat = async () => {
    if (!currentUserId || !userId) {
      return;
    }

    try {
      const conversationId = await startConversation(currentUserId, userId);
      const chatParams = {
        conversationId,
        otherUserName: userData?.name ?? 'User',
      };

      const looseNav = navigation as unknown as {
        navigate: (name: string, params?: object) => void;
      };

      if (route?.params?.userId) {
        looseNav.navigate('Chat', chatParams);
      } else {
        looseNav.navigate('Messages', { screen: 'Chat', params: chatParams });
      }
    } catch (error) {
      Alert.alert('Error', getFirestoreErrorMessage(error));
    }
  };

  const updateProfilePhoto = async () => {
    if (currentUserId !== userId) {
      return;
    }

    const uri = await pickImageFromLibrary();
    if (!uri) {
      return;
    }

    setUpdatingPhoto(true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(uri);
      await firestore().collection('users').doc(userId).set(
        { photoUrl: uploadedUrl, updatedAt: firestore.FieldValue.serverTimestamp() },
        { merge: true },
      );
    } catch (error) {
      Alert.alert('Error', getFirestoreErrorMessage(error));
    } finally {
      setUpdatingPhoto(false);
    }
  };

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (!userData?.photoUrl) {
        return;
      }

      try {
        if (userData.photoUrl.startsWith('http')) {
          setImageUrl(userData.photoUrl);
        } else {
          const url = await storage().ref(userData.photoUrl).getDownloadURL();
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Error fetching image URL:', error);
        setImageError(true);
      }
    };

    fetchImageUrl();
  }, [userData?.photoUrl]);

  const renderPost = useCallback(
    ({ item }: { item: any }) => <PostCard item={item} showOwnerActions={currentUserId === userId} />,
    [currentUserId, userId],
  );

  const isOtherProfile = Boolean(route?.params?.userId);

  if (loading) {
    return (
      <Screen backgroundColor={colors.background}>
        <ScreenHeader
          title={isOtherProfile ? 'Profile' : 'My Profile'}
          onBack={isOtherProfile ? () => navigation.goBack() : undefined}
        />
        <ActivityIndicator size="large" color={colors.primary} style={styles.center} />
      </Screen>
    );
  }

  return (
    <Screen backgroundColor={colors.background}>
      <ScreenHeader
        title={isOtherProfile ? userData?.name ?? 'Profile' : 'My Profile'}
        onBack={isOtherProfile ? () => navigation.goBack() : undefined}
      />
      <FlatList
        data={userPosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        initialNumToRender={5}
        windowSize={5}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.profileContent}>
            <TouchableOpacity
              onPress={updateProfilePhoto}
              disabled={currentUserId !== userId || updatingPhoto}
            >
              <View style={styles.imageContainer}>
                {imageUrl && !imageError ? (
                  <Image source={{ uri: imageUrl }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>
                      {userData?.name?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                {updatingPhoto ? (
                  <ActivityIndicator style={styles.photoLoader} color="#6366F1" />
                ) : null}
              </View>
            </TouchableOpacity>

            <Text style={styles.name}>{userData?.name || 'No Name'}</Text>
            <Text style={styles.bio}>{userData?.bio || 'No Bio'}</Text>
            <Text style={styles.followerCountText}>{followerCount} Followers</Text>

            {currentUserId !== userId && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[
                    styles.followButton,
                    isFollowing ? styles.followingButton : styles.followButtonActive,
                  ]}
                  onPress={toggleFollow}
                >
                  <Text style={isFollowing ? styles.followingText : styles.followText}>
                    {isFollowing ? 'Following' : 'Follow'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.messageButton} onPress={openChat}>
                  <Text style={styles.messageText}>Message</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.postsHeader}>Posts</Text>
          </View>
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  listContent: { paddingBottom: hp('2%'), paddingHorizontal: screenPadding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileContent: {
    alignItems: 'center',
    paddingVertical: hp('2.5%'),
    paddingHorizontal: screenPadding,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: hp('1.5%'),
  },
  imageContainer: { marginBottom: hp('2.5%') },
  profileImage: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: '#F3F4F6',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#6366F1',
  },
  placeholderText: { color: '#fff', fontSize: wp('10%'), fontWeight: '800' },
  photoLoader: { position: 'absolute', alignSelf: 'center', top: wp('12%') },
  name: { ...typography.h2, marginTop: 4 },
  bio: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: hp('1%') },
  followerCountText: {
    ...typography.caption,
    fontWeight: '600',
    marginVertical: hp('1.5%'),
  },
  actionRow: { flexDirection: 'row', gap: wp('3%'), marginBottom: hp('1%') },
  followButton: {
    paddingVertical: 10,
    paddingHorizontal: wp('7%'),
    borderRadius: 24,
  },
  followButtonActive: { backgroundColor: colors.primary },
  followingButton: { backgroundColor: colors.borderLight },
  followText: { color: '#fff', fontWeight: '700' },
  followingText: { color: colors.text, fontWeight: '700' },
  messageButton: {
    paddingVertical: 10,
    paddingHorizontal: wp('7%'),
    borderRadius: 24,
    backgroundColor: colors.text,
  },
  messageText: { color: '#fff', fontWeight: '700' },
  postsHeader: {
    ...typography.h3,
    alignSelf: 'flex-start',
    marginTop: hp('1%'),
    marginBottom: hp('1%'),
  },
});

export default ProfileScreen;
