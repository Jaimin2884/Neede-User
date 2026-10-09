import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  SectionList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryProductCard } from '@/features/product/components/CategoryProductCard';
import { ProductGridSkeleton, Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { CartDock } from '@/features/cart/components/CartDock';
import { useCart } from '@/features/cart/hooks/useCart';
import { useStoreCatalog } from '@/features/shop/hooks/useStoreCatalog';
import { getStoreProducts } from '@/features/shop/api/storeApi';
import { colors } from '@/theme/colors';
import type { CategoryProduct } from '@/features/product/types/product';
import type { StoreProfile } from '@/features/shop/types/shop';

type ProductRow = {
  id: string;
  items: CategoryProduct[];
  status?: 'loading' | 'more';
};

type CatalogSection = {
  key: string;
  categoryId: string;
  subCategoryId: string;
  categoryName: string;
  showCategoryTitle: boolean;
  title: string;
  count: number;
  data: ProductRow[];
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

const GRID_PADDING = 12;
const GRID_GAP = 8;

function chunkProducts(products: CategoryProduct[], columns: number): ProductRow[] {
  const rows: ProductRow[] = [];

  for (let index = 0; index < products.length; index += columns) {
    const items = products.slice(index, index + columns);
    rows.push({
      id: items.map((item) => item.id).join('-'),
      items,
    });
  }

  return rows;
}

function StoreHero({
  store,
  fallbackName,
}: {
  store: StoreProfile | null;
  fallbackName: string;
}) {
  const name = store?.name || fallbackName || 'Store';
  const tagline = store?.tagline || store?.city || 'Grocery & daily essentials';

  return (
    <View style={styles.hero}>
      <View style={styles.bannerCard}>
        {store?.imageUrl ? (
          <Image source={{ uri: store.imageUrl }} style={styles.banner} resizeMode="cover" />
        ) : (
          <View style={styles.bannerFallback}>
            <Ionicons name="storefront" size={40} color={colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.logoRing}>
        {store?.logoUrl ? (
          <Image source={{ uri: store.logoUrl }} style={styles.logoImage} resizeMode="cover" />
        ) : (
          <View style={styles.logoFallback}>
            <Ionicons name="cart" size={28} color={colors.white} />
          </View>
        )}
      </View>

      <Text style={styles.storeName}>{name}</Text>
      <Text style={styles.tagline}>{tagline}</Text>

      {store ? (
        <View style={styles.metaRow}>
          <View style={[styles.statusPill, !store.isOpen && styles.statusPillClosed]}>
            <View style={[styles.statusDot, !store.isOpen && styles.statusDotClosed]} />
            <Text style={[styles.statusText, !store.isOpen && styles.statusTextClosed]}>
              {store.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
          {store.time ? <Text style={styles.metaText}>{store.time}</Text> : null}
          {store.distance ? <Text style={styles.metaText}>{store.distance}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

export default function StoreCatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ storeId?: string; name?: string }>();
  const storeId = firstParam(params.storeId);
  const fallbackName = firstParam(params.name);
  const catalog = useStoreCatalog(storeId);
  const cart = useCart();
  const listRef = useRef<SectionList<ProductRow, CatalogSection>>(null);

  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [searchHits, setSearchHits] = useState<CategoryProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const searchPageRef = useRef(1);
  const searchRequestRef = useRef(0);
  const ensureRef = useRef(catalog.ensureProducts);
  ensureRef.current = catalog.ensureProducts;

  const columns = 3;
  const cardWidth = Math.floor((screenWidth - GRID_PADDING * 2 - GRID_GAP * (columns - 1)) / columns);
  const headerName = catalog.store?.name || fallbackName || 'Store';
  const searchNeedle = query.trim();
  const isSearching = searchNeedle.length >= 2;

  const sections = useMemo(() => {
    const next: CatalogSection[] = [];

    catalog.categories.forEach((category) => {
      let shown = false;

      category.subCategories.forEach((subCategory) => {
        const page = catalog.pages[subCategory.id];
        const rows = chunkProducts(page?.products ?? [], columns);

        if (!page?.loaded || page.loading || page.hasMore) {
          rows.push({
            id: `${subCategory.id}-${page?.loading ? 'loading' : 'more'}`,
            items: [],
            status: page?.loading || !page?.loaded ? 'loading' : 'more',
          });
        }

        next.push({
          key: `${category.id}-${subCategory.id}`,
          categoryId: category.id,
          subCategoryId: subCategory.id,
          categoryName: category.name,
          showCategoryTitle: !shown,
          title: subCategory.name,
          count: subCategory.productCount,
          data: rows,
        });
        shown = true;
      });
    });

    return next;
  }, [catalog.categories, catalog.pages, columns]);

  const categoryChips = useMemo(() => {
    const seen = new Set<string>();

    return sections.flatMap((section) => {
      if (!section.showCategoryTitle || seen.has(section.categoryId)) {
        return [];
      }

      seen.add(section.categoryId);
      return [{ id: section.categoryId, name: section.categoryName }];
    });
  }, [sections]);

  const selectedCategoryId = categoryChips.some((chip) => chip.id === activeCategoryId)
    ? activeCategoryId
    : (categoryChips[0]?.id ?? '');

  useEffect(() => {
    if (!isSearching) {
      setSearchHits([]);
      setSearchHasMore(false);
      setSearchLoading(false);
      return;
    }

    const requestId = ++searchRequestRef.current;
    const timer = setTimeout(() => {
      setSearchLoading(true);
      searchPageRef.current = 1;
      getStoreProducts(storeId, { query: searchNeedle, page: 1, perPage: 12 })
        .then((page) => {
          if (requestId !== searchRequestRef.current) {
            return;
          }
          setSearchHits(page.products);
          setSearchHasMore(page.hasMore);
        })
        .catch(() => {
          if (requestId !== searchRequestRef.current) {
            return;
          }
          setSearchHits([]);
          setSearchHasMore(false);
        })
        .finally(() => {
          if (requestId === searchRequestRef.current) {
            setSearchLoading(false);
          }
        });
    }, 280);

    return () => clearTimeout(timer);
  }, [isSearching, searchNeedle, storeId]);

  const loadMoreSearch = () => {
    if (!isSearching || searchLoading || !searchHasMore) {
      return;
    }

    const requestId = searchRequestRef.current;
    const nextPage = searchPageRef.current + 1;
    setSearchLoading(true);
    getStoreProducts(storeId, { query: searchNeedle, page: nextPage, perPage: 12 })
      .then((page) => {
        if (requestId !== searchRequestRef.current) {
          return;
        }
        searchPageRef.current = page.page;
        setSearchHits((current) => {
          const seen = new Set(current.map((item) => item.id));
          return [...current, ...page.products.filter((item) => !seen.has(item.id))];
        });
        setSearchHasMore(page.hasMore);
      })
      .catch(() => undefined)
      .finally(() => {
        if (requestId === searchRequestRef.current) {
          setSearchLoading(false);
        }
      });
  };

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ item?: ProductRow; section?: CatalogSection }>;
    }) => {
      const seen = new Set<string>();
      viewableItems.forEach((token) => {
        const section = token.section;
        if (!section || seen.has(section.subCategoryId)) {
          return;
        }
        if (token.item?.status === 'loading' || token.item?.status === 'more') {
          seen.add(section.subCategoryId);
          ensureRef.current(section.subCategoryId);
        }
      });
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 25, minimumViewTime: 60 }).current;

  const openProduct = (product: CategoryProduct) => {
    router.push({
      pathname: '/product/id',
      params: {
        variantId: product.id,
        storeId: product.storeId || storeId,
      },
    });
  };

  const storeFor = (product: CategoryProduct) => product.storeId || storeId;

  const goBack = () => {
    if (searching) {
      setSearching(false);
      setQuery('');
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/tabs');
  };

  const jumpToCategory = (categoryId: string) => {
    const sectionIndex = sections.findIndex(
      (section) => section.categoryId === categoryId && section.showCategoryTitle
    );

    if (sectionIndex < 0) {
      return;
    }

    setActiveCategoryId(categoryId);
    listRef.current?.scrollToLocation({
      sectionIndex,
      itemIndex: 0,
      animated: true,
      viewOffset: 12,
    });
  };

  const listHeader = (
    <View>
      <StoreHero store={catalog.store} fallbackName={fallbackName} />
      {categoryChips.length > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {categoryChips.map((chip) => {
            const selected = chip.id === selectedCategoryId;

            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.chip, selected && styles.chipSelected]}
                activeOpacity={0.8}
                onPress={() => jumpToCategory(chip.id)}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                  {chip.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );

  const renderBody = () => {
    if (catalog.loading) {
      return (
        <ScrollView style={styles.loadingBody} showsVerticalScrollIndicator={false}>
          <StoreHero store={null} fallbackName={headerName} />
          <SkeletonGroup>
            <View style={styles.skeletonCopy}>
              <Skeleton width={150} height={18} />
              <Skeleton width={88} height={12} style={{ marginTop: 8 }} />
            </View>
          </SkeletonGroup>
          <ProductGridSkeleton columns={columns} cardWidth={cardWidth} rows={3} padding={GRID_PADDING} gap={GRID_GAP} />
        </ScrollView>
      );
    }

    if (catalog.needsAddress) {
      return (
        <View style={styles.stateBox}>
          <Ionicons name="location-outline" size={28} color={colors.primary} />
          <Text style={styles.stateTitle}>Add a delivery address</Text>
          <Text style={styles.stateText}>Store products are shown for shops within 3 km of your address.</Text>
          <TouchableOpacity
            style={styles.stateButton}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/address-book', params: { mode: 'select' } })}
          >
            <Text style={styles.stateButtonText}>Choose address</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (catalog.error) {
      return (
        <View style={styles.stateBox}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.primary} />
          <Text style={styles.stateTitle}>Could not load store</Text>
          <Text style={styles.stateText}>{catalog.error}</Text>
          <TouchableOpacity style={styles.stateButton} activeOpacity={0.85} onPress={() => void catalog.reload()}>
            <Text style={styles.stateButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isSearching) {
      return (
        <FlatList
          key={`store-search-${columns}`}
          data={searchHits}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          columnWrapperStyle={searchHits.length > 0 ? styles.productRow : undefined}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom, 20) + (cart.bill.itemCount > 0 ? 96 : 16) }]}
          onEndReached={loadMoreSearch}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            searchLoading && searchHits.length > 0 ? (
              <ProductGridSkeleton columns={columns} cardWidth={cardWidth} rows={1} padding={GRID_PADDING} gap={GRID_GAP} />
            ) : null
          }
          ListEmptyComponent={
            searchLoading ? (
              <ProductGridSkeleton columns={columns} cardWidth={cardWidth} rows={3} padding={GRID_PADDING} gap={GRID_GAP} />
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons name="search-outline" size={28} color={colors.primary} />
                <Text style={styles.stateTitle}>No matching products</Text>
                <Text style={styles.stateText}>Try another name from this store.</Text>
              </View>
            )
          }
          renderItem={({ item }) => (
            <CategoryProductCard
              product={item}
              width={cardWidth}
              quantity={cart.quantityFor(storeFor(item), item.id)}
              onPress={() => openProduct(item)}
              onAdd={() => void cart.add(storeFor(item), item.id)}
              onRemove={() =>
                void cart.setQuantity(storeFor(item), item.id, cart.quantityFor(storeFor(item), item.id) - 1)
              }
            />
          )}
        />
      );
    }

    return (
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={7}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + (cart.bill.itemCount > 0 ? 96 : 16) },
          sections.length === 0 && styles.listContentEmpty,
        ]}
        extraData={cart.lines}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={({ index }) => {
          setTimeout(() => {
            listRef.current?.scrollToLocation({
              sectionIndex: index,
              itemIndex: 0,
              animated: true,
            });
          }, 80);
        }}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            {section.showCategoryTitle ? <Text style={styles.categoryTitle}>{section.categoryName}</Text> : null}
            <Text style={styles.subCategoryTitle}>{section.title}</Text>
            <Text style={styles.itemCount}>
              {section.count} {section.count === 1 ? 'item' : 'items'}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          if (item.status === 'loading' || item.items.length === 0) {
            return (
              <ProductGridSkeleton columns={columns} cardWidth={cardWidth} rows={1} padding={GRID_PADDING} gap={GRID_GAP} />
            );
          }

          return (
            <View style={styles.productRow}>
              {item.items.map((product) => (
                <CategoryProductCard
                  key={product.id}
                  product={product}
                  width={cardWidth}
                  quantity={cart.quantityFor(storeFor(product), product.id)}
                  onPress={() => openProduct(product)}
                  onAdd={() => void cart.add(storeFor(product), product.id)}
                  onRemove={() =>
                    void cart.setQuantity(
                      storeFor(product),
                      product.id,
                      cart.quantityFor(storeFor(product), product.id) - 1
                    )
                  }
                />
              ))}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="basket-outline" size={28} color={colors.primary} />
            <Text style={styles.stateTitle}>No products yet</Text>
            <Text style={styles.stateText}>This store has no priced products right now.</Text>
          </View>
        }
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={goBack}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {searching ? (
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search in this store"
            placeholderTextColor={colors.placeholder}
            autoFocus
            returnKeyType="search"
          />
        ) : (
          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle} numberOfLines={1}>
              {headerName}
            </Text>
            <Text style={styles.screenHint}>Selected store</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.75}
          onPress={() => {
            setSearching((current) => !current);
            if (searching) {
              setQuery('');
            }
          }}
        >
          <Ionicons name={searching ? 'close' : 'search-outline'} size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={21} color={colors.textPrimary} />
        </View>
      </View>
      {renderBody()}
      <CartDock />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topBar: {
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
    paddingBottom: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 2,
    paddingRight: 8,
  },
  screenTitle: {
    width: '100%',
    textAlign: 'left',
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  screenHint: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'left',
  },
  loadingBody: {
    flex: 1,
  },
  skeletonCopy: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  listContent: {
    paddingTop: 6,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  hero: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: '#E8EEF4',
  },
  bannerCard: {
    height: 156,
    margin: 10,
    marginBottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8F3FB',
  },
  banner: {
    width: '100%',
    height: '100%',
  },
  bannerFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F3FB',
  },
  logoRing: {
    marginTop: -32,
    marginLeft: 22,
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: colors.white,
    padding: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    backgroundColor: colors.primaryLight,
  },
  logoFallback: {
    flex: 1,
    borderRadius: 33,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeName: {
    marginTop: 12,
    marginHorizontal: 18,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  tagline: {
    marginTop: 4,
    marginHorizontal: 18,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#64748B',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    marginHorizontal: 18,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F8EF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillClosed: {
    backgroundColor: '#F1F5F9',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  statusDotClosed: {
    backgroundColor: '#94A3B8',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  statusTextClosed: {
    color: '#64748B',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  chip: {
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  chipTextSelected: {
    color: colors.white,
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  categoryTitle: {
    marginTop: 16,
    marginBottom: 12,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  subCategoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  itemCount: {
    marginTop: 2,
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GRID_GAP,
    paddingHorizontal: GRID_PADDING,
  },
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 36,
    gap: 8,
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stateText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stateButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
});
