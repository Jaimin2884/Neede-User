import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface FloatingDeliveryBarProps {
  onPress?: () => void;
  shopAmount?: number;
}

export const FloatingDeliveryBar: React.FC<FloatingDeliveryBarProps> = ({
  onPress,
  shopAmount = 149,
}) => {
  return (
    <View style={styles.wrapper}>
      {/* Main Dark Floating Bar */}
      <TouchableOpacity
        style={styles.floatingBar}
        activeOpacity={0.92}
        onPress={onPress}
      >
        {/* Left Circular Icon */}
        <View style={styles.iconCircle}>
          <Ionicons name="bag-handle" size={17} color="#FFFFFF" />
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>Unlock free delivery</Text>
          <Text style={styles.subtitleText}>
            Shop for <Text style={styles.boldAmount}>₹{shopAmount}</Text>
          </Text>
        </View>

        {/* Right Arrow / Action */}
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  floatingBar: {
    width: '100%',
    backgroundColor: colors.darkFloatingBar,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 1,
  },
  boldAmount: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
  arrowContainer: {
    paddingLeft: 8,
  },
});
