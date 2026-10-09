import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StoreItem } from '@/features/shop/types/shop';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { colors } from '@/theme/colors';

interface TopStoresSectionProps {
  stores?: StoreItem[];
  loading?: boolean;
  emptyMessage?: string;
  onSeeAllPress?: () => void;
  onStorePress?: (store: StoreItem) => void;
}

function storeImage(store: StoreItem) {
  if (store.imageUrl) {
    return { uri: store.imageUrl };
  }

  return store.image;
}

export const TopStoresSection: React.FC<TopStoresSectionProps> = ({
  stores = [],
  loading = false,
  emptyMessage = 'No stores within 3 km of your default address.',
  onSeeAllPress,
  onStorePress,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Stores Near You</Text>
        {stores.length > 0 ? (
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

      {loading ? (
        <SkeletonGroup>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {Array.from({ length: 3 }, (_, index) => (
              <View key={index} style={styles.skeletonCard}>
                <Skeleton width={146} height={94} radius={16} />
                <Skeleton width={100} height={12} style={{ marginTop: 8 }} />
                <Skeleton width={72} height={10} style={{ marginTop: 6 }} />
              </View>
            ))}
          </ScrollView>
        </SkeletonGroup>
      ) : stores.length === 0 ? (
        <View style={styles.stateBox}>
          <Ionicons name="storefront-outline" size={22} color={colors.textSecondary} />
          <Text style={styles.stateText}>{emptyMessage}</Text>
        </View>
      ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {stores.map((store) => {
          const image = storeImage(store);

          return (
          <TouchableOpacity
            key={store.id}
            style={styles.storeCard}
            activeOpacity={0.88}
            onPress={() => onStorePress?.(store)}
          >
            {/* Storefront Image */}
            <View style={styles.imageContainer}>
              {image ? (
                <Image
                  source={image}
                  style={styles.storefrontImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imageFallback}>
                  <Ionicons name="storefront" size={28} color={colors.primary} />
                </View>
              )}
              {/* Overlapping Brand Logo Badge */}
              <View style={styles.storeLogoCircle}>
                <View style={styles.storeLogoInner}>
                  <Ionicons name="storefront" size={14} color={colors.primary} />
                </View>
              </View>
            </View>

            {/* Store Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.storeName} numberOfLines={1}>
                {store.name}
              </Text>

              {/* Rating & Distance */}
              <View style={styles.ratingDistanceRow}>
                {store.rating != null ? (
                  <>
                    <Ionicons name="star" size={11} color={colors.starRating} style={styles.starIcon} />
                    <Text style={styles.ratingText}>{store.rating.toFixed(1)}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                  </>
                ) : null}
                <Text style={styles.distanceText}>{store.distance}</Text>
              </View>

              {/* Delivery Time */}
              <View style={styles.timeRow}>
                <Ionicons name="time-outline" size={12} color="#64748B" style={styles.clockIcon} />
                <Text style={styles.timeText}>{store.time}</Text>
              </View>

              {/* Free Delivery Tag */}
              <View style={[styles.freeDeliveryBadge, store.isOpen === false && styles.closedBadge]}>
                <Text style={[styles.freeDeliveryText, store.isOpen === false && styles.closedText]}>
                  {store.tag}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          );
        })}
      </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
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
  stateBox: {
    marginHorizontal: 16,
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  stateText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  skeletonCard: {
    width: 146,
    marginRight: 12,
  },
  storeCard: {
    width: 146,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 94,
    position: 'relative',
  },
  storefrontImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeLogoCircle: {
    position: 'absolute',
    bottom: -12,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  storeLogoInner: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#EBF5FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    paddingTop: 16,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  ratingDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  starIcon: {
    marginRight: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  dotSeparator: {
    fontSize: 10,
    color: '#94A3B8',
    marginHorizontal: 4,
  },
  distanceText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  clockIcon: {
    marginRight: 3,
  },
  timeText: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '500',
  },
  freeDeliveryBadge: {
    backgroundColor: colors.freeDeliveryBg,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  freeDeliveryText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  closedBadge: {
    backgroundColor: '#F1F5F9',
  },
  closedText: {
    color: '#64748B',
  },
});
