import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryProduct } from '@/types/product';
import { colors } from '@/theme/colors';

type CategoryProductCardProps = {
  product: CategoryProduct;
  width: number;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
};

function formatRupee(value: number): string {
  const rounded = Math.round(value * 10) / 10;

  if (Math.abs(rounded - Math.round(rounded)) < 0.001) {
    return `₹${Math.round(rounded)}`;
  }

  return `₹${rounded.toFixed(1)}`;
}

export const CategoryProductCard: React.FC<CategoryProductCardProps> = ({
  product,
  width,
  quantity,
  onAdd,
  onRemove,
}) => {
  return (
    <View style={[styles.card, { width }]}>
      <View style={[styles.imageFrame, { height: width * 0.92 }]}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <Ionicons name="basket-outline" size={36} color={colors.primary} />
        )}

        {product.unitLabel ? (
          <View style={styles.unitBadge}>
            <Text style={styles.unitText}>{product.unitLabel}</Text>
          </View>
        ) : null}

        {quantity === 0 ? (
          <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={onAdd}>
            <Text style={styles.addText}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterBtn} activeOpacity={0.7} onPress={onRemove}>
              <Ionicons name="remove" size={14} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.counterQty}>{quantity}</Text>
            <TouchableOpacity style={styles.counterBtn} activeOpacity={0.7} onPress={onAdd}>
              <Ionicons name="add" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatRupee(product.price)}</Text>
        {product.mrp != null ? <Text style={styles.mrp}>{formatRupee(product.mrp)}</Text> : null}
      </View>

      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 18,
  },
  imageFrame: {
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#E6EEF5',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  unitBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    backgroundColor: colors.white,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  addButton: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    minWidth: 58,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  addText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  counter: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    minWidth: 78,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  counterBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterQty: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
    minWidth: 14,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  mrp: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.placeholder,
    textDecorationLine: 'line-through',
  },
  name: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
});
