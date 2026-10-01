import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import type { UserAddress } from '@/types/address';
import { displayAddressLabel } from '@/utils/address';

type AddressRequiredModalProps = {
  visible: boolean;
  addresses: UserAddress[];
  selectingId: number | null;
  onAddAddress: () => void;
  onSelectAddress: (address: UserAddress) => void;
};

export function AddressRequiredModal({
  visible,
  addresses,
  selectingId,
  onAddAddress,
  onSelectAddress,
}: AddressRequiredModalProps) {
  const insets = useSafeAreaInsets();
  const hasSavedAddresses = addresses.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => undefined}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="location" size={28} color={colors.primary} />
          </View>

          <Text style={styles.title}>
            {hasSavedAddresses ? 'Select a default address' : 'Add a delivery address'}
          </Text>
          <Text style={styles.message}>
            {hasSavedAddresses
              ? 'Choose where orders should be delivered. This stays open until a default address is selected.'
              : 'A delivery address is required before you can continue. This stays open until you add one.'}
          </Text>

          {hasSavedAddresses ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {addresses.map((address) => {
                const busy = selectingId === address.id;
                const detail = [address.complete_address, address.city].filter(Boolean).join(', ');

                return (
                  <Pressable
                    key={address.id}
                    style={({ pressed }) => [styles.addressCard, pressed && styles.pressed]}
                    onPress={() => onSelectAddress(address)}
                    disabled={selectingId !== null}
                  >
                    <View style={styles.addressIcon}>
                      <Ionicons name="home-outline" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.addressCopy}>
                      <Text style={styles.addressLabel} numberOfLines={1}>
                        {displayAddressLabel(address)}
                      </Text>
                      <Text style={styles.addressDetail} numberOfLines={2}>
                        {detail || 'Saved address'}
                      </Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator color={colors.primary} size="small" />
                    ) : (
                      <Text style={styles.useLabel}>Use</Text>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              selectingId !== null && styles.primaryButtonDisabled,
              pressed && selectingId === null && styles.pressed,
            ]}
            onPress={onAddAddress}
            disabled={selectingId !== null}
          >
            <Ionicons name="add" size={18} color={colors.white} />
            <Text style={styles.primaryButtonText}>
              {hasSavedAddresses ? 'Add new address' : 'Add address'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    maxHeight: '82%',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    marginTop: 14,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  list: {
    marginTop: 18,
    flexGrow: 0,
  },
  listContent: {
    gap: 10,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  addressIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCopy: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  addressDetail: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  useLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  primaryButton: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.85,
  },
});
