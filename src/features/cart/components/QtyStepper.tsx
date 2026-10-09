import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors } from '@/theme/colors';

type QtyStepperProps = {
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
  disabled?: boolean;
  minWidth?: number;
};

export function QtyStepper({ quantity, onAdd, onRemove, disabled = false, minWidth }: QtyStepperProps) {
  if (quantity < 1) {
    return (
      <TouchableOpacity
        style={[styles.add, disabled && styles.disabled]}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={onAdd}
      >
        <Text style={styles.addText}>ADD</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.stepper, minWidth ? { minWidth } : null, disabled && styles.disabled]}>
      <TouchableOpacity style={styles.stepBtn} activeOpacity={0.75} disabled={disabled} onPress={onRemove}>
        <Ionicons name="remove" size={16} color={colors.white} />
      </TouchableOpacity>
      <Text style={styles.qty}>{quantity}</Text>
      <TouchableOpacity style={styles.stepBtn} activeOpacity={0.75} disabled={disabled} onPress={onAdd}>
        <Ionicons name="add" size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  add: {
    minWidth: 72,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  addText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  stepper: {
    minWidth: 104,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  stepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
