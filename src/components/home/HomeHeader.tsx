import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

interface HomeHeaderProps {
  onSearchPress?: () => void;
  onProfilePress?: () => void;
  onAddressPress?: () => void;
}

const PLACEHOLDERS = [
  'Search "magazine"',
  'Search "milk"',
  'Search "bread"',
  'Search "fresh fruits"',
  'Search "chips & cold drinks"',
];

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  onSearchPress,
  onProfilePress,
  onAddressPress,
}) => {
  const insets = useSafeAreaInsets();
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={[styles.headerRoot, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      {/* Top Row: Delivery Time & Profile */}
      <View style={styles.topRow}>
        <View style={styles.brandDeliveryGroup}>
          <Text style={styles.deliveryTimeText}>8 minutes</Text>
        </View>

        <View style={styles.actionsGroup}>
          {/* Profile Button */}
          <TouchableOpacity
            style={styles.profileCircle}
            activeOpacity={0.85}
            onPress={onProfilePress}
          >
            <Ionicons name="person" size={18} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>


      {/* Location Selector */}
      <TouchableOpacity
        style={styles.locationSelector}
        activeOpacity={0.7}
        onPress={onAddressPress}
      >
        <Text style={styles.locationText} numberOfLines={1}>
          <Text style={styles.locationTag}>HOME</Text> - D-15, 4th floor, Shivganga
        </Text>
        <Ionicons name="chevron-down" size={15} color="#FFFFFF" style={styles.chevronIcon} />
      </TouchableOpacity>

      {/* Search Bar */}
      <TouchableOpacity
        style={styles.searchBarWrapper}
        activeOpacity={0.9}
        onPress={onSearchPress}
      >
        <Ionicons name="search" size={20} color="#1E293B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={PLACEHOLDERS[placeholderIndex]}
          placeholderTextColor="#64748B"
          editable={false}
          pointerEvents="none"
        />
        <View style={styles.micButton}>
          <Ionicons name="mic" size={20} color="#1E293B" />
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRoot: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandDeliveryGroup: {
    flex: 1,
  },
  deliveryTimeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
    paddingVertical: 2,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    maxWidth: '92%',
  },
  locationTag: {
    fontWeight: '800',
  },
  chevronIcon: {
    marginLeft: 3,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    height: 48,
    marginTop: 12,
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    padding: 0,
  },
  micButton: {
    paddingLeft: 8,
  },
});
