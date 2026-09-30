import React from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';

import { CategoryGridSection } from '@/components/cards/CategoryGridSection';
import { DealsSection } from '@/components/cards/DealsSection';
import { TopStoresSection } from '@/components/cards/TopStoresSection';
import { BannerSlider } from '@/components/common/BannerSlider';
import { HomeHeader } from '@/components/common/HomeHeader';
import { LocationRequiredModal } from '@/components/modals/LocationRequiredModal';
import { groceryKitchenCategories, snacksDrinksCategories } from '@/constants/homeData';
import { useRequireLocation } from '@/hooks/useRequireLocation';
import type { BannerItem, CategoryItem, DealItem, StoreItem } from '@/types/home';
import { colors } from '@/theme/colors';

const BOTTOM_PEEK_TAGS = ['Dragon Fruit', 'Snacks Corner', 'Baby Apple', 'Apple Cider'];

export default function HomeScreen() {
  const router = useRouter();
  const { prompt: locationPrompt, enableLocation } = useRequireLocation();

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search for groceries, snacks, household items and more.');
  };

  const handleAddressPress = () => {
    Alert.alert('Select Delivery Location', 'Current: HOME - D-15, 4th floor, Shivganga');
  };

  const handleProfilePress = () => {
    router.push('/profile');
  };


  const handleBannerPress = (banner: BannerItem) => {
    Alert.alert(banner.tag, `${banner.title.replace('\n', ' ')}: Special offer applied!`);
  };

  const handleStorePress = (store: StoreItem) => {
    Alert.alert(store.name, `Delivery in ${store.time} • Free delivery applied!`);
  };

  const handleDealPress = (deal: DealItem) => {
    Alert.alert(deal.title, `Special price: ₹${deal.price} (${deal.discount})`);
  };

  const handleCategoryPress = (category: CategoryItem) => {
    Alert.alert(
      category.name.replace('\n', ' '),
      `Exploring all products in ${category.name.replace('\n', ' ')}`
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Top Header */}
      <HomeHeader
        onSearchPress={handleSearchPress}
        onAddressPress={handleAddressPress}
        onProfilePress={handleProfilePress}
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
          onStorePress={handleStorePress}
          onSeeAllPress={() => Alert.alert('All Stores', 'Showing all nearby partner stores.')}
        />

        {/* Deals Near You */}
        <DealsSection
          onDealPress={handleDealPress}
          onSeeAllPress={() => Alert.alert('All Deals', 'Showing all hot deals in your area.')}
        />

        {/* Grocery & Kitchen Section */}
        <CategoryGridSection
          title="Grocery & Kitchen"
          items={groceryKitchenCategories}
          showSeeAll={true}
          onSeeAllPress={() =>
            Alert.alert('Grocery & Kitchen', 'Browse full Grocery & Kitchen catalog.')
          }
          onItemPress={handleCategoryPress}
        />

        {/* Snacks & Drinks Section */}
        <CategoryGridSection
          title="Snacks & Drinks"
          items={snacksDrinksCategories}
          showSeeAll={false}
          onItemPress={handleCategoryPress}
        />

        {/* Peeking Tags Row (as shown in reference at the bottom of the feed) */}
        <View style={styles.peekingContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {BOTTOM_PEEK_TAGS.map((tag, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.tagChip}
                activeOpacity={0.75}
                onPress={() => Alert.alert(tag, `Exploring ${tag}`)}
              >
                <Text style={styles.tagChipText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

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
  peekingContainer: {
    marginTop: 18,
    paddingHorizontal: 16,
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
});
