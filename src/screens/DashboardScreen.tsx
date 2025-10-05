"use client"

import { useState, useEffect ,useCallback} from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,RefreshControl
} from "react-native"
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/Feather"
import { Card } from "../components/Card"
import { Badge } from "../components/Badge"
import { ProgressBar } from "../components/ProgressBar"
import { colors } from "../theme/colors"
import { apiService } from "../services/apiService"

// Icon mapping for activities
const activityIconMap: Record<string, { name: string; color: string }> = {
  task_completed: { name: "check-circle", color: colors.success },
  task_updated: { name: "refresh-cw", color: colors.primary },
  task_created: { name: "plus-circle", color:"#3b82f6" },
  project_created: { name: "folder-plus", color: colors.primary },
  payment_received: { name: "dollar-sign", color: colors.success },
  note_added: { name: "file-text", color: colors.warning },
}

type TaskSummary = {
  projectId: string
  status: string
}

type ProjectSummary = {
  id: string
  title: string
  status: string
  progress: number
}

type Activity = {
  id: string
  type: string
  title: string
  createdAt: string
  project: { title: string } | null
}

type Deadline = {
  id: string
  title: string
  project: { title: string }
  deadline: string
}

type FinanceOverview = {
  monthlyEarnings: any[]
}

export default function DashboardScreen({ navigation }: any) {
  const [stats, setStats] = useState<any>(null)
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [financeOverview, setFinanceOverview] = useState<FinanceOverview | null>(null)
  const [loading, setLoading] = useState(true)
   const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalBudget, setTotalBudget] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [pendingPayments, setPendingPayments] = useState(0)


 
    const loadDashboard = useCallback(async () => {
      setLoading(true)
      setError(null)
      try {
        // Fetch all needed data including tasks
        const [
          statsRes,
          projRes,
          actsRes,
          dlRes,
          finRes,
          tasksRes,
        ] = await Promise.all([
          apiService.getDashboardStats(),
          // apiService.getProjects({ status: 'active' }),
          apiService.getProjects(),
          apiService.getDashboardActivities(),
          apiService.getDashboardDeadlines(),
          apiService.getDashboardFinanceOverview(),
          apiService.getTasks(),
        ])
        const projectList = projRes.projects || projRes
        const txs = finRes.transactions || []
        const budgetSum = projectList.reduce(
        (sum: number, p: any) => sum + (p.budget?.total || 0),
            0
        )
        const paidSum = stats?.finance?.totalEarnings ?? 0
        
        setTotalBudget(budgetSum)
        setTotalPaid(paidSum)
        setPendingPayments(budgetSum - paidSum)
        setStats(statsRes)
        setActivities(actsRes.activities || [])
        setDeadlines(dlRes.deadlines || [])
        setFinanceOverview(finRes)

        const rawProjects = projRes.projects || projRes
        const rawTasks = tasksRes.tasks || tasksRes

        // Summarize tasks per project
        const taskSummaries: TaskSummary[] = rawTasks.map((t: any) => ({ projectId: t.project.id, status: t.status }))

        // Helper to compute progress
        const computeProgress = (projectId: string) => {
          const related = taskSummaries.filter(ts => ts.projectId === projectId)
          const total = related.length
          if (total === 0) return 0
          const done = related.filter(ts => ts.status === 'completed').length
          return Math.round((done / total) * 100)
        }

        // Build top-3 project overview
        const sortedProjects = rawProjects.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        const top3 = sortedProjects.slice(0, 3).map((p: any) => ({
          id: p.id,
          title: p.title,
          status: p.status,
          progress: computeProgress(p.id),
        }))
        setProjects(top3)
      } catch (e: any) {
        console.error(e)
        setError(e.message)
      } finally {
        setLoading(false)
      }
   
   
  }, [])
    useFocusEffect(
      useCallback(() => {
        loadDashboard()
      }, [loadDashboard])
    )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadDashboard()
    setRefreshing(false)
  }, [loadDashboard])

  if (loading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity
            style={styles.activityButton}
            onPress={() => navigation.navigate("Activities")}
          >
            <Icon name="clock" size={16} color={colors.foreground} />
            <Text style={styles.activityText}>Activities</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Projects</Text>
              <Icon name="folder" size={16} color={colors.mutedForeground} />
            </View>
            <Text style={styles.statValue}>{stats.projects.total}</Text>
            <Text style={styles.statChange}>
              Active: {stats.projects.active}, Completed:{" "}
              {stats.projects.completed}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Tasks</Text>
              <Icon
                name="check-square"
                size={16}
                color={colors.mutedForeground}
              />
            </View>
            <Text style={styles.statValue}>{stats.tasks.total}</Text>
            <Text style={styles.statChange}>
              Overdue: {stats.tasks.overdue}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Earnings</Text>
              <Icon
                name="dollar-sign"
                size={16}
                color={colors.mutedForeground}
              />
            </View>
            <Text style={styles.statValue}>
              {" "}
               ₹{stats?.finance?.totalEarnings ?? 0}
            </Text>
            <Text style={styles.statChange}>
              Growth: {stats.finance.growth}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Pending Payments</Text>
              <Icon
                name="credit-card"
                size={16}
                color={colors.mutedForeground}
              />
            </View>
            <Text style={styles.statValue}>
              ₹{pendingPayments.toLocaleString()}
            </Text>
            <Text style={styles.statChange}>
              Paid: ₹{totalPaid.toLocaleString()}
            </Text>
          </Card>
        </View>

        {/* Project Overview Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Project Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Projects")}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          {projects.length > 0 ? (
            <FlatList
              data={projects}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card style={styles.projectCard}>
                  <Text style={styles.projectTitle}>{item.title}</Text>
                  <Badge
                    variant={
                      item.status === "in_progress"
                        ? "default"
                        : item.status === "completed"
                        ? "success"
                        : "secondary"
                    }
                  >
                    {item.status.replace("_", " ")}
                  </Badge>
                  <View style={styles.projectProgress}>
                    <ProgressBar value={item.progress} />
                    <Text style={styles.progressPercent}>{item.progress}%</Text>
                  </View>
                </Card>
              )}
              key="projectOverviewList"
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No projects available</Text>
            </View>
          )}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Activities")}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>
          <Card style={styles.activitySectionCard}>
            <FlatList
              data={activities.slice(0, 6)}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const icon = activityIconMap[item.type] || {
                  name: "activity",
                  color: colors.mutedForeground,
                };
                return (
                  <View style={styles.activityItem}>
                    <Icon
                      name={icon.name as any}
                      size={20}
                      color={icon.color}
                      style={styles.activityIcon}
                    />
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle}>{item.title}</Text>
                      {item.project && (
                        <Text style={styles.activityProject}>
                          {item.project.title}
                        </Text>
                      )}
                      <Text style={styles.activityDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No recent activity.</Text>
              }
              key="recentActivityList"
            />
          </Card>
        </View>

        {/* Upcoming Deadlines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>

          {deadlines.length > 0 ? (
            deadlines.map((dl) => {
              const daysLeft = Math.ceil(
                (new Date(dl.deadline).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              );
              return (
                <Card key={dl.id} style={styles.deadlineCard}>
                  <View style={styles.deadlineHeader}>
                    <Text style={styles.deadlineTitle}>{dl.title}</Text>
                    <Badge
                      variant={
                        daysLeft <= 3
                          ? "destructive"
                          : daysLeft <= 7
                          ? "default"
                          : "secondary"
                      }
                    >
                      {daysLeft} days left
                    </Badge>
                  </View>
                  <Text style={styles.deadlineProject}>{dl.project.title}</Text>
                </Card>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming deadlines</Text>
            </View>
          )}
        </View>

        {/* Finance Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finance Overview</Text>
          {financeOverview?.monthlyEarnings.length ? (
            <Text style={styles.emptyText}>[Chart Placeholder]</Text>
          ) : (
            <Text style={styles.emptyText}>No earnings data available.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  scrollView: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: colors.foreground },
  activityButton: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 6 },
  activityText: { color: colors.foreground, marginLeft: 6, fontSize: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4, paddingHorizontal: 16, marginBottom: 20 },
  statCard: { width: "48%", marginHorizontal: "1%", marginVertical: 4 },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  statTitle: { fontSize: 14, color: colors.mutedForeground },
  statValue: { fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 4 },
  statChange: { fontSize: 12, color: colors.mutedForeground },
  section: { marginVertical: 16, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  sectionLink: { fontSize: 14, color: colors.primary },
  projectCard: { width: 200, marginRight: 12, padding: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  projectTitle: { fontSize: 16, fontWeight: "500", color: colors.foreground, marginBottom: 6 },
  projectProgress: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  progressPercent: { marginLeft: 8, color: colors.foreground, fontWeight: "500" },
  activitySectionCard: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 12 },
  activityItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  activityIcon: { marginRight: 12 },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 16, fontWeight: "500", color: colors.foreground, marginBottom: 2 },
  activityProject: { fontSize: 14, color: colors.mutedForeground, marginBottom: 2 },
  activityDate: { fontSize: 12, color: colors.mutedForeground },
  deadlineCard: { marginBottom: 8, padding: 12 },
  deadlineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  deadlineTitle: { fontSize: 16, fontWeight: "500", color: colors.foreground },
  deadlineProject: { fontSize: 14, color: colors.mutedForeground },
  emptyText: { textAlign: "center", color: colors.mutedForeground, marginTop: 20 },
  errorText: { color: "red", textAlign: "center" },
  emptyState: {
  padding: 16,
  alignItems: 'center',
  justifyContent: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
  },
})
