import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { RootStackParamList } from '../types/navigation';
import { pickImageFromLibrary, uploadImageToCloudinary } from '../services/imageUpload';
import { getFirestoreErrorMessage } from '../config/firebase';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

const PostScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [postText, setPostText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      setImageUri(uri);
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) {
      return;
    }

    setLoading(true);
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        imageUrl = await uploadImageToCloudinary(imageUri);
      }

      await firestore().collection('posts').add({
        text: postText.trim(),
        userId: auth().currentUser?.uid,
        imageUrl,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      setPostText('');
      setImageUri(null);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', getFirestoreErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Create Post"
        onBack={() => navigation.goBack()}
        backLabel="Cancel"
        rightAction={
          <TouchableOpacity onPress={handlePost} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.postButtonTextHeader}>Post</Text>
            )}
          </TouchableOpacity>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          value={postText}
          onChangeText={setPostText}
          multiline
          autoFocus
          placeholderTextColor={colors.textMuted}
        />

        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : null}

        <TouchableOpacity style={styles.imageButton} onPress={handlePickImage} activeOpacity={0.85}>
          <Text style={styles.imageButtonText}>Add Photo</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  postButtonTextHeader: { ...typography.label, fontWeight: '700' },
  inputContainer: { flex: 1, padding: screenPadding },
  input: {
    fontSize: 16,
    flex: 1,
    color: colors.text,
    textAlignVertical: 'top',
    lineHeight: 24,
  },
  preview: {
    width: '100%',
    height: hp('22%'),
    borderRadius: 14,
    marginBottom: hp('2%'),
  },
  imageButton: {
    backgroundColor: colors.primaryLight,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  imageButtonText: { color: colors.primary, fontWeight: '700' },
});

export default PostScreen;
