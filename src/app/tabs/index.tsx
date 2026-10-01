import React, { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Alert,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CategoryGridSection } from '@/components/cards/CategoryGridSection';
import { DealsSection } from '@/components/cards/DealsSection';
import { TopStoresSection } from '@/components/cards/TopStoresSection';
import { BannerSlider } from '@/components/common/BannerSlider';
import { HomeHeader } from '@/components/common/HomeHeader';
import { LocationRequiredModal } from '@/components/modals/LocationRequiredModal';
import { useHomeCategories } from '@/hooks/useHomeCategories';
import { useNearbyStores } from '@/hooks/useNearbyStores';
import { useRequireLocation } from '@/hooks/useRequireLocation';
import { getCustomerAddresses } from '@/services/addressApi';
import type { BannerItem, CategoryItem, DealItem, HomeCategorySection, StoreItem } from '@/types/home';
import { colors } from '@/theme/colors';
import { displayAddressLabel } from '@/utils/address';

export default function HomeScreen() {
  const router = useRouter();
  const { prompt: locationPrompt, enableLocation } = useRequireLocation();
  const { stores, loading: storesLoading, error: storesError } = useNearbyStores();
  const {
    sections: categorySections,
    loading: categoriesLoading,
    error: categoriesError,
  } = useHomeCategories();
  const [locationLabel, setLocationLabel] = useState('Address Book');
  const [locationDetail, setLocationDetail] = useState('Select a delivery address');

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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
          <View style={styles.categoryState}>
            <ActivityIndicator color={colors.primary} />
          </View>
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
          categorySections.map((section) => (
            <CategoryGridSection
              key={section.id}
              title={section.name}
              items={section.items.slice(0, 8)}
              showSeeAll={false}
              onItemPress={(item) => handleCategoryPress(section, item)}
            />
          ))
        )}

      </ScrollView>

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
});
