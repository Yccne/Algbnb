import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { dashboardController, logementController, reservationController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const fallbackImage = 'https://placehold.co/150x150?text=Annonce';

export const PageDashboardHote = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardController.getHostDashboard();
      setDashboard(data);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadDashboard();
  }, [user]);

  const toggleStatus = async (annonce) => {
    try {
      await logementController.togglePublication(annonce.id, !annonce.est_actif);
      await loadDashboard();
    } catch (toggleError) {
      Alert.alert('Erreur', toggleError.message);
    }
  };

  const deleteAnnonce = async (id) => {
    Alert.alert('Supprimer', 'Supprimer cette annonce ?', [
      { text: 'Annuler' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await logementController.supprimerLogement(id);
            await loadDashboard();
          } catch (deleteError) {
            Alert.alert('Erreur', deleteError.message);
          }
        },
      },
    ]);
  };

  const handleReservationStatus = async (id, statut) => {
    try {
      await reservationController.updateReservationStatus(id, statut);
      await loadDashboard();
    } catch (statusError) {
      Alert.alert('Erreur', statusError.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Connecte-toi en hôte pour accéder au dashboard.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Espace Hôte</Text>
          <Text style={styles.displayTitle}>Pilotage en temps réel</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Créer annonce')} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ Nouvelle annonce</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.greetTitle}>Bonjour, {user.prenom || user.nom}</Text>
        <Text style={styles.greetSubtitle}>Statistiques calculées à partir de la base PostgreSQL.</Text>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        {[
          { label: 'Annonces actives', value: dashboard?.stats?.nb_annonces_actives || 0 },
          { label: 'Réservations confirmées', value: dashboard?.stats?.nb_reservations_confirmees || 0 },
          { label: 'Demandes en attente', value: dashboard?.stats?.nb_reservations_en_attente || 0 },
          { label: 'Revenus', value: `${dashboard?.stats?.revenu_total || 0} DZD` },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes annonces</Text>
        {(dashboard?.logements || []).map((annonce) => (
          <View key={annonce.id} style={styles.annonceCard}>
            <Image source={{ uri: annonce.photos?.[0] || fallbackImage }} style={styles.annonceThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.annonceTitle}>{annonce.titre}</Text>
              <Text style={styles.annonceDetails}>{annonce.ville} • {annonce.prix} DZD / nuit</Text>
              <View style={[styles.badge, annonce.est_actif ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, annonce.est_actif ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {annonce.est_actif ? 'En ligne' : 'En pause'} • {annonce.validation_statut}
                </Text>
              </View>
            </View>
            <View style={styles.annonceActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => toggleStatus(annonce)}>
                <Text style={styles.iconBtnText}>⏻</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Créer annonce')}>
                <Text style={styles.iconBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteAnnonce(annonce.id)}>
                <Text style={[styles.iconBtnText, { color: theme.colors.error }]}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {dashboard?.logements?.length === 0 ? <Text style={styles.emptyText}>Aucune annonce créée.</Text> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Réservations récentes</Text>
        {(dashboard?.reservations || []).map((booking) => (
          <View key={booking.id} style={styles.bookingItem}>
            <Text style={styles.bookingName}>{booking.voyageur_prenom} {booking.voyageur_nom}</Text>
            <Text style={styles.bookingDetails}>{booking.logement_titre}</Text>
            <Text style={styles.bookingDetails}>{booking.date_arrivee} → {booking.date_depart} • {booking.statut}</Text>
            {booking.statut === 'en_attente' ? (
              <View style={styles.bookingActions}>
                <TouchableOpacity style={styles.confirmBtn} onPress={() => handleReservationStatus(booking.id, 'confirmee')}>
                  <Text style={styles.confirmBtnText}>Confirmer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.refuseBtn} onPress={() => handleReservationStatus(booking.id, 'refusee')}>
                  <Text style={styles.refuseBtnText}>Refuser</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
        {dashboard?.reservations?.length === 0 ? <Text style={styles.emptyText}>Pas encore de réservation.</Text> : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgMain, padding: theme.spacing.l },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.l,
    paddingBottom: theme.spacing.l,
    gap: 12,
  },
  headerLabel: { fontSize: theme.fontSize.titleLg, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38 },
  newBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 10, paddingHorizontal: 16 },
  newBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodySm },
  section: { paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.l },
  greetTitle: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', marginBottom: theme.spacing.xs, color: theme.colors.onSurface },
  greetSubtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd },
  statsRow: { paddingHorizontal: theme.spacing.m, gap: 12, flexDirection: 'row', marginBottom: theme.spacing.l },
  statCard: { backgroundColor: theme.colors.surfaceLowest, borderRadius: theme.radius.lg, padding: theme.spacing.m, width: 170, ...theme.shadow.sm },
  statLabel: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodySm, marginBottom: theme.spacing.xs },
  statValue: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface },
  sectionTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface, marginBottom: theme.spacing.m },
  annonceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.s,
    ...theme.shadow.sm,
  },
  annonceThumb: { width: 56, height: 56, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceHigh },
  annonceTitle: { fontSize: theme.fontSize.bodyMd, fontWeight: '700', color: theme.colors.onSurface },
  annonceDetails: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  badge: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.full },
  badgeActive: { backgroundColor: theme.colors.primaryContainer },
  badgeInactive: { backgroundColor: theme.colors.surfaceHigh },
  badgeText: { fontSize: 12 },
  badgeTextActive: { color: theme.colors.onPrimaryContainer },
  badgeTextInactive: { color: theme.colors.onSurfaceVariant },
  annonceActions: { flexDirection: 'column', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: theme.colors.outlineVariant, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 14, color: theme.colors.onSurfaceVariant },
  bookingItem: { padding: theme.spacing.m, backgroundColor: theme.colors.surfaceLowest, borderRadius: theme.radius.md, marginBottom: theme.spacing.s },
  bookingName: { fontSize: theme.fontSize.bodyMd, fontWeight: '700', color: theme.colors.onSurface },
  bookingDetails: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, marginTop: 2 },
  bookingActions: { flexDirection: 'row', gap: 10, marginTop: theme.spacing.s },
  confirmBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.full },
  confirmBtnText: { color: theme.colors.onPrimary, fontWeight: '600' },
  refuseBtn: { borderWidth: 1, borderColor: theme.colors.outlineVariant, paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.full },
  refuseBtnText: { color: theme.colors.onSurface, fontWeight: '600' },
  errorBox: { marginHorizontal: theme.spacing.m, marginBottom: theme.spacing.m, backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
  emptyTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface, textAlign: 'center' },
  emptyText: { color: theme.colors.onSurfaceVariant },
});
