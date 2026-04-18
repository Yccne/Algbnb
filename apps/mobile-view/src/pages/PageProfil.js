import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

export const PageProfil = () => {
  const navigation = useNavigation();
  const [isEditing, setIsEditing] = useState(false);
  const [profilData, setProfilData] = useState({
    nom: 'Amine Benali',
    email: 'amine@example.com',
    telephone: '+213 5 55 12 34 56',
    aPropos: "Passionné de voyages et de découvertes architecturales. J'aime partager mes bonnes adresses et découvrir des lieux qui racontent une histoire unique à travers le monde.",
  });

  const saveProfile = () => {
    setIsEditing(false);
    Alert.alert('Succès', 'Profil mis à jour avec succès !');
  };

  const avisProfile = [
    { auteur: 'Samia L.', date: 'Mai 2026', texte: "Un hôte exceptionnel ! Amine a été très réactif et de bon conseil pour mon séjour à Alger." },
    { auteur: 'Marc V.', date: 'Avril 2024', texte: "Logement impeccable et accueil chaleureux. Je recommande vivement l'expérience." },
    { auteur: 'Fahd K.', date: 'Mars 2026', texte: "Parfait de A à Z. La communication était fluide et le lieu magnifique." },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=200&q=80' }}
          style={styles.avatar}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.profileName}>{profilData.nom}</Text>
            {!isEditing && (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtnText}>✏️ Modifier</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.memberSince}>Membre depuis Juin 2021</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Dashboard Hôte')}>
          <Text style={styles.btnPrimaryText}>Mon Dashboard Hôte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Root', { screen: 'Réservations' })}>
          <Text style={styles.btnOutlineText}>Mes Voyages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Créer annonce')}>
          <Text style={styles.btnOutlineText}>Créer une annonce</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Form or About */}
      {isEditing ? (
        <View style={styles.editCard}>
          <Text style={styles.sectionTitle}>Modifier vos informations</Text>
          <Text style={styles.inputLabel}>Nom complet</Text>
          <TextInput style={styles.input} value={profilData.nom} onChangeText={v => setProfilData({ ...profilData, nom: v })} />
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.input} value={profilData.email} onChangeText={v => setProfilData({ ...profilData, email: v })} keyboardType="email-address" />
          <Text style={styles.inputLabel}>Téléphone</Text>
          <TextInput style={styles.input} value={profilData.telephone} onChangeText={v => setProfilData({ ...profilData, telephone: v })} keyboardType="phone-pad" />
          <Text style={styles.inputLabel}>À propos de moi</Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={profilData.aPropos} onChangeText={v => setProfilData({ ...profilData, aPropos: v })} multiline />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: theme.spacing.m }}>
            <TouchableOpacity style={styles.btnPrimary} onPress={saveProfile}>
              <Text style={styles.btnPrimaryText}>💾 Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setIsEditing(false)}>
              <Text style={styles.btnOutlineText}>✕ Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>À propos de moi</Text>
          <Text style={styles.aboutText}>{profilData.aPropos}</Text>
          <View style={styles.infoGrid}>
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profilData.email}</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{profilData.telephone}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Reviews */}
      <View style={styles.reviewsSection}>
        <Text style={styles.sectionTitle}>Avis (12)</Text>
        {avisProfile.map((av, idx) => (
          <View key={idx} style={styles.reviewItem}>
            <Text style={styles.reviewAuthor}>{av.auteur}</Text>
            <Text style={styles.reviewDate}>{av.date}</Text>
            <Text style={styles.reviewText}>"{av.texte}"</Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Confidentialité  ·  Conditions  ·  Plan du site  ·  Destinations</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l,
    borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  profileName: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface },
  memberSince: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  editBtn: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 6, paddingHorizontal: 12 },
  editBtnText: { fontSize: theme.fontSize.bodySm, fontWeight: '600', color: theme.colors.onSurface },

  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.m },
  btnPrimary: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 12, paddingHorizontal: 18 },
  btnPrimaryText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodySm },
  btnOutline: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 12, paddingHorizontal: 18 },
  btnOutlineText: { fontWeight: '600', fontSize: theme.fontSize.bodySm, color: theme.colors.onSurface },

  editCard: {
    backgroundColor: theme.colors.surfaceLowest, padding: theme.spacing.l, borderRadius: theme.radius.lg,
    marginHorizontal: theme.spacing.m, marginBottom: theme.spacing.l, ...theme.shadow.ambient,
  },
  sectionTitle: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', marginBottom: theme.spacing.m, color: theme.colors.onSurface },
  inputLabel: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, marginBottom: 4, marginTop: theme.spacing.s },
  input: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface },

  aboutSection: { paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.xl },
  aboutText: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurfaceVariant, lineHeight: 24, marginBottom: theme.spacing.m },
  infoGrid: { flexDirection: 'row', gap: 32 },
  infoLabel: { fontSize: theme.fontSize.labelSm, color: theme.colors.onSurfaceVariant, marginBottom: 2 },
  infoValue: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface },

  reviewsSection: { paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.xl },
  reviewItem: { paddingBottom: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh, marginBottom: theme.spacing.m },
  reviewAuthor: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface },
  reviewDate: { fontSize: 13, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.s },
  reviewText: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurfaceVariant, fontStyle: 'italic', lineHeight: 22 },

  footer: { padding: theme.spacing.l, alignItems: 'center' },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, textAlign: 'center' },
});
