"use client"
import { Modal } from "react-native"

import { useState, useCallback } from "react"
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
import { Card } from "../components/Card"
import { Badge } from "../components/Badge"
import { ProgressBar } from "../components/ProgressBar"
import { colors } from "../theme/colors"
import { apiService } from "../services/apiService"
import { useFocusEffect } from "@react-navigation/native"

// Map backend status codes to display labels
const statusLabels: Record<string, string> = {
  in_progress: "In Progress",
  completed: "Completed",
  not_started: "Not Started",
  archived: "Archived",
}

type Project = {
  id: string
  title: string
  client: { name: string }
  status: string
  deadline: string
  budget: { total: number; currency: string }
  isArchived?: boolean
}

type TaskSummary = {
  id: string
  projectId: string
  status: string
}

export default function ProjectsScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "completed" | "archived">("all")
  const [rawProjects, setRawProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<TaskSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
    // controls dropdown menu visibility
  const [dropdownVisible, setDropdownVisible] = useState(false)
  // the project whose menu is open
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

    const openDropdown = (proj: Project) => {
      setSelectedProject(proj)
      setDropdownVisible(true)
    }
    const closeDropdown = () => {
      setSelectedProject(null)
      setDropdownVisible(false)
    }

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      const statusParam = activeFilter === 'all' ? undefined : activeFilter
      const resp = await apiService.getProjects({ status: statusParam })
      const list = resp.projects || resp
      // Map raw project data
      const mapped = list.map((p: any) => ({
        id: p.id,
        title: p.title,
        client: p.client,
        status: p.status,
        deadline: p.deadline,
        budget: p.budget,
      }))
      setRawProjects(mapped)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    }
  }, [activeFilter])

  // Fetch tasks summary to compute progress
  const fetchTasks = useCallback(async () => {
    try {
      const resp = await apiService.getTasks()
      const list = resp.tasks || resp
      const summary = list.map((t: any) => ({
        id: t.id,
        projectId: t.project.id,
        status: t.status,
      }))
      setTasks(summary)
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    }
  }, [])

  // Refresh when screen gains focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true)
      setError(null)
      Promise.all([fetchProjects(), fetchTasks()])
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
      setSelectedIds([])
    }, [fetchProjects, fetchTasks])
  )

  // Selection toggles
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }
  const clearSelection = () => setSelectedIds([])

  // Delete selected projects
  const deleteSelected = async () => {
    setLoading(true)
    try {
      await Promise.all(selectedIds.map(id => apiService.deleteProject(id)))
      clearSelection()
      fetchProjects()
      fetchTasks()
    } catch (e: any) {
      console.error(e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Compute progress percentage: completed tasks / total tasks
  const computeProgress = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.projectId === projectId)
    const total = projectTasks.length
    if (total === 0) return 0
    const completed = projectTasks.filter(t => t.status === 'completed').length
    return Math.round((completed / total) * 100)
  }

  // Prepare projects with computed progress
  const displayProjects = rawProjects.map(proj => ({
    ...proj,
    progress: computeProgress(proj.id),
  }))

  // Filter by search
  const filteredProjects = displayProjects.filter(proj =>
    proj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proj.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header: normal or selection mode */}
      <View style={styles.header}>
        {selectedIds.length > 0 ? (
          <>
            <TouchableOpacity
              onPress={clearSelection}
              style={styles.headerIcon}
            >
              <Icon name="x" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedIds.length} selected
            </Text>
            <TouchableOpacity
              onPress={deleteSelected}
              style={styles.headerIcon}
            >
              <Icon name="trash" size={20} color="red" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.titleSection}>
              <Text style={styles.title}>Projects</Text>
              <Text style={styles.subtitle}>
                Manage and track all your projects
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate("ProjectForm")}
            >
              <Icon name="plus" size={16} color={colors.primaryForeground} />
              <Text style={styles.addButtonText}>New Project</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={16}
          color={colors.mutedForeground}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {[
          { key: "all", label: "All Projects" },
          { key: "active", label: "Active" },
          { key: "completed", label: "Completed" },
          { key: "archived", label: "Archived" },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterTab,
              activeFilter === filter.key && styles.activeFilterTab,
            ]}
            onPress={() => setActiveFilter(filter.key as any)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === filter.key && styles.activeFilterTabText,
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

     {/* Body */}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {loading ? (
          <ActivityIndicator
            style={styles.loadingIndicator}
            color={colors.primary}
          />
        ) : (
          <ScrollView
            style={styles.projectsList}
            showsVerticalScrollIndicator={false}
          >
            {filteredProjects.length > 0 ? (
              filteredProjects.map((proj) => (
                <TouchableOpacity
                  key={proj.id}
                  onPress={() =>
                    navigation.navigate("ProjectDetail", { projectId: proj.id })
                  }
                  onLongPress={() => toggleSelect(proj.id)}
                  style={
                    selectedIds.includes(proj.id) ? styles.selectedCard : undefined
                  }
                >
                  <Card style={styles.projectCard}>
                    <View style={styles.projectHeader}>
                      <Text style={styles.projectTitle}>{proj.title}</Text>
                      <Badge
                        variant={
                          proj.status === "in_progress"
                            ? "default"
                            : proj.status === "completed"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {statusLabels[proj.status]}
                      </Badge>
                      <TouchableOpacity onPress={() => openDropdown(proj)}>
                        <Icon
                          name="more-vertical"
                          size={20}
                          color={colors.mutedForeground}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.detailValue}>
                      Client: {proj.client.name}
                    </Text>
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <Text style={styles.progressValue}>{proj.progress}%</Text>
                      </View>
                      <ProgressBar value={proj.progress} />
                    </View>
                  </Card>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyListContainer}>
                <Icon
                  name="folder"
                  size={48}
                  color={colors.mutedForeground}
                  style={styles.emptyListIcon}
                />
                <Text style={styles.emptyListText}>No projects found</Text>
                {searchQuery && (
                  <Text style={styles.emptyListSubtext}>
                    No results for "{searchQuery}"
                  </Text>
                )}
              </View>
            )}
          </ScrollView>
        )}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        {/* tappable overlay to close */}
        <TouchableOpacity style={styles.overlay} onPress={closeDropdown} />
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              closeDropdown();
              navigation.navigate("EditProjectForm", {
                projectId: selectedProject!.id,
              });
            }}
          >
            <Icon name="edit" size={16} color={colors.foreground} />
            <Text style={styles.optionText}>Edit Project</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={() => {
              closeDropdown();
              navigation.navigate("TaskForm", {
                projectId: selectedProject!.id,
              });
            }}
          >
            <Icon name="plus-square" size={16} color={colors.foreground} />
            <Text style={styles.optionText}>Add Task</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.option}
            onPress={async () => {
              await apiService.updateProject(selectedProject!.id, {
                isArchived: !selectedProject!.isArchived,
              });
              closeDropdown();
              fetchProjects(); // re-fetch or refresh
            }}
          >
            <Icon name="archive" size={16} color={colors.foreground} />
            <Text style={styles.optionText}>
              {selectedProject?.isArchived ? "Unarchive" : "Archive"}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", padding: 16 },
  titleSection: { flex: 1 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: "bold", color: colors.foreground, textAlign: "center" },
  headerIcon: { padding: 8 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 2 },
  addButton: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addButtonText: { color: colors.primaryForeground, marginLeft: 6, fontSize: 14, fontWeight: "500" },
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 16, borderRadius: 8, paddingHorizontal: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: colors.foreground, paddingVertical: 12, fontSize: 16 },
  filterContainer: { marginBottom: 16,maxHeight:40},
  filterContent: { paddingHorizontal: 16, alignItems: "flex-start" },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, borderRadius: 6, backgroundColor: colors.muted },
  activeFilterTab: { backgroundColor: colors.primary },
  filterTabText: { color: colors.mutedForeground, fontSize: 14 },
  activeFilterTabText: { color: colors.primaryForeground },
  loadingIndicator: { marginTop: 20 },
  projectsList: { flex: 1, paddingHorizontal: 16 },
  selectedCard: { opacity: 0.6, borderWidth: 2, borderColor: colors.primary },
  projectCard: { marginBottom: 12 },
  projectHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  projectTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  detailValue: { fontSize: 14, color: colors.foreground, marginBottom: 12 },
  progressSection: { marginTop: 8 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  progressLabel: { fontSize: 14, color: colors.mutedForeground },
  progressValue: { fontSize: 14, color: colors.foreground },
  errorText: { textAlign: "center", marginTop: 20, color: "red" },

    overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)"
  },
  dropdownMenu: {
    position: "absolute",
    top: 100,      // adjust to sit under the header or card
    right: 20,     // align to right edge
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  optionText: {
    marginLeft: 8,
    color: colors.foreground,
  },
emptyListContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 48,
},
emptyListIcon: {
  marginBottom: 16,
  opacity: 0.5,
},
emptyListText: {
  fontSize: 18,
  color: colors.mutedForeground,
  marginBottom: 8,
},
emptyListSubtext: {
  fontSize: 14,
  color: colors.mutedForeground,
},

})
