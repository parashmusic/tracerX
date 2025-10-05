"use client"

import { useState } from "react"
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Dimensions } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Icon from "react-native-vector-icons/Feather"
import { Card } from "../components/Card"
import { Badge } from "../components/Badge"
import { colors } from "../theme/colors"

const { width } = Dimensions.get("window")

export default function FinanceScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")

  const stats = [
    { title: "Total Earnings", value: "₹24,565.00", change: "+12.5% from last month" },
    { title: "Pending Payments", value: "₹4,325.00", change: "3 invoices pending" },
    { title: "This Month", value: "₹6,720.00", change: "+8.2% from last month" },
    { title: "Overdue", value: "₹1,250.00", change: "1 invoice overdue" },
  ]

  const transactions = [
    {
      id: "1",
      type: "invoice",
      number: "INV-001",
      project: "E-commerce Website Redesign",
      projectId: "1",
      client: "TechRetail Inc.",
      amount: 5000,
      status: "Paid",
      date: "2023-11-10",
    },
    {
      id: "2",
      type: "invoice",
      number: "INV-002",
      project: "Mobile App Development",
      projectId: "2",
      client: "HealthTrack",
      amount: 9000,
      status: "Paid",
      date: "2023-11-05",
    },
    {
      id: "3",
      type: "invoice",
      number: "INV-003",
      project: "Brand Identity Refresh",
      projectId: "3",
      client: "FoodDelivery Co.",
      amount: 5500,
      status: "Paid",
      date: "2023-10-25",
    },
    {
      id: "4",
      type: "invoice",
      number: "INV-004",
      project: "E-commerce Website Redesign",
      projectId: "1",
      client: "TechRetail Inc.",
      amount: 7000,
      status: "Pending",
      date: "2023-12-10",
    },
    {
      id: "5",
      type: "payment",
      reference: "PAY-001",
      project: "E-commerce Website Redesign",
      projectId: "1",
      client: "TechRetail Inc.",
      amount: 5000,
      status: "Completed",
      date: "2023-11-10",
    },
  ]

  const filters = [
    { key: "all", label: "All Transactions" },
    { key: "invoices", label: "Invoices" },
    { key: "payments", label: "Payments" },
    { key: "pending", label: "Pending" },
  ]

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.client.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeFilter === "all") return matchesSearch
    if (activeFilter === "invoices") return matchesSearch && transaction.type === "invoice"
    if (activeFilter === "payments") return matchesSearch && transaction.type === "payment"
    if (activeFilter === "pending") return matchesSearch && transaction.status === "Pending"

    return matchesSearch
  })

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.title}>Finance</Text>
          <Text style={styles.subtitle}>Track your earnings and payments</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Icon name="plus" size={16} color={colors.primaryForeground} />
          <Text style={styles.addButtonText}>New Invoice</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.devNotification}>
        <Text style={styles.devNotificationText}>
          This page is under development. Data shown is for demonstration purposes only.
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={styles.statCard}>
              <Text style={styles.statTitle}>{stat.title}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statChange}>{stat.change}</Text>
            </Card>
          ))}
        </View>

        {/* Earnings Chart Placeholder */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Earnings Overview</Text>
          <Text style={styles.chartSubtitle}>Your earnings over the past 12 months</Text>
          <View style={styles.chartPlaceholder}>
            <Icon name="bar-chart-2" size={48} color={colors.mutedForeground} />
            <Text style={styles.chartPlaceholderText}>Chart visualization would go here</Text>
          </View>
        </Card>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Icon name="search" size={16} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterTab, activeFilter === filter.key && styles.activeFilterTab]}
              onPress={() => setActiveFilter(filter.key)}
            >
              <Text style={[styles.filterTabText, activeFilter === filter.key && styles.activeFilterTabText]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Transactions List */}
        <View style={styles.transactionsList}>
          {filteredTransactions.map((transaction) => (
            <Card key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionHeader}>
                <Text style={styles.transactionTitle}>
                  {transaction.type === "invoice"
                    ? `Invoice #${transaction.number}`
                    : `Payment #${transaction.reference}`}
                </Text>
                <View style={styles.transactionActions}>
                  <Badge
                    variant={
                      transaction.status === "Paid" || transaction.status === "Completed"
                        ? "success"
                        : transaction.status === "Pending"
                          ? "default"
                          : "destructive"
                    }
                  >
                    {transaction.status}
                  </Badge>
                  <TouchableOpacity style={styles.moreButton}>
                    <Icon name="more-horizontal" size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.transactionDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Project</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate("Projects", {
                        screen: "ProjectDetail",
                        params: { projectId: transaction.projectId },
                      })
                    }
                  >
                    <Text style={styles.detailLink}>{transaction.project}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Client</Text>
                  <Text style={styles.detailValue}>{transaction.client}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={styles.detailAmount}>₹{transaction.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>{new Date(transaction.date).toLocaleDateString()}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 8,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 2,
  },
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
  devNotification: {
    backgroundColor: colors.accent, // A light yellow, good for warnings
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'black', // A slightly darker yellow
  },
  devNotificationText: {
    color: "white", // A dark amber color for text
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    marginHorizontal: "1%",
    marginVertical: 4,
  },
  statTitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.foreground,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  chartCard: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.muted,
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginBottom: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.foreground,
    paddingVertical: 12,
    fontSize: 16,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.muted,
  },
  activeFilterTab: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  activeFilterTabText: {
    color: colors.primaryForeground,
  },
  transactionsList: {
    paddingBottom: 20,
  },
  transactionCard: {
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
    flex: 1,
  },
  transactionActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  moreButton: {
    padding: 4,
    marginLeft: 8,
  },
  transactionDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  detailValue: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: "500",
  },
  detailLink: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  detailAmount: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: "bold",
  },
})