import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

const reservations = [
  {
    id: 1,
    titre: 'Dar El Dey - Casbah',
    dates: '12 - 18 Juillet 2026',
    details: '2 voyageurs · Alger, Algérie',
    logementId: 1,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80',
  },
  {
    id: 2,
    titre: 'Villa Oranaise avec Piscine',
    dates: '24 - 27 Décembre 2026',
    details: '4 voyageurs · Oran, Algérie',
    logementId: 2,
    image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=300&q=80',
  },
];

export const PageMesReservations = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Voyages</Text>
        <Text style={styles.subtitle}>Gérez vos réservations passées et à venir.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
      ) : (
        <View style={styles.listings}>
          {reservations.map(res => (
            <TouchableOpacity
              key={res.id}
              style={styles.reservationCard}
              onPress={() => navigation.navigate('Logement', { logementId: res.logementId })}
              activeOpacity={0.8}
            >
              <Image source={{ uri: res.image }} style={styles.reservationImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reservationTitle}>{res.titre}</Text>
                <View style={styles.dateRow}>
                  <Text style={{ fontSize: 14 }}>📅</Text>
                  <Text style={styles.reservationDate}>{res.dates}</Text>
                </View>
                <Text style={styles.reservationDetails}>{res.details}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Empty state CTA */}
          <View style={styles.emptyCta}>
            <Text style={styles.emptyTitle}>Aucune réservation pour le moment.</Text>
            <Text style={styles.emptyText}>Il est temps de dépoussiérer vos valises et de commencer à planifier votre prochaine aventure.</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Root', { screen: 'Accueil' })} activeOpacity={0.8}>
              <Text style={styles.exploreBtnText}>Commencer l'exploration</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 algbnb - Curateur Digital</Text>
        <Text style={styles.footerText}>Confidentialité  ·  Conditions  ·  Assistance</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xl },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, letterSpacing: -0.5, marginBottom: theme.spacing.s },
  subtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, lineHeight: 22 },
  listings: { paddingHorizontal: theme.spacing.m },
  reservationCard: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: theme.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceHigh,
    marginBottom: theme.spacing.l,
  },
  reservationImage: { width: 80, height: 80, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceHigh },
  reservationTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface, marginBottom: theme.spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reservationDate: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodySm },
  reservationDetails: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodySm },
  emptyCta: {
    marginTop: theme.spacing.l,
    backgroundColor: theme.colors.surfaceLowest,
    padding: theme.spacing.l,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.onSurface, textAlign: 'center' },
  emptyText: { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: theme.spacing.l, lineHeight: 22 },
  exploreBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 14, paddingHorizontal: 28 },
  exploreBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodyMd },
  footer: { padding: theme.spacing.l, alignItems: 'center', gap: 4 },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
});
