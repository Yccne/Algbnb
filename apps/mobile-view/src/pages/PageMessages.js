import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { messagesController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

export const PageMessages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [error, setError] = useState('');

  const loadConversations = async () => {
    try {
      const data = await messagesController.getConversations();
      setConversations(data);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const handleSelectConv = async (conv) => {
    setSelectedConv(conv);
    setError('');
    try {
      const data = await messagesController.getConversationMessages(conv.conversation_id);
      setMessages(data);
      setConversations((current) => current.map((item) => (item.conversation_id === conv.conversation_id ? { ...item, nb_non_lus: 0 } : item)));
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  const handleSend = async () => {
    if (!msgInput.trim() || !selectedConv) return;
    try {
      await messagesController.sendMessage(selectedConv.conversation_id, msgInput.trim());
      setMsgInput('');
      await handleSelectConv(selectedConv);
      await loadConversations();
    } catch (sendError) {
      setError(sendError.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.containerCenter}>
        <Text style={styles.emptyText}>Connecte-toi pour accéder à la messagerie.</Text>
      </View>
    );
  }

  if (selectedConv) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => setSelectedConv(null)} style={{ marginRight: 12 }}>
            <Text style={{ fontSize: 24, color: theme.colors.onSurfaceVariant }}>←</Text>
          </TouchableOpacity>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(selectedConv.interlocuteur_prenom || 'U').charAt(0)}</Text>
          </View>
          <Text style={styles.chatName}>{selectedConv.interlocuteur_prenom} {selectedConv.interlocuteur_nom}</Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.messagesContainer}>
          {messages.map((msg) => {
            const isMe = String(msg.id_expediteur) === String(user.id);
            return (
              <View key={msg.id} style={[styles.msgBubble, isMe ? styles.msgMe : styles.msgThem]}>
                <Text style={[styles.msgText, isMe && { color: theme.colors.onPrimary }]}>{msg.contenu || 'Photo envoyée'}</Text>
                <Text style={[styles.msgTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>{msg.date_envoi?.slice(11, 16)}</Text>
              </View>
            );
          })}
        </ScrollView>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <TextInput value={msgInput} onChangeText={setMsgInput} placeholder="Écrivez un message..." placeholderTextColor={theme.colors.onSurfaceVariant} style={styles.chatInput} />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={{ color: theme.colors.onPrimary, fontSize: 18 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Messages</Text>
        <Text style={styles.subtitle}>Conversations réelles entre voyageurs et hôtes.</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.convList}>
        {conversations.map((conv) => (
          <TouchableOpacity key={conv.conversation_id} style={[styles.convItem, Number(conv.nb_non_lus) > 0 && styles.convItemUnread]} onPress={() => handleSelectConv(conv)} activeOpacity={0.7}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{(conv.interlocuteur_prenom || 'U').charAt(0)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={[styles.convName, Number(conv.nb_non_lus) > 0 && { fontWeight: '700' }]}>{conv.interlocuteur_prenom} {conv.interlocuteur_nom}</Text>
                <Text style={styles.convDate}>{conv.dernier_message_date?.slice(0, 10) || ''}</Text>
              </View>
              <Text style={styles.convPreview} numberOfLines={1}>{conv.dernier_message || (conv.derniere_photo ? 'Photo envoyée' : 'Aucun message')}</Text>
            </View>
            {Number(conv.nb_non_lus) > 0 ? <View style={styles.unreadDot} /> : null}
          </TouchableOpacity>
        ))}
        {conversations.length === 0 ? <Text style={styles.emptyText}>Aucune conversation.</Text> : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  containerCenter: { flex: 1, backgroundColor: theme.colors.bgMain, justifyContent: 'center', alignItems: 'center', padding: theme.spacing.l },
  header: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, marginBottom: theme.spacing.s },
  subtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, lineHeight: 22 },
  convList: { paddingHorizontal: theme.spacing.m },
  convItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: theme.spacing.s, borderRadius: theme.radius.md, marginBottom: 2 },
  convItemUnread: { backgroundColor: theme.colors.surfaceLow },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: 18 },
  convName: { fontSize: theme.fontSize.bodyMd, fontWeight: '600', color: theme.colors.onSurface },
  convDate: { fontSize: theme.fontSize.labelSm, color: theme.colors.onSurfaceVariant },
  convPreview: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary },
  chatHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh },
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
  errorBox: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m, marginHorizontal: theme.spacing.m, marginBottom: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
  emptyText: { color: theme.colors.onSurfaceVariant },
});
