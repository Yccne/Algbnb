import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { reservationController } from '@algbnb/core';
import { theme } from '../styles/theme';

export const PagePaiement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);

  const reservationData = route.params || {
    logement: { id: 1, titre: 'Dar El Dey - Casbah', prix: 18000 },
    dateArrivee: '2026-06-01',
    dateDepart: '2026-06-05',
    voyageurs: 2,
    nuits: 4,
    sousTotal: 72000,
    frais: 8640,
    total: 80640,
  };

  const { logement, dateArrivee, dateDepart, voyageurs, nuits, sousTotal, frais, total } = reservationData;

  const handlePayment = async () => {
    setLoading(true);
    try {
      await reservationController.reserver({
        logementId: logement.id,
        voyageurId: 2,
        dateArrivee,
        dateDepart,
        total,
      });
      Alert.alert('Succès', 'Réservation confirmée ! Vous allez être redirigé vers vos voyages.', [
        { text: 'OK', onPress: () => navigation.navigate('Root', { screen: 'Réservations' }) }
      ]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.displayTitle}>Confirmer et payer</Text>

      {/* Details Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Détails du voyage</Text>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Logement</Text>
          <Text style={styles.detailValue}>{logement.titre}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Dates</Text>
          <Text style={styles.detailValue}>{dateArrivee} - {dateDepart}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Voyageurs</Text>
          <Text style={styles.detailValue}>{voyageurs} voyageur{voyageurs > 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{logement.prix} DZD x {nuits} {nuits > 1 ? 'nuits' : 'nuit'}</Text>
          <Text style={styles.detailValue}>{sousTotal} DZD</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frais de service algbnb</Text>
          <Text style={styles.detailValue}>{frais} DZD</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>{total} DZD</Text>
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.6 }]}
          onPress={handlePayment}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.payBtnText}>{loading ? 'Traitement en cours...' : 'Confirmer et payer'}</Text>
        </TouchableOpacity>

        {/* Secure Badge */}
        <View style={styles.secureBadge}>
          <Text style={{ fontSize: 14 }}>🛡️</Text>
          <Text style={styles.secureText}>Paiement sécurisé et crypté</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Confidentialité  ·  Conditions  ·  Aide</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { padding: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: 100 },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, letterSpacing: -0.5, marginBottom: theme.spacing.l },
  card: {
    backgroundColor: theme.colors.surfaceLowest,
    padding: theme.spacing.l,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  cardTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.m, color: theme.colors.onSurface },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.s },
  detailLabel: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd },
  detailValue: { fontWeight: '700', fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: theme.colors.surfaceHigh, marginVertical: theme.spacing.m },
  totalLabel: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  payBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center', marginTop: theme.spacing.l },
  payBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 17 },
  secureBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: theme.spacing.s },
  secureText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  footer: { paddingVertical: theme.spacing.l, alignItems: 'center' },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
});
