import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { userController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const defaultAvatar = 'https://placehold.co/200x200?text=Profil';

export const PageProfil = () => {
  const navigation = useNavigation();
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '', bio: '' });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      try {
        const data = await userController.getMyProfile();
        setProfile(data.user);
        setStats(data.stats);
        setForm({
          nom: data.user.nom || '',
          prenom: data.user.prenom || '',
          email: data.user.email || '',
          telephone: data.user.telephone || '',
          bio: data.user.bio || '',
        });
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    load();
  }, [user]);

  const saveProfile = async () => {
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      setIsEditing(false);
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Connecte-toi pour accéder à ton profil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <Image source={{ uri: profile?.photo_profil || defaultAvatar }} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.profileName}>{profile?.nomComplet || [profile?.prenom, profile?.nom].filter(Boolean).join(' ')}</Text>
            {!isEditing ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                <Text style={styles.editBtnText}>Modifier</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.memberSince}>Membre depuis {profile?.date_inscription?.slice(0, 10)}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.statsRow}>
        {[
          { label: 'Réservations', value: stats.nb_reservations || 0 },
          { label: 'Favoris', value: stats.nb_favoris || 0 },
          { label: 'Annonces', value: stats.nb_annonces || 0 },
        ].map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statValue}>{item.value}</Text>
            <Text style={styles.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {isEditing ? (
        <View style={styles.editCard}>
          <Text style={styles.sectionTitle}>Modifier vos informations</Text>
          <TextInput style={styles.input} value={form.prenom} onChangeText={(value) => setForm((current) => ({ ...current, prenom: value }))} placeholder="Prénom" />
          <TextInput style={styles.input} value={form.nom} onChangeText={(value) => setForm((current) => ({ ...current, nom: value }))} placeholder="Nom" />
          <TextInput style={styles.input} value={form.email} onChangeText={(value) => setForm((current) => ({ ...current, email: value }))} placeholder="Email" keyboardType="email-address" />
          <TextInput style={styles.input} value={form.telephone} onChangeText={(value) => setForm((current) => ({ ...current, telephone: value }))} placeholder="Téléphone" keyboardType="phone-pad" />
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={form.bio} onChangeText={(value) => setForm((current) => ({ ...current, bio: value }))} placeholder="Bio" multiline />
          <View style={{ flexDirection: 'row', gap: 12, marginTop: theme.spacing.m }}>
            <TouchableOpacity style={styles.btnPrimary} onPress={saveProfile}>
              <Text style={styles.btnPrimaryText}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setIsEditing(false)}>
              <Text style={styles.btnOutlineText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.aboutText}>{profile?.bio || 'Aucune bio renseignée.'}</Text>
          <View style={styles.infoGrid}>
            <View>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{profile?.email || 'Non renseigné'}</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>Téléphone</Text>
              <Text style={styles.infoValue}>{profile?.telephone || 'Non renseigné'}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Dashboard Hôte')}>
          <Text style={styles.btnPrimaryText}>Dashboard Hôte</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.navigate('Créer annonce')}>
          <Text style={styles.btnOutlineText}>Créer annonce</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={logout}>
          <Text style={styles.btnOutlineText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgMain, padding: theme.spacing.l },
  emptyText: { color: theme.colors.onSurfaceVariant },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  profileName: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface },
  memberSince: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  editBtn: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 6, paddingHorizontal: 12 },
  editBtnText: { fontSize: theme.fontSize.bodySm, fontWeight: '600', color: theme.colors.onSurface },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.m },
  statCard: { flex: 1, backgroundColor: theme.colors.surfaceLowest, borderRadius: theme.radius.md, padding: theme.spacing.m, alignItems: 'center', ...theme.shadow.sm },
  statValue: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface },
  statLabel: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  editCard: { backgroundColor: theme.colors.surfaceLowest, padding: theme.spacing.l, borderRadius: theme.radius.lg, marginHorizontal: theme.spacing.m, marginBottom: theme.spacing.l, ...theme.shadow.ambient },
  sectionTitle: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', marginBottom: theme.spacing.m, color: theme.colors.onSurface },
  input: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, marginBottom: theme.spacing.s },
  aboutSection: { paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.xl },
  aboutText: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurfaceVariant, lineHeight: 24, marginBottom: theme.spacing.m },
  infoGrid: { flexDirection: 'row', gap: 32 },
  infoLabel: { fontSize: theme.fontSize.labelSm, color: theme.colors.onSurfaceVariant, marginBottom: 2 },
  infoValue: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.m },
  btnPrimary: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 12, paddingHorizontal: 18 },
  btnPrimaryText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodySm },
  btnOutline: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 12, paddingHorizontal: 18 },
  btnOutlineText: { fontWeight: '600', fontSize: theme.fontSize.bodySm, color: theme.colors.onSurface },
  errorBox: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m, marginHorizontal: theme.spacing.m, marginVertical: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
});
