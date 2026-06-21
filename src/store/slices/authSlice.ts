import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

export interface UserProfile {
  uid: string;
  name: string;
  bio: string;
  photoUrl?: string;
}

interface AuthState {
  user: FirebaseAuthTypes.User | null;
  profile: UserProfile | null;
  profileCompleted: boolean;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  profileCompleted: false,
  initializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthUser(state, action: PayloadAction<FirebaseAuthTypes.User | null>) {
      state.user = action.payload;
    },
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
      state.profileCompleted = action.payload !== null;
    },
    setInitializing(state, action: PayloadAction<boolean>) {
      state.initializing = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.profile = null;
      state.profileCompleted = false;
      state.initializing = false;
    },
  },
});

export const { setAuthUser, setProfile, setInitializing, clearAuth } =
  authSlice.actions;
export default authSlice.reducer;
