import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text, IconButton, Divider } from 'react-native-paper';
import { AppTheme } from '../../constants/theme';

interface HeaderProps {
  title: string;
  showDivider?: boolean;
  leftAction?: {
    icon: string;
    onPress: () => void;
  };
  rightActions?: Array<{
    icon: string;
    onPress: () => void;
    disabled?: boolean;
  }>;
  style?: ViewStyle;
}

export default function Header({
  title,
  showDivider = true,
  leftAction,
  rightActions,
  style,
}: HeaderProps) {
  return (
    <>
      <View style={[styles.container, style]}>
        <View style={styles.leftSection}>
          {leftAction && (
            <IconButton
              icon={leftAction.icon}
              size={24}
              onPress={leftAction.onPress}
              iconColor={AppTheme.colors.primary}
              style={styles.leftIcon}
            />
          )}
          <Text variant="headlineSmall" style={styles.title}>
            {title}
          </Text>
        </View>
        {rightActions && rightActions.length > 0 && (
          <View style={styles.rightSection}>
            {rightActions.map((action, index) => (
              <IconButton
                key={index}
                icon={action.icon}
                size={24}
                onPress={action.onPress}
                disabled={action.disabled}
                iconColor={AppTheme.colors.text}
              />
            ))}
          </View>
        )}
      </View>
      {showDivider && <Divider />}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppTheme.spacing.md,
    paddingTop: AppTheme.spacing.md,
    paddingBottom: AppTheme.spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftIcon: {
    marginLeft: -AppTheme.spacing.sm,
    marginRight: AppTheme.spacing.xs,
  },
  title: {
    fontWeight: '700',
    color: AppTheme.colors.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
