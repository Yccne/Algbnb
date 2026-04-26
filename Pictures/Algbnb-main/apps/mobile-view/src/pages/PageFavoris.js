import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { favorisController } from '@algbnb/core';
import { useAuth } from '../context/AuthContext';
import { LogementCard } from '../components/LogementCard';
import { theme } from '../styles/theme';

export const PageFavoris = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setLogements([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await favorisController.getFavoris();
        setLogements(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Favoris</Text>
        <Text style={styles.subtitle}>Vos logements preferes, sauvegardes dans votre compte.</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : !user ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: theme.spacing.s }}>♡</Text>
          <Text style={styles.emptyTitle}>Connectez-vous pour voir vos favoris</Text>
          <Text style={styles.emptyText}>Les favoris sont maintenant enregistres en base et relies a votre compte.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Connexion')} activeOpacity={0.8}>
            <Text style={styles.exploreBtnText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      ) : logements.length > 0 ? (
        <View style={styles.listings}>
          {logements.map((logement) => (
            <LogementCard
              key={logement.id}
              logement={logement}
              initialFavorite
              onFavoriteChange={(next) => {
                if (!next) {
                  setLogements((current) => current.filter((item) => item.id !== logement.id));
                }
              }}
              onPress={() => navigation.navigate('Logement', { logementId: logement.id })}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, marginBottom: theme.spacing.s }}>♡</Text>
          <Text style={styles.emptyTitle}>Aucun favori pour le moment</Text>
          <Text style={styles.emptyText}>Parcourez les annonces et enregistrez vos logements preferes ici.</Text>
          <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Root', { screen: 'Accueil' })} activeOpacity={0.8}>
            <Text style={styles.exploreBtnText}>Explorer les logements</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>Confidentialite · Conditions · Aide</Text>
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
  emptyTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.onSurface, textAlign: 'center' },
  emptyText: { color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: theme.spacing.l },
  exploreBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 14, paddingHorizontal: 28 },
  exploreBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodyMd },
  errorBox: { marginHorizontal: theme.spacing.m, backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
  footer: { padding: theme.spacing.l, alignItems: 'center' },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
});
