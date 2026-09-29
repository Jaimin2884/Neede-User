import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dealsNearYou, DealItem } from '@/data/homeData';
import { colors } from '@/theme/colors';

export default function OrderAgainScreen() {
  const insets = useSafeAreaInsets();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleIncrement = (id: string) => {
    setQuantities((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: string) => {
    setQuantities((prev) => {
      const next = { ...prev };
      if ((next[id] || 0) <= 1) {
        delete next[id];
      } else {
        next[id] -= 1;
      }
      return next;
    });
  };

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 16) }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order Again</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subheading}>Frequently Ordered Items</Text>
        {dealsNearYou.map((item: DealItem) => {
          const qty = quantities[item.id] || 0;

          return (
            <View key={item.id} style={styles.itemCard}>
              <Image source={item.image} style={styles.itemImage} resizeMode="cover" />
              <View style={styles.itemInfo}>
                <Text style={styles.weightText}>{item.weight}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceText}>₹{item.price}</Text>
                  {item.originalPrice ? (
                    <Text style={styles.originalPriceText}>₹{item.originalPrice}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.actionContainer}>
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
                      <Ionicons name="remove" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.counterQtyText}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.counterBtn}
                      activeOpacity={0.7}
                      onPress={() => handleIncrement(item.id)}
                    >
                      <Ionicons name="add" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          style={styles.viewHistoryButton}
          activeOpacity={0.85}
          onPress={() => Alert.alert('Past Orders', 'Showing all past order history.')}
        >
          <Text style={styles.viewHistoryText}>View Past Orders</Text>
        </TouchableOpacity>
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
  subheading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  weightText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  originalPriceText: {
    fontSize: 10,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  actionContainer: {
    minWidth: 70,
  },
  addButton: {
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  counterRow: {
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  counterBtn: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterQtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginHorizontal: 4,
  },
  viewHistoryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  viewHistoryText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
