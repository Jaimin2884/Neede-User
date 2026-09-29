import React from 'react';
import { StyleSheet, View, Text, ScrollView, StatusBar, TouchableOpacity, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { topStores } from '@/data/homeData';
import { colors } from '@/theme/colors';

export default function StoresScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stores Near You</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {topStores.map((store) => (
          <TouchableOpacity
            key={store.id}
            style={styles.storeCard}
            activeOpacity={0.88}
          >
            <Image source={store.image} style={styles.storeImage} resizeMode="cover" />
            <View style={styles.storeInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.storeName}>{store.name}</Text>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color="#FFFFFF" />
                  <Text style={styles.ratingText}>{store.rating.toFixed(1)}</Text>
                </View>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={13} color="#64748B" />
                <Text style={styles.metaText}>{store.time}</Text>
                <Text style={styles.dot}>•</Text>
                <Ionicons name="location-outline" size={13} color="#64748B" />
                <Text style={styles.metaText}>{store.distance}</Text>
              </View>
              <View style={styles.tagBadge}>
                <Text style={styles.tagText}>{store.tag}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  content: {
    padding: 16,
    paddingBottom: 40,
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
  storeInfo: {
    padding: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
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
});
