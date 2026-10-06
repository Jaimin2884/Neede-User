import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCustomerOrder } from '@/features/orders/hooks/useCustomerOrder';
import { colors } from '@/theme/colors';

const steps = ['Placed', 'Preparing', 'On the way'] as const;

function readOrderId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return Number.isFinite(id) ? id : 0;
}

function stepIndex(status: string) {
  if (status === 'assigned') {
    return 2;
  }

  if (status === 'confirmed') {
    return 1;
  }

  return 0;
}

function headline(status: string) {
  if (status === 'assigned') {
    return 'Your order is on the way';
  }

  if (status === 'confirmed') {
    return 'Your order is being prepared';
  }

  return 'Waiting for the store';
}

function storeLabel(orderStatus: string, storeStatus: string) {
  if (orderStatus === 'assigned') {
    return 'With delivery';
  }

  if (storeStatus === 'confirmed') {
    return 'Preparing';
  }

  return 'Waiting';
}

export default function TrackOrderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { order, loading, error } = useCustomerOrder(readOrderId(id));
  const activeStep = stepIndex(order?.status ?? 'placed');

  return (
    <View style={[styles.root, { paddingTop: Math.max(insets.top, 10) }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Track order</Text>
          <Text style={styles.headerSub}>{order ? `#${order.orderNumber}` : 'Order'}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : error || !order ? (
        <Text style={styles.error}>{error || 'Order not found.'}</Text>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 28, paddingHorizontal: 20 }}
        >
          <View style={styles.hero}>
            <View style={styles.orb}>
              <Ionicons
                name={order.status === 'assigned' ? 'bicycle' : 'restaurant-outline'}
                size={28}
                color={colors.primary}
              />
            </View>
            <Text style={styles.headline}>{headline(order.status)}</Text>
            <Text style={styles.placeHint}>Delivering to {order.addressLabel}</Text>
          </View>

          <View style={styles.stepper}>
            {steps.map((label, index) => {
              const done = index <= activeStep;
              return (
                <View key={label} style={styles.step}>
                  <View style={styles.stepTrack}>
                    {index > 0 ? <View style={[styles.line, index <= activeStep && styles.lineDone]} /> : <View style={styles.lineSpacer} />}
                    <View style={[styles.dot, done && styles.dotDone]}>
                      {done ? <Ionicons name="checkmark" size={12} color={colors.white} /> : null}
                    </View>
                    {index < steps.length - 1 ? <View style={[styles.line, index < activeStep && styles.lineDone]} /> : <View style={styles.lineSpacer} />}
                  </View>
                  <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.section}>Fulfillment</Text>
          {order.stores.map((store) => {
            const ready = store.status === 'confirmed' || order.status === 'assigned';
            return (
              <View key={store.storeName} style={styles.card}>
                <Text style={styles.storeName}>{store.storeName}</Text>
                <Text style={styles.storeHint}>
                  {store.items.map((item) => `${item.quantity} × ${item.name}`).join(', ')}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, ready && styles.barFillWide]} />
                </View>
                <Text style={styles.storeState}>{storeLabel(order.status, store.status)}</Text>
              </View>
            );
          })}

          {order.storeCount > 1 && order.status !== 'assigned' ? (
            <View style={styles.note}>
              <Ionicons name="git-network-outline" size={18} color={colors.primary} />
              <Text style={styles.noteText}>
                Delivery opens after every store confirms. You still get one delivery for this order.
              </Text>
            </View>
          ) : null}

          {order.deliveryPartnerName ? (
            <View style={styles.partner}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={18} color={colors.primary} />
              </View>
              <View style={styles.partnerCopy}>
                <Text style={styles.storeName}>{order.deliveryPartnerName}</Text>
                <Text style={styles.storeHint}>Delivery partner</Text>
              </View>
              <View style={styles.partnerBadge}>
                <Text style={styles.partnerBadgeText}>Assigned</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.addressCard}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <View style={styles.addressCopy}>
              <Text style={styles.addressLabel}>Delivery address</Text>
              <Text style={styles.addressText}>
                {order.receiverName}, {order.addressLine}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F8FC',
  },
  header: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  back: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  loader: {
    marginTop: 48,
  },
  error: {
    marginTop: 40,
    textAlign: 'center',
    color: colors.textSecondary,
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: 'center',
    paddingTop: 8,
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F3FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headline: {
    marginTop: 14,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  placeHint: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 14,
  },
  stepper: {
    marginTop: 22,
    flexDirection: 'row',
  },
  step: {
    flex: 1,
    alignItems: 'center',
  },
  stepTrack: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    flex: 1,
    height: 3,
    backgroundColor: '#D9E6F2',
    borderRadius: 2,
  },
  lineDone: {
    backgroundColor: colors.primary,
  },
  lineSpacer: {
    flex: 1,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D9E6F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.primary,
  },
  stepLabel: {
    marginTop: 8,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepLabelDone: {
    color: colors.primary,
  },
  section: {
    marginTop: 22,
    marginBottom: 8,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  storeName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  storeHint: {
    marginTop: 4,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  barTrack: {
    marginTop: 12,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E4EEF6',
    overflow: 'hidden',
  },
  barFill: {
    width: '38%',
    height: '100%',
    backgroundColor: colors.primary,
  },
  barFillWide: {
    width: '100%',
  },
  storeState: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  note: {
    marginTop: 4,
    marginBottom: 10,
    backgroundColor: '#E8F3FB',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  noteText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  partner: {
    marginTop: 6,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerCopy: {
    flex: 1,
  },
  partnerBadge: {
    backgroundColor: colors.savingsBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  partnerBadgeText: {
    color: colors.savingsText,
    fontSize: 12,
    fontWeight: '800',
  },
  addressCard: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 10,
  },
  addressCopy: {
    flex: 1,
  },
  addressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  addressText: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
});
