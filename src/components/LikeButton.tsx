import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { wp } from '../hooks/useResponsive';

interface LikeButtonProps {
  liked: boolean;
  likeCount: number;
  onToggle: () => void;
}

const LikeButton = ({ liked, likeCount, onToggle }: LikeButtonProps) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (liked) {
      scale.value = withSequence(
        withSpring(1.35, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 8, stiffness: 200 }),
      );
    }
  }, [liked, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={onToggle} style={styles.container} activeOpacity={0.8}>
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={wp('6%')}
          color={liked ? '#EF4444' : '#6B7280'}
        />
      </Animated.View>
      <Text style={[styles.count, liked && styles.countActive]}>{likeCount}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    fontSize: wp('3.6%'),
    color: '#6B7280',
    marginLeft: wp('1%'),
    fontWeight: '600',
  },
  countActive: {
    color: '#EF4444',
  },
});

export default React.memo(LikeButton);
