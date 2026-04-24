import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logementController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const fallbackImage = 'https://placehold.co/1200x800?text=Logement';

export const PageLogement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const logementId = route.params?.logementId;

  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateArrivee, setDateArrivee] = useState('');
  const [dateDepart, setDateDepart] = useState('');
  const [voyageurs, setVoyageurs] = useState('1');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await logementController.getLogementById(logementId);
        setLogement(data);
      } catch (error) {
        Alert.alert('Erreur', error.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [logementId]);

  const nuits = useMemo(() => {
    if (!dateArrivee || !dateDepart) return 1;
    const start = new Date(`${dateArrivee}T00:00:00`);
    const end = new Date(`${dateDepart}T00:00:00`);
    const diff = Math.round((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [dateArrivee, dateDepart]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!logement) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Logement introuvable</Text>
      </View>
    );
  }

  const prixNuit = logement.prix || 0;
  const sousTotal = prixNuit * nuits;
  const frais = Math.round(sousTotal * 0.12);
  const total = sousTotal + frais;

  const handleReserve = () => {
    if (!user) {
      navigation.navigate('Connexion');
      return;
    }
    if (!dateArrivee || !dateDepart) {
      Alert.alert('Dates requises', 'Renseigne une date d’arrivée et de départ au format YYYY-MM-DD.');
      return;
    }
    navigation.navigate('Paiement', {
      logement,
      dateArrivee,
      dateDepart,
      voyageurs: Number(voyageurs || 1),
      nuits,
      sousTotal,
      frais,
      total,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.photoContainer}>
        <Image source={{ uri: logement.photos?.[0] || fallbackImage }} style={styles.photo} />
      </View>

      <View style={styles.section}>
        <Text style={styles.heroTitle}>{logement.titre}</Text>
        <Text style={styles.location}>{logement.ville}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.stat}>👥 {logement.voyageurs} voyageurs</Text>
          <Text style={styles.stat}>🛏️ {logement.chambres} chambres · {logement.lits} lits</Text>
          <Text style={styles.stat}>🛁 {logement.sallesDeBain} sdb</Text>
        </View>
      </View>

      <View style={styles.hostCard}>
        <Image source={{ uri: logement.hote?.photo || fallbackImage }} style={styles.hostAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.hostName}>Hôte : {logement.hote?.nom || 'Hôte'}</Text>
          <Text style={styles.hostSince}>{logement.hote?.verifie ? 'Profil vérifié' : 'Profil non vérifié'}</Text>
        </View>
        <View style={styles.hostStats}>
          <View style={{ alignItems: 'center', marginRight: theme.spacing.m }}>
            <Text style={styles.hostStatNum}>{Number(logement.note || 0).toFixed(1)}</Text>
            <Text style={styles.hostStatLabel}>NOTE</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.hostStatNum}>{logement.nbAvis || logement.avis?.length || 0}</Text>
            <Text style={styles.hostStatLabel}>AVIS</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos</Text>
        <Text style={styles.descriptionText}>{logement.description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Équipements</Text>
        <View style={styles.equipGrid}>
          {(logement.equipements || []).map((eq) => (
            <View key={eq} style={styles.equipItem}>
              <Text style={styles.equipText}>• {eq}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avis</Text>
        {(logement.avis || []).map((av) => (
          <View key={av.id} style={styles.reviewCard}>
            <Text style={styles.reviewAuthor}>{av.auteur}</Text>
            <Text style={styles.reviewText}>{av.commentaire || 'Aucun commentaire.'}</Text>
          </View>
        ))}
        {(logement.avis || []).length === 0 ? <Text style={styles.emptyText}>Aucun avis public pour le moment.</Text> : null}
      </View>

      <View style={styles.bookingCard}>
        <Text style={styles.bookingPrice}>{logement.prix} DZD <Text style={styles.bookingUnit}>/ nuit</Text></Text>
        <TextInput value={dateArrivee} onChangeText={setDateArrivee} placeholder="Arrivée YYYY-MM-DD" style={styles.input} />
        <TextInput value={dateDepart} onChangeText={setDateDepart} placeholder="Départ YYYY-MM-DD" style={styles.input} />
        <TextInput value={voyageurs} onChangeText={setVoyageurs} placeholder="Voyageurs" keyboardType="numeric" style={styles.input} />

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.bookingLabel}>{prixNuit} DZD x {nuits} nuit{nuits > 1 ? 's' : ''}</Text>
            <Text style={styles.bookingValue}>{sousTotal} DZD</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.bookingLabel}>Frais de service</Text>
            <Text style={styles.bookingValue}>{frais} DZD</Text>
          </View>
          <View style={styles.bookingDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.bookingTotal}>Total</Text>
            <Text style={styles.bookingTotal}>{total} DZD</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.reserveBtn} activeOpacity={0.8} onPress={handleReserve}>
          <Text style={styles.reserveBtnText}>Réserver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgMain },
  photoContainer: { width: '100%', height: 300, borderRadius: theme.radius.lg, overflow: 'hidden', marginBottom: theme.spacing.m, paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.m },
  photo: { width: '100%', height: '100%', borderRadius: theme.radius.lg, resizeMode: 'cover' },
  section: { paddingHorizontal: theme.spacing.m, marginBottom: theme.spacing.l },
  heroTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, marginBottom: theme.spacing.xs },
  location: { fontSize: theme.fontSize.titleLg, color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.m },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  stat: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  hostCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: theme.spacing.m, backgroundColor: theme.colors.surfaceLow, borderRadius: theme.radius.lg, marginHorizontal: theme.spacing.m, marginBottom: theme.spacing.l },
  hostAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: theme.colors.primaryContainer },
  hostName: { fontSize: theme.fontSize.bodyMd, fontWeight: '700', color: theme.colors.onSurface },
  hostSince: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  hostStats: { flexDirection: 'row' },
  hostStatNum: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface },
  hostStatLabel: { fontSize: 10, color: theme.colors.onSurfaceVariant },
  sectionTitle: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface, marginBottom: theme.spacing.m },
  descriptionText: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurfaceVariant, lineHeight: 26 },
  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  equipItem: { width: '45%' },
  equipText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  reviewCard: { backgroundColor: theme.colors.surfaceLow, borderRadius: theme.radius.lg, padding: theme.spacing.m, marginBottom: theme.spacing.s },
  reviewAuthor: { fontSize: theme.fontSize.bodyMd, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 4 },
  reviewText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, lineHeight: 22 },
  bookingCard: { margin: theme.spacing.m, padding: theme.spacing.m, backgroundColor: theme.colors.surfaceLowest, borderRadius: theme.radius.lg, ...theme.shadow.ambient },
  bookingPrice: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface, marginBottom: theme.spacing.m },
  bookingUnit: { fontSize: theme.fontSize.bodyMd, fontWeight: '400', color: theme.colors.onSurfaceVariant },
  input: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, marginBottom: theme.spacing.s },
  bookingDetails: { marginBottom: theme.spacing.m },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.s },
  bookingLabel: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  bookingValue: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurface },
  bookingDivider: { height: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: theme.spacing.s, opacity: 0.3 },
  bookingTotal: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  reserveBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center', marginBottom: theme.spacing.s },
  reserveBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 17 },
  emptyText: { color: theme.colors.onSurfaceVariant },
});
