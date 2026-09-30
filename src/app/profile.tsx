import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api';
import { colors } from '@/theme/colors';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AccountItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

const accountItems: AccountItem[] = [
  { icon: 'location-outline', label: 'Saved Addresses' },
  { icon: 'heart-outline', label: 'Favourite Shops' },
  { icon: 'time-outline', label: 'Recently Visited Shops' },
  { icon: 'bookmark-outline', label: 'Wishlist' },
  { icon: 'card-outline', label: 'Payment Methods' },
  { icon: 'receipt-outline', label: 'Transactions & Invoices' },
];

const shopItems: AccountItem[] = [
  { icon: 'compass-outline', label: 'Nearby Shops' },
  { icon: 'storefront-outline', label: 'Favourite Stores' },
  { icon: 'repeat-outline', label: 'Reorder from Previous Shop' },
];

function formatMobileNumber(mobileNumber: string) {
  const digits = mobileNumber.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  return mobileNumber;
}

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { user, logout, updateProfile } = useAuth();
  const [hideSensitive, setHideSensitive] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const isWideScreen = screenWidth >= 600;
  const mobileNumber = user ? formatMobileNumber(user.mobile) : '';
  const displayName = user?.name?.trim() || mobileNumber || 'Neede User';
  const displayEmail = user?.email?.trim() || 'Email not added';

  const openSection = (label: string) => {
    Alert.alert(label, 'This section will be available soon.');
  };

  const openEditProfile = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setIsEditing(true);
  };

  const closeEditProfile = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedEmail && !emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    setIsSaving(true);

    try {
      await updateProfile({ name: trimmedName, email: trimmedEmail });
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Could not save profile', getApiErrorMessage(error, 'Please try again.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  const renderListItem = (item: AccountItem, isLast: boolean) => (
    <View key={item.label}>
      <Pressable
        style={({ pressed }) => [styles.listItem, pressed && styles.listItemPressed]}
        onPress={() => openSection(item.label)}
      >
        <View style={styles.listItemLeft}>
          <Ionicons name={item.icon} size={20} color={colors.primary} style={styles.listItemIcon} />
          <Text style={styles.listItemText}>{item.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </Pressable>
      {!isLast ? <View style={styles.divider} /> : null}
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={[styles.guestHeader, { paddingTop: Math.max(insets.top, 16) + 16 }]}>
          <Pressable
            style={({ pressed }) => [styles.headerNavButton, pressed && styles.buttonPressed]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
        </View>
        <View style={[styles.guestContent, isWideScreen && styles.contentWrapperWide]}>
          <Pressable
            style={({ pressed }) => [styles.loginButton, pressed && styles.buttonPressed]}
            onPress={() => router.replace('/auth/login')}
          >
            <Ionicons name="log-in-outline" size={18} color={colors.white} />
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (isEditing) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.editScrollContainer,
            {
              paddingTop: Math.max(insets.top, 16) + 16,
              paddingBottom: Math.max(insets.bottom, 24),
            },
            isWideScreen && styles.contentWrapperWide,
          ]}
        >
          <View style={styles.editHeaderRow}>
            <Pressable
              style={({ pressed }) => [styles.headerNavButton, pressed && styles.buttonPressed]}
              onPress={closeEditProfile}
              disabled={isSaving}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>
            <Text style={styles.editHeaderTitle}>Edit Profile</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.editAvatar}>
            <Ionicons name="person" size={44} color={colors.primary} />
          </View>

          <View style={styles.editFormCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Add your name"
                placeholderTextColor="#94A3B8"
                autoCapitalize="words"
                editable={!isSaving}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Add your email"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                editable={!isSaving}
                style={styles.textInput}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.readOnlyInput}>
                <Text style={styles.readOnlyInputText}>{mobileNumber}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              </View>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && !isSaving && styles.buttonPressed,
              isSaving && styles.saveButtonDisabled,
            ]}
            onPress={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={colors.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}
      >
        <LinearGradient
          colors={['#1A6CA7', '#5BAFEF']}
          style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 16 }]}
        >
          <View style={styles.headerNavRow}>
            <Pressable
              style={({ pressed }) => [styles.headerNavButton, pressed && styles.buttonPressed]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.headerEditButton, pressed && styles.buttonPressed]}
              onPress={openEditProfile}
            >
              <Ionicons name="pencil" size={16} color={colors.white} />
            </Pressable>
          </View>

          <View style={styles.userInfoContainer}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={54} color={colors.primary} />
            </View>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.userMeta}>{displayEmail}</Text>
          </View>
        </LinearGradient>

        <View style={[styles.contentWrapper, isWideScreen && styles.contentWrapperWide]}>
          <View style={styles.quickActionsRow}>
            <QuickAction
              icon="bag-handle-outline"
              iconColor={colors.primary}
              iconBackground="#EFF6FF"
              title="Your Orders"
              subtitle="Track all orders"
              onPress={() => openSection('Your Orders')}
            />
            <QuickAction
              icon="storefront-outline"
              iconColor={colors.primary}
              iconBackground="#EFF6FF"
              title="My Shops"
              subtitle="Favourite stores"
              onPress={() => openSection('My Shops')}
            />
            <QuickAction
              icon="help-circle-outline"
              iconColor="#B45309"
              iconBackground="#FEF3C7"
              title="Need Help?"
              subtitle="24×7 Support"
              onPress={() => openSection('Need Help?')}
            />
          </View>

          <Text style={styles.sectionHeader}>Basic Details</Text>
          <View style={styles.cardContainer}>
            <DetailRow icon="person-outline" label="Name" value={user.name?.trim() || 'Not added'} />
            <View style={styles.innerDivider} />
            <DetailRow icon="mail-outline" label="Email" value={user.email?.trim() || 'Not added'} />
            <View style={styles.innerDivider} />
            <DetailRow icon="call-outline" label="Mobile" value={mobileNumber} />
          </View>

          <View style={styles.cardContainer}>
            <Pressable style={styles.settingsRow} onPress={() => openSection('Appearance')}>
              <View style={styles.settingsLeft}>
                <Ionicons name="sunny-outline" size={22} color="#1E293B" />
                <Text style={styles.settingsText}>Appearance</Text>
              </View>
              <View style={styles.appearanceDropdown}>
                <Text style={styles.appearanceValue}>Light Mode</Text>
                <Ionicons name="chevron-down" size={12} color="#64748B" />
              </View>
            </Pressable>
            <View style={styles.innerDivider} />
            <View style={styles.settingsBlock}>
              <View style={styles.settingsBlockLeft}>
                <Ionicons name="eye-off-outline" size={22} color="#1E293B" style={styles.settingsBlockIcon} />
                <View style={styles.settingsBlockContent}>
                  <Text style={styles.settingsText}>Hide Sensitive Products</Text>
                  <Text style={styles.settingsSubtext}>
                    Hide tobacco, wellness and restricted products
                  </Text>
                  <Pressable onPress={() => openSection('Hide Sensitive Products')}>
                    <Text style={styles.knowMoreLink}>Know More</Text>
                  </Pressable>
                </View>
              </View>
              <Switch
                value={hideSensitive}
                onValueChange={setHideSensitive}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor="#CBD5E1"
              />
            </View>
          </View>

          <Text style={styles.sectionHeader}>My Account</Text>
          <View style={styles.cardContainer}>
            {accountItems.map((item, index) => renderListItem(item, index === accountItems.length - 1))}
          </View>

          <View style={[styles.cardContainer, styles.shopWithNeedeCard]}>
            <View style={styles.shopWithNeedeHeader}>
              <Text style={styles.shopWithNeedeTitle}>Shop With Neede</Text>
              <Text style={styles.shopWithNeedeSubtitle}>Support local, order from shops near you.</Text>
            </View>
            {shopItems.map((item, index) => renderListItem(item, index === shopItems.length - 1))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.logoutCard, pressed && styles.logoutCardPressed]}
            onPress={handleLogout}
          >
            <View style={styles.logoutLeft}>
              <View style={styles.logoutIconContainer}>
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              </View>
              <View style={styles.logoutTextContainer}>
                <Text style={styles.logoutTitle}>Logout</Text>
                <Text style={styles.logoutSubtitle}>Sign out from your account</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#DC2626" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function QuickAction({
  icon,
  iconColor,
  iconBackground,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.quickActionCard, pressed && styles.cardPressed]} onPress={onPress}>
      <View style={[styles.quickIconBg, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text style={styles.quickCardTitle}>{title}</Text>
      <Text style={styles.quickCardSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailRowLeft}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  guestHeader: {
    paddingHorizontal: 20,
  },
  guestContent: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loginButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerNavButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerEditButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  avatarContainer: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    marginTop: 14,
  },
  userMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4,
  },
  contentWrapper: {
    width: '100%',
    alignSelf: 'center',
  },
  contentWrapperWide: {
    maxWidth: 600,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
  },
  quickCardSubtitle: {
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  cardContainer: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  detailRow: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 12,
  },
  detailValue: {
    flex: 1,
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 12,
  },
  appearanceDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  appearanceValue: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E293B',
    marginRight: 6,
  },
  innerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  settingsBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsBlockLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  settingsBlockIcon: {
    marginTop: 2,
  },
  settingsBlockContent: {
    flex: 1,
    marginLeft: 12,
    paddingRight: 8,
  },
  settingsSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  knowMoreLink: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  listItemPressed: {
    backgroundColor: '#F8FAFC',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemIcon: {
    marginRight: 12,
  },
  listItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 48,
  },
  shopWithNeedeCard: {
    borderTopWidth: 4,
    borderTopColor: colors.primary,
    marginTop: 16,
  },
  shopWithNeedeHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  shopWithNeedeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  shopWithNeedeSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFEBEB',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
  },
  logoutCardPressed: {
    backgroundColor: '#FDD8D8',
  },
  logoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutTextContainer: {
    marginLeft: 12,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
  },
  logoutSubtitle: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
    marginTop: 1,
  },
  editScrollContainer: {
    flexGrow: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  editHeaderRow: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  editHeaderTitle: {
    flex: 1,
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 38,
    height: 38,
  },
  editAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 4,
    borderColor: colors.white,
  },
  editFormCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
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
  readOnlyInput: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  readOnlyInputText: {
    color: '#475569',
    fontSize: 15,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});
