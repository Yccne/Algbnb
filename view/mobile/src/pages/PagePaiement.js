import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { reservationController } from '@algbnb/controller-client';
import { theme } from '../styles/theme';

export const PagePaiement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reservationData = route.params;
  if (!reservationData) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Aucune réservation en préparation.</Text>
      </View>
    );
  }

  const { logement, dateArrivee, dateDepart, voyageurs, nuits, sousTotal, frais, total } = reservationData;

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      await reservationController.creerReservation({
        id_logement: logement.id,
        date_arrivee: dateArrivee,
        date_depart: dateDepart,
        nb_voyageurs: voyageurs,
      });
      Alert.alert('Réservation créée', 'La réservation a bien été enregistrée.', [
        { text: 'OK', onPress: () => navigation.navigate('Root', { screen: 'Réservations' }) },
      ]);
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.displayTitle}>Confirmer la réservation</Text>

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
          <Text style={styles.detailValue}>{voyageurs}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>{logement.prix} DZD x {nuits} nuit{nuits > 1 ? 's' : ''}</Text>
          <Text style={styles.detailValue}>{sousTotal} DZD</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frais de service</Text>
          <Text style={styles.detailValue}>{frais} DZD</Text>
        </View>

        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalLabel}>{total} DZD</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.payBtn, loading && { opacity: 0.6 }]} onPress={handlePayment} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.payBtnText}>{loading ? 'Création...' : 'Confirmer'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { padding: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: 100 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.bgMain },
  emptyText: { color: theme.colors.onSurfaceVariant },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, marginBottom: theme.spacing.l },
  card: { backgroundColor: theme.colors.surfaceLowest, padding: theme.spacing.l, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.outlineVariant },
  cardTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.m, color: theme.colors.onSurface },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.s, gap: 16 },
  detailLabel: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, flex: 1 },
  detailValue: { fontWeight: '700', fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: theme.colors.surfaceHigh, marginVertical: theme.spacing.m },
  totalLabel: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  payBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center', marginTop: theme.spacing.l },
  payBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 17 },
  errorBox: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m, marginTop: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
});
