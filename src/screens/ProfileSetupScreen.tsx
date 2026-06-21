import React, { useState } from 'react';
import {
  TextInput,
  Image,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { uploadImageToCloudinary, pickImageFromLibrary } from '../services/imageUpload';
import { getFirestoreErrorMessage } from '../config/firebase';
import Screen from '../components/layout/Screen';
import ScreenHeader from '../components/layout/ScreenHeader';
import { wp, hp } from '../hooks/useResponsive';
import { colors } from '../theme/colors';
import { screenPadding } from '../theme/spacing';
import { typography } from '../theme/typography';

const ProfileSetupScreen = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectImage = async () => {
    const uri = await pickImageFromLibrary();
    if (uri) {
      setImageUri(uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !bio.trim() || !imageUri) {
      Alert.alert(
        'Validation Error',
        'Please fill all fields and pick an image.',
      );
      return;
    }

    setLoading(true);
    const userId = auth().currentUser?.uid;

    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      setLoading(false);
      return;
    }

    try {
      const imageUrl = await uploadImageToCloudinary(imageUri);

      await firestore().collection('users').doc(userId).set(
        {
          name: name.trim(),
          bio: bio.trim(),
          photoUrl: imageUrl,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      Alert.alert('Success', 'Profile saved!');
    } catch (error) {
      Alert.alert('Error', getFirestoreErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <ScreenHeader title="Setup Profile" bordered />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.subtitle}>
            Add a photo and tell people a little about yourself.
          </Text>

          <TouchableOpacity onPress={selectImage} style={styles.imagePlaceholder} activeOpacity={0.85}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.image} />
            ) : (
              <Text style={styles.placeholderText}>Tap to add photo</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveProfile}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: screenPadding,
    paddingBottom: hp('4%'),
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: hp('3%'),
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: hp('1.5%'),
    borderRadius: 12,
    backgroundColor: colors.background,
    fontSize: 16,
    color: colors.text,
  },
  bioInput: {
    minHeight: hp('12%'),
    paddingTop: 14,
  },
  imagePlaceholder: {
    width: wp('32%'),
    height: wp('32%'),
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: hp('3%'),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp('16%'),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  image: { width: '100%', height: '100%' },
  placeholderText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 12 },
  primaryButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: hp('2%'),
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default ProfileSetupScreen;
