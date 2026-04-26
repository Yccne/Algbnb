import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { reservationController } from '@algbnb/controller-client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

const fallbackImage = 'https://placehold.co/300x300?text=Reservation';

export const PageMesReservations = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await reservationController.getReservationsVoyageur();
        setReservations(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Voyages</Text>
        <Text style={styles.subtitle}>Réservations réelles enregistrées dans la base.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
      ) : !user ? (
        <View style={styles.emptyCta}>
          <Text style={styles.emptyTitle}>Connexion requise</Text>
          <Text style={styles.emptyText}>Connecte-toi pour voir tes réservations.</Text>
        </View>
      ) : (
        <View style={styles.listings}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {reservations.map((res) => (
            <TouchableOpacity key={res.id} style={styles.reservationCard} onPress={() => navigation.navigate('Logement', { logementId: res.id_logement })} activeOpacity={0.8}>
              <Image source={{ uri: res.photos?.[0] || fallbackImage }} style={styles.reservationImage} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reservationTitle}>{res.titre}</Text>
                <View style={styles.dateRow}>
                  <Text style={{ fontSize: 14 }}>📅</Text>
                  <Text style={styles.reservationDate}>{res.date_arrivee} → {res.date_depart}</Text>
                </View>
                <Text style={styles.reservationDetails}>{res.nb_voyageurs} voyageur{res.nb_voyageurs > 1 ? 's' : ''} · {res.ville}</Text>
                <Text style={styles.reservationDetails}>Statut : {res.statut}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {reservations.length === 0 ? (
            <View style={styles.emptyCta}>
              <Text style={styles.emptyTitle}>Aucune réservation pour le moment</Text>
              <Text style={styles.emptyText}>Quand une réservation est créée, elle apparaîtra ici.</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Root', { screen: 'Accueil' })} activeOpacity={0.8}>
                <Text style={styles.exploreBtnText}>Explorer</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.xl },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, marginBottom: theme.spacing.s },
  subtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, lineHeight: 22 },
  listings: { paddingHorizontal: theme.spacing.m },
  reservationCard: { flexDirection: 'row', gap: 16, paddingBottom: theme.spacing.l, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh, marginBottom: theme.spacing.l },
  reservationImage: { width: 80, height: 80, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceHigh },
  reservationTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', color: theme.colors.onSurface, marginBottom: theme.spacing.xs },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  reservationDate: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodySm },
  reservationDetails: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodySm },
  emptyCta: { marginTop: theme.spacing.l, backgroundColor: theme.colors.surfaceLowest, padding: theme.spacing.l, borderRadius: theme.radius.lg, alignItems: 'center' },
  emptyTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.onSurface, textAlign: 'center' },
  emptyText: { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: theme.spacing.l, lineHeight: 22 },
  exploreBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 14, paddingHorizontal: 28 },
  exploreBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodyMd },
  errorBox: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m, marginBottom: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
});
