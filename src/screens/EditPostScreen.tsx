import React, { useState } from 'react';
import {
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import firestore from '@react-native-firebase/firestore';
import { RootStackParamList } from '../types/navigation';
import { pickImageFromLibrary, uploadImageToCloudinary } from '../services/imageUpload';
import { getFirestoreErrorMessage } from '../config/firebase';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

type EditPostRouteProp = RouteProp<RootStackParamList, 'EditPost'>;

const EditPostScreen = ({ route }: { route: EditPostRouteProp }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { postId, text: initialText, imageUrl: initialImageUrl } = route.params;
  const [postText, setPostText] = useState(initialText);
  const [imageUri, setImageUri] = useState<string | null>(initialImageUrl ?? null);
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      setImageUri(uri);
    }
  };

  const handleSave = async () => {
    if (!postText.trim()) {
      Alert.alert('Validation', 'Post text cannot be empty.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = initialImageUrl;
      if (imageUri && imageUri !== initialImageUrl && !imageUri.startsWith('http')) {
        imageUrl = await uploadImageToCloudinary(imageUri);
      }

      await firestore()
        .collection('posts')
        .doc(postId)
        .update({
          text: postText.trim(),
          imageUrl: imageUrl ?? firestore.FieldValue.delete(),
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });

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
        title="Edit Post"
        onBack={() => navigation.goBack()}
        backLabel="Cancel"
        rightAction={
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.save}>Save</Text>
            )}
          </TouchableOpacity>
        }
      />

      <TextInput
        style={styles.input}
        value={postText}
        onChangeText={setPostText}
        multiline
        placeholder="Update your post..."
        placeholderTextColor={colors.textMuted}
      />

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : null}

      <TouchableOpacity style={styles.imageButton} onPress={handlePickImage} activeOpacity={0.85}>
        <Text style={styles.imageButtonText}>
          {imageUri ? 'Change Image' : 'Add Image'}
        </Text>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  save: { ...typography.label, fontWeight: '700' },
  input: {
    flex: 1,
    padding: screenPadding,
    fontSize: 16,
    textAlignVertical: 'top',
    color: colors.text,
  },
  preview: {
    width: '90%',
    alignSelf: 'center',
    height: hp('22%'),
    borderRadius: 14,
    marginBottom: hp('2%'),
  },
  imageButton: {
    marginHorizontal: screenPadding,
    marginBottom: hp('3%'),
    backgroundColor: colors.primaryLight,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  imageButtonText: { color: colors.primary, fontWeight: '700' },
});

export default EditPostScreen;
