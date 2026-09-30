import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  deleteCustomerAddress,
  getCustomerAddresses,
  setDefaultCustomerAddress,
} from '@/services/addressApi';
import { getApiErrorMessage } from '@/services/api';
import { colors } from '@/theme/colors';
import type { UserAddress } from '@/types/address';
import { displayAddressLabel, formatAddressPhone } from '@/utils/address';

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert('', message);
}

function labelIcon(label: string): keyof typeof Ionicons.glyphMap {
  const normalized = label.toLowerCase();

  if (normalized === 'home') return 'home';
  if (normalized === 'work') return 'briefcase';
  if (normalized === 'hotel') return 'bed';
  return 'location';
}

function isSelectMode(mode: string | string[] | undefined) {
  const value = Array.isArray(mode) ? mode[0] : mode;
  return value === 'select';
}

export default function AddressBookScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const selectMode = isSelectMode(mode);
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isWideScreen = screenWidth >= 600;

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadAddresses = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
    }

    try {
      const nextAddresses = await getCustomerAddresses();
      setAddresses(nextAddresses);
    } catch (error) {
      Alert.alert('Address Book', getApiErrorMessage(error, 'Unable to load addresses.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [loadAddresses])
  );

  const leaveAddressBook = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/tabs');
  };

  const openAddFlow = () => {
    router.push('/address-book/form');
  };

  const openEditFlow = (address: UserAddress) => {
    router.push({ pathname: '/address-book/form', params: { id: String(address.id) } });
  };

  const handleDelete = (address: UserAddress) => {
    Alert.alert('Delete this address?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setActionId(address.id);

          try {
            await deleteCustomerAddress(address.id);
            showToast('Address deleted');
            await loadAddresses(true);
          } catch (error) {
            Alert.alert('Delete failed', getApiErrorMessage(error, 'Unable to delete address.'));
          } finally {
            setActionId(null);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (address: UserAddress) => {
    if (address.is_default) {
      return;
    }

    setActionId(address.id);

    try {
      await setDefaultCustomerAddress(address.id);
      setAddresses((prev) =>
        prev.map((item) => ({
          ...item,
          is_default: item.id === address.id,
        }))
      );
      showToast('Default address updated');
    } catch (error) {
      Alert.alert('Update failed', getApiErrorMessage(error, 'Unable to update default address.'));
    } finally {
      setActionId(null);
    }
  };

  const handleDeliverHere = async (address: UserAddress) => {
    if (address.is_default) {
      leaveAddressBook();
      return;
    }

    setActionId(address.id);

    try {
      await setDefaultCustomerAddress(address.id);
      showToast('Delivering to this address');
      leaveAddressBook();
    } catch (error) {
      Alert.alert('Update failed', getApiErrorMessage(error, 'Unable to select this address.'));
      setActionId(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          onPress={leaveAddressBook}
        >
          <Ionicons name="arrow-back" size={20} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Address Book</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
            isWideScreen && styles.contentWide,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAddresses(true);
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          <Pressable
            style={({ pressed }) => [styles.addCard, pressed && styles.pressed]}
            onPress={openAddFlow}
          >
            <View style={styles.addIconCircle}>
              <Ionicons name="add" size={22} color={colors.primary} />
            </View>
            <Text style={styles.addCardText}>Add new address</Text>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </Pressable>

          {addresses.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="location-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No addresses saved yet</Text>
              <Text style={styles.emptySubtitle}>Add your first address</Text>
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={openAddFlow}
              >
                <Text style={styles.primaryButtonText}>Add new address</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.sectionLabel}>Saved addresses</Text>
              {addresses.map((address) => {
                const busy = actionId === address.id;
                const title = displayAddressLabel(address);
                const areaLine = [address.area, address.street, address.city].filter(Boolean).join(', ');

                return (
                  <View
                    key={address.id}
                    style={[styles.addressCard, address.is_default && styles.addressCardDefault]}
                  >
                    <View style={styles.addressCardHeader}>
                      <View style={styles.addressTitleRow}>
                        <View
                          style={[
                            styles.labelIconCircle,
                            address.is_default && styles.labelIconCircleDefault,
                          ]}
                        >
                          <Ionicons
                            name={labelIcon(address.label)}
                            size={16}
                            color={address.is_default ? colors.white : colors.primary}
                          />
                        </View>
                        <Text style={styles.addressLabel}>{title}</Text>
                        {address.is_default ? (
                          <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Default</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={styles.cardActions}>
                        <Pressable
                          style={styles.iconAction}
                          onPress={() => openEditFlow(address)}
                          disabled={busy}
                        >
                          <Ionicons name="create-outline" size={18} color={colors.primary} />
                        </Pressable>
                        <Pressable
                          style={styles.iconAction}
                          onPress={() => handleDelete(address)}
                          disabled={busy}
                        >
                          <Ionicons name="trash-outline" size={18} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>

                    <Text style={styles.addressLine}>{address.complete_address}</Text>
                    {areaLine ? <Text style={styles.areaLine}>{areaLine}</Text> : null}

                    <View style={styles.receiverRow}>
                      <Ionicons name="person-outline" size={14} color="#64748B" />
                      <Text style={styles.receiverText}>{address.receiver_name}</Text>
                    </View>
                    <View style={styles.receiverRow}>
                      <Ionicons name="call-outline" size={14} color="#64748B" />
                      <Text style={styles.receiverText}>{formatAddressPhone(address.receiver_phone)}</Text>
                    </View>

                    {selectMode ? (
                      <Pressable
                        style={({ pressed }) => [
                          styles.deliverHereButton,
                          pressed && styles.pressed,
                          busy && styles.deliverHereButtonDisabled,
                        ]}
                        onPress={() => handleDeliverHere(address)}
                        disabled={busy}
                      >
                        {busy ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <>
                            <Ionicons name="navigate" size={16} color={colors.white} />
                            <Text style={styles.deliverHereText}>Deliver here</Text>
                          </>
                        )}
                      </Pressable>
                    ) : !address.is_default ? (
                      <Pressable
                        style={({ pressed }) => [styles.setDefaultButton, pressed && styles.pressed]}
                        onPress={() => handleSetDefault(address)}
                        disabled={busy}
                      >
                        {busy ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
                            <Text style={styles.setDefaultText}>Set as default</Text>
                          </>
                        )}
                      </Pressable>
                    ) : (
                      <View style={styles.currentLocationRow}>
                        <Ionicons name="navigate-circle" size={16} color="#16A34A" />
                        <Text style={styles.currentLocationText}>
                          {address.is_current_location
                            ? 'Current location · Default delivery address'
                            : 'Default delivery address'}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 38,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentWide: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  addCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addCardText: {
    flex: 1,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  sectionLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  addressCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 12,
  },
  addressCardDefault: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FBFF',
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    paddingRight: 8,
  },
  labelIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelIconCircleDefault: {
    backgroundColor: colors.primary,
  },
  addressLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  iconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLine: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 4,
  },
  areaLine: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  receiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  receiverText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  setDefaultButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  setDefaultText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  deliverHereButton: {
    marginTop: 12,
    alignSelf: 'stretch',
    minHeight: 42,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deliverHereButtonDisabled: {
    opacity: 0.7,
  },
  deliverHereText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  currentLocationRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  currentLocationText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
  },
  primaryButton: {
    minHeight: 48,
    minWidth: 180,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
  },
});
