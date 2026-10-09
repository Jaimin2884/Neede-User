import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { CartDock } from '@/features/cart/components/CartDock';
import { useCart } from '@/features/cart/hooks/useCart';
import { getHomeCategories } from '@/features/home/api/homeApi';
import { useNearbyStores } from '@/features/shop/hooks/useNearbyStores';
import type { CategoryItem, HomeCategorySection } from '@/features/home/types/home';
import type { StoreItem } from '@/features/shop/types/shop';
import { getApiErrorMessage } from '@/services/api/errors';
import { colors } from '@/theme/colors';

const PAGE_SIZE = 6;
const GRID_GAP = 12;
const HORIZONTAL_PADDING = 16;
const MAX_CONTENT_WIDTH = 640;

const SPOTLIGHT_TONES = [
  { background: '#FFF1F2', accent: '#BE123C' },
  { background: '#EFF6FF', accent: '#1D4ED8' },
  { background: '#F0FDF4', accent: '#047857' },
  { background: '#FFF7ED', accent: '#C2410C' },
];

function tileSource(item: CategoryItem) {
  if (item.image) {
    return item.image;
  }

  if (item.remoteImageUrl) {
    return { uri: item.remoteImageUrl };
  }

  return null;
}

function storePhoto(store: StoreItem) {
  if (store.imageUrl) {
    return { uri: store.imageUrl };
  }

  return store.image ?? null;
}

function CategoryTile({
  item,
  width,
  onPress,
}: {
  item: CategoryItem;
  width: number;
  onPress: () => void;
}) {
  const source = tileSource(item);
  const label = item.name.replace(/\n/g, ' ');

  return (
    <Pressable
      style={({ pressed }) => [styles.tile, { width }, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.imageBox, { width, height: width }]}>
        {source ? (
          <Image source={source} style={styles.tileImage} resizeMode="cover" />
        ) : (
          <Ionicons name="basket-outline" size={26} color={colors.primary} />
        )}
      </View>
      <Text style={styles.tileName} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

function SpotlightCard({
  store,
  tone,
  onPress,
}: {
  store: StoreItem;
  tone: (typeof SPOTLIGHT_TONES)[number];
  onPress: () => void;
}) {
  const photo = storePhoto(store);
  const meta = [store.distance, store.isOpen === false ? 'Closed' : 'Open'].filter(Boolean).join(' · ');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.spotlightCard,
        { backgroundColor: tone.background },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.spotlightName, { color: tone.accent }]} numberOfLines={2}>
        {store.name}
      </Text>
      <Text style={styles.spotlightMeta} numberOfLines={1}>
        {meta}
      </Text>
      <View style={styles.spotlightPhotoWrap}>
        {photo ? (
          <Image source={photo} style={styles.spotlightPhoto} resizeMode="cover" />
        ) : (
          <View style={[styles.spotlightPhoto, styles.spotlightFallback]}>
            <Ionicons name="storefront" size={28} color={tone.accent} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function CategoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const cart = useCart();
  const { stores, loading: storesLoading } = useNearbyStores();
  const [sections, setSections] = useState<HomeCategorySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contentWidth = Math.min(screenWidth, MAX_CONTENT_WIDTH);
  const tileWidth = Math.floor((contentWidth - HORIZONTAL_PADDING * 2 - GRID_GAP * 3) / 4);

  const loadSections = useCallback(async () => {
    const collected: HomeCategorySection[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 12) {
      const result = await getHomeCategories({ page, perPage: PAGE_SIZE });
      const seen = new Set(collected.map((section) => section.id));
      result.sections.forEach((section) => {
        if (!seen.has(section.id)) {
          collected.push(section);
          seen.add(section.id);
        }
      });
      hasMore = result.hasMore && result.sections.length > 0;
      page += 1;
    }

    return collected;
  }, []);

  const refresh = useCallback(
    async (mode: 'initial' | 'pull') => {
      if (mode === 'pull') {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const next = await loadSections();
        setSections(next);
        setError(null);
      } catch (loadError) {
        setError(getApiErrorMessage(loadError, 'Unable to load categories.'));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [loadSections]
  );

  useFocusEffect(
    useCallback(() => {
      void refresh('initial');
    }, [refresh])
  );

  const openCategory = (section: HomeCategorySection, item: CategoryItem) => {
    router.push({
      pathname: '/category/id',
      params: {
        categoryId: item.categoryId ?? section.id,
        subCategoryId: item.id,
        name: section.name,
      },
    });
  };

  const openStore = (store: StoreItem) => {
    router.push({
      pathname: '/store/id',
      params: {
        storeId: store.id,
        name: store.name,
      },
    });
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 12) }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <Text style={styles.headerSubtitle}>Shop by what you need</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + (cart.bill.itemCount > 0 ? 160 : 88) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh('pull')}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={[styles.sheet, { width: contentWidth }]}>
          {loading && sections.length === 0 ? (
            <SkeletonGroup>
              <View style={styles.section}>
                <Skeleton width={140} height={16} />
                <View style={styles.grid}>
                  {Array.from({ length: 8 }, (_, index) => (
                    <View key={index} style={{ width: tileWidth, alignItems: 'center' }}>
                      <Skeleton width={tileWidth} height={tileWidth} radius={16} />
                      <Skeleton width={Math.round(tileWidth * 0.7)} height={8} style={{ marginTop: 8 }} />
                    </View>
                  ))}
                </View>
              </View>
            </SkeletonGroup>
          ) : error && sections.length === 0 ? (
            <View style={styles.stateBox}>
              <Ionicons name="grid-outline" size={28} color={colors.textSecondary} />
              <Text style={styles.stateTitle}>Could not load categories</Text>
              <Text style={styles.stateText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => void refresh('initial')}>
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : sections.length === 0 ? (
            <View style={styles.stateBox}>
              <Ionicons name="grid-outline" size={28} color={colors.textSecondary} />
              <Text style={styles.stateTitle}>No categories nearby</Text>
              <Text style={styles.stateText}>Categories appear when nearby stores map products.</Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.name}</Text>
                <View style={styles.grid}>
                  {section.items.map((item) => (
                    <CategoryTile
                      key={item.id}
                      item={item}
                      width={tileWidth}
                      onPress={() => openCategory(section, item)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}

          {stores.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Stores in Spotlight</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.spotlightRow}
              >
                {stores.map((store, index) => (
                  <SpotlightCard
                    key={store.id}
                    store={store}
                    tone={SPOTLIGHT_TONES[index % SPOTLIGHT_TONES.length]}
                    onPress={() => openStore(store)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : storesLoading ? (
            <SkeletonGroup>
              <View style={styles.section}>
                <Skeleton width={160} height={16} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spotlightRow}>
                  {Array.from({ length: 3 }, (_, index) => (
                    <View key={index} style={{ width: 180 }}>
                      <Skeleton width={180} height={96} radius={16} />
                      <Skeleton width={110} height={12} style={{ marginTop: 8 }} />
                    </View>
                  ))}
                </ScrollView>
              </View>
            </SkeletonGroup>
          ) : null}

          <Text style={styles.footer}>Everything you need, right around you.</Text>
        </View>
      </ScrollView>
      <CartDock aboveTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  scrollContent: {
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    letterSpacing: -0.1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_GAP,
    rowGap: 16,
  },
  tile: {
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.97 }],
  },
  imageBox: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  tileName: {
    marginTop: 8,
    minHeight: 32,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  spotlightRow: {
    paddingRight: 4,
    paddingBottom: 4,
  },
  spotlightCard: {
    width: 156,
    height: 188,
    borderRadius: 18,
    padding: 14,
    marginRight: 12,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  spotlightName: {
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 19,
  },
  spotlightMeta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  spotlightPhotoWrap: {
    alignSelf: 'flex-end',
  },
  spotlightPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  spotlightFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 28,
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  stateTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  stateText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
