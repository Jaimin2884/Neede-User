import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCustomerAddresses } from '@/features/address/api/addressApi';
import { displayAddressLabel } from '@/features/address/utils/address';
import { QtyStepper } from '@/features/cart/components/QtyStepper';
import { useCart } from '@/features/cart/hooks/useCart';
import type { CartLine } from '@/features/cart/types/cart';
import { colors } from '@/theme/colors';
import { formatRupee } from '@/utils/money';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useCart();
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('Select a delivery address');
  const [offersOpen, setOffersOpen] = useState(false);

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
            setAddressLabel('Address');
            setAddressLine('Select a delivery address');
            return;
          }

          setAddressLabel(displayAddressLabel(selected));
          setAddressLine(selected.complete_address);
        })
        .catch(() => undefined);

      return () => {
        active = false;
      };
    }, [])
  );

  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, { storeId: string; storeName: string; lines: CartLine[] }>();

    cart.lines.forEach((line) => {
      const current = map.get(line.storeId);
      if (!current) {
        order.push(line.storeId);
        map.set(line.storeId, { storeId: line.storeId, storeName: line.storeName, lines: [line] });
        return;
      }

      current.lines.push(line);
    });

    return order.map((storeId) => map.get(storeId)!);
  }, [cart.lines]);

  const offerCount = (cart.bill.productDiscount > 0 ? 1 : 0) + (cart.bill.freeDelivery ? 1 : 0);
  const minutes = 12;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/tabs');
  };

  const checkout = () => {
    if (cart.bill.itemCount < 1) {
      return;
    }

    Alert.alert(
      'Proceed to checkout',
      `Total ${formatRupee(cart.bill.total)} from ${cart.bill.storeCount} ${cart.bill.storeCount === 1 ? 'store' : 'stores'}. Payment will open in the next step.`
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.page} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.iconButton} onPress={goBack} activeOpacity={0.75}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Your Basket</Text>
          <Text style={styles.headerMeta}>
            {cart.bill.itemCount} {cart.bill.itemCount === 1 ? 'item' : 'items'}
            {cart.bill.storeCount > 0 ? ` · ${cart.bill.storeCount}/2 stores` : ''}
          </Text>
        </View>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color={colors.primary} />
        </View>
      </View>

      {cart.bill.itemCount === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bag-handle-outline" size={42} color={colors.primary} />
          <Text style={styles.emptyTitle}>Your basket is empty</Text>
          <Text style={styles.emptyText}>Add products from up to 2 nearby stores.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={() => router.replace('/tabs')}>
            <Text style={styles.emptyButtonText}>Start shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 92 }]}
          >
            <View style={styles.deliveryCard}>
              <View style={styles.clock}>
                <Ionicons name="time" size={18} color={colors.white} />
              </View>
              <View style={styles.deliveryCopy}>
                <Text style={styles.deliveryTitle}>Delivery in {minutes} mins</Text>
                <Text style={styles.deliveryAddress} numberOfLines={1}>
                  {addressLabel} · {addressLine}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push({ pathname: '/address-book', params: { mode: 'select' } })}>
                <Text style={styles.change}>Change</Text>
              </TouchableOpacity>
            </View>

            {cart.bill.saved > 0 ? (
              <View style={styles.saveBanner}>
                <Ionicons name="sparkles" size={16} color={colors.savingsText} />
                <Text style={styles.saveText}>You're saving {formatRupee(cart.bill.saved)} on this order</Text>
              </View>
            ) : null}

            {groups.map((group) => (
              <View key={group.storeId} style={styles.group}>
                <View style={styles.groupHead}>
                  <Ionicons name="storefront-outline" size={16} color={colors.primary} />
                  <Text style={styles.groupTitle}>{group.storeName}</Text>
                </View>
                {group.lines.map((line) => (
                  <View key={line.id} style={styles.line}>
                    <View style={styles.thumb}>
                      {line.imageUrl ? (
                        <Image source={{ uri: line.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
                      ) : (
                        <Ionicons name="basket-outline" size={22} color={colors.primary} />
                      )}
                    </View>
                    <View style={styles.lineCopy}>
                      <Text style={styles.lineName} numberOfLines={2}>
                        {line.name}
                      </Text>
                      <Text style={styles.lineUnit}>{line.unitLabel}</Text>
                      <Text style={styles.linePrice}>{formatRupee(line.price)}</Text>
                    </View>
                    <QtyStepper
                      quantity={line.quantity}
                      onAdd={() => void cart.setQuantity(line.storeId, line.variantId, line.quantity + 1)}
                      onRemove={() => void cart.setQuantity(line.storeId, line.variantId, line.quantity - 1)}
                    />
                  </View>
                ))}
              </View>
            ))}

            {cart.suggestions.length > 0 ? (
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Forgot something?</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestRow}>
                  {cart.suggestions.map((item) => (
                    <View key={`${item.storeId}-${item.id}`} style={styles.suggestCard}>
                      <View style={styles.suggestImage}>
                        {item.imageUrl ? (
                          <Image source={{ uri: item.imageUrl }} style={styles.thumbImage} resizeMode="cover" />
                        ) : (
                          <Ionicons name="basket-outline" size={22} color={colors.primary} />
                        )}
                      </View>
                      <Text style={styles.suggestName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.lineUnit}>{item.unitLabel}</Text>
                      <View style={styles.suggestFoot}>
                        <Text style={styles.linePrice}>{formatRupee(item.price)}</Text>
                        <TouchableOpacity
                          style={styles.suggestAdd}
                          onPress={() => {
                            if (item.storeId) {
                              void cart.add(item.storeId, item.id);
                            }
                          }}
                        >
                          <Text style={styles.suggestAddText}>ADD</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {offerCount > 0 ? (
              <TouchableOpacity style={styles.offers} activeOpacity={0.85} onPress={() => setOffersOpen((open) => !open)}>
                <Ionicons name="pricetag" size={16} color={colors.primary} />
                <Text style={styles.offersText}>
                  {offerCount} {offerCount === 1 ? 'offer' : 'offers'} available
                </Text>
                <Ionicons name={offersOpen ? 'chevron-up' : 'chevron-forward'} size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
            {offersOpen ? (
              <View style={styles.offerList}>
                {cart.bill.productDiscount > 0 ? (
                  <Text style={styles.offerLine}>Product discount {formatRupee(cart.bill.productDiscount)}</Text>
                ) : null}
                {cart.bill.freeDelivery ? <Text style={styles.offerLine}>Free delivery unlocked</Text> : null}
              </View>
            ) : null}

            <View style={styles.bill}>
              <Text style={styles.blockTitle}>Bill Details</Text>
              <BillRow label="Item total" value={formatRupee(cart.bill.itemTotal)} />
              {cart.bill.productDiscount > 0 ? (
                <BillRow label="Product discount" value={`-${formatRupee(cart.bill.productDiscount)}`} accent />
              ) : null}
              <BillRow label="Delivery fee" value={cart.bill.deliveryFee === 0 ? 'FREE' : formatRupee(cart.bill.deliveryFee)} accent={cart.bill.deliveryFee === 0} />
              <BillRow label="Handling fee" value={formatRupee(cart.bill.handlingFee)} />
              <View style={styles.billDivider} />
              <BillRow label="Total to pay" value={formatRupee(cart.bill.total)} strong />
            </View>

            {cart.bill.freeDelivery ? (
              <View style={styles.freeBanner}>
                <Ionicons name="bicycle" size={16} color={colors.primary} />
                <Text style={styles.freeText}>You unlocked FREE delivery</Text>
                <Text style={styles.freeSaved}>SAVED {formatRupee(40)}</Text>
              </View>
            ) : (
              <Text style={styles.deliveryHint}>
                Add {formatRupee(Math.max(0, 199 - cart.bill.sellingTotal))} more for free delivery.
              </Text>
            )}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View>
              <Text style={styles.footerLabel}>TOTAL</Text>
              <Text style={styles.footerTotal}>{formatRupee(cart.bill.total)}</Text>
            </View>
            <TouchableOpacity style={styles.checkout} activeOpacity={0.9} onPress={checkout}>
              <Text style={styles.checkoutText}>PROCEED TO CHECKOUT</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

function BillRow({
  label,
  value,
  accent = false,
  strong = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <View style={styles.billRow}>
      <Text style={[styles.billLabel, strong && styles.billStrong]}>{label}</Text>
      <Text style={[styles.billValue, accent && styles.billAccent, strong && styles.billStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.page,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerMeta: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
  },
  deliveryCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clock: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryCopy: {
    flex: 1,
  },
  deliveryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  deliveryAddress: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  change: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
  saveBanner: {
    marginTop: 12,
    backgroundColor: colors.savingsBg,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveText: {
    color: colors.savingsText,
    fontWeight: '800',
    fontSize: 13,
  },
  group: {
    marginTop: 16,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primaryDark,
  },
  line: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  lineCopy: {
    flex: 1,
  },
  lineName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  lineUnit: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  linePrice: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  block: {
    marginTop: 8,
  },
  blockTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  suggestRow: {
    gap: 10,
  },
  suggestCard: {
    width: 140,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 10,
  },
  suggestImage: {
    height: 78,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  suggestName: {
    marginTop: 8,
    minHeight: 34,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  suggestFoot: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestAdd: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestAddText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  offers: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offersText: {
    flex: 1,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  offerList: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  offerLine: {
    color: colors.savingsText,
    fontWeight: '700',
  },
  bill: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  billValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  billAccent: {
    color: colors.savingsText,
  },
  billStrong: {
    color: colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  billDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 10,
  },
  freeBanner: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFE3F5',
    backgroundColor: colors.white,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  freeText: {
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  freeSaved: {
    color: colors.savingsText,
    fontWeight: '800',
    fontSize: 12,
  },
  deliveryHint: {
    marginTop: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footerTotal: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  checkout: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutText: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  emptyText: {
    marginTop: 6,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: '800',
  },
});
