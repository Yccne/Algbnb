import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logementController } from '@algbnb/core';
import { LogementCard } from '../components/LogementCard';
import { theme } from '../styles/theme';

export const PageFavoris = () => {
  const navigation = useNavigation();
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const all = await logementController.getLogements();
      setLogements(all.slice(0, 2)); // Simulate 2 favorites
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Favoris</Text>
        <Text style={styles.subtitle}>Vos logements préférés, toujours à portée de main.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
      ) : logements.length > 0 ? (
        <View style={styles.listings}>
          {logements.map(logement => (
            <LogementCard
              key={logement.id}
              logement={logement}
              onPress={() => navigation.navigate('Logement', { logementId: logement.id })}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: theme.spacing.s }}>♡</Text>
          <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
          <Text style={styles.emptyText}>Parcourez nos logements et ajoutez vos coups de cœur ici.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Root', { screen: 'Accueil' })} activeOpacity={0.8}>
            <Text style={styles.exploreBtnText}>Explorer les logements</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Confidentialité  ·  Conditions  ·  Aide</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, letterSpacing: -0.5, marginBottom: theme.spacing.s },
  subtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, lineHeight: 22 },
  listings: { paddingHorizontal: theme.spacing.m },
  emptyState: { alignItems: 'center', paddingVertical: theme.spacing.xxl, paddingHorizontal: theme.spacing.l },
  emptyTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.onSurface },
  emptyText: { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: theme.spacing.l },
  exploreBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 14, paddingHorizontal: 28 },
  exploreBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodyMd },
  footer: { padding: theme.spacing.l, alignItems: 'center' },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
});
