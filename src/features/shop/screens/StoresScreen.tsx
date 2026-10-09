import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { CartDock } from '@/features/cart/components/CartDock';
import { useCart } from '@/features/cart/hooks/useCart';
import { useNearbyStores } from '@/features/shop/hooks/useNearbyStores';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { colors } from '@/theme/colors';
import type { StoreItem } from '@/features/shop/types/shop';

function storeImage(store: StoreItem) {
  if (store.imageUrl) {
    return { uri: store.imageUrl };
  }

  return store.image;
}

export default function StoresScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const { stores, loading, error } = useNearbyStores();

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stores Near You</Text>
        <Text style={styles.headerSubtitle}>Within 3 km of your default address</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.content, cart.bill.itemCount > 0 && styles.contentWithCart]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <SkeletonGroup>
            {Array.from({ length: 3 }, (_, index) => (
              <View key={index} style={styles.storeSkeleton}>
                <Skeleton height={140} radius={16} />
                <Skeleton width="58%" height={14} style={{ marginTop: 12 }} />
                <Skeleton width="36%" height={10} style={{ marginTop: 8 }} />
              </View>
            ))}
          </SkeletonGroup>
        ) : stores.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="storefront-outline" size={28} color={colors.textSecondary} />
            <Text style={styles.stateTitle}>No stores nearby</Text>
            <Text style={styles.stateText}>
              {error ?? 'No stores within 3 km of your default address.'}
            </Text>
          </View>
        ) : (
          stores.map((store) => {
            const image = storeImage(store);

            return (
              <TouchableOpacity
                key={store.id}
                style={styles.storeCard}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: '/store/id',
                    params: { storeId: store.id, name: store.name },
                  })
                }
              >
                {image ? (
                  <Image source={image} style={styles.storeImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imageFallback}>
                    <Ionicons name="storefront" size={36} color={colors.primary} />
                  </View>
                )}
                <View style={styles.storeInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.storeName}>{store.name}</Text>
                    {store.rating != null ? (
                      <View style={styles.ratingBadge}>
                        <Ionicons name="star" size={11} color="#FFFFFF" />
                        <Text style={styles.ratingText}>{store.rating.toFixed(1)}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time-outline" size={13} color="#64748B" />
                    <Text style={styles.metaText}>{store.time}</Text>
                    <Text style={styles.dot}>•</Text>
                    <Ionicons name="location-outline" size={13} color="#64748B" />
                    <Text style={styles.metaText}>{store.distance}</Text>
                  </View>
                  <View style={[styles.tagBadge, store.isOpen === false && styles.closedBadge]}>
                    <Text style={[styles.tagText, store.isOpen === false && styles.closedText]}>
                      {store.tag}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
      <CartDock aboveTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  contentWithCart: {
    paddingBottom: 112,
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    gap: 8,
  },
  stateTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  stateText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  storeSkeleton: {
    marginBottom: 16,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
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
  storeImage: {
    width: '100%',
    height: 140,
  },
  imageFallback: {
    width: '100%',
    height: 140,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.starRating,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  dot: {
    color: '#94A3B8',
    marginHorizontal: 2,
  },
  tagBadge: {
    backgroundColor: colors.freeDeliveryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  closedBadge: {
    backgroundColor: '#F1F5F9',
  },
  closedText: {
    color: '#64748B',
  },
});
