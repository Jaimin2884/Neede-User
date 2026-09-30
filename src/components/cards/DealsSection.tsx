import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { dealsNearYou } from '@/constants/homeData';
import type { DealItem } from '@/types/home';
import { colors } from '@/theme/colors';

interface DealsSectionProps {
  deals?: DealItem[];
  onSeeAllPress?: () => void;
  onDealPress?: (deal: DealItem) => void;
  onCartChange?: (itemCount: number) => void;
}

export const DealsSection: React.FC<DealsSectionProps> = ({
  deals = dealsNearYou,
  onSeeAllPress,
  onDealPress,
  onCartChange,
}) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleIncrement = (id: string) => {
    setQuantities((prev) => {
      const next = { ...prev, [id]: (prev[id] || 0) + 1 };
      const total = Object.values(next).reduce((a, b) => a + b, 0);
      onCartChange?.(total);
      return next;
    });
  };

  const handleDecrement = (id: string) => {
    setQuantities((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        const total = Object.values(next).reduce((a, b) => a + b, 0);
        onCartChange?.(total);
        return next;
      }
      const next = { ...prev, [id]: current - 1 };
      const total = Object.values(next).reduce((a, b) => a + b, 0);
      onCartChange?.(total);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Deals Near You</Text>
        <TouchableOpacity
          style={styles.seeAllButton}
          activeOpacity={0.7}
          onPress={onSeeAllPress}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Deals List */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {deals.map((item) => {
          const qty = quantities[item.id] || 0;

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.dealCard}
              activeOpacity={0.92}
              onPress={() => onDealPress?.(item)}
            >
              {/* Product Image with Discount Badge */}
              <View style={styles.imageContainer}>
                <Image
                  source={item.image}
                  style={styles.productImage}
                  resizeMode="cover"
                />

                {/* Red Discount Tag */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{item.discount}</Text>
                </View>
              </View>

              {/* Product Info */}
              <View style={styles.infoContainer}>
                <Text style={styles.weightText}>{item.weight}</Text>
                <Text style={styles.productTitle} numberOfLines={1}>
                  {item.title}
                </Text>

                {/* Price Row */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{item.price}</Text>
                  {item.originalPrice ? (
                    <Text style={styles.originalPriceText}>₹{item.originalPrice}</Text>
                  ) : null}
                </View>

                {/* ADD / Quantity Counter Button */}
                {qty === 0 ? (
                  <TouchableOpacity
                    style={styles.addButton}
                    activeOpacity={0.8}
                    onPress={() => handleIncrement(item.id)}
                  >
                    <Text style={styles.addButtonText}>ADD</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      activeOpacity={0.7}
                      onPress={() => handleDecrement(item.id)}
                    >
                      <Ionicons name="remove" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.counterQtyText}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      activeOpacity={0.7}
                      onPress={() => handleIncrement(item.id)}
                    >
                      <Ionicons name="add" size={13} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  dealCard: {
    width: 122,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 96,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: colors.discountBadge,
    paddingHorizontal: 4.5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  discountText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  infoContainer: {
    padding: 8,
  },
  weightText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    marginBottom: 6,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 4,
  },
  originalPriceText: {
    fontSize: 9.5,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '500',
  },
  addButton: {
    width: '100%',
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  counterRow: {
    width: '100%',
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  counterBtn: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterQtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
