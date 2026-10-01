import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryProductCard } from '@/components/cards/CategoryProductCard';
import { useCategoryCatalog } from '@/hooks/useCategoryCatalog';
import { getCustomerAddresses } from '@/services/addressApi';
import { colors } from '@/theme/colors';
import type { CategoryBrowseFilters, CategoryProduct, ProductSort } from '@/types/product';
import { displayAddressLabel } from '@/utils/address';

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
    <Pressable style={styles.sheetRow} onPress={onPress}>
      <Text style={[styles.sheetLabel, selected && styles.sheetLabelActive]}>{label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={colors.primary} /> : null}
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});

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

  const title = catalog.categoryName || fallbackName || 'Products';
  const cardWidth = Math.floor((screenWidth - 16 * 2 - 14) / 2);

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

  const changeQuantity = (productId: string, delta: number) => {
    setQuantities((current) => {
      const nextValue = (current[productId] ?? 0) + delta;

      if (nextValue <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }

      return { ...current, [productId]: nextValue };
    });
  };

  const shareCategory = () => {
    void Share.share({ message: `Shop ${title} on Neede` });
  };

  const renderProduct = ({ item }: { item: CategoryProduct }) => (
    <CategoryProductCard
      product={item}
      width={cardWidth}
      quantity={quantities[item.id] ?? 0}
      onAdd={() => changeQuantity(item.id, 1)}
      onRemove={() => changeQuantity(item.id, -1)}
    />
  );

  const productPane = () => {
    if (catalog.productsLoading && visibleProducts.length === 0) {
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
          <Text style={styles.stateTitle}>Add a delivery address</Text>
          <Text style={styles.stateText}>Products are shown from stores within 3 km of your default address.</Text>
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

    if (catalog.error && catalog.products.length === 0) {
      return (
        <View style={styles.paneState}>
          <Ionicons name="alert-circle-outline" size={28} color={colors.primary} />
          <Text style={styles.stateTitle}>Could not load products</Text>
          <Text style={styles.stateText}>{catalog.error}</Text>
          <TouchableOpacity style={styles.stateButton} activeOpacity={0.85} onPress={() => void catalog.reload()}>
            <Text style={styles.stateButtonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (catalog.subCategories.length === 0) {
      return (
        <View style={styles.paneState}>
          <Ionicons name="storefront-outline" size={28} color={colors.primary} />
          <Text style={styles.stateTitle}>No products nearby</Text>
          <Text style={styles.stateText}>No stores within 3 km currently sell this category.</Text>
        </View>
      );
    }

    if (visibleProducts.length === 0) {
      const filtered = query.trim().length > 0 || Boolean(catalog.filters.type) || Boolean(catalog.filters.brandId);

      return (
        <View style={styles.paneState}>
          <Ionicons name="search-outline" size={28} color={colors.primary} />
          <Text style={styles.stateTitle}>{filtered ? 'No matching products' : 'No products here'}</Text>
          <Text style={styles.stateText}>
            {filtered ? 'Try clearing filters or pick another subcategory.' : 'This subcategory has no priced products from nearby stores.'}
          </Text>
          {filtered ? (
            <TouchableOpacity style={styles.stateButton} activeOpacity={0.85} onPress={clearFilters}>
              <Text style={styles.stateButtonText}>Clear filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      );
    }

    return (
      <FlatList
        data={visibleProducts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderProduct}
        columnWrapperStyle={styles.productRow}
        ListHeaderComponent={
          <View style={styles.sectionIntro}>
            <Text style={styles.categoryHeading}>{title}</Text>
            {selectedSubCategory ? (
              <>
                <Text style={styles.sectionIntroTitle}>{selectedSubCategory.name}</Text>
                <Text style={styles.sectionIntroMeta}>
                  {catalog.productsLoading
                    ? 'Loading...'
                    : `${visibleProducts.length} ${visibleProducts.length === 1 ? 'item' : 'items'}`}
                </Text>
              </>
            ) : null}
          </View>
        }
        style={styles.productListView}
        contentContainerStyle={[styles.productList, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}
        showsVerticalScrollIndicator={false}
        extraData={quantities}
      />
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <View style={styles.titleRow}>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={goBack}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>

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
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => router.push({ pathname: '/address-book', params: { mode: 'select' } })}
              >
                <Text style={styles.deliveryLine} numberOfLines={1}>
                  <Text style={styles.delivering}>Delivering to {locationLabel}</Text>
                  {locationDetail ? <Text style={styles.addressDetail}>{` · ${locationDetail}`}</Text> : null}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.75} onPress={shareCategory}>
            <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
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
            <Ionicons name={searching ? 'close' : 'search'} size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <TouchableOpacity
            style={[styles.chip, activeFilterCount > 0 && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => openSheet('filters')}
          >
            <Ionicons
              name="options-outline"
              size={14}
              color={activeFilterCount > 0 ? colors.primary : colors.textPrimary}
            />
            <Text style={[styles.chipText, activeFilterCount > 0 && styles.chipTextActive]}>
              {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, catalog.filters.sort !== 'name_asc' && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => openSheet('sort')}
          >
            <Ionicons
              name="swap-vertical-outline"
              size={14}
              color={catalog.filters.sort !== 'name_asc' ? colors.primary : colors.textPrimary}
            />
            <Text style={[styles.chipText, catalog.filters.sort !== 'name_asc' && styles.chipTextActive]}>
              {sortLabel}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, Boolean(catalog.filters.type) && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => openSheet('type')}
          >
            <Text style={[styles.chipText, Boolean(catalog.filters.type) && styles.chipTextActive]} numberOfLines={1}>
              {catalog.filters.type || 'Type'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={catalog.filters.type ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.chip, Boolean(catalog.filters.brandId) && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => openSheet('brand')}
          >
            <Text style={[styles.chipText, Boolean(catalog.filters.brandId) && styles.chipTextActive]} numberOfLines={1}>
              {selectedBrand?.name || 'Brand'}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={catalog.filters.brandId ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>
        </ScrollView>
      </View>

      {catalog.loading ? (
        <View style={styles.paneState}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <View style={styles.body}>
          {catalog.subCategories.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subCategoryRow}
            >
              {catalog.subCategories.map((item) => {
                const selected = item.id === catalog.selectedSubCategoryId;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.subChip, selected && styles.subChipActive]}
                    activeOpacity={0.8}
                    onPress={() => catalog.selectSubCategory(item.id)}
                  >
                    <View style={[styles.subChipImage, selected && styles.subChipImageActive]}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.subChipPhoto} resizeMode="cover" />
                      ) : (
                        <Ionicons name="basket-outline" size={16} color={colors.primary} />
                      )}
                    </View>
                    <Text style={[styles.subChipText, selected && styles.subChipTextActive]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : null}
          <View style={styles.products}>{productPane()}</View>
        </View>
      )}

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSheet(null)}>
          <Pressable style={styles.sheetCard} onPress={() => undefined}>
            <ScrollView style={styles.sheetList} bounces={false}>
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
                    <TouchableOpacity style={styles.sheetSecondaryButton} activeOpacity={0.85} onPress={clearFilters}>
                      <Text style={styles.sheetSecondaryButtonText}>Clear all</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.sheetPrimaryButton}
                      activeOpacity={0.85}
                      onPress={() => applyFilters(draftFilters)}
                    >
                      <Text style={styles.sheetPrimaryButtonText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    paddingRight: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  deliveryLine: {
    marginTop: 1,
    fontSize: 12,
  },
  delivering: {
    color: colors.primary,
    fontWeight: '700',
  },
  addressDetail: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  chip: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chipTextActive: {
    color: colors.primary,
  },
  body: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#F8FAFC',
  },
  subCategoryRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  subChip: {
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.white,
    paddingRight: 12,
    paddingLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  subChipImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  subChipImageActive: {
    backgroundColor: colors.white,
  },
  subChipPhoto: {
    width: 28,
    height: 28,
  },
  subChipText: {
    maxWidth: 140,
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  subChipTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  products: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  productListView: {
    flex: 1,
    width: '100%',
  },
  productList: {
    paddingTop: 4,
    paddingHorizontal: 16,
  },
  sectionIntro: {
    marginBottom: 12,
    paddingTop: 8,
  },
  categoryHeading: {
    marginBottom: 14,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionIntroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionIntroMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  paneState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
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
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '70%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: 18,
    marginBottom: 8,
  },
  sheetList: {
    flexGrow: 0,
  },
  sheetRow: {
    minHeight: 48,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sheetLabelActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  sheetSectionLabel: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingTop: 8,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sheetEmpty: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 12,
  },
  sheetSecondaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sheetPrimaryButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
});
