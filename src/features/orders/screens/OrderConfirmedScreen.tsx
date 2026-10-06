import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCustomerOrder } from '@/features/orders/hooks/useCustomerOrder';
import { colors } from '@/theme/colors';
import { formatRupee } from '@/utils/money';

function readOrderId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isFinite(id) ? id : 0;
}

export default function OrderConfirmedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { order, loading, error } = useCustomerOrder(readOrderId(id));

  const goHome = () => {
    router.replace('/tabs');
  };

  const openTrack = () => {
    if (!order) {
      return;
    }

    router.push({ pathname: '/order/track/[id]', params: { id: String(order.orderId) } });
  };

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable onPress={goHome} hitSlop={10} style={styles.close}>
          <Ionicons name="close" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : error || !order ? (
        <View style={styles.loader}>
          <Text style={styles.error}>{error || 'Order not found.'}</Text>
          <Pressable style={styles.secondary} onPress={goHome}>
            <Text style={styles.secondaryText}>Continue shopping</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="bag-handle" size={28} color={colors.primary} />
            <View style={styles.heroCheck}>
              <Ionicons name="checkmark" size={12} color={colors.white} />
            </View>
          </View>

          <Text style={styles.title}>Your order is confirmed!</Text>
          <Text style={styles.subtitle}>
            {order.storeCount === 1
              ? 'Your items are with the store.'
              : `Your items are with ${order.storeCount} nearby stores.`}
          </Text>

          <View style={styles.payPill}>
            <Ionicons name="checkmark-circle" size={16} color={colors.savingsText} />
            <Text style={styles.payText}>
              {order.paymentMethod} · {formatRupee(order.total)}
            </Text>
          </View>

          <View style={styles.liveCard}>
            <View>
              <Text style={styles.liveLabel}>LIVE STATUS</Text>
              <Text style={styles.liveValue}>{statusTitle(order.status)}</Text>
              <Text style={styles.liveHint}>Updates as the store and delivery partner respond</Text>
            </View>
            <View style={styles.liveIcon}>
              <Ionicons name="pulse" size={20} color={colors.white} />
            </View>
          </View>

          <Text style={styles.orderId}>Order ID #{order.orderNumber}</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Your order is being prepared</Text>
            <Text style={styles.cardMeta}>
              {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} from {order.storeCount}{' '}
              {order.storeCount === 1 ? 'store' : 'nearby stores'}
            </Text>
            {order.stores.map((store) => (
              <View key={store.storeName} style={styles.storeRow}>
                <View style={styles.storeIcon}>
                  <Ionicons name="storefront-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.storeCopy}>
                  <Text style={styles.storeName}>{store.storeName}</Text>
                  <Text style={styles.storeMeta}>
                    {store.items.reduce((sum, item) => sum + item.quantity, 0)}{' '}
                    {store.items.reduce((sum, item) => sum + item.quantity, 0) === 1 ? 'item' : 'items'}
                    {' · '}
                    <Text style={styles.storeStatus}>{storeStatusLabel(order.status, store.status)}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.summaryHead}>
              <Text style={styles.cardTitle}>Order summary</Text>
              <Text style={styles.cardMeta}>
                {order.itemCount} items · {formatRupee(order.total)}
              </Text>
            </View>
            {order.stores.flatMap((store) => store.items).map((item, index) => (
              <View key={`${item.name}-${index}`} style={styles.itemRow}>
                <View style={styles.itemBadge}>
                  <Text style={styles.itemQty}>{item.quantity}</Text>
                </View>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemPrice}>{formatRupee(item.lineTotal)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.card}>
            <View style={styles.addressRow}>
              <View style={styles.storeIcon}>
                <Ionicons name="home-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.storeCopy}>
                <Text style={styles.cardMeta}>Delivering to</Text>
                <Text style={styles.storeName}>{order.receiverName}</Text>
                <Text style={styles.address}>
                  {order.addressLabel} · {order.addressLine}
                </Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.primary} onPress={openTrack}>
            <Text style={styles.primaryText}>Track order</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>
          <Pressable style={styles.secondary} onPress={goHome}>
            <Text style={styles.secondaryText}>Continue shopping</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function statusTitle(status: string) {
  if (status === 'assigned') {
    return 'On the way';
  }

  if (status === 'confirmed') {
    return 'Preparing';
  }

  return 'Waiting for store';
}

function storeStatusLabel(orderStatus: string, storeStatus: string) {
  if (orderStatus === 'assigned') {
    return 'With delivery';
  }

  if (storeStatus === 'confirmed') {
    return 'Preparing';
  }

  return 'Waiting';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroIcon: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#123B63',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  heroCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F4F8FC',
  },
  title: {
    marginTop: 18,
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  payPill: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.savingsBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  payText: {
    color: colors.savingsText,
    fontSize: 13,
    fontWeight: '700',
  },
  liveCard: {
    marginTop: 18,
    width: '100%',
    backgroundColor: '#E8F3FB',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  liveLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  liveValue: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  liveHint: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
  },
  liveIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderId: {
    marginTop: 14,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    marginTop: 14,
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
  },
  storeRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCopy: {
    flex: 1,
  },
  storeName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  storeMeta: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: 13,
  },
  storeStatus: {
    color: colors.primary,
    fontWeight: '700',
  },
  summaryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  itemRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemQty: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  itemName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  itemPrice: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  address: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  primary: {
    marginTop: 18,
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondary: {
    marginTop: 10,
    width: '100%',
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#D5E6F4',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  error: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
});
