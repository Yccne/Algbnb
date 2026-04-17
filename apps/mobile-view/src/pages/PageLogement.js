import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { logementController } from '@algbnb/core';
import { theme } from '../styles/theme';

const equipementEmojis = {
  'Wi-Fi': '📶', 'Parking': '🅿️', 'Cuisine équipée': '🍳', 'Climatisation': '❄️',
  'Piscine': '🏊', 'Piscine à débordement': '🏊', 'Vue mer': '🌊', 'Sauna': '🧖',
};

const avisExperts = [
  { auteur: 'Marc Dupont', date: 'Juin 2024', note: 5, texte: "Un séjour inoubliable. La vue est encore plus belle en vrai que sur les photos. L'hôte est très attentionné." },
  { auteur: 'Léa Vasseur', date: 'Mai 2024', note: 5, texte: "Le design minimaliste apporte une sérénité immédiate. Parfait pour une escapade relaxante loin de l'agitation." },
  { auteur: 'Thomas Leroy', date: 'Avril 2024', note: 4, texte: "Excellente communication et cadre magnifique. Conseils locaux très appréciés. Nous reviendrons !" },
  { auteur: 'Camille Martin', date: 'Mars 2024', note: 5, texte: "Superbe et très fonctionnel. Chaque détail semble avoir été pensé pour le bien-être des voyageurs." },
];

export const PageLogement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const logementId = route.params?.logementId || 1;

  const [logement, setLogement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [voyageurs, setVoyageurs] = useState(1);

  const prixNuit = logement?.prix || 0;
  const nuits = 1;
  const sousTotal = nuits * prixNuit;
  const frais = Math.round(sousTotal * 0.12);
  const total = sousTotal + frais;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const l = await logementController.getLogementById(logementId);
        setLogement(l);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [logementId]);

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  if (!logement) return <View style={styles.loadingContainer}><Text style={{ color: theme.colors.onSurfaceVariant }}>Logement introuvable</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Actions Row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => setIsFav(!isFav)} style={styles.actionBtn}>
          <Text style={{ color: isFav ? theme.colors.heart : theme.colors.onSurfaceVariant, fontSize: 18 }}>{isFav ? '♥' : '♡'}</Text>
          <Text style={styles.actionText}>Sauvegarder</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={{ fontSize: 18 }}>↗️</Text>
          <Text style={styles.actionText}>Partager</Text>
        </TouchableOpacity>
      </View>

      {/* Photo */}
      <View style={styles.photoContainer}>
        <Image source={{ uri: logement.photos[0] }} style={styles.photo} />
      </View>

      {/* Title + Location */}
      <View style={styles.section}>
        <Text style={styles.heroTitle}>{logement.titre}</Text>
        <Text style={styles.location}>{logement.ville}</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>👥 {logement.voyageurs} voyageurs</Text>
          <Text style={styles.stat}>🛏️ {logement.chambres} ch · {logement.lits} lits</Text>
          <Text style={styles.stat}>🚿 {logement.sallesDeBain} sdb</Text>
        </View>
      </View>

      {/* Host Section */}
      <View style={styles.hostCard}>
        <Image
          source={{ uri: logement.hote?.photo || 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80' }}
          style={styles.hostAvatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.hostName}>Hôte : {logement.hote?.nom || 'Sophie'}</Text>
          <Text style={styles.hostSince}>Hôte depuis {logement.hote?.depuis || '4 ans'}</Text>
        </View>
        <View style={styles.hostStats}>
          <View style={{ alignItems: 'center', marginRight: theme.spacing.m }}>
            <Text style={styles.hostStatNum}>{logement.note}</Text>
            <Text style={styles.hostStatLabel}>NOTE</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.hostStatNum}>128</Text>
            <Text style={styles.hostStatLabel}>AVIS</Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>À propos de ce logement</Text>
        <Text style={styles.descriptionText}>{logement.description}</Text>
      </View>

      {/* Equipements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Équipements</Text>
        <View style={styles.equipGrid}>
          {logement.equipements?.map((eq, idx) => (
            <View key={idx} style={styles.equipItem}>
              <Text style={{ fontSize: 18 }}>{equipementEmojis[eq] || '✓'}</Text>
              <Text style={styles.equipText}>{eq}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reviews */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Avis des voyageurs</Text>
        {avisExperts.map((av, idx) => (
          <View key={idx} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>{av.auteur.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.reviewAuthor}>{av.auteur}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: theme.colors.star, fontSize: 12 }}>{'★'.repeat(av.note)}</Text>
                  <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginLeft: 4 }}>{av.date}</Text>
                </View>
              </View>
            </View>
            <Text style={styles.reviewText}>{av.texte}</Text>
          </View>
        ))}
      </View>

      {/* Booking Card */}
      <View style={styles.bookingCard}>
        <Text style={styles.bookingPrice}>
          {logement.prix} DZD <Text style={styles.bookingUnit}>/ nuit</Text>
        </Text>

        <View style={styles.bookingDetails}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.bookingLabel}>{prixNuit} DZD x {nuits} nuit</Text>
            <Text style={styles.bookingValue}>{sousTotal} DZD</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={styles.bookingLabel}>Frais de service algbnb</Text>
            <Text style={styles.bookingValue}>{frais} DZD</Text>
          </View>
          <View style={styles.bookingDivider} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.bookingTotal}>Total</Text>
            <Text style={styles.bookingTotal}>{total} DZD</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.reserveBtn}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Paiement', {
            logement, nuits, sousTotal, frais, total, voyageurs,
            dateArrivee: '2026-06-01', dateDepart: '2026-06-02'
          })}
        >
          <Text style={styles.reserveBtnText}>Réserver</Text>
        </TouchableOpacity>
        <Text style={styles.bookingNote}>Aucun montant ne sera débité pour le moment</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 algbnb. Tous droits réservés.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgMain },
  actionsRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.s, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionText: { fontSize: theme.fontSize.bodySm, fontWeight: '600', color: theme.colors.onSurfaceVariant },
  photoContainer: { width: '100%', height: 300, borderRadius: theme.radius.lg, overflow: 'hidden', marginBottom: theme.spacing.m, paddingHorizontal: theme.spacing.m },
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
  hostStatLabel: { fontSize: 10, color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionTitle: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface, marginBottom: theme.spacing.m },
  descriptionText: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurfaceVariant, lineHeight: 26 },
  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  equipItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%', paddingVertical: 8 },
  equipText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  reviewCard: { backgroundColor: theme.colors.surfaceLow, borderRadius: theme.radius.lg, padding: theme.spacing.m, marginBottom: theme.spacing.s },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: theme.spacing.s },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.primaryContainer, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { fontWeight: '700', color: theme.colors.onPrimary, fontSize: theme.fontSize.bodySm },
  reviewAuthor: { fontSize: theme.fontSize.bodyMd, fontWeight: '600', color: theme.colors.onSurface },
  reviewText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, lineHeight: 22 },
  bookingCard: { margin: theme.spacing.m, padding: theme.spacing.m, backgroundColor: theme.colors.surfaceLowest, borderRadius: theme.radius.lg, ...theme.shadow.ambient },
  bookingPrice: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface, marginBottom: theme.spacing.m },
  bookingUnit: { fontSize: theme.fontSize.bodyMd, fontWeight: '400', color: theme.colors.onSurfaceVariant },
  bookingDetails: { marginBottom: theme.spacing.m },
  bookingLabel: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, textDecorationLine: 'underline' },
  bookingValue: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurface },
  bookingDivider: { height: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: theme.spacing.s, opacity: 0.3 },
  bookingTotal: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  reserveBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center', marginBottom: theme.spacing.s },
  reserveBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 17 },
  bookingNote: { textAlign: 'center', fontSize: 13, color: theme.colors.onSurfaceVariant },
  footer: { padding: theme.spacing.l, alignItems: 'center' },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
});
