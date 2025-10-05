import type React from "react"
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from "react-native"
import { colors } from "../theme/colors"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "secondary" | "success" | "destructive" | "outline"
  style?: ViewStyle
  textStyle?: TextStyle
}

export function Badge({ children, variant = "default", style, textStyle }: BadgeProps) {
  const badgeStyle = [styles.badge, styles[variant], style]

  const badgeTextStyle = [styles.badgeText, styles[`${variant}Text`], textStyle]

  return (
    <View style={badgeStyle}>
      <Text style={badgeTextStyle}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  default: {
    backgroundColor: colors.primary,
  },
  defaultText: {
    color: colors.primaryForeground,
  },
  secondary: {
    backgroundColor: colors.secondary,
  },
  secondaryText: {
    color: colors.secondaryForeground,
  },
  success: {
    backgroundColor: colors.success,
  },
  successText: {
    color: colors.foreground,
  },
  destructive: {
    backgroundColor: colors.destructive,
  },
  destructiveText: {
    color: colors.destructiveForeground,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.foreground,
  },
})
