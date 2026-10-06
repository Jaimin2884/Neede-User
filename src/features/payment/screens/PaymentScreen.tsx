import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPaymentMethod, setPaymentMethod } from '@/features/payment/paymentSelection';
import { colors } from '@/theme/colors';
import { formatRupee } from '@/utils/money';

type PaymentOption = {
  id: string;
  name: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  bgColor: string;
  type: 'upi' | 'cod';
};

const paymentOptions: PaymentOption[] = [
  {
    id: 'gpay',
    name: 'Google Pay',
    icon: 'logo-google',
    iconColor: '#EA4335',
    bgColor: '#FDF2F2',
    type: 'upi',
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    icon: 'phone-portrait-outline',
    iconColor: '#5B21B6',
    bgColor: '#F5F3FF',
    type: 'upi',
  },
  {
    id: 'paytm',
    name: 'Paytm',
    icon: 'wallet-outline',
    iconColor: '#0284C7',
    bgColor: '#F0F9FF',
    type: 'upi',
  },
  {
    id: 'cod',
    name: 'COD',
    subtitle: 'Cash on delivery',
    icon: 'cash-outline',
    iconColor: '#16A34A',
    bgColor: '#F0FDF4',
    type: 'cod',
  },
];

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert('', message);
}

function readTotal(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const amount = Number(raw);
  return Number.isFinite(amount) ? amount : 0;
}

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isWideScreen = screenWidth >= 600;
  const { total } = useLocalSearchParams<{ total?: string }>();
  const grandTotal = readTotal(total);
  const savedMethod = getPaymentMethod();
  const [currentSelection, setCurrentSelection] = useState(
    paymentOptions.some((option) => option.name === savedMethod) ? savedMethod ?? '' : ''
  );
  const selectedDetails = paymentOptions.find((option) => option.name === currentSelection);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/cart');
  };

  const handleSelectOption = (name: string) => {
    setCurrentSelection(name);
    showToast(`Selected ${name}`);
  };

  const handleUsePayment = () => {
    if (!currentSelection) {
      showToast('Please select a payment method');
      return;
    }

    setPaymentMethod(currentSelection);
    goBack();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 10) }]}>
        <Pressable onPress={goBack} style={styles.backButton} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <Text style={styles.headerSubtitle}>Choose how you want to pay</Text>
        </View>
        <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 12) + 88 }}
      >
        <View style={[styles.inner, isWideScreen && styles.innerWide]}>
          <View style={styles.amountCard}>
            <View style={styles.amountLeft}>
              <View style={styles.amountIcon}>
                <Ionicons name="wallet" size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.amountLabel}>AMOUNT TO PAY</Text>
                <Text style={styles.amountValue}>{formatRupee(grandTotal)}</Text>
              </View>
            </View>
            <View style={styles.secureBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.secureText}>SECURE</Text>
            </View>
          </View>

          <View style={styles.promoStrip}>
            <Ionicons name="gift-outline" size={16} color="#0284C7" />
            <Text style={styles.promoText}>Save ₹50 with eligible UPI payment</Text>
          </View>

          <Text style={styles.sectionTitle}>SELECTED PAYMENT METHOD</Text>
          <View style={styles.selectedCard}>
            <View style={styles.selectedInner}>
              <View style={[styles.methodIcon, { backgroundColor: selectedDetails?.bgColor || colors.borderLight }]}>
                <Ionicons
                  name={selectedDetails?.icon || 'card-outline'}
                  size={18}
                  color={selectedDetails?.iconColor || colors.textSecondary}
                />
              </View>
              <View style={styles.selectedCopy}>
                <Text style={styles.selectedName}>{selectedDetails?.name || 'No method selected'}</Text>
                <Text style={styles.selectedMask}>
                  {selectedDetails?.subtitle || (selectedDetails ? 'Ready to use' : 'Choose how you want to pay')}
                </Text>
              </View>
            </View>
            {selectedDetails ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
          </View>

          <Text style={styles.sectionTitle}>PAY BY UPI</Text>
          <View style={styles.optionsBlock}>
            {paymentOptions
              .filter((option) => option.type === 'upi')
              .map((option, index, list) => (
                <OptionRow
                  key={option.id}
                  option={option}
                  selected={currentSelection === option.name}
                  last={index === list.length - 1}
                  onPress={() => handleSelectOption(option.name)}
                />
              ))}
          </View>

          <Text style={styles.sectionTitle}>PAY ON DELIVERY</Text>
          <View style={styles.optionsBlock}>
            {paymentOptions
              .filter((option) => option.type === 'cod')
              .map((option) => (
                <OptionRow
                  key={option.id}
                  option={option}
                  selected={currentSelection === option.name}
                  last
                  onPress={() => handleSelectOption(option.name)}
                />
              ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.footerInner, isWideScreen && styles.innerWide]}>
          <View>
            <Text style={styles.footerLabel}>TOTAL TO PAY</Text>
            <Text style={styles.footerPrice}>{formatRupee(grandTotal)}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.useButton, pressed && styles.useButtonPressed]}
            onPress={handleUsePayment}
          >
            <Text style={styles.useButtonText}>USE THIS PAYMENT METHOD</Text>
            <Ionicons name="arrow-forward" size={15} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function OptionRow({
  option,
  selected,
  last,
  onPress,
}: {
  option: PaymentOption;
  selected: boolean;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.optionRow, last && styles.noBorder]} onPress={onPress}>
      <View style={styles.optionLeft}>
        <View style={[styles.methodIcon, { backgroundColor: option.bgColor }]}>
          <Ionicons name={option.icon} size={16} color={option.iconColor} />
        </View>
        <View>
          <Text style={styles.optionName}>{option.name}</Text>
          {option.subtitle ? <Text style={styles.optionMask}>{option.subtitle}</Text> : null}
        </View>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'chevron-forward'}
        size={selected ? 20 : 16}
        color={selected ? colors.primary : colors.placeholder}
      />
    </Pressable>
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
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    marginTop: 1,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  innerWide: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  amountCard: {
    backgroundColor: colors.primaryLight,
    borderColor: '#BAE6FD',
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 14,
    marginTop: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 0.4,
  },
  amountValue: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  secureBadge: {
    alignItems: 'center',
  },
  secureText: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
  promoStrip: {
    marginHorizontal: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
  },
  sectionTitle: {
    marginHorizontal: 14,
    marginTop: 18,
    marginBottom: 6,
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  selectedCard: {
    marginHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedInner: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  selectedCopy: {
    flex: 1,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  selectedMask: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  optionsBlock: {
    marginHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  optionMask: {
    marginTop: 2,
    fontSize: 11,
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
  },
  footerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.placeholder,
    letterSpacing: 0.4,
  },
  footerPrice: {
    marginTop: 2,
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  useButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexShrink: 1,
  },
  useButtonPressed: {
    opacity: 0.9,
  },
  useButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
