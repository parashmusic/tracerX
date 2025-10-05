"use client"

import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/Feather"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { colors } from "../theme/colors"
import { apiService } from "../services/apiService"

export default function ProjectFormScreen({ navigation }: any) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [clientName, setClientName] = useState("")
  const [budget, setBudget] = useState("")
  const [deadline, setDeadline] = useState("")
  const [isDatePickerVisible, setDatePickerVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Show calendar picker
  const showDatePicker = () => setDatePickerVisible(true)
  const hideDatePicker = () => setDatePickerVisible(false)
  const handleConfirm = (date: Date) => {
    hideDatePicker()
    const iso = date.toISOString().split("T")[0]
    setDeadline(iso)
  }

  const handleSubmit = async () => {
    if (!title.trim() || !clientName.trim() || !budget.trim() || !deadline.trim()) {
      setError("Please fill in all required fields: Title, Client Name, Budget, and Deadline.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const payload = {
        title,
        description,
        client: { name: clientName },
        budget: { total: Number(budget) },
        deadline,
      }
      console.log("Creating project with payload:", payload)
      await apiService.createProject(payload)
      navigation.goBack()
    } catch (e: any) {
      console.error("Create project error:", e)
      setError(e.message || "Failed to create project.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.title}>New Project</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Project Title"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Project Description"
          multiline
          numberOfLines={4}
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={styles.section}>Client Info</Text>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={clientName}
          onChangeText={setClientName}
          placeholder="Client Name"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={styles.section}>Financials</Text>
        <Text style={styles.label}>Budget *</Text>
        <TextInput
          style={styles.input}
          value={budget}
          onChangeText={setBudget}
          placeholder="Total Budget"
          keyboardType="numeric"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={styles.section}>Deadline *</Text>
        <TouchableOpacity style={styles.input} onPress={showDatePicker}>
          <Text style={deadline ? styles.inputText : styles.placeholderText}>
            {deadline || "Select deadline"}
          </Text>
        </TouchableOpacity>
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.buttonText}>Create Project</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  form: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 20, fontWeight: "bold", color: colors.foreground, marginLeft: 12 },
  label: { fontSize: 14, color: colors.mutedForeground, marginBottom: 4 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,color: colors.foreground 
  },
  inputText: { color: colors.foreground },
  placeholderText: { color: colors.mutedForeground },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  section: { fontSize: 16, fontWeight: "600", color: colors.foreground, marginVertical: 12 },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 6, alignItems: "center", marginTop: 8 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: "500" },
  error: { color: "red", marginBottom: 12, textAlign: "center" },
})
