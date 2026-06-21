import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { RootStackParamList } from '../types/navigation';
import { getFirestoreErrorMessage } from '../config/firebase';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

interface SearchUser {
  id: string;
  name: string;
  bio?: string;
  photoUrl?: string;
}

const SearchScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [posts, setPosts] = useState<
    Array<{ id: string; text: string; userId: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) {
      setUsers([]);
      setPosts([]);
      setError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const usersSnapshot = await firestore()
          .collection('users')
          .orderBy('name')
          .startAt(trimmed)
          .endAt(`${trimmed}\uf8ff`)
          .limit(20)
          .get();

        const matchedUsers = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<SearchUser, 'id'>),
        }));
        setUsers(matchedUsers);

        const postsSnapshot = await firestore()
          .collection('posts')
          .orderBy('text')
          .startAt(trimmed)
          .endAt(`${trimmed}\uf8ff`)
          .limit(20)
          .get();

        setPosts(
          postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as { text: string; userId: string }),
          })),
        );
      } catch (searchError) {
        setError(getFirestoreErrorMessage(searchError));
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <Screen>
      <ScreenHeader title="Search" onBack={() => navigation.goBack()} />

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search users or posts..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          autoFocus
        />
      </View>

      {loading ? <ActivityIndicator style={styles.loader} color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={[
          ...users.map(user => ({ type: 'user' as const, ...user })),
          ...posts.map(post => ({ type: 'post' as const, ...post })),
        ]}
        keyExtractor={item => `${item.type}-${item.id}`}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          query.trim().length >= 2 && !loading ? (
            <Text style={styles.empty}>No matches found.</Text>
          ) : null
        }
        renderItem={({ item }) =>
          item.type === 'user' ? (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
              activeOpacity={0.7}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSubtitle}>{item.bio ?? 'User profile'}</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.row}>
              <View style={styles.postBadge}>
                <Text style={styles.postBadgeText}>Post</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowSubtitle} numberOfLines={2}>{item.text}</Text>
              </View>
            </View>
          )
        }
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  searchBox: {
    paddingHorizontal: screenPadding,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  loader: { marginVertical: hp('2%') },
  error: { color: colors.warning, textAlign: 'center', marginBottom: hp('1%') },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: hp('4%') },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenPadding,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
    gap: 12,
    backgroundColor: colors.surface,
  },
  avatar: { width: wp('11%'), height: wp('11%'), borderRadius: wp('5.5%') },
  avatarPlaceholder: {
    width: wp('11%'),
    height: wp('11%'),
    borderRadius: wp('5.5%'),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  rowText: { flex: 1 },
  rowTitle: { fontWeight: '700', fontSize: 16, color: colors.text },
  rowSubtitle: { ...typography.caption, marginTop: 2 },
  postBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  postBadgeText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
});

export default SearchScreen;
