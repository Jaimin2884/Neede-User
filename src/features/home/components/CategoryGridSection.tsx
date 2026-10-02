import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CategoryItem } from '@/features/home/types/home';
import { colors } from '@/theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const COLUMN_GAP = 10;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - COLUMN_GAP * 3) / 4;

interface CategoryGridSectionProps {
  title: string;
  items: CategoryItem[];
  showSeeAll?: boolean;
  onSeeAllPress?: () => void;
  onItemPress?: (item: CategoryItem) => void;
}

export const CategoryGridSection: React.FC<CategoryGridSectionProps> = ({
  title,
  items,
  showSeeAll = true,
  onSeeAllPress,
  onItemPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {showSeeAll ? (
          <TouchableOpacity
            style={styles.seeAllButton}
            activeOpacity={0.7}
            onPress={onSeeAllPress}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 4-Column Grid */}
      <View style={styles.gridContainer}>
        {items.map((item) => {
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.gridItem, { width: ITEM_WIDTH }]}
              activeOpacity={0.82}
              onPress={() => onItemPress?.(item)}
            >
              {/* Rounded Image Container */}
              <View style={[styles.tileBox, { width: ITEM_WIDTH, height: ITEM_WIDTH }]}>
                {item.image ? (
                  <Image
                    source={item.image}
                    style={styles.tileImage}
                    resizeMode="contain"
                  />
                ) : item.remoteImageUrl ? (
                  <Image
                    source={{ uri: item.remoteImageUrl }}
                    style={styles.tileImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name={(item.iconFallback as any) || 'basket-outline'}
                    size={28}
                    color={colors.primary}
                  />
                )}
              </View>

              {/* Title Below Tile */}
              <Text style={styles.itemLabel} numberOfLines={2}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    paddingHorizontal: GRID_PADDING,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    columnGap: COLUMN_GAP,
    rowGap: 14,
  },
  gridItem: {
    alignItems: 'center',
  },
  tileBox: {
    backgroundColor: '#F0F5FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8EFF6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  itemLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 13.5,
    paddingHorizontal: 2,
  },
});
