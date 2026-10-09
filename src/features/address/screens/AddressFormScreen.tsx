import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeliveryMap, type DeliveryMapRegion } from '@/features/address/components/DeliveryMap';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createCustomerAddress, getCustomerAddresses, updateCustomerAddress } from '@/features/address/api/addressApi';
import { getApiErrorMessage } from '@/services/api/errors';
import {
  geocodeQuery,
  requestCurrentLocation,
  reverseGeocodeCoords,
  type ResolvedLocation,
} from '@/services/locationService';
import { Skeleton, SkeletonGroup } from '@/components/ui/Skeleton';
import { colors } from '@/theme/colors';
import type { AddressLabel, AddressPayload, UserAddress } from '@/features/address/types/address';
import type { AuthUser } from '@/features/auth/types/auth';

type FlowStep = 'details' | 'pin';

const PIN_DELTA = 0.006;

function toMapRegion(latitude: number, longitude: number): DeliveryMapRegion {
  return {
    latitude,
    longitude,
    latitudeDelta: PIN_DELTA,
    longitudeDelta: PIN_DELTA,
  };
}

type DraftAddress = {
  label: AddressLabel;
  customLabel: string;
  receiverType: 'myself' | 'someone';
  receiverName: string;
  receiverPhone: string;
  completeAddress: string;
  area: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  isCurrentLocation: boolean;
};

const LABEL_OPTIONS: AddressLabel[] = ['Home', 'Work', 'Hotel', 'Other'];

function showToast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }

  Alert.alert('', message);
}

function labelIcon(label: string): keyof typeof Ionicons.glyphMap {
  const normalized = label.toLowerCase();
  if (normalized === 'home') return 'home-outline';
  if (normalized === 'work') return 'briefcase-outline';
  if (normalized === 'hotel') return 'bed-outline';
  return 'location-outline';
}

function createEmptyDraft(user: AuthUser): DraftAddress {
  return {
    label: 'Home',
    customLabel: '',
    receiverType: 'myself',
    receiverName: user.name || '',
    receiverPhone: user.mobile || '',
    completeAddress: '',
    area: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: null,
    longitude: null,
    isCurrentLocation: false,
  };
}

function addressToDraft(address: UserAddress, user: AuthUser): DraftAddress {
  const phone = address.receiver_phone || user.mobile || '';
  const isMyself =
    !address.receiver_name ||
    address.receiver_name === (user.name || '') ||
    address.receiver_phone === user.mobile;

  return {
    label: LABEL_OPTIONS.includes(address.label as AddressLabel)
      ? (address.label as AddressLabel)
      : 'Other',
    customLabel: address.custom_label || '',
    receiverType: isMyself ? 'myself' : 'someone',
    receiverName: address.receiver_name || user.name || '',
    receiverPhone: phone,
    completeAddress: address.complete_address || '',
    area: address.area || '',
    street: address.street || '',
    city: address.city || '',
    state: address.state || '',
    country: address.country || '',
    postalCode: address.postal_code || '',
    latitude: address.latitude,
    longitude: address.longitude,
    isCurrentLocation: address.is_current_location,
  };
}

function applyResolvedLocation(draft: DraftAddress, location: ResolvedLocation): DraftAddress {
  return {
    ...draft,
    area: location.area,
    street: location.street,
    city: location.city,
    state: location.state,
    country: location.country,
    postalCode: location.postal_code,
    latitude: location.latitude,
    longitude: location.longitude,
  };
}

export default function AddressFormScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id, required } = useLocalSearchParams<{ id?: string; required?: string }>();
  const editingId = id ? Number(id) : null;
  const isRequired = !editingId && (required === '1' || required === 'true');
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const isWideScreen = screenWidth >= 600;

  const [step, setStep] = useState<FlowStep>('details');
  const [showLocationSheet, setShowLocationSheet] = useState(!editingId);
  const [draft, setDraft] = useState<DraftAddress | null>(user ? createEmptyDraft(user) : null);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editingId));
  const [currentLocationPreview, setCurrentLocationPreview] = useState('');
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [manualSearch, setManualSearch] = useState('');
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [mapRegion, setMapRegion] = useState<DeliveryMapRegion | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const pinLookupRef = useRef(0);

  useEffect(() => {
    if (!user || editingId || draft) {
      return;
    }

    setDraft(createEmptyDraft(user));
  }, [draft, editingId, user]);

  useEffect(() => {
    if (!user || !editingId) {
      return;
    }

    let active = true;

    (async () => {
      try {
        const addresses = await getCustomerAddresses();
        const found = addresses.find((item) => item.id === editingId);

        if (!active) {
          return;
        }

        if (!found) {
          Alert.alert('Address Book', 'Address not found.');
          router.back();
          return;
        }

        const nextDraft = addressToDraft(found, user);
        setEditingAddress(found);
        setDraft(nextDraft);
        if (nextDraft.latitude != null && nextDraft.longitude != null) {
          setMapRegion(toMapRegion(nextDraft.latitude, nextDraft.longitude));
        }
      } catch (error) {
        if (!active) {
          return;
        }

        Alert.alert('Address Book', getApiErrorMessage(error, 'Unable to load this address.'));
        router.back();
      } finally {
        if (active) {
          setLoadingEdit(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [editingId, router, user]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const location = await requestCurrentLocation();
        if (!active) {
          return;
        }

        setCurrentLocationPreview(location.displayLine);
        setUserCoords({ latitude: location.latitude, longitude: location.longitude });
      } catch {
        if (active) {
          setCurrentLocationPreview('');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const areaLine = useMemo(() => {
    if (!draft) {
      return 'Select area';
    }

    return [draft.area, draft.street].filter(Boolean).join(', ') || draft.city || 'Select area';
  }, [draft]);

  const updateDraft = useCallback((patch: Partial<DraftAddress>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const handleUseCurrentLocation = async () => {
    setLocating(true);

    try {
      const location = await requestCurrentLocation();
      setCurrentLocationPreview(location.displayLine);
      setUserCoords({ latitude: location.latitude, longitude: location.longitude });
      setMapRegion(toMapRegion(location.latitude, location.longitude));
      setDraft((prev) =>
        prev
          ? {
              ...applyResolvedLocation(prev, location),
              isCurrentLocation: true,
            }
          : prev
      );
      setShowLocationSheet(false);
      setShowManualSearch(false);
    } catch (error) {
      Alert.alert('Location unavailable', getApiErrorMessage(error, 'Unable to detect your current location.'));
    } finally {
      setLocating(false);
    }
  };

  const applyManualLocation = async () => {
    const query = manualSearch.trim();

    if (!query) {
      Alert.alert('Enter a location', 'Please type an area, landmark, or city.');
      return;
    }

    setLocating(true);

    try {
      const resolved = await geocodeQuery(query);
      setMapRegion(toMapRegion(resolved.latitude, resolved.longitude));
      setDraft((prev) =>
        prev
          ? {
              ...applyResolvedLocation(prev, resolved),
              isCurrentLocation: false,
            }
          : prev
      );
      setShowLocationSheet(false);
      setShowManualSearch(false);
      setManualSearch('');
    } catch (error) {
      Alert.alert('Search failed', getApiErrorMessage(error, 'Unable to search that location right now.'));
    } finally {
      setLocating(false);
    }
  };

  const validateDetails = () => {
    if (!draft) {
      return false;
    }

    if (!draft.completeAddress.trim()) {
      Alert.alert('Required', 'Please enter the complete address.');
      return false;
    }

    if (!draft.receiverName.trim()) {
      Alert.alert('Required', "Please enter the receiver's name.");
      return false;
    }

    const phone = draft.receiverPhone.replace(/\D/g, '');
    if (phone.length !== 10) {
      Alert.alert('Required', "Please enter a valid 10-digit receiver's phone number.");
      return false;
    }

    if (draft.label === 'Other' && !draft.customLabel.trim()) {
      Alert.alert('Required', 'Please enter a custom label for this address.');
      return false;
    }

    if (!draft.city.trim()) {
      Alert.alert('Required', 'Please select a location for this address.');
      return false;
    }

    if (draft.latitude == null || draft.longitude == null) {
      Alert.alert('Required', 'Please select a delivery location.');
      return false;
    }

    return true;
  };

  const openPinStep = () => {
    if (!draft || !validateDetails() || draft.latitude == null || draft.longitude == null) {
      return;
    }

    setMapRegion(toMapRegion(draft.latitude, draft.longitude));
    setStep('pin');
  };

  const goToCurrentLocationOnMap = async () => {
    setLocating(true);

    try {
      const location = await requestCurrentLocation();
      setCurrentLocationPreview(location.displayLine);
      setUserCoords({ latitude: location.latitude, longitude: location.longitude });
      setMapRegion(toMapRegion(location.latitude, location.longitude));
      setDraft((prev) =>
        prev
          ? {
              ...applyResolvedLocation(prev, location),
              isCurrentLocation: true,
            }
          : prev
      );
    } catch (error) {
      Alert.alert('Location unavailable', getApiErrorMessage(error, 'Unable to detect your current location.'));
    } finally {
      setLocating(false);
    }
  };

  const handleRegionChangeComplete = async (region: DeliveryMapRegion) => {
    const lookupId = pinLookupRef.current + 1;
    pinLookupRef.current = lookupId;

    setDraft((prev) =>
      prev
        ? {
            ...prev,
            latitude: region.latitude,
            longitude: region.longitude,
            isCurrentLocation: false,
          }
        : prev
    );

    try {
      const resolved = await reverseGeocodeCoords(region.latitude, region.longitude);
      if (pinLookupRef.current !== lookupId) {
        return;
      }

      setDraft((prev) =>
        prev
          ? {
              ...prev,
              area: resolved.area || prev.area,
              street: resolved.street || prev.street,
              city: resolved.city || prev.city,
              state: resolved.state || prev.state,
              country: resolved.country || prev.country,
              postalCode: resolved.postal_code || prev.postalCode,
              latitude: region.latitude,
              longitude: region.longitude,
            }
          : prev
      );
    } catch {
      // Keep the typed address if reverse geocoding fails. The pin coordinates stay.
    }
  };

  const buildPayload = (): AddressPayload | null => {
    if (!draft) {
      return null;
    }

    return {
      label: draft.label,
      custom_label: draft.label === 'Other' ? draft.customLabel.trim() : null,
      receiver_name: draft.receiverName.trim(),
      receiver_phone: draft.receiverPhone.replace(/\D/g, ''),
      complete_address: draft.completeAddress.trim(),
      area: draft.area.trim() || null,
      street: draft.street.trim() || null,
      city: draft.city.trim() || null,
      state: draft.state.trim() || null,
      country: draft.country.trim() || null,
      postal_code: draft.postalCode.trim() || null,
      latitude: draft.latitude,
      longitude: draft.longitude,
      is_default: editingAddress?.is_default ?? isRequired,
      is_current_location: draft.isCurrentLocation,
    };
  };

  const handleSave = async () => {
    if (!validateDetails()) {
      setStep('details');
      return;
    }

    const payload = buildPayload();
    if (!payload) {
      return;
    }

    setSaving(true);

    try {
      if (editingAddress) {
        await updateCustomerAddress(editingAddress.id, payload);
      } else {
        await createCustomerAddress(payload);
      }

      showToast(editingAddress ? 'Address updated' : 'Address saved');
      router.back();
    } catch (error) {
      Alert.alert('Save failed', getApiErrorMessage(error, 'Unable to save address. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleReceiverTypeChange = (type: 'myself' | 'someone') => {
    if (!draft || !user) {
      return;
    }

    if (type === 'myself') {
      updateDraft({
        receiverType: 'myself',
        receiverName: user.name || draft.receiverName,
        receiverPhone: user.mobile || draft.receiverPhone,
      });
      return;
    }

    updateDraft({ receiverType: 'someone' });
  };

  useEffect(() => {
    if (!isRequired) {
      return;
    }

    const parent = navigation.getParent();
    parent?.setOptions({ gestureEnabled: false });

    return () => {
      parent?.setOptions({ gestureEnabled: true });
    };
  }, [isRequired, navigation]);

  useEffect(() => {
    if (!isRequired) {
      return;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step === 'pin') {
        setStep('details');
      }

      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [isRequired, step]);

  if (!user || !draft || loadingEdit) {
    return (
      <View style={[styles.formSkeleton, { paddingTop: Math.max(insets.top, 16) }]}>
        <SkeletonGroup>
          <Skeleton width={160} height={18} />
          <Skeleton height={180} radius={16} style={{ marginTop: 16 }} />
          <Skeleton width="100%" height={48} radius={12} style={{ marginTop: 16 }} />
          <Skeleton width="100%" height={48} radius={12} style={{ marginTop: 10 }} />
          <Skeleton width="100%" height={48} radius={12} style={{ marginTop: 10 }} />
        </SkeletonGroup>
      </View>
    );
  }

  const closeLocationSheet = () => {
    if (editingAddress || draft.city) {
      setShowLocationSheet(false);
      setShowManualSearch(false);
      return;
    }

    if (isRequired) {
      return;
    }

    router.back();
  };

  const leaveForm = () => {
    if (isRequired) {
      return;
    }

    router.back();
  };

  if (step === 'pin') {
    const pinLabel =
      draft.latitude != null && draft.longitude != null
        ? `${draft.latitude.toFixed(6)}, ${draft.longitude.toFixed(6)}`
        : 'Move the map to place the pin';

    return (
      <View style={styles.container}>
        {isRequired ? <Stack.Screen options={{ gestureEnabled: false }} /> : null}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
            onPress={() => setStep('details')}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>Review your delivery pin</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.mapWrap}>
          {mapRegion ? (
            <DeliveryMap
              region={mapRegion}
              userCoords={userCoords}
              onRegionChangeComplete={handleRegionChangeComplete}
            />
          ) : (
            <View style={styles.mapMissing}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.mapMissingText}>Select a location to load the map</Text>
            </View>
          )}

          <View style={styles.mapBanner} pointerEvents="none">
            <Text style={styles.mapBannerText}>Move the map so the pin is on the exact delivery point</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.currentLocationFab, pressed && styles.pressed]}
            onPress={goToCurrentLocationOnMap}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator color={colors.primaryDark} size="small" />
            ) : (
              <>
                <Ionicons name="navigate" size={16} color={colors.primaryDark} />
                <Text style={styles.currentLocationFabText}>Go to current location</Text>
              </>
            )}
          </Pressable>
        </View>

        <ScrollView
          style={styles.pinSheet}
          contentContainerStyle={[
            styles.pinSheetContent,
            { paddingBottom: Math.max(insets.bottom, 16) + 84 },
            isWideScreen && styles.contentWide,
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dragHandle} />
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Your address details</Text>
            <Pressable onPress={() => setStep('details')}>
              <Text style={styles.editLink}>Edit</Text>
            </Pressable>
          </View>

          <View style={styles.summaryCard}>
            <SummaryRow label="Address" value={draft.completeAddress} />
            <SummaryRow label="Area" value={draft.area || draft.street || '—'} />
            <SummaryRow label="City" value={draft.city || '—'} />
            <SummaryRow label="Pin latitude, longitude" value={pinLabel} />
            <SummaryRow label="Receiver name" value={draft.receiverName} />
            <SummaryRow label="Receiver phone" value={draft.receiverPhone} isLast />
          </View>
        </ScrollView>

        <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (saving || locating) && styles.primaryButtonDisabled,
              pressed && styles.pressed,
            ]}
            onPress={handleSave}
            disabled={saving || locating}
          >
            {saving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Save Address</Text>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isRequired ? <Stack.Screen options={{ gestureEnabled: false }} /> : null}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 8 }]}>
        {isRequired ? (
          <View style={styles.headerSpacer} />
        ) : (
          <Pressable
            style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
            onPress={leaveForm}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
        )}
        <Text style={styles.headerTitle}>{editingAddress ? 'Edit address details' : 'Add address details'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 96 },
          isWideScreen && styles.contentWide,
        ]}
      >
        <View style={styles.sectionCard}>
          <View style={styles.locationRow}>
            <View style={styles.locationTextCol}>
              <Text style={styles.fieldLabel}>City</Text>
              <Text style={styles.fieldValue}>{draft.city || 'Select city'}</Text>
            </View>
            <Pressable onPress={() => setShowLocationSheet(true)}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.softDivider} />

          <View style={styles.locationRow}>
            <View style={styles.locationTextCol}>
              <Text style={styles.fieldLabel}>Area / Street</Text>
              <Text style={styles.fieldValue}>{areaLine}</Text>
            </View>
            <Pressable onPress={() => setShowLocationSheet(true)}>
              <Text style={styles.changeLink}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.softDivider} />

          <Text style={styles.inputLabel}>Enter complete address*</Text>
          <TextInput
            style={[styles.textInput, styles.multilineInput]}
            value={draft.completeAddress}
            onChangeText={(text) => updateDraft({ completeAddress: text })}
            placeholder="Example: Plot No. 112, Shree Vihar Colony, Jagatpura"
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.sectionHeading}>Contact details</Text>
        <View style={styles.sectionCard}>
          <Text style={styles.inputLabel}>Receiver type</Text>
          <View style={styles.radioRow}>
            <Pressable style={styles.radioOption} onPress={() => handleReceiverTypeChange('myself')}>
              <Ionicons
                name={draft.receiverType === 'myself' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>Myself</Text>
            </Pressable>
            <Pressable style={styles.radioOption} onPress={() => handleReceiverTypeChange('someone')}>
              <Ionicons
                name={draft.receiverType === 'someone' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.radioLabel}>Someone else</Text>
            </Pressable>
          </View>

          <Text style={styles.inputLabel}>Receiver&apos;s name*</Text>
          <TextInput
            style={styles.textInput}
            value={draft.receiverName}
            onChangeText={(text) => updateDraft({ receiverName: text })}
            placeholder="Enter receiver's name"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Receiver&apos;s phone number*</Text>
          <View style={styles.phoneRow}>
            <View style={styles.phonePrefix}>
              <Text style={styles.phonePrefixText}>+91</Text>
            </View>
            <TextInput
              style={[styles.textInput, styles.phoneInput]}
              value={draft.receiverPhone}
              onChangeText={(text) => updateDraft({ receiverPhone: text.replace(/\D/g, '').slice(0, 10) })}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        </View>

        <Text style={styles.sectionHeading}>Save address as</Text>
        <View style={styles.labelRow}>
          {LABEL_OPTIONS.map((label) => {
            const selected = draft.label === label;

            return (
              <Pressable
                key={label}
                style={[styles.labelChip, selected && styles.labelChipActive]}
                onPress={() => updateDraft({ label })}
              >
                <Ionicons name={labelIcon(label)} size={16} color={selected ? colors.white : colors.primary} />
                <Text style={[styles.labelChipText, selected && styles.labelChipTextActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {draft.label === 'Other' ? (
          <TextInput
            style={[styles.textInput, styles.customLabelInput]}
            value={draft.customLabel}
            onChangeText={(text) => updateDraft({ customLabel: text })}
            placeholder="Enter custom label"
            placeholderTextColor="#94A3B8"
          />
        ) : null}
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <Pressable
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={openPinStep}
        >
          <Text style={styles.primaryButtonText}>Next</Text>
        </Pressable>
      </View>

      <Modal
        visible={showLocationSheet}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeLocationSheet}
      >
        <View style={styles.sheetOverlay}>
          {isRequired ? (
            <View style={StyleSheet.absoluteFill} />
          ) : (
            <Pressable style={StyleSheet.absoluteFill} onPress={closeLocationSheet} />
          )}
          <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.sheetIconCircle}>
              <Ionicons name="navigate" size={28} color={colors.primary} />
            </View>
            <Text style={styles.sheetTitle}>Where should we deliver?</Text>
            <Text style={styles.sheetMessage}>
              Use your current location, or search for another area.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.sheetPrimaryOption, pressed && styles.pressed]}
              onPress={handleUseCurrentLocation}
              disabled={locating}
            >
              {locating && !showManualSearch ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Text style={styles.sheetPrimaryOptionText}>Deliver at my current location</Text>
                  {currentLocationPreview ? (
                    <Text style={styles.sheetPrimaryOptionSub}>{currentLocationPreview}</Text>
                  ) : null}
                </>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.sheetSecondaryOption, pressed && styles.pressed]}
              onPress={() => {
                setShowManualSearch(true);
                updateDraft({ isCurrentLocation: false });
              }}
              disabled={locating}
            >
              <Text style={styles.sheetSecondaryOptionText}>Deliver somewhere else</Text>
            </Pressable>

            {showManualSearch ? (
              <View style={styles.manualSearchBox}>
                <TextInput
                  style={styles.textInput}
                  value={manualSearch}
                  onChangeText={setManualSearch}
                  placeholder="Search area, landmark, or city"
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
                <Pressable
                  style={({ pressed }) => [styles.primaryButton, styles.manualSearchButton, pressed && styles.pressed]}
                  onPress={applyManualLocation}
                  disabled={locating}
                >
                  {locating ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Use this location</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.summaryRow, !isLast && styles.summaryRowBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  formSkeleton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentWide: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationTextCol: {
    flex: 1,
  },
  fieldLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  fieldValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  changeLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  softDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
  },
  textInput: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 14,
  },
  multilineInput: {
    minHeight: 88,
    paddingTop: 12,
    paddingBottom: 12,
  },
  customLabelInput: {
    marginTop: 12,
  },
  sectionHeading: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 4,
  },
  radioRow: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 14,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioLabel: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '700',
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phonePrefix: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '800',
  },
  phoneInput: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  labelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  labelChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  labelChipText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  labelChipTextActive: {
    color: colors.white,
  },
  stickyBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    opacity: 0.8,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 16,
  },
  sheetIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  sheetMessage: {
    marginTop: 8,
    marginBottom: 20,
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sheetPrimaryOption: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryOptionText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  sheetPrimaryOptionSub: {
    color: '#DBEAFE',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  sheetSecondaryOption: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    minHeight: 52,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryOptionText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  manualSearchBox: {
    marginTop: 16,
    gap: 10,
  },
  manualSearchButton: {
    marginTop: 4,
  },
  mapWrap: {
    height: 320,
    backgroundColor: '#E2E8F0',
    position: 'relative',
  },
  mapMissing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F7FA',
  },
  mapMissingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
  mapBanner: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mapBannerText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  currentLocationFab: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  currentLocationFabText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '800',
  },
  pinSheet: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
  },
  pinSheetContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  editLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingHorizontal: 14,
  },
  summaryRow: {
    paddingVertical: 12,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
});
