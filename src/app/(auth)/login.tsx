import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { AuthScaffold } from '@/components/common/AuthScaffold';
import { colors } from '@/theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const isValidPhone = phoneNumber.length === 10 && /^\d+$/.test(phoneNumber);

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value.replace(/\D/g, '').slice(0, 10));
  };

  const handleContinue = () => {
    if (!isValidPhone) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    router.push({
      pathname: '/(auth)/otp',
      params: { phone: phoneNumber },
    });
  };

  return (
    <AuthScaffold>
      <Text style={styles.title}>India&apos;s last minute app</Text>
      <Text style={styles.subtitle}>Log In or Sign Up</Text>

      <View style={[styles.inputWrapper, isFocused && styles.inputWrapperFocused]}>
        <Text style={styles.countryCode}>+91</Text>
        <View style={styles.divider} />
        <TextInput
          style={styles.textInput}
          placeholder="Enter mobile number"
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
          maxLength={10}
          value={phoneNumber}
          onChangeText={handlePhoneNumberChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>

      <PrimaryButton
        label="Continue"
        disabled={!isValidPhone}
        onPress={handleContinue}
        style={styles.continueButton}
      />

      <View style={styles.legalContainer}>
        <Text style={styles.legalText}>
          By continuing, you agree to our{' '}
          <Text
            style={styles.legalLink}
            onPress={() => Alert.alert('Terms of Service', 'Terms of service agreement details.')}
          >
            Terms of service
          </Text>
          {' & '}
          <Text
            style={styles.legalLink}
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy details.')}
          >
            Privacy policy
          </Text>
        </Text>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    width: '100%',
  },
  inputWrapperFocused: {
    borderColor: colors.primary,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    height: '100%',
    paddingVertical: 0,
  },
  continueButton: {
    marginTop: 12,
  },
  legalContainer: {
    marginTop: 8,
    paddingBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  legalText: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: colors.primary,
    fontWeight: '500',
  },
});
