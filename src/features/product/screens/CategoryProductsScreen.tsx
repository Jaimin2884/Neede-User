import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CartDock } from '@/features/cart/components/CartDock';
import { useCart } from '@/features/cart/hooks/useCart';
import { useCategoryCatalog } from '@/features/product/hooks/useCategoryCatalog';
import { getCustomerAddresses } from '@/features/address/api/addressApi';
import { colors } from '@/theme/colors';
import type {
  CategoryBrowseFilters,
  CategoryProduct,
  CategorySubCategory,
  ProductSort,
} from '@/features/product/types/product';
import { displayAddressLabel } from '@/features/address/utils/address';

type FilterSheet = 'filters' | 'sort' | 'type' | 'brand' | null;

const SORT_OPTIONS: { id: ProductSort; label: string }[] = [
  { id: 'name_asc', label: 'Name (A–Z)' },
  { id: 'name_desc', label: 'Name (Z–A)' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
];

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}

function formatRupee(value: number): string {
  const rounded = Math.round(value * 10) / 10;

  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return `₹${Math.round(rounded)}`;
  }

  return `₹${rounded.toFixed(1)}`;
}

function FilterOption({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.sheetOption} onPress={onPress}>
      <Text style={[styles.sheetOptionText, selected && styles.sheetOptionTextSelected]}>{label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
    </Pressable>
  );
}

function FilterPill({
  icon,
  label,
  chevron,
  active,
  onPress,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  chevron?: boolean;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.filterPill, active && styles.filterPillActive]} onPress={onPress}>
      {icon ? <Ionicons name={icon} size={15} color={active ? colors.primary : '#334155'} /> : null}
      <Text style={[styles.filterText, active && styles.filterTextActive]} numberOfLines={1}>
        {label}
      </Text>
      {chevron ? <Ionicons name="chevron-down" size={12} color={active ? colors.primary : '#64748B'} /> : null}
    </Pressable>
  );
}

function SideCategoryItem({
  category,
  active,
  onPress,
}: {
  category: CategorySubCategory;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.sideItem, active && styles.sideItemActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {active ? <View style={styles.activeRail} /> : null}
      <View style={[styles.sideThumb, active && styles.sideThumbActive]}>
        {category.imageUrl ? (
          <Image source={{ uri: category.imageUrl }} style={styles.sideThumbImage} resizeMode="contain" />
        ) : (
          <Ionicons name="basket-outline" size={22} color={active ? '#0B74B6' : '#64748B'} />
        )}
      </View>
      <Text style={[styles.sideText, active && styles.sideTextActive]} numberOfLines={2}>
        {category.name}
      </Text>
    </Pressable>
  );
}

function BrowseProductCard({
  product,
  width,
  quantity,
  onPress,
  onAdd,
  onRemove,
}: {
  product: CategoryProduct;
  width: number;
  quantity: number;
  onPress: () => void;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable style={[styles.productCard, { width }]} onPress={onPress}>
      <View style={styles.productImageWrap}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={styles.productImageFallback}>
            <Ionicons name="cube-outline" size={28} color="#94A3B8" />
          </View>
        )}
      </View>
      <View style={styles.productMetaRow}>
        <Text style={styles.productQty} numberOfLines={1}>
          {product.unitLabel}
        </Text>
        {quantity > 0 ? (
          <View style={styles.qtyStepper}>
            <Pressable style={styles.qtyStepperBtn} onPress={onRemove} hitSlop={6}>
              <Ionicons name="remove" size={14} color="#FFFFFF" />
            </Pressable>
            <Text style={styles.qtyStepperValue}>{quantity}</Text>
            <Pressable style={styles.qtyStepperBtn} onPress={onAdd} hitSlop={6}>
              <Ionicons name="add" size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={onAdd}>
            <Text style={styles.addText}>ADD</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatRupee(product.price)}</Text>
        {product.mrp != null ? <Text style={styles.originalPrice}>{formatRupee(product.mrp)}</Text> : null}
      </View>
      <Text style={styles.productName} numberOfLines={2}>
        {product.name}
      </Text>
    </Pressable>
  );
}

export default function CategoryProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ categoryId?: string; subCategoryId?: string; name?: string }>();
  const categoryId = firstParam(params.categoryId);
  const initialSubCategoryId = firstParam(params.subCategoryId);
  const fallbackName = firstParam(params.name);
  const catalog = useCategoryCatalog(categoryId, initialSubCategoryId);

  const [locationLabel, setLocationLabel] = useState('Address');
  const [locationDetail, setLocationDetail] = useState('');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState<FilterSheet>(null);
  const [draftFilters, setDraftFilters] = useState<CategoryBrowseFilters>(catalog.filters);
  const cart = useCart();

  useFocusEffect(
    useCallback(() => {
      let active = true;

      getCustomerAddresses()
        .then((addresses) => {
          if (!active) {
            return;
          }

          const selected = addresses.find((item) => item.is_default);
          if (!selected) {
            setLocationLabel('Address');
            setLocationDetail('Select a delivery address');
            return;
          }

          setLocationLabel(displayAddressLabel(selected));
          setLocationDetail(selected.complete_address);
        })
        .catch(() => undefined);

      return () => {
        active = false;
      };
    }, [])
  );

  const contentWidth = Math.min(screenWidth, 520);
  const sideRailWidth = screenWidth < 360 ? 76 : 88;
  const productCardWidth = Math.floor((contentWidth - sideRailWidth - 12 * 2 - 10) / 2);
  const title = catalog.categoryName || fallbackName || 'Category';
  const addressLine = locationDetail
    ? `Delivering to ${locationLabel}: ${locationDetail}`
    : `Delivering to ${locationLabel}`;

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return catalog.products;
    }

    return catalog.products.filter((product) => product.name.toLowerCase().includes(needle));
  }, [catalog.products, query]);

  const selectedBrand = catalog.filterOptions.brands.find((brand) => brand.id === catalog.filters.brandId) ?? null;
  const sortLabel =
    catalog.filters.sort === 'name_asc'
      ? 'Sort'
      : SORT_OPTIONS.find((option) => option.id === catalog.filters.sort)?.label ?? 'Sort';
  const activeFilterCount =
    (catalog.filters.type ? 1 : 0) + (catalog.filters.brandId ? 1 : 0) + (catalog.filters.sort !== 'name_asc' ? 1 : 0);
  const selectedSubCategory = catalog.subCategories.find((item) => item.id === catalog.selectedSubCategoryId);

  const openSheet = (next: FilterSheet) => {
    setDraftFilters(catalog.filters);
    setSheet(next);
  };

  const applyFilters = (next: CategoryBrowseFilters) => {
    setSheet(null);
    catalog.applyFilters(next);
  };

  const clearFilters = () => {
    applyFilters({ sort: 'name_asc', type: null, brandId: null });
  };

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

  const openProduct = (product: CategoryProduct) => {
    router.push({
      pathname: '/product/id',
      params: {
        variantId: product.id,
        storeId: product.storeId ?? '',
      },
    });
  };

  const changeQuantity = (product: CategoryProduct, delta: number) => {
    if (!product.storeId) {
      if (delta > 0) {
        openProduct(product);
      }
      return;
    }

    const next = cart.quantityFor(product.storeId, product.id) + delta;
    if (delta > 0 && cart.quantityFor(product.storeId, product.id) === 0) {
      void cart.add(product.storeId, product.id);
      return;
    }

    void cart.setQuantity(product.storeId, product.id, next);
  };

  const productPane = () => {
    if (catalog.productsLoading && visibleProducts.length === 0) {
      return (
        <View style={styles.paneState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }

    if (visibleProducts.length === 0) {
      const filtered = query.trim().length > 0 || Boolean(catalog.filters.type) || Boolean(catalog.filters.brandId);

      return (
        <View style={styles.paneState}>
          <Ionicons name="basket-outline" size={32} color="#94A3B8" />
          <Text style={styles.emptyTitle}>{filtered ? 'No matching products' : 'No products here yet'}</Text>
          <Text style={styles.emptySubtitle}>
            {filtered ? 'Try clearing filters or pick another category.' : 'Try another category from the list.'}
          </Text>
          {filtered ? (
            <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersButtonText}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 16) + (cart.bill.itemCount > 0 ? 88 : 20),
        }}
      >
        {selectedSubCategory ? (
          <View style={styles.sectionIntro}>
            <Text style={styles.sectionIntroTitle} numberOfLines={1}>
              {selectedSubCategory.name}
            </Text>
            <Text style={styles.sectionIntroMeta}>
              {catalog.productsLoading
                ? 'Loading...'
                : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'item' : 'items'}`}
            </Text>
          </View>
        ) : null}
        <View style={styles.grid}>
          {visibleProducts.map((product) => (
            <BrowseProductCard
              key={product.id}
              product={product}
              width={productCardWidth}
              quantity={cart.quantityFor(product.storeId, product.id)}
              onPress={() => openProduct(product)}
              onAdd={() => changeQuantity(product, 1)}
              onRemove={() => changeQuantity(product, -1)}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  const body = () => {
    if (catalog.loading && catalog.subCategories.length === 0) {
      return (
        <View style={styles.paneState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      );
    }

    if (catalog.needsAddress) {
      return (
        <View style={styles.paneState}>
          <Ionicons name="location-outline" size={28} color={colors.primary} />
          <Text style={styles.emptyTitle}>Add a delivery address</Text>
          <Text style={styles.emptySubtitle}>Products are shown from stores within 3 km of your default address.</Text>
          <Pressable
            style={styles.stateButton}
            onPress={() => router.push({ pathname: '/address-book', params: { mode: 'select' } })}
          >
            <Text style={styles.stateButtonText}>Choose address</Text>
          </Pressable>
        </View>
      );
    }

    if (catalog.error && catalog.subCategories.length === 0) {
      return (
        <View style={styles.paneState}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.primary} />
          <Text style={styles.emptyTitle}>Could not load products</Text>
          <Text style={styles.emptySubtitle}>{catalog.error}</Text>
          <Pressable style={styles.stateButton} onPress={() => void catalog.reload()}>
            <Text style={styles.stateButtonText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    if (catalog.subCategories.length === 0) {
      return (
        <View style={styles.paneState}>
          <Ionicons name="storefront-outline" size={28} color={colors.primary} />
          <Text style={styles.emptyTitle}>No products nearby</Text>
          <Text style={styles.emptySubtitle}>No stores within 3 km currently sell this category.</Text>
        </View>
      );
    }

    return (
      <View style={styles.body}>
        <View style={[styles.sideRail, { width: sideRailWidth }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sideRailContent}>
            {catalog.subCategories.map((item) => (
              <SideCategoryItem
                key={item.id}
                category={item}
                active={item.id === catalog.selectedSubCategoryId}
                onPress={() => catalog.selectSubCategory(item.id)}
              />
            ))}
          </ScrollView>
        </View>
        <View style={styles.products}>{productPane()}</View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={[styles.shell, { width: contentWidth }]}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerTop}>
            <Pressable style={styles.headerIconButton} onPress={goBack}>
              <Ionicons name="arrow-back" size={22} color="#0F172A" />
            </Pressable>

            {searching ? (
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search in this category"
                placeholderTextColor={colors.placeholder}
                autoFocus
                returnKeyType="search"
              />
            ) : (
              <View style={styles.titleBlock}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                <Pressable onPress={() => router.push({ pathname: '/address-book', params: { mode: 'select' } })}>
                  <Text style={styles.address} numberOfLines={1}>
                    {addressLine}
                  </Text>
                </Pressable>
              </View>
            )}

            <Pressable
              style={styles.searchIcon}
              onPress={() => {
                setSearching((current) => !current);
                if (searching) {
                  setQuery('');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Search products"
            >
              <Ionicons name={searching ? 'close' : 'search'} size={22} color="#0F172A" />
            </Pressable>
            <Pressable style={styles.profileCircle} onPress={() => router.push('/profile')}>
              <Ionicons name="person-outline" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
            <FilterPill
              icon="options-outline"
              label={activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
              active={activeFilterCount > 0}
              onPress={() => openSheet('filters')}
            />
            <FilterPill
              icon="swap-vertical-outline"
              label={sortLabel}
              active={catalog.filters.sort !== 'name_asc'}
              onPress={() => openSheet('sort')}
            />
            <FilterPill
              label={catalog.filters.type || 'Type'}
              chevron
              active={Boolean(catalog.filters.type)}
              onPress={() => openSheet('type')}
            />
            <FilterPill
              label={selectedBrand?.name || 'Brand'}
              chevron
              active={Boolean(catalog.filters.brandId)}
              onPress={() => openSheet('brand')}
            />
          </ScrollView>
        </View>

        {body()}
      </View>

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <View style={styles.sheetBackdrop}>
          <Pressable style={styles.sheetDismiss} onPress={() => setSheet(null)} />
          <View style={[styles.sheetPanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.sheetHandle} />
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              {sheet === 'sort' ? (
                <>
                  <Text style={styles.sheetTitle}>Sort by</Text>
                  {SORT_OPTIONS.map((option) => (
                    <FilterOption
                      key={option.id}
                      label={option.label}
                      selected={catalog.filters.sort === option.id}
                      onPress={() => applyFilters({ ...catalog.filters, sort: option.id })}
                    />
                  ))}
                </>
              ) : null}
              {sheet === 'type' ? (
                <>
                  <Text style={styles.sheetTitle}>Type</Text>
                  <FilterOption
                    label="All types"
                    selected={!catalog.filters.type}
                    onPress={() => applyFilters({ ...catalog.filters, type: null })}
                  />
                  {catalog.filterOptions.types.length === 0 ? (
                    <Text style={styles.sheetEmpty}>No type options for this category.</Text>
                  ) : (
                    catalog.filterOptions.types.map((type) => (
                      <FilterOption
                        key={type}
                        label={type}
                        selected={catalog.filters.type === type}
                        onPress={() => applyFilters({ ...catalog.filters, type })}
                      />
                    ))
                  )}
                </>
              ) : null}
              {sheet === 'brand' ? (
                <>
                  <Text style={styles.sheetTitle}>Brand</Text>
                  <FilterOption
                    label="All brands"
                    selected={!catalog.filters.brandId}
                    onPress={() => applyFilters({ ...catalog.filters, brandId: null })}
                  />
                  {catalog.filterOptions.brands.length === 0 ? (
                    <Text style={styles.sheetEmpty}>No brand options for this category.</Text>
                  ) : (
                    catalog.filterOptions.brands.map((brand) => (
                      <FilterOption
                        key={brand.id}
                        label={brand.name}
                        selected={catalog.filters.brandId === brand.id}
                        onPress={() => applyFilters({ ...catalog.filters, brandId: brand.id })}
                      />
                    ))
                  )}
                </>
              ) : null}
              {sheet === 'filters' ? (
                <>
                  <Text style={styles.sheetTitle}>Filters</Text>
                  <Text style={styles.sheetSectionLabel}>Sort</Text>
                  {SORT_OPTIONS.map((option) => (
                    <FilterOption
                      key={option.id}
                      label={option.label}
                      selected={draftFilters.sort === option.id}
                      onPress={() => setDraftFilters((current) => ({ ...current, sort: option.id }))}
                    />
                  ))}
                  <Text style={styles.sheetSectionLabel}>Type</Text>
                  <FilterOption
                    label="All types"
                    selected={!draftFilters.type}
                    onPress={() => setDraftFilters((current) => ({ ...current, type: null }))}
                  />
                  {catalog.filterOptions.types.map((type) => (
                    <FilterOption
                      key={type}
                      label={type}
                      selected={draftFilters.type === type}
                      onPress={() => setDraftFilters((current) => ({ ...current, type }))}
                    />
                  ))}
                  <Text style={styles.sheetSectionLabel}>Brand</Text>
                  <FilterOption
                    label="All brands"
                    selected={!draftFilters.brandId}
                    onPress={() => setDraftFilters((current) => ({ ...current, brandId: null }))}
                  />
                  {catalog.filterOptions.brands.map((brand) => (
                    <FilterOption
                      key={brand.id}
                      label={brand.name}
                      selected={draftFilters.brandId === brand.id}
                      onPress={() => setDraftFilters((current) => ({ ...current, brandId: brand.id }))}
                    />
                  ))}
                  <View style={styles.sheetActions}>
                    <Pressable style={styles.sheetSecondaryButton} onPress={clearFilters}>
                      <Text style={styles.sheetSecondaryButtonText}>Clear all</Text>
                    </Pressable>
                    <Pressable style={styles.sheetPrimaryButton} onPress={() => applyFilters(draftFilters)}>
                      <Text style={styles.sheetPrimaryButtonText}>Apply</Text>
                    </Pressable>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <CartDock />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  shell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  headerTop: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 4,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  titleBlock: {
    flex: 1,
    marginLeft: 10,
    marginRight: 4,
  },
  title: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  address: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  searchIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B74B6',
    marginLeft: 2,
  },
  filters: {
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 10,
  },
  filterPill: {
    height: 32,
    maxWidth: 180,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  filterPillActive: {
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
  },
  filterText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  filterTextActive: {
    color: colors.primary,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  sideRail: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#E2E8F0',
  },
  sideRailContent: {
    paddingVertical: 6,
    paddingBottom: 20,
  },
  sideItem: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 10,
    position: 'relative',
  },
  sideItemActive: {
    backgroundColor: '#F0F9FF',
  },
  activeRail: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#0B74B6',
  },
  sideThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sideThumbActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  sideThumbImage: {
    width: '82%',
    height: '82%',
  },
  sideText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
    textAlign: 'center',
  },
  sideTextActive: {
    color: '#0B74B6',
    fontWeight: '700',
  },
  products: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionIntro: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionIntroTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionIntroMeta: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    rowGap: 14,
    paddingBottom: 20,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEF2F6',
    padding: 10,
  },
  productImageWrap: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productMetaRow: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 6,
  },
  productQty: {
    flex: 1,
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  originalPrice: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
    textDecorationLine: 'line-through',
  },
  productName: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginTop: 4,
  },
  addButton: {
    height: 28,
    minWidth: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  qtyStepper: {
    height: 28,
    minWidth: 72,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  qtyStepperBtn: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyStepperValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  paneState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
  },
  clearFiltersButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  stateButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheetDismiss: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  sheetPanel: {
    maxHeight: '72%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 12,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  sheetSectionLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 4,
  },
  sheetOption: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
  },
  sheetOptionText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    paddingRight: 12,
  },
  sheetOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  sheetEmpty: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 16,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 8,
  },
  sheetSecondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  sheetSecondaryButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  sheetPrimaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  sheetPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
