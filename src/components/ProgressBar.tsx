import { View, StyleSheet } from "react-native"
import { colors } from "../theme/colors"

interface ProgressBarProps {
  value: number
  max?: number
  height?: number
}

export function ProgressBar({ value, max = 100, height = 8 }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <View style={[styles.container, { height }]}>
      <View style={[styles.progress, { width: `${percentage}%`, height }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.muted,
    borderRadius: 4,
    overflow: "hidden",
  },
  progress: {
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
})
