import axios from 'axios';

const CLOUD_NAME = 'dt4unxor3';
const UPLOAD_PRESET = 'social_connect_preset';

export async function uploadImageToCloudinary(uri: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'upload.jpg',
  } as unknown as Blob);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await axios.post(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return response.data.secure_url as string;
}

export async function pickImageFromLibrary(): Promise<string | null> {
  const { launchImageLibrary } = await import('react-native-image-picker');

  return new Promise(resolve => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.6 }, response => {
      if (response.didCancel || !response.assets?.[0]?.uri) {
        resolve(null);
        return;
      }
      resolve(response.assets[0].uri ?? null);
    });
  });
}
