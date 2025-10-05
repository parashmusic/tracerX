"use client"

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/Feather"
import DateTimePickerModal from "react-native-modal-datetime-picker"
import { Picker } from '@react-native-picker/picker'
import { colors } from "../theme/colors"
import { apiService } from "../services/apiService"
import { authService } from "../services/authService"

export default function TaskFormScreen({ route, navigation }: any) {
  const projectIdFromRoute = route.params?.projectId || ""

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [projectId, setProjectId] = useState(projectIdFromRoute)
  const [assignee, setAssignee] = useState<string>("")
  const [dueDate, setDueDate] = useState("")
  const [priority, setPriority] = useState("low")

  const [projects, setProjects] = useState<any[]>([])
  const [assignees, setAssignees] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDatePickerVisible, setDatePickerVisible] = useState(false)
  const API_BASE_URL = process.env.API_BASE_URL || "https://tracerx-backend.onrender.com/api"
  // Load dropdown data and current user
  useEffect(() => {
    async function fetchData() {
      try {
        // Get current user from storage
        const { user: storedUser } = await authService.getStoredUserData()
        if (storedUser) {
          setCurrentUser(storedUser)
          setAssignee(storedUser._id)  // default to self
        }

        // Load projects
        const projResp = await apiService.getProjects()
        setProjects(projResp.projects || projResp)

        // Load assignees (collaborators)
        const usersRes = await fetch(`${API_BASE_URL}/users/search/collaborators?q=`)
        const usersData = await usersRes.json()
        const usersList = usersData.data?.users || []
        setAssignees(usersList)
      } catch (e: any) {
        console.error("Dropdown load error:", e)
      }
    }
    fetchData()
  }, [])

  // Date picker handlers
  const showDatePicker = () => setDatePickerVisible(true)
  const hideDatePicker = () => setDatePickerVisible(false)
  const handleConfirm = (date: Date) => {
    hideDatePicker()
    const iso = date.toISOString().split("T")[0]
    setDueDate(iso)
  }

  const handleSubmit = async () => {
    if (!title || !projectId || !assignee || !dueDate) {
      setError("Please fill all required fields.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        title,
        description,
        project: projectId,
        assignee,
        dueDate,
        priority,
      }
      await apiService.createTask(payload)
      navigation.goBack()
    } catch (e: any) {
      console.error("Create task error:", e)
      Alert.alert("Error", e.message || "Failed to create task.")
      setError(e.message)
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
          <Text style={styles.title}>New Task</Text>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}

        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Task Title" placeholderTextColor={colors.mutedForeground} />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Task Description" multiline numberOfLines={4} placeholderTextColor={colors.mutedForeground} />

        {/* Project Dropdown */}
        <Text style={styles.label}>Project *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={projectId} onValueChange={setProjectId}>
            <Picker.Item label="Select project" value="" />
            {projects.map(p => (
              <Picker.Item key={p.id} label={p.title} value={p.id} />
            ))}
          </Picker>
        </View>

        {/* Assignee Dropdown (default to self) */}
        <Text style={styles.label}>Assignee *</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={assignee} onValueChange={setAssignee}>
            <Picker.Item label={currentUser ? `Me (${currentUser.name})` : "Select user"} value={currentUser?._id || ""} />
            {assignees.map(u => (
              <Picker.Item key={u._id}  label={u.name} value={u._id} />
            ))}
          </Picker>
        </View>

        {/* Due Date Picker */}
        <Text style={styles.label}>Due Date *</Text>
        <TouchableOpacity style={styles.input} onPress={showDatePicker}>
          <Text style={dueDate ? styles.inputText : styles.placeholderText}>{dueDate || "Select date"}</Text>
        </TouchableOpacity>
        <DateTimePickerModal isVisible={isDatePickerVisible} mode="date" onConfirm={handleConfirm} onCancel={hideDatePicker} />

        {/* Priority Dropdown */}
        <Text style={styles.label}>Priority</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={priority}  onValueChange={setPriority}>
            <Picker.Item  label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item  label="High" value="high" />
            <Picker.Item label="Urgent" value="urgent" />
          </Picker>
        </View>

        {/* Submit */}
        <TouchableOpacity style={[styles.button, loading && styles.disabled]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.buttonText}>Create Task</Text>}
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
  input: { backgroundColor: colors.card, borderRadius: 6,color: colors.foreground, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 },
  inputText: { color: colors.foreground },
  placeholderText: { color: colors.mutedForeground },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  pickerContainer: { backgroundColor: colors.card, borderRadius: 6, marginBottom: 16, },
  button: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 6, alignItems: "center" },
  disabled: { opacity: 0.6, marginTop: 8 },
  buttonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: "500" },
  error: { color: "red", textAlign: "center", marginBottom: 12 },
})
