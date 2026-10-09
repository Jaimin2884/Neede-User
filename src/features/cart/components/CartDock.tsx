import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCart } from '@/features/cart/hooks/useCart';
import { colors } from '@/theme/colors';

type CartDockProps = {
  lifted?: number;
  aboveTabs?: boolean;
};

export function CartDock({ lifted = 0, aboveTabs = false }: CartDockProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bill, lines } = useCart();

  if (bill.itemCount < 1) {
    return null;
  }

  const previews = lines.slice(0, 3);
  const itemLabel = `${bill.itemCount} ${bill.itemCount === 1 ? 'Item' : 'Items'}`;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: (aboveTabs ? 10 : Math.max(insets.bottom, 12)) + lifted },
      ]}
    >
      <TouchableOpacity style={styles.bar} activeOpacity={0.9} onPress={() => router.push('/cart')}>
        <View style={styles.thumbs}>
          {previews.map((line, index) => (
            <View key={line.id} style={[styles.thumb, index > 0 && styles.thumbOverlap]}>
              {line.imageUrl ? (
                <Image source={{ uri: line.imageUrl }} style={{ width: 32, height: 32 }} resizeMode="cover" />
              ) : (
                <Ionicons name="basket-outline" size={16} color={colors.primary} />
              )}
            </View>
          ))}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>View cart</Text>
          <Text style={styles.subtitle}>{itemLabel}</Text>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.white} />
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 8,
    alignItems: 'center',
  },
  bar: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 8,
    gap: 10,
    shadowColor: '#0F2744',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
    width: '100%',
    maxWidth: 280,
  },
  thumbs: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
  },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbOverlap: {
    marginLeft: -12,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 1,
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
