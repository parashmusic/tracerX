"use client";

import React, { useState, useEffect,useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/Feather";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { ProgressBar } from "../components/ProgressBar";
import { colors } from "../theme/colors";
import { apiService } from "../services/apiService";
import { useFocusEffect } from "@react-navigation/native"
type TabKey = "tasks" | "finance" | "notes";

type Project = {
  id: string;
  title: string;
  client: { name: string };
  status: string;
  deadline: string; // ISO date
  budget: { total: number; currency: string };
  paid: number;
  description: string;
  notes: string;
};

type TaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string;
};

const statusLabels: Record<string, string> = {
  in_progress: "In Progress",
  completed: "Completed",
  not_started: "Not Started",
  archived: "Archived",
};

export default function ProjectDetailScreen({ route, navigation }: any) {
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabKey>("tasks");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [newPaymentAmount, setNewPaymentAmount] = useState("")
  
  const confirmPayment = async () => {
  const amt = parseFloat(newPaymentAmount);
  if (isNaN(amt) || amt <= 0) {
    Alert.alert("Invalid amount");
    return;
  }
  setShowPaymentModal(false);
  setFinanceLoading(true);
  try {
    await apiService.createTransaction({
      project :projectId,
      amount: amt,
      type: "payment",
       status: "paid", 
      description: "Client payment",
      date: new Date().toISOString().split("T")[0],
    });
    const data = await apiService.getTransactions({ project: projectId });
    setTransactions(data.transactions || []);
  } catch (e: any) {
  
    setFinanceError(e.message || "Failed to add payment");
  } finally {
    setFinanceLoading(false);
    setNewPaymentAmount("");
  }
}

  const [transactions, setTransactions] = useState<any[]>([])
  const [financeLoading, setFinanceLoading] = useState(false)
  const [financeError, setFinanceError] = useState<string | null>(null)
  
  const totalBudget = project?.budget?.total ?? 0;
  const currency    = project?.budget?.currency ?? "";
  const totalPaid   = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const remaining   = totalBudget - totalPaid;
  useEffect(() => {
  if (activeTab !== "finance") return

  setFinanceLoading(true)
  setFinanceError(null)
  apiService
    .getTransactions({ project: projectId })
    .then(data => {
      setTransactions(data.transactions || [])
    })
    .catch(e => setFinanceError(e.message || "Failed to load payments"))
    .finally(() => setFinanceLoading(false))    
  }, [activeTab, projectId])




 
    const load = useCallback( async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getProject(projectId);
        const proj = (res as any).project || res;
        setProject(proj);
        setNotesText(proj.notes || "");

        const tResp = await apiService.getTasks({ project: projectId });
        const list = (tResp as any).tasks || tResp;
        setTasks(
          list.map((t: any) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
          }))
        );
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
     }, [projectId]);

   useFocusEffect(
   useCallback(() => {
     load()
     }, [load])
    )

  const daysRemaining =
    project &&
    Math.ceil(
      (new Date(project.deadline).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

  const showDatePicker = () => setDatePickerVisible(true);
  const hideDatePicker = () => setDatePickerVisible(false);

  const handleDeadlineConfirm = async (date: Date) => {
    hideDatePicker();
    if (!project) return;
    const iso = date.toISOString().split("T")[0];
    try {
      await apiService.updateProject(project.id, { deadline: iso });
      setProject({ ...project, deadline: iso });
    } catch {
      setError("Failed to update deadline");
    }
  };

const saveNotes = async () => {
  if (!project) return;
  try {
    // 1) send to backend, which returns the new note object
    const newNote = await apiService.addProjectNote(project.id, {
      content: notesText,
      isImportant: true,
    });

    // 2) update local state by appending
    setProject(prev => prev && ({
      ...prev,
      notes: [...(prev.notes || []), newNote],
    }));
    
    // 3) clear input & exit edit mode
    setNotesText("");
    setEditingNotes(false);
  } catch {
    setError("Failed to save notes");
  }
};


  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.loader}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }
  if (!project) return null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{project.title}</Text>
          <Badge
            variant={
              project.status === "in_progress"
                ? "default"
                : project.status === "completed"
                ? "success"
                : "secondary"
            }
            style={styles.statusBadge}
          >
            {statusLabels[project.status]}
          </Badge>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Client</Text>
            <Text style={styles.statValue}>{project.client.name}</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Deadline</Text>
              <Icon name="calendar" size={16} color={colors.mutedForeground} />
            </View>
            <TouchableOpacity onPress={showDatePicker}>
              <Text style={styles.statValue}>
                {new Date(project.deadline).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
            <Text style={styles.statSub}>{daysRemaining} days remaining</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Budget</Text>
            <Text style={styles.statValue}>
              {project.budget.currency} {project.budget.total.toLocaleString()}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Remaining Payment</Text>
            <Text style={styles.statValue}>
             {currency} {remaining.toLocaleString()}
            </Text>
          </Card>
        </View>

        {/* Description */}
        <Card style={styles.fullCard}>
          <Text style={styles.sectionTitle}>Project Description</Text>
          <Text style={styles.sectionText}>{project.description}</Text>
        </Card>

       {/* <Card style={styles.fullCard}>
  <View style={styles.notesHeader}>
    <Text style={styles.sectionTitle}>Project Notes</Text>
    <TouchableOpacity onPress={() => editingNotes ? saveNotes() : setEditingNotes(true)}>
      <Icon name={editingNotes ? "check" : "edit"} size={16} color={colors.foreground} />
    </TouchableOpacity>
  </View>


  {(project.notes || []).map((note: any) => (
    <View key={note._id} style={styles.noteItem}>
      <Text style={styles.noteText}>{note.content}</Text>
      <Text style={styles.noteMeta}>
        {new Date(note.createdAt).toLocaleString()}
        {note.isImportant && " • Important"}
      </Text>
    </View>
  ))}

 
  {editingNotes && (
    <TextInput
      style={styles.notesInput}
      value={notesText}
      onChangeText={setNotesText}
      multiline
    />
  )}
  {!editingNotes && project.notes.length === 0 && (
    <Text style={styles.emptyText}>No notes yet</Text>
  )}
</Card> */}


        {/* Tabs */}
        <View style={styles.tabBar}>
          {(["tasks", "finance", "notes"] as TabKey[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {activeTab === "tasks" && (
          <View>
            <View style={styles.listHeader}>
              <Text style={styles.sectionTitle}>Tasks</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  navigation.navigate("Projects", {
                    screen: "TaskForm",
                    params: { projectId },
                  })
                }
              >
                <Icon name="plus" size={20} color={colors.primaryForeground} />
              </TouchableOpacity>
            </View>
            {tasks.length === 0 ? (
              <Text style={styles.emptyText}>No tasks yet</Text>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} style={styles.taskCard}>
                  <View style={styles.taskRow}>
                    <TouchableOpacity>
                      <Icon
                        name="square"
                        size={20}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                    <View style={styles.taskInfo}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={styles.taskBadges}>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                              ? "default"
                              : "secondary"
                          }
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
                        >
                          {task.status}
                        </Badge>
                      </View>
                    </View>
                    <TouchableOpacity>
                      <Icon
                        name="more-vertical"
                        size={20}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
        {activeTab === "finance" && (
  <View style={styles.financeContainer}>
    {financeLoading ? (
      <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
    ) : financeError ? (
      <Text style={styles.errorText}>{financeError}</Text>
    ) : (
      <>
        {/* Summary cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total Budget</Text>
            <Text style={styles.statValue}>
              {currency} {totalBudget.toLocaleString()}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total Paid</Text>
            <Text style={styles.statValue}>
                 {currency} {totalPaid.toLocaleString()}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Remaining</Text>
            <Text style={styles.statValue}>
              {currency} {remaining.toLocaleString()}
            </Text>
          </Card>
        </View>

        {/* Payment Log Header */}
        <View style={styles.financeHeader}>
          <Text style={styles.sectionTitle}>Payment Log</Text>
          <TouchableOpacity
            style={styles.addPaymentButton}
            onPress={() => setShowPaymentModal(true)}
          >
            <Icon name="plus" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Transaction list */}
        {transactions.length === 0 ? (
          <Text style={styles.emptyText}>No payments yet</Text>
        ) : (
          <ScrollView
            style={styles.transactionList}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {transactions.map(tx => (
              <Card key={tx.id} style={styles.transactionCard}>
                <View style={styles.transactionRow}>
                  <Text style={styles.transactionAmount}>
                    {tx.currency} {tx.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.transactionDesc}>{tx.description}</Text>
              </Card>
            ))}
          </ScrollView>
        )}
      </>
    )}
  </View>
)}

        {activeTab === "notes" && (
          <Text style={styles.emptyText}>Additional notes go here.</Text>
        )}

        {/* Date Picker */}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleDeadlineConfirm}
          onCancel={hideDatePicker}
        />
        <Modal
  visible={showPaymentModal}
  transparent
  animationType="slide"
  onRequestClose={() => setShowPaymentModal(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Enter payment amount</Text>
      <TextInput
        style={styles.modalInput}
        value={newPaymentAmount}
        onChangeText={setNewPaymentAmount}
        keyboardType="numeric"
        placeholder="e.g. 2000"
        placeholderTextColor={colors.mutedForeground}
      />
      <View style={styles.modalButtons}>
        <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmPayment}>
          <Text style={[styles.modalButtonText, { fontWeight: "600" }]}>OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },
  content: { padding: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "600", color: colors.foreground },
  statusBadge: { paddingHorizontal: 12 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16 },
  statCard: { width: "48%", padding: 12, backgroundColor: colors.card, borderRadius: 8, marginBottom: 16 },
  statLabel: { fontSize: 12, color: colors.mutedForeground, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  statSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 4 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  fullCard: { padding: 16, backgroundColor: colors.card, borderRadius: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 },
  sectionText: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  notesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  editBtn: { padding: 4 },
  notesInput: { backgroundColor: colors.input, color: colors.foreground, padding: 12, borderRadius: 8, minHeight: 80 },
  tabBar: { flexDirection: "row", backgroundColor: colors.card, borderRadius: 8, overflow: "hidden", marginBottom: 16 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: "center" },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 14, color: colors.mutedForeground },
  tabTextActive: { color: colors.primaryForeground },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  addButton: { backgroundColor: colors.primary, padding: 8, borderRadius: 6 },
  emptyText: { textAlign: "center", color: colors.mutedForeground, marginTop: 20 },
  taskCard: { marginBottom: 12, padding: 12 },
  taskRow: { flexDirection: "row", alignItems: "center" },
  taskInfo: { flex: 1, marginHorizontal: 8 },
  taskTitle: { fontSize: 16, fontWeight: "500", color: colors.foreground, marginBottom: 4 },
  taskBadges: { flexDirection: "row", gap: 4 },
  errorText: { color: "red", textAlign: "center" },
  noteItem: {
  marginBottom: 8,
  padding: 8,
  backgroundColor: colors.input,
  borderRadius: 6,
},
noteText: { color: colors.foreground, fontSize: 14 },
noteMeta: { color: colors.mutedForeground, fontSize: 12, marginTop: 2 },

addButtonLow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: colors.primary,
  padding: 8,
  borderRadius: 6,
  marginBottom: 16,
},
buttonText: {
  color: colors.primaryForeground,
  fontSize: 14,
  fontWeight: "500",
},
modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  width: "80%",
  backgroundColor: colors.card,
  borderRadius: 8,
  padding: 16,
},
modalTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: colors.foreground,
  marginBottom: 12,
  textAlign: "center",
},
modalInput: {
  backgroundColor: colors.input,
  color: colors.foreground,
  borderRadius: 6,
  padding: 12,
  marginBottom: 16,
},
modalButtons: {
  flexDirection: "row",
  justifyContent: "space-between",
},
modalButtonText: {
  fontSize: 14,
  color: colors.primary,
},

financeContainer: {
  marginBottom: 16,
},
financeHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginVertical: 12,
},
addPaymentButton: {
  backgroundColor: colors.primary,
  padding: 8,
  borderRadius: 6,
},
transactionList: {
  maxHeight: 300,       // or flex: 1 if you want full scroll area
},
transactionCard: {
  padding: 12,
  marginBottom: 8,
  backgroundColor: colors.card,
  borderRadius: 8,
},
transactionRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 4,
},
transactionAmount: {
  fontSize: 14,
  fontWeight: "600",
  color: colors.foreground,
},
transactionDate: {
  fontSize: 12,
  color: colors.mutedForeground,
},
transactionDesc: {
  fontSize: 13,
  color: colors.foreground,
  lineHeight: 18,
},

});
