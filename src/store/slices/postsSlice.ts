import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Post {
  id: string;
  userId: string;
  text: string;
  imageUrl?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  createdAt?: { seconds: number; nanoseconds: number } | null;
}

interface PostsState {
  items: Post[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  items: [],
  loading: true,
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    setPosts(state, action: PayloadAction<Post[]>) {
      state.items = action.payload;
      state.loading = false;
      state.error = null;
    },
    setPostsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setPostsError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.loading = false;
    },
    upsertPost(state, action: PayloadAction<Post>) {
      const index = state.items.findIndex(post => post.id === action.payload.id);
      if (index >= 0) {
        state.items[index] = action.payload;
      } else {
        state.items.unshift(action.payload);
      }
    },
    removePost(state, action: PayloadAction<string>) {
      state.items = state.items.filter(post => post.id !== action.payload);
    },
  },
});

export const {
  setPosts,
  setPostsLoading,
  setPostsError,
  upsertPost,
  removePost,
} = postsSlice.actions;
export default postsSlice.reducer;
