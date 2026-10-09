import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryProduct } from '@/features/product/types/product';
import { colors } from '@/theme/colors';

type CategoryProductCardProps = {
  product: CategoryProduct;
  width: number;
  quantity: number;
  onPress?: () => void;
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
  onPress,
  onAdd,
  onRemove,
}) => {
  const compact = width < 118;
  const frameHeight = Math.round(width * (compact ? 0.92 : 0.96));
  const radius = compact ? 12 : 16;

  return (
    <View style={[styles.card, compact && styles.cardCompact, { width }]}>
      <View style={[styles.imageFrame, { width, height: frameHeight, borderRadius: radius }]} collapsable={false}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={{ width, height: frameHeight, borderRadius: radius }}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imageFallback}>
            <Ionicons name="basket-outline" size={compact ? 22 : 36} color={colors.primary} />
          </View>
        )}

        <TouchableOpacity
          style={styles.imagePress}
          activeOpacity={0.9}
          onPress={onPress}
          disabled={!onPress}
        />

        {product.unitLabel ? (
          <View style={[styles.unitBadge, compact ? styles.unitBadgeCompact : styles.unitBadgeRegular]}>
            <Text style={[styles.unitText, compact && styles.unitTextCompact]} numberOfLines={1}>
              {product.unitLabel}
            </Text>
          </View>
        ) : null}

        {quantity === 0 ? (
          <TouchableOpacity
            style={[styles.addButton, compact && styles.addButtonCompact]}
            activeOpacity={0.85}
            onPress={onAdd}
          >
            <Text style={[styles.addText, compact && styles.addTextCompact]}>ADD</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.counter, compact && styles.counterCompact]}>
            <TouchableOpacity style={[styles.counterBtn, compact && styles.counterBtnCompact]} activeOpacity={0.7} onPress={onRemove}>
              <Ionicons name="remove" size={compact ? 13 : 16} color={colors.white} />
            </TouchableOpacity>
            <Text style={[styles.counterQty, compact && styles.counterQtyCompact]}>{quantity}</Text>
            <TouchableOpacity style={[styles.counterBtn, compact && styles.counterBtnCompact]} activeOpacity={0.7} onPress={onAdd}>
              <Ionicons name="add" size={compact ? 13 : 16} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={onPress} disabled={!onPress}>
        {product.unitPriceLabel ? (
          <Text style={[styles.unitPrice, compact && styles.unitPriceCompact]} numberOfLines={1}>
            {product.unitPriceLabel}
          </Text>
        ) : null}

        <View style={styles.priceRow}>
          <Text style={[styles.price, compact && styles.priceCompact]}>{formatRupee(product.price)}</Text>
          {product.mrp != null ? (
            <Text style={[styles.mrp, compact && styles.mrpCompact]}>{formatRupee(product.mrp)}</Text>
          ) : null}
        </View>

        {product.discountPercent > 0 ? (
          <Text style={[styles.discount, compact && styles.discountCompact]} numberOfLines={1}>
            {compact ? `${product.discountPercent}% OFF` : `${product.discountPercent}% OFF on MRP`}
          </Text>
        ) : null}

        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>
          {product.name}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 18,
  },
  cardCompact: {
    marginBottom: 12,
  },
  imageFrame: {
    borderRadius: 16,
    backgroundColor: '#F7F8FA',
    marginBottom: 8,
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePress: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  unitBadge: {
    position: 'absolute',
    zIndex: 2,
    backgroundColor: colors.white,
  },
  unitBadgeRegular: {
    left: 8,
    bottom: 10,
    maxWidth: '42%',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  unitBadgeCompact: {
    top: 6,
    left: 6,
    maxWidth: '70%',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  unitTextCompact: {
    fontSize: 9,
  },
  addButton: {
    position: 'absolute',
    zIndex: 2,
    right: 8,
    bottom: 8,
    minWidth: 64,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7E3EE',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: '#0F2744',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addButtonCompact: {
    right: 4,
    bottom: 4,
    minWidth: 44,
    height: 24,
    borderRadius: 8,
    paddingHorizontal: 6,
  },
  addText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
  },
  addTextCompact: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  counter: {
    position: 'absolute',
    zIndex: 2,
    right: 8,
    bottom: 8,
    minWidth: 86,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    shadowColor: '#0F2744',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  counterCompact: {
    right: 4,
    bottom: 4,
    minWidth: 68,
    height: 24,
    borderRadius: 8,
  },
  counterBtn: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnCompact: {
    width: 20,
    height: 20,
  },
  counterQty: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    minWidth: 16,
    textAlign: 'center',
  },
  counterQtyCompact: {
    fontSize: 12,
    minWidth: 12,
  },
  unitPrice: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  unitPriceCompact: {
    fontSize: 9,
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
  priceCompact: {
    fontSize: 13,
  },
  mrp: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.placeholder,
    textDecorationLine: 'line-through',
  },
  mrpCompact: {
    fontSize: 10,
  },
  discount: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  discountCompact: {
    fontSize: 10,
  },
  name: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  nameCompact: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 14,
  },
});
