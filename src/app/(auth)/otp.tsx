import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/buttons/PrimaryButton';
import { AuthScaffold } from '@/components/common/AuthScaffold';
import { colors } from '@/theme/colors';

const OTP_LENGTH = 4;

function readPhoneParam(phone: string | string[] | undefined) {
  if (Array.isArray(phone)) {
    return phone[0] ?? '';
  }

  return phone ?? '';
}

export default function OtpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ phone?: string | string[] }>();
  const phoneNumber = readPhoneParam(params.phone);
  const [otp, setOtp] = useState(() => Array(OTP_LENGTH).fill(''));
  const [isToastVisible, setIsToastVisible] = useState(false);
  const otpInputs = useRef<(TextInput | null)[]>([]);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const otpCode = otp.join('');
  const isValidOtp = otpCode.length === OTP_LENGTH;

  useEffect(() => {
    if (!phoneNumber) {
      router.replace('/(auth)/login');
    }
  }, [phoneNumber, router]);

  useEffect(() => {
    return () => {
      if (toastTimeout.current) {
        clearTimeout(toastTimeout.current);
      }
    };
  }, []);

  const showVerificationFailedToast = () => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    setIsToastVisible(true);
    toastTimeout.current = setTimeout(() => {
      setIsToastVisible(false);
    }, 2200);
  };

  const handleOtpChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    if (digits.length > 1) {
      const nextOtp = Array(OTP_LENGTH).fill('');
      digits.slice(0, OTP_LENGTH).split('').forEach((digit, digitIndex) => {
        nextOtp[digitIndex] = digit;
      });
      setOtp(nextOtp);
      otpInputs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = digits;
    setOtp(nextOtp);

    if (digits && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/(auth)/login');
  };

  const handleVerify = () => {
    if (!isValidOtp) {
      showVerificationFailedToast();
      return;
    }

    router.replace('/(tabs)' as any);

  };


  if (!phoneNumber) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <AuthScaffold
        topOverlay={
          <View style={[styles.backContainer, { top: Math.max(insets.top, 16) + 8 }]}>
            <Pressable
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              onPress={handleBack}
            >
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          </View>
        }
      >
        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>We&apos;ve sent a verification code to</Text>
        <Text style={styles.phoneNumber}>+91 {phoneNumber}</Text>

        <Pressable
          style={({ pressed }) => [styles.changeNumberButton, pressed && styles.pressed]}
          onPress={handleBack}
        >
          <Text style={styles.changeNumberText}>Change number</Text>
        </Pressable>

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(input) => {
                otpInputs.current[index] = input;
              }}
              style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
              value={digit}
              onChangeText={(value) => handleOtpChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? OTP_LENGTH : 1}
              textAlign="center"
              selectTextOnFocus
            />
          ))}
        </View>

        <PrimaryButton label="Verify & Continue" disabled={!isValidOtp} onPress={handleVerify} />

        <Pressable
          style={({ pressed }) => [styles.resendButton, pressed && styles.pressed]}
          onPress={() => {}}
        >
          <Text style={styles.resendText}>Resend OTP</Text>
        </Pressable>
      </AuthScaffold>

      {isToastVisible ? (
        <View style={[styles.toast, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
          <Text style={styles.toastText}>Verification failed</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  backContainer: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
  },
  backText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
  phoneNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 2,
  },
  changeNumberButton: {
    marginTop: 8,
    marginBottom: 18,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  changeNumberText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    marginBottom: 18,
  },
  otpInput: {
    flex: 1,
    maxWidth: 54,
    height: 48,
    borderWidth: 1,
    borderColor: colors.otpBorder,
    borderRadius: 12,
    backgroundColor: colors.otpBackground,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.otpFilledBackground,
  },
  resendButton: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  resendText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: colors.toast,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  toastText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '500',
  },
});
