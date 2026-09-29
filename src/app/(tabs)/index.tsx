import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  StatusBar,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';

import { HomeHeader } from '@/components/home/HomeHeader';
import { BannerSlider } from '@/components/home/BannerSlider';
import { TopStoresSection } from '@/components/home/TopStoresSection';
import { DealsSection } from '@/components/home/DealsSection';
import { CategoryGridSection } from '@/components/home/CategoryGridSection';
import { FloatingDeliveryBar } from '@/components/home/FloatingDeliveryBar';
import {
  groceryKitchenCategories,
  snacksDrinksCategories,
  BannerItem,
  StoreItem,
  DealItem,
  CategoryItem,
} from '@/data/homeData';
import { colors } from '@/theme/colors';

const BOTTOM_PEEK_TAGS = ['Dragon Fruit', 'Snacks Corner', 'Baby Apple', 'Apple Cider'];

export default function HomeScreen() {
  const [cartCount, setCartCount] = useState(0);

  const handleSearchPress = () => {
    Alert.alert('Search', 'Search for groceries, snacks, household items and more.');
  };

  const handleAddressPress = () => {
    Alert.alert('Select Delivery Location', 'Current: HOME - D-15, 4th floor, Shivganga');
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Manage your account, addresses, and orders.');
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

  const handleUnlockDeliveryPress = () => {
    Alert.alert(
      'Free Delivery',
      'Add items worth ₹149 to your cart to get 100% Free Delivery!'
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
          onCartChange={setCartCount}
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

        {/* Extra spacing so content is never hidden behind floating delivery pill */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Bottom Delivery Bar */}
      <View style={styles.floatingBarAnchor}>
        <FloatingDeliveryBar
          onPress={handleUnlockDeliveryPress}
          shopAmount={Math.max(149 - cartCount * 25, 0)}
        />
      </View>

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
  bottomSpacer: {
    height: 90,
  },
  floatingBarAnchor: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
