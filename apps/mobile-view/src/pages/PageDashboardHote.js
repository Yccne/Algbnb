import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

export const PageDashboardHote = () => {
  const navigation = useNavigation();

  const [annonces, setAnnonces] = useState([
    { id: 1, titre: 'Dar El Dey - Casbah', ville: 'Alger', prix: 18000, active: true },
    { id: 2, titre: 'Appartement Haut Standing Hydra', ville: 'Alger', prix: 22000, active: true },
    { id: 3, titre: 'Chalet Cap Carbon', ville: 'Béjaïa', prix: 12000, active: false },
  ]);

  const toggleStatus = (id) => {
    setAnnonces(annonces.map(a => a.id === id ? { ...a, active: !a.active } : a));
  };

  const deleteAnnonce = (id) => {
    Alert.alert('Supprimer', 'Êtes-vous sûr de vouloir supprimer cette annonce ?', [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: () => setAnnonces(annonces.filter(a => a.id !== id)) }
    ]);
  };

  const stats = [
    { label: 'Annonces actives', value: '12' },
    { label: 'Réservations ce mois', value: '48' },
    { label: 'Revenus ce mois', value: '125 000 DZD' },
    { label: "Taux d'occupation", value: '92 %' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Algbnb Hôte</Text>
          <Text style={styles.displayTitle}>Édition Luxe</Text>
        </View>
        <TouchableOpacity style={styles.newBtn} onPress={() => navigation.navigate('Créer annonce')} activeOpacity={0.8}>
          <Text style={styles.newBtnText}>+ Nouvelle annonce</Text>
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={styles.section}>
        <Text style={styles.greetTitle}>Bonjour, Alexandre</Text>
        <Text style={styles.greetSubtitle}>Voici un aperçu de vos performances pour le mois de Juin.</Text>
      </View>

      {/* Stats Grid */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        {stats.map((stat, idx) => (
          <View key={idx} style={styles.statCard}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Mes annonces */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.m }}>
          <Text style={styles.sectionTitle}>Mes annonces</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Resultats')}>
            <Text style={styles.seeAll}>Voir toutes</Text>
          </TouchableOpacity>
        </View>

        {annonces.map(annonce => (
          <View key={annonce.id} style={styles.annonceCard}>
            <View style={styles.annonceThumb} />
            <View style={{ flex: 1 }}>
              <Text style={styles.annonceTitle}>{annonce.titre}</Text>
              <Text style={styles.annonceDetails}>{annonce.ville} • {annonce.prix} DZD / nuit</Text>
              <View style={[styles.badge, annonce.active ? styles.badgeActive : styles.badgeInactive]}>
                <Text style={[styles.badgeText, annonce.active ? styles.badgeTextActive : styles.badgeTextInactive]}>
                  {annonce.active ? 'En ligne' : 'En pause'}
                </Text>
              </View>
            </View>
            <View style={styles.annonceActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={() => toggleStatus(annonce.id)}>
                <Text style={{ fontSize: 16, color: annonce.active ? theme.colors.warning : theme.colors.primary }}>⏻</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Créer annonce')}>
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => deleteAnnonce(annonce.id)}>
                <Text style={{ fontSize: 14, color: theme.colors.error }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Upcoming Bookings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prochaines réservations</Text>
        {[
          { nom: 'Sarah Mitchell', details: '2 adultes • Dar El Dey - Casbah', id: 1 },
          { nom: 'Marc Lefebvre', details: '1 voyageur • Appartement Haut Standing Hydra', id: 2 },
          { nom: 'Léa Dubois', details: '4 voyageurs • Chalet Cap Carbon', id: 3 },
        ].map((booking, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.bookingItem}
            onPress={() => navigation.navigate('Logement', { logementId: booking.id })}
          >
            <Text style={styles.bookingName}>{booking.nom}</Text>
            <Text style={styles.bookingDetails}>{booking.details}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Elite Card */}
      <View style={styles.eliteCard}>
        <Text style={styles.eliteTitle}>Devenez Hôte Élite</Text>
        <Text style={styles.eliteText}>Réalisez 5 réservations supplémentaires sans annulation pour débloquer le badge Élite.</Text>
      </View>

      {/* Recent Messages */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Messages récents</Text>
        {[
          { nom: 'Julien Petit', msg: '"Est-il possible d\'arriver plus tôt pour..."' },
          { nom: 'Chloé Bernard', msg: '"Merci beaucoup pour les conseils sur les..."' },
        ].map((m, idx) => (
          <TouchableOpacity key={idx} style={styles.bookingItem} onPress={() => navigation.navigate('Root', { screen: 'Messages' })}>
            <Text style={styles.bookingName}>{m.nom}</Text>
            <Text style={styles.bookingDetails}>{m.msg}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l,
  },
  headerLabel: { fontSize: theme.fontSize.titleLg, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, letterSpacing: -0.5 },
  newBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 10, paddingHorizontal: 16 },
  newBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodySm },

  section: { paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.l },
  greetTitle: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', marginBottom: theme.spacing.xs, color: theme.colors.onSurface },
  greetSubtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd },
  sectionTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface },
  seeAll: { fontSize: theme.fontSize.bodySm, fontWeight: '600', color: theme.colors.primary },

  statsRow: { paddingHorizontal: theme.spacing.m, gap: 12, flexDirection: 'row', marginBottom: theme.spacing.l },
  statCard: {
    backgroundColor: theme.colors.surfaceLowest, borderRadius: theme.radius.lg, padding: theme.spacing.m,
    width: 160, ...theme.shadow.sm,
  },
  statLabel: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodySm, marginBottom: theme.spacing.xs },
  statValue: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface },

  annonceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: theme.spacing.m, backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.md, marginBottom: theme.spacing.s, ...theme.shadow.sm,
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

  bookingItem: { paddingVertical: theme.spacing.s, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh },
  bookingName: { fontSize: theme.fontSize.bodyMd, fontWeight: '700', color: theme.colors.onSurface },
  bookingDetails: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },

  eliteCard: {
    backgroundColor: theme.colors.primaryContainer, borderRadius: theme.radius.lg,
    padding: theme.spacing.l, marginHorizontal: theme.spacing.m, marginBottom: theme.spacing.l,
  },
  eliteTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onPrimary, marginBottom: theme.spacing.xs },
  eliteText: { fontSize: theme.fontSize.bodySm, color: 'rgba(255,255,255,0.8)', lineHeight: 22 },
});
