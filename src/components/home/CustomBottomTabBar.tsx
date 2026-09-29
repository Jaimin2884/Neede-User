import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export type TabName = 'home' | 'category' | 'stores' | 'orderAgain';

interface CustomBottomTabBarProps {
  activeTab?: TabName;
  onTabPress?: (tab: TabName) => void;
}

export const CustomBottomTabBar: React.FC<CustomBottomTabBarProps> = ({
  activeTab = 'home',
  onTabPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarRoot, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* 1. Home Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('home')}
      >
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={23}
          color={activeTab === 'home' ? colors.primary : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'home' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Home
        </Text>
      </TouchableOpacity>

      {/* 2. Category Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('category')}
      >
        <Ionicons
          name={activeTab === 'category' ? 'grid' : 'grid-outline'}
          size={23}
          color={activeTab === 'category' ? colors.primary : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'category' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Category
        </Text>
      </TouchableOpacity>

      {/* 3. Stores Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('stores')}
      >
        <Ionicons
          name={activeTab === 'stores' ? 'storefront' : 'storefront-outline'}
          size={23}
          color={activeTab === 'stores' ? colors.primary : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'stores' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Stores
        </Text>
      </TouchableOpacity>

      {/* 4. Order Again Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        activeOpacity={0.7}
        onPress={() => onTabPress?.('orderAgain')}
      >
        <Ionicons
          name={activeTab === 'orderAgain' ? 'repeat' : 'repeat-outline'}
          size={23}
          color={activeTab === 'orderAgain' ? colors.primary : '#64748B'}
        />
        <Text
          style={[
            styles.tabLabel,
            activeTab === 'orderAgain' ? styles.tabLabelActive : styles.tabLabelInactive,
          ]}
        >
          Order Again
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarRoot: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 3,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    fontWeight: '800',
    color: colors.primary,
  },
  tabLabelInactive: {
    fontWeight: '500',
    color: '#64748B',
  },
});
