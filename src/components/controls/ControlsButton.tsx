import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { haptics } from '../../utils/haptics';

interface ControlsButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export default function ControlsButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
}: ControlsButtonProps): React.JSX.Element {
  const handlePress = () => {
    haptics.transport();
    onPress();
  };
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text
        style={[
          styles.buttonText,
          variant === 'primary' ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  primary: {
    backgroundColor: colors.neonCyan,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.neonGreen,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacings.wide,
  },
  primaryText: {
    color: colors.background,
  },
  secondaryText: {
    color: colors.neonGreen,
  },
});
