import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '@/features/cart/hooks/useCart';
import { colors } from '@/theme/colors';
import { formatRupee } from '@/utils/money';

type CartDockProps = {
  lifted?: number;
};

export function CartDock({ lifted = 0 }: CartDockProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bill } = useCart();

  if (bill.itemCount < 1) {
    return null;
  }

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) + lifted }]}>
      <TouchableOpacity
        style={styles.bar}
        activeOpacity={0.9}
        onPress={() => router.push('/cart')}
      >
        <View style={styles.bag}>
          <Ionicons name="bag-handle" size={18} color={colors.white} />
        </View>
        <Text style={styles.summary}>
          {bill.itemCount} {bill.itemCount === 1 ? 'item' : 'items'} · {formatRupee(bill.sellingTotal)}
        </Text>
        <Text style={styles.action}>VIEW CART</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  bar: {
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.cartNavy,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: '#0F2744',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  bag: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summary: {
    flex: 1,
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  action: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
