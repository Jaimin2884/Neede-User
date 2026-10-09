import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Alert,
  Text,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { CartDock } from '@/features/cart/components/CartDock';
import { useCart } from '@/features/cart/hooks/useCart';
import { CategoryGridSection } from '@/features/home/components/CategoryGridSection';
import { DealsSection } from '@/features/home/components/DealsSection';
import { TopStoresSection } from '@/features/shop/components/TopStoresSection';
import { BannerSlider } from '@/features/home/components/BannerSlider';
import { HomeHeader } from '@/features/home/components/HomeHeader';
import { LocationRequiredModal } from '@/features/address/components/LocationRequiredModal';
import { useHomeCategories } from '@/features/home/hooks/useHomeCategories';
import { useNearbyStores } from '@/features/shop/hooks/useNearbyStores';
import { useRequireLocation } from '@/features/address/hooks/useRequireLocation';
import { getCustomerAddresses } from '@/features/address/api/addressApi';
import type { BannerItem, CategoryItem, DealItem, HomeCategorySection } from '@/features/home/types/home';
import type { StoreItem } from '@/features/shop/types/shop';
import { colors } from '@/theme/colors';
import { displayAddressLabel } from '@/features/address/utils/address';

export default function HomeScreen() {
  const router = useRouter();
  const cart = useCart();
  const { prompt: locationPrompt, enableLocation } = useRequireLocation();
  const { stores, loading: storesLoading, error: storesError } = useNearbyStores();
  const {
    sections: categorySections,
    loading: categoriesLoading,
    loadingMore: categoriesLoadingMore,
    hasMore: categoriesHasMore,
    error: categoriesError,
    loadMore: loadMoreCategories,
  } = useHomeCategories();
  const [locationLabel, setLocationLabel] = useState('Address Book');
  const [locationDetail, setLocationDetail] = useState('Select a delivery address');
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const scrollOffsetRef = useRef(0);
  const loadMoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryStateRef = useRef({
    loading: categoriesLoading,
    loadingMore: categoriesLoadingMore,
    hasMore: categoriesHasMore,
  });
  categoryStateRef.current = {
    loading: categoriesLoading,
    loadingMore: categoriesLoadingMore,
    hasMore: categoriesHasMore,
  };

  useEffect(() => {
    return () => {
      if (loadMoreTimerRef.current) {
        clearTimeout(loadMoreTimerRef.current);
      }
    };
  }, []);

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
            setLocationLabel('Address Book');
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

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search for groceries, snacks, household items and more.');
  };

  const handleAddressPress = () => {
    router.push({ pathname: '/address-book', params: { mode: 'select' } });
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };


  const handleBannerPress = (banner: BannerItem) => {
    Alert.alert(banner.tag, `${banner.title.replace('\n', ' ')}: Special offer applied!`);
  };

  const handleStorePress = (store: StoreItem) => {
    router.push({
      pathname: '/store/id',
      params: {
        storeId: store.id,
        name: store.name,
      },
    });
  };

  const handleDealPress = (deal: DealItem) => {
    Alert.alert(deal.title, `Special price: ₹${deal.price} (${deal.discount})`);
  };

  const scheduleLoadMoreCategories = () => {
    if (loadMoreTimerRef.current) {
      return;
    }

    loadMoreTimerRef.current = setTimeout(() => {
      loadMoreTimerRef.current = null;
      const { loading, loadingMore, hasMore } = categoryStateRef.current;
      if (loading || loadingMore || !hasMore) {
        return;
      }

      const viewportHeight = viewportHeightRef.current;
      const contentHeight = contentHeightRef.current;
      if (viewportHeight <= 0 || contentHeight <= 0) {
        return;
      }

      const distanceFromBottom = contentHeight - (viewportHeight + scrollOffsetRef.current);
      if (distanceFromBottom < 360) {
        void loadMoreCategories();
      }
    }, 0);
  };

  const handleHomeScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    viewportHeightRef.current = layoutMeasurement.height;
    contentHeightRef.current = contentSize.height;
    scrollOffsetRef.current = contentOffset.y;
    scheduleLoadMoreCategories();
  };

  const handleHomeContentSizeChange = (_width: number, height: number) => {
    contentHeightRef.current = height;
    scheduleLoadMoreCategories();
  };

  const handleCategoryPress = (section: HomeCategorySection, category: CategoryItem) => {
    router.push({
      pathname: '/category/id',
      params: {
        categoryId: category.categoryId ?? section.id,
        subCategoryId: category.id,
        name: section.name,
      },
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top Header */}
      <HomeHeader
        onSearchPress={handleSearchPress}
        onAddressPress={handleAddressPress}
        onProfilePress={handleProfilePress}
        locationLabel={locationLabel}
        locationDetail={locationDetail}
      />


      {/* Main Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          cart.bill.itemCount > 0 && styles.scrollContentWithCart,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={200}
        onLayout={(event) => {
          viewportHeightRef.current = event.nativeEvent.layout.height;
          scheduleLoadMoreCategories();
        }}
        onContentSizeChange={handleHomeContentSizeChange}
        onScroll={handleHomeScroll}
      >
        {/* Banner Carousel Slider */}
        <BannerSlider onBannerPress={handleBannerPress} />

        {/* Top Stores Near You */}
        <TopStoresSection
          stores={stores}
          loading={storesLoading}
          emptyMessage={storesError ?? 'No stores within 3 km of your default address.'}
          onStorePress={handleStorePress}
          onSeeAllPress={() => router.push('/tabs/stores')}
        />

        {/* Deals Near You */}
        <DealsSection
          onDealPress={handleDealPress}
          onSeeAllPress={() => Alert.alert('All Deals', 'Showing all hot deals in your area.')}
        />

        {categoriesLoading ? (
          <SkeletonGroup>
            <View style={styles.categorySkeleton}>
              <Skeleton width={128} height={16} />
              <View style={styles.categorySkeletonRow}>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} width="22%" height={74} radius={16} />
                ))}
              </View>
              <View style={styles.categorySkeletonRow}>
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} width="22%" height={74} radius={16} />
                ))}
              </View>
            </View>
          </SkeletonGroup>
        ) : categoriesError ? (
          <View style={styles.categoryState}>
            <Ionicons name="grid-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.categoryStateText}>{categoriesError}</Text>
          </View>
        ) : categorySections.length === 0 ? (
          <View style={styles.categoryState}>
            <Ionicons name="grid-outline" size={22} color={colors.textSecondary} />
            <Text style={styles.categoryStateText}>
              Categories appear when nearby stores map products.
            </Text>
          </View>
        ) : (
          <>
            {categorySections.map((section) => (
              <CategoryGridSection
                key={section.id}
                title={section.name}
                items={section.items.slice(0, 8)}
                showSeeAll={false}
                onItemPress={(item) => handleCategoryPress(section, item)}
              />
            ))}
            {categoriesLoadingMore ? (
              <SkeletonGroup>
                <View style={styles.categorySkeletonRow}>
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} width="22%" height={74} radius={16} />
                  ))}
                </View>
              </SkeletonGroup>
            ) : null}
          </>
        )}

      </ScrollView>

      <CartDock aboveTabs />
      <LocationRequiredModal
        visible={locationPrompt !== null}
        title={locationPrompt?.title ?? ''}
        message={locationPrompt?.message ?? ''}
        actionLabel={locationPrompt?.actionLabel ?? ''}
        onAction={() => {
          void enableLocation();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  scrollContentWithCart: {
    paddingBottom: 96,
  },
  categoryState: {
    marginTop: 22,
    marginHorizontal: 16,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  categoryStateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categorySkeleton: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  categorySkeletonRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
