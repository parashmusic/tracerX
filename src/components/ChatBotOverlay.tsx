// src/components/ChatbotOverlay.tsx
import React, { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native"
import Icon from "react-native-vector-icons/Feather"
import run, { generateQuotation } from "../services/gemini"   
import { colors } from "../theme/colors"

export default function ChatbotOverlay() {
  const [visible, setVisible] = useState(false)
  const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string; isQuotation?: boolean }[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    if (visible) {
      setMessages([
        {
          sender: 'bot',
          text: "Hi there! I'm QuoTie, your project quotation buddy! 🚀\n\nI can help you:\n• Generate professional project quotations\n• Break down tasks and timelines\n• Calculate fair pricing\n• Offer freelancing advice\n\nTell me about your project and I'll whip up a custom pricing breakdown for you!"
        }
      ]);
      setInput('');
    }
  }, [visible]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const detectQuotationRequest = (text: string): boolean => {
    const quotationKeywords = [
      'quotation', 'quote', 'estimate', 'pricing', 'budget', 'cost',
      'how much', 'price', 'project cost', 'proposal', 'bid'
    ];
    return quotationKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  };

  const sendMessage = async () => {
    const prompt = input.trim()
    if (!prompt) return

    // Add user message
    setMessages((m) => [...m, { sender: "user", text: prompt }])
    setInput("")
    setLoading(true)

    try {
      let reply: string;
      
      // Check if this is a quotation request
      if (detectQuotationRequest(prompt)) {
        // Use the specialized quotation function
        reply = await generateQuotation(prompt);
      } else {
        // Use general chat
        reply = await run(prompt);
      }
      
      setMessages((m) => [...m, { 
        sender: "bot", 
        text: reply,
        isQuotation: detectQuotationRequest(prompt)
      }])
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { 
          sender: "bot", 
          text: `❗️ Sorry, I'm having trouble responding right now. Please try again in a moment!\n\nError: ${e.message || "Unknown error"}` 
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isQuotation = item.isQuotation;
    
    return (
      <View
        style={[
          styles.bubble,
          item.sender === "user" ? styles.userBubble : styles.botBubble,
          isQuotation && styles.quotationBubble
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.sender === "user" ? styles.userText : styles.botText,
            isQuotation && styles.quotationText
          ]}
        >
          {item.text}
        </Text>
        {isQuotation && (
          <TouchableOpacity 
            style={styles.copyButton}
            onPress={() => {
              // Copy to clipboard functionality
              Alert.alert("Copied!", "Quotation copied to clipboard");
            }}
          >
            <Text style={styles.copyButtonText}>📋 Copy Quotation</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const quickActions = [
    { title: "💼 Website Quote", prompt: "Create a quotation for a 5-page business website" },
    { title: "📱 App Estimate", prompt: "Give me a quote for a mobile app with user authentication" },
    { title: "🎨 Design Project", prompt: "I need pricing for logo and branding package" },
    { title: "📢 Marketing", prompt: "Social media campaign for 3 months - quote needed" },
  ];

  return (
    <>
      {/* Floating chat button */}
      <TouchableOpacity style={styles.fab} onPress={() => setVisible(true)}>
        <Icon name="message-circle" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Full-screen chat overlay */}
      <Modal visible={visible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ImageBackground 
            source={{ uri: "https://www.krea.ai/api/img?f=webp&i=https%3A%2F%2Ftest1-emgndhaqd0c9h2db.a01.azurefd.net%2Fimages%2F90953294-538f-408d-86fa-17690e9df987.png" }}
            style={styles.overlay}
          >
            <View style={styles.header}>
              <Image  
                source={{ uri: "https://cdn-icons-png.freepik.com/512/12715/12715291.png" }}
                style={styles.logo} 
              />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Quotie AI</Text>
                <Text style={styles.headerSubtitle}>Your Freelance Buddy</Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
                <Icon name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Quick Actions 
            {messages.length <= 1 && (
              <View style={styles.quickActions}>
                <Text style={styles.quickActionsTitle}>Quick Quotes</Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.quickActionButton}
                      onPress={() => {
                        setInput(action.prompt);
                        // Auto-send after a brief delay
                        setTimeout(sendMessage, 100);
                      }}
                    >
                      <Text style={styles.quickActionText}>{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
              */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(_, i) => i.toString()}
              contentContainerStyle={styles.messageList}
              renderItem={renderMessage}
              showsVerticalScrollIndicator={false}
            />

            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#3b82f6" size="large" />
                <Text style={styles.loadingText}>Quotie is thinking...</Text>
              </View>
            )}

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Ask for a quotation or chat with Quotie..."
                placeholderTextColor="#9ca3af"
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline
                maxLength={1000}
              />
              <TouchableOpacity 
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
                onPress={sendMessage}
                disabled={!input.trim() || loading}
              >
                <Icon name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </KeyboardAvoidingView>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: "absolute",
    bottom: 110,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  overlay: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  logo: {
    borderRadius: 20,
    width: 40,
    height: 40,
    marginRight: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#d1d5db",
    fontSize: 12,
  },
  closeButton: {
    padding: 4,
  },
  quickActions: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    margin: 16,
    borderRadius: 12,
  },
  quickActionsTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: colors.mutedForeground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  quickActionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  bubble: {
    marginVertical: 6,
    maxWidth: "85%",
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: "#2563eb",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "rgba(55, 65, 81, 0.9)",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  quotationBubble: {
    backgroundColor: "rgba(21, 94, 117, 0.9)",
    borderLeftWidth: 4,
    borderLeftColor: "#0ea5e9",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: { 
    color: "#fff" 
  },
  botText: { 
    color: "#f3f4f6" 
  },
  quotationText: {
    color: "#ecfeff",
  },
  copyButton: {
    marginTop: 8,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  copyButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "rgba(18, 18, 18, 0.95)",
    borderTopWidth: 1,
    borderColor: "#374151",
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: "#1f2937",
    color: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    marginLeft: 12,
    padding: 10,
    backgroundColor: "#3b82f6",
    borderRadius: 20,
  },
  sendBtnDisabled: {
    backgroundColor: "#6b7280",
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  loadingText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
})