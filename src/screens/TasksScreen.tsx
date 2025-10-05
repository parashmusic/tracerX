"use client"

import { useState, useCallback } from "react"
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
import { Card } from "../components/Card"
import { Badge } from "../components/Badge"
import { colors } from "../theme/colors"
import { apiService } from "../services/apiService"
import { useFocusEffect } from "@react-navigation/native"

// Map backend status codes to display labels
const statusLabels: Record<string, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  completed: "Completed",
}

type Task = {
  id: string
  title: string
  project: { title: string; id: string }
  status: string
  dueDate: string
  priority: string
  assignee: { name: string }
}

export default function TasksScreen({ navigation }: any) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "todo" | "in_progress" | "completed">("all")

  // Fetch tasks from backend
  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const resp = await apiService.getTasks()
      const list = resp.tasks || resp
      const mapped: Task[] = list.map((t: any) => ({
        id: t.id,
        title: t.title,
        project: { title: t.project.title, id: t.project.id },
        status: t.status,
        dueDate: t.dueDate,
        priority: t.priority,
        assignee: t.assignee,
      }))
      setTasks(mapped)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchTasks()
    }, [fetchTasks])
  )

  // Toggle task completion
  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === "completed" ? "todo" : "completed"
    try {
      await apiService.updateTask(task.id, { status: newStatus })
      fetchTasks()
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update task")
    }
  }

  // Delete a task
  const deleteTask = (id: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteTask(id)
              fetchTasks()
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to delete task")
            }
          },
        },
      ]
    )
  }

  // Filter and search
  const filteredTasks = tasks.filter(task => {
    const matchSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.project.title.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchSearch) return false
    if (activeFilter === "all") return true
    return task.status === activeFilter
  })


  /**
 * Returns a string like " (3 days left)" or " (due today)" given an ISO date.
 */
function getDaysRemaining(dueDate: string): string {
  const today = new Date()
  const due   = new Date(dueDate)
  // zero out time so that “due today” works correctly
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diffMs  = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays > 1)       return ` (${diffDays} days left)`
  else if (diffDays === 1) return ` (tomorrow)`
  else if (diffDays === 0) return ` (due today)`
  else                     return ` (${Math.abs(diffDays)} days overdue)`
}


  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Tasks</Text>
          <Text style={styles.subtitle}>Manage and track all your tasks</Text>
           <Text style={styles.helperText}>(Tap a task title to toggle its status)</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("TaskForm")}
        >
          <Icon name="plus" size={16} color={colors.primaryForeground} />
          <Text style={styles.addButtonText}>New Task</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={16} color={colors.mutedForeground} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {[
          { key: "all", label: "All Tasks" },
          { key: "todo", label: "To Do" },
          // { key: "in_progress", label: "In Progress" },
          { key: "completed", label: "Completed" },
        ].map(filter => (
          <TouchableOpacity
            key={filter.key}
            style={[styles.filterTab, activeFilter === filter.key && styles.activeFilterTab]}
            onPress={() => setActiveFilter(filter.key as any)}
          >
            <Text style={[styles.filterTabText, activeFilter === filter.key && styles.activeFilterTabText]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Body */}
{error && <Text style={styles.errorText}>{error}</Text>}
{loading ? (
  <ActivityIndicator style={styles.loadingIndicator} color={colors.primary} />
) : (
  <ScrollView style={styles.tasksList} showsVerticalScrollIndicator={false}>
    {filteredTasks.length > 0 ? (
      filteredTasks.map(task => (
        <Card key={task.id} style={styles.taskCard}>
          <View style={styles.taskHeader}>
            <TouchableOpacity
              onLongPress={() => deleteTask(task.id)}
              onPress={() => toggleStatus(task)}
              style={styles.taskTitleContainer}
            >
              <Text 
                style={[
                  styles.taskTitle,
                  task.status === "completed" && styles.completedTask
                ]}
                numberOfLines={2}
              >
                {task.title}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.moreButton} 
              onPress={() => deleteTask(task.id)}
              hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
            >
              <Icon name="trash-2" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>

          {task.project && (
            <TouchableOpacity
              onPress={() => navigation.navigate("ProjectDetail", { projectId: task.project.id })}
            >
              <Text style={styles.taskProject}>{task.project.title}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.taskBadges}>
            <Badge
              variant={task.priority === "high" ? "destructive" : task.priority === "medium" ? "default" : "secondary"}
            >
              {task.priority}
            </Badge>
            <Badge
              variant={
                task.status === "in_progress"
                  ? "default"
                  : task.status === "completed"
                  ? "success"
                  : "secondary"
              }
              style={styles.statusBadge}
            >
              {statusLabels[task.status]}
            </Badge>
          </View>

          <View style={styles.taskDetails}>
            <View style={styles.taskDetailRow}>
              <Icon name="calendar" size={14} color={colors.mutedForeground} />
              <Text style={styles.taskDetail}>
                {new Date(task.dueDate).toLocaleDateString()}
                {task.dueDate && (
                  <Text style={styles.daysRemaining}>
                    {getDaysRemaining(task.dueDate)}
                  </Text>
                )}
              </Text>
            </View>
            <View style={styles.taskDetailRow}>
              <Icon name="user" size={14} color={colors.mutedForeground} />
              <Text style={styles.taskDetail}>{task.assignee?.name || 'Unassigned'}</Text>
            </View>
          </View>
        </Card>
      ))
    ) : (
      <View style={styles.emptyState}>
        <Icon name="check-circle" size={48} color={colors.mutedForeground} />
        <Text style={styles.emptyStateTitle}>No tasks found</Text>
        <Text style={styles.emptyStateText}>
          {searchQuery 
            ? `No tasks match your search for "${searchQuery}"`
            : 'Create a new task to get started'}
        </Text>
      </View>
    )}
  </ScrollView>
)}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  helperText: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
    fontStyle: "italic",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 8,
  },
  titleSection: { flex: 1 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addButtonText: {
    color: colors.primaryForeground,
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterContainer: { paddingHorizontal: 14,marginHorizontal:"auto",marginBottom: 16,maxHeight:40 },
  filterTab: {
    paddingHorizontal: 30,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 6,
    backgroundColor: colors.muted,
  },
  activeFilterTab: { backgroundColor: colors.primary },
  filterTabText: { color: colors.mutedForeground, fontSize: 14 },
  activeFilterTabText: { color: colors.primaryForeground },
  loadingIndicator: { marginTop: 20 },
  tasksList: { flex: 1, paddingHorizontal: 16 },
  taskCard: { marginBottom: 12 },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  moreButton: { padding: 4 },
  taskProject: { fontSize: 14, color: colors.primary, marginBottom: 8 },
  taskBadges: { flexDirection: "row", marginBottom: 8 },
  statusBadge: { marginLeft: 8 },
  taskDetail: { fontSize: 14, color: colors.mutedForeground, marginBottom: 4 },
  errorText: { textAlign: "center", marginTop: 20, color: "red" },
  emptyState: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 48,
  paddingHorizontal: 24,
},
emptyStateTitle: {
  fontSize: 18,
  fontWeight: '500',
  color: colors.foreground,
  marginTop: 16,
  marginBottom: 8,
},
emptyStateText: {
  fontSize: 14,
  color: colors.mutedForeground,
  textAlign: 'center',
},
taskTitleContainer: {
  flex: 1,
},
completedTask: {
  textDecorationLine: 'line-through',
  color: colors.mutedForeground,
},
taskDetails: {
  marginTop: 8,
},
taskDetailRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 4,
},
daysRemaining: {
  color: colors.destructive,
  marginLeft: 8,
  fontSize: 12,
},
});
