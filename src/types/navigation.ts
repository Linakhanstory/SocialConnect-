export type RootStackParamList = {
  Home: undefined;
  UserProfile: { userId: string };
  Profile: { userId?: string };
  Comments: { postId: string };
  Post: undefined;
  EditPost: { postId: string; text: string; imageUrl?: string };
  Search: undefined;
  Chat: { conversationId: string; otherUserName: string };
  ChatList: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  Messages: undefined;
  Profile: undefined;
  Settings: undefined;
};
