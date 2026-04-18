import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Dimensions, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logementController } from '@algbnb/core';
import { LogementCard } from '../components/LogementCard';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const categories = [
  { label: 'Villas', emoji: '🏡' },
  { label: 'Maisons traditionnelles', emoji: '🏛️' },
  { label: 'Appartements', emoji: '🏙️' },
  { label: 'Bord de mer', emoji: '🌊' },
  { label: 'Sahara', emoji: '🐪' },
  { label: 'Luxe', emoji: '✨' },
];

export const PageAccueil = () => {
  const navigation = useNavigation();
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lieu, setLieu] = useState('');

  useEffect(() => {
    const fetchLogements = async () => {
      setLoading(true);
      try {
        const data = await logementController.getLogements();
        setLogements(data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchLogements();
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      
      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>L'art de séjourner{'\n'}en toute sérénité.</Text>
        <Text style={styles.heroSubtitle}>
          Découvrez des demeures d'exception, curatées pour leur caractère unique et leur confort absolu.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchField}>
          <Text style={styles.searchIcon}>📍</Text>
          <TextInput
            placeholder="Où allez-vous ?"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={lieu}
            onChangeText={setLieu}
            style={styles.searchInput}
          />
        </View>
        <View style={[styles.searchField, { borderLeftWidth: 1, borderLeftColor: theme.colors.surfaceHigh }]}>
          <Text style={styles.searchIcon}>📅</Text>
          <TextInput
            placeholder="Arrivée - Départ"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => navigation.navigate('Resultats')}
          activeOpacity={0.8}
        >
          <Text style={styles.searchButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContainer}>
        {categories.map((cat, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.chip}
            onPress={() => navigation.navigate('Resultats')}
            activeOpacity={0.7}
          >
            <Text style={styles.chipEmoji}>{cat.emoji}</Text>
            <Text style={styles.chipText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Popular Listings */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Logements populaires</Text>
          <Text style={styles.sectionSubtitle}>Les escapades les plus prisées par notre communauté.</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Resultats')}>
          <Text style={styles.seeAll}>Voir tout →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
      ) : (
        <View style={styles.listings}>
          {logements.slice(0, 3).map((logement) => (
            <LogementCard
              key={logement.id}
              logement={logement}
              onPress={() => navigation.navigate('Logement', { logementId: logement.id })}
            />
          ))}
        </View>
      )}

      {/* Value Props */}
      <View style={styles.valuePropsContainer}>
        <Text style={styles.valuePropsTitle}>Pourquoi choisir algbnb ?</Text>
        
        <View style={styles.valueProp}>
          <View style={styles.valuePropIcon}>
            <Text style={{ fontSize: 24 }}>🛡️</Text>
          </View>
          <Text style={styles.valuePropTitle}>Hôtes Certifiés</Text>
          <Text style={styles.valuePropText}>Chaque hôte passe un entretien rigoureux pour garantir un accueil d'exception.</Text>
        </View>

        <View style={styles.valueProp}>
          <View style={styles.valuePropIcon}>
            <Text style={{ fontSize: 24 }}>✨</Text>
          </View>
          <Text style={styles.valuePropTitle}>Expériences Locales</Text>
          <Text style={styles.valuePropText}>Accédez à des activités secrètes et authentiques recommandées par vos hôtes.</Text>
        </View>

        <View style={styles.valueProp}>
          <View style={styles.valuePropIcon}>
            <Text style={{ fontSize: 24 }}>⭐</Text>
          </View>
          <Text style={styles.valuePropTitle}>Sans Commission</Text>
          <Text style={styles.valuePropText}>Plateforme locale sans frais de commission, des tarifs justes pour tous.</Text>
        </View>
      </View>

      {/* Testimonial */}
      <View style={styles.testimonial}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80' }}
          style={styles.testimonialAvatar}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.testimonialQuote}>"Ma priorité est que chaque voyageur se sente comme chez lui, avec une touche de luxe en plus."</Text>
          <Text style={styles.testimonialAuthor}>Jean-Marc <Text style={styles.testimonialSince}>— Super Hôte depuis 5 ans</Text></Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 algbnb. Tous droits réservés.</Text>
      </View>
    </ScrollView>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgMain,
  },
  content: {
    paddingBottom: 100,
  },
  hero: {
    paddingHorizontal: theme.spacing.m,
    paddingTop: theme.spacing.xxl,
    paddingBottom: theme.spacing.l,
  },
  heroTitle: {
    fontSize: theme.fontSize.displayLg,
    fontWeight: '700',
    color: theme.colors.onSurface,
    lineHeight: 46,
    letterSpacing: -1.2,
    marginBottom: theme.spacing.s,
  },
  heroSubtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.titleLg,
    fontWeight: '400',
    lineHeight: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.full,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.l,
    paddingHorizontal: theme.spacing.s,
    paddingVertical: theme.spacing.xs,
    ...theme.shadow.ambient,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon: {
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.onSurface,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 18,
  },
  chipScroll: {
    marginBottom: theme.spacing.l,
  },
  chipContainer: {
    paddingHorizontal: theme.spacing.m,
    gap: 10,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceLow,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipText: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: theme.fontSize.headlineMd,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  sectionSubtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.bodySm,
    marginTop: 4,
  },
  seeAll: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: theme.fontSize.bodySm,
  },
  listings: {
    paddingHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  valuePropsContainer: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.lg,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.xl,
  },
  valuePropsTitle: {
    fontSize: theme.fontSize.headlineMd,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.l,
    color: theme.colors.onSurface,
  },
  valueProp: {
    alignItems: 'center',
    paddingVertical: theme.spacing.m,
  },
  valuePropIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.s,
  },
  valuePropTitle: {
    fontSize: theme.fontSize.titleLg,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
    color: theme.colors.onSurface,
  },
  valuePropText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.bodySm,
    textAlign: 'center',
    lineHeight: 22,
  },
  testimonial: {
    flexDirection: 'row',
    padding: theme.spacing.m,
    backgroundColor: theme.colors.surfaceLowest,
    borderRadius: theme.radius.lg,
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
    gap: 16,
    ...theme.shadow.sm,
  },
  testimonialAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: theme.colors.primaryContainer,
  },
  testimonialQuote: {
    fontStyle: 'italic',
    fontSize: theme.fontSize.bodyMd,
    lineHeight: 22,
    marginBottom: theme.spacing.xs,
    color: theme.colors.onSurface,
  },
  testimonialAuthor: {
    fontWeight: '600',
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.onSurface,
  },
  testimonialSince: {
    fontWeight: '400',
    color: theme.colors.onSurfaceVariant,
  },
  footer: {
    paddingVertical: theme.spacing.l,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
});
