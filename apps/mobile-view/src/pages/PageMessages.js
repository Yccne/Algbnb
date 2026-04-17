import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

const initialConversations = [
  {
    id: 1, nom: 'Samia', date: "Aujourd'hui", avatar: 'S', unread: true,
    messages: [{ sender: 'them', text: 'Bonjour ! La villa est-elle disponible pour le 15 juin ?', time: '10:00' }]
  },
  {
    id: 2, nom: 'Yacine Cherif', date: 'Hier', avatar: 'Y', unread: true,
    messages: [{ sender: 'them', text: "Est-il possible d'arriver plus tôt pour le check-in ?", time: 'Hier' }]
  },
  {
    id: 3, nom: 'Amina B.', date: 'Il y a 2 jours', avatar: 'A', unread: false,
    messages: [
      { sender: 'me', text: "Super, n'hésitez pas si vous avez d'autres questions.", time: 'Mar' },
      { sender: 'them', text: 'Merci beaucoup pour les conseils sur les restaurants !', time: 'Mar' }
    ]
  },
  {
    id: 4, nom: 'Khaled O.', date: 'La semaine dernière', avatar: 'K', unread: false,
    messages: [{ sender: 'them', text: 'Top séjour, merci encore pour tout.', time: 'Lun' }]
  },
];

export const PageMessages = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConv, setSelectedConv] = useState(null);
  const [msgInput, setMsgInput] = useState('');

  const handleSelectConv = (conv) => {
    setConversations(conversations.map(c => c.id === conv.id ? { ...c, unread: false } : c));
    setSelectedConv({ ...conv, unread: false });
  };

  const handleSend = () => {
    if (!msgInput.trim()) return;
    const newMsg = { sender: 'me', text: msgInput, time: "À l'instant" };
    const updated = conversations.map(c => {
      if (c.id === selectedConv.id) return { ...c, messages: [...c.messages, newMsg] };
      return c;
    });
    setConversations(updated);
    setSelectedConv({ ...selectedConv, messages: [...selectedConv.messages, newMsg] });
    setMsgInput('');
  };

  // Chat View
  if (selectedConv) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConv(null)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24, color: theme.colors.onSurfaceVariant }}>←</Text>
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{selectedConv.avatar}</Text>
          </View>
          <Text style={styles.chatName}>{selectedConv.nom}</Text>
        </View>

        {/* Messages */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.messagesContainer}>
          {selectedConv.messages.map((msg, idx) => (
            <View key={idx} style={[styles.msgBubble, msg.sender === 'me' ? styles.msgMe : styles.msgThem]}>
              <Text style={[styles.msgText, msg.sender === 'me' && { color: theme.colors.onPrimary }]}>{msg.text}</Text>
              <Text style={[styles.msgTime, msg.sender === 'me' && { color: 'rgba(255,255,255,0.7)' }]}>{msg.time}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            value={msgInput}
            onChangeText={setMsgInput}
            placeholder="Écrivez un message..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={styles.chatInput}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={{ color: theme.colors.onPrimary, fontSize: 18 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // Conversation List
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Messages</Text>
        <Text style={styles.subtitle}>Vos conversations avec les hôtes et voyageurs.</Text>
      </View>

      <View style={styles.convList}>
        {conversations.map(conv => {
          const lastMessage = conv.messages[conv.messages.length - 1].text;
          return (
            <TouchableOpacity
              key={conv.id}
              style={[styles.convItem, conv.unread && styles.convItemUnread]}
              onPress={() => handleSelectConv(conv)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{conv.avatar}</Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={[styles.convName, conv.unread && { fontWeight: '700' }]}>{conv.nom}</Text>
                  <Text style={styles.convDate}>{conv.date}</Text>
                </View>
                <Text style={styles.convPreview} numberOfLines={1}>{lastMessage}</Text>
              </View>
              {conv.unread && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Confidentialité  ·  Conditions  ·  Aide</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, letterSpacing: -0.5, marginBottom: theme.spacing.s },
  subtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, lineHeight: 22 },

  convList: { paddingHorizontal: theme.spacing.m },
  convItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.s,
    borderRadius: theme.radius.md,
    marginBottom: 2,
  },
  convItemUnread: { backgroundColor: theme.colors.surfaceLow },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: 18 },
  convName: { fontSize: theme.fontSize.bodyMd, fontWeight: '600', color: theme.colors.onSurface },
  convDate: { fontSize: theme.fontSize.labelSm, color: theme.colors.onSurfaceVariant },
  convPreview: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },

  // Chat
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s,
    borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh,
  },
  chatName: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface },
  messagesContainer: { padding: theme.spacing.m, gap: 12 },
  msgBubble: { maxWidth: '80%', padding: 12, borderRadius: theme.radius.lg },
  msgMe: { alignSelf: 'flex-end', backgroundColor: theme.colors.primary },
  msgThem: { alignSelf: 'flex-start', backgroundColor: theme.colors.surfaceLow },
  msgText: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, lineHeight: 20 },
  msgTime: { fontSize: 10, textAlign: 'right', marginTop: 4, opacity: 0.7, color: theme.colors.onSurfaceVariant },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: theme.spacing.s, borderTopWidth: 1, borderTopColor: theme.colors.surfaceHigh },
  chatInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingHorizontal: 16, paddingVertical: 12, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' },

  footer: { padding: theme.spacing.l, alignItems: 'center' },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
});
