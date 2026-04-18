import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';

export const PageCreerAnnonce = () => {
  const navigation = useNavigation();
  const [chambres, setChambres] = useState(2);
  const [lits, setLits] = useState(3);
  const [sallesDeBain, setSallesDeBain] = useState(1);
  const [voyageurs, setVoyageurs] = useState(4);
  const [equipements, setEquipements] = useState({ wifi: false, cuisine: false, piscine: false, parking: false });

  const toggleEquipement = (key) => setEquipements(prev => ({ ...prev, [key]: !prev[key] }));

  const Counter = ({ label, value, setValue }) => (
    <View style={styles.counterRow}>
      <Text style={styles.counterLabel}>{label}</Text>
      <View style={styles.counterControls}>
        <TouchableOpacity
          onPress={() => setValue(Math.max(0, value - 1))}
          style={[styles.counterBtn, value === 0 && { opacity: 0.4 }]}
          disabled={value === 0}
        >
          <Text style={styles.counterBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value}</Text>
        <TouchableOpacity onPress={() => setValue(value + 1)} style={styles.counterBtn}>
          <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Publiez votre logement</Text>
        <Text style={styles.subtitle}>Créez une annonce d'exception en quelques étapes.</Text>
      </View>

      <View style={styles.formCard}>
        {/* Informations générales */}
        <Text style={styles.sectionTitle}>Informations générales</Text>
        <TextInput
          placeholder="Titre de l'annonce (ex: Villa de rêve avec vue mer)"
          placeholderTextColor={theme.colors.onSurfaceVariant}
          style={styles.input}
        />
        <TextInput
          placeholder="Description détaillée de votre bien..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          multiline
          numberOfLines={4}
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        />

        {/* Type selector */}
        <View style={styles.typeOptions}>
          {['Appartement', 'Maison / Villa', 'Chambre privée'].map(type => (
            <TouchableOpacity key={type} style={styles.typeChip}>
              <Text style={styles.typeChipText}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Configuration */}
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>Capacité et Configuration</Text>
        <View style={styles.countersContainer}>
          <Counter label="Capacité d'accueil (voyageurs)" value={voyageurs} setValue={setVoyageurs} />
          <Counter label="Chambres" value={chambres} setValue={setChambres} />
          <Counter label="Lits" value={lits} setValue={setLits} />
          <Counter label="Salles de bain" value={sallesDeBain} setValue={setSallesDeBain} />
        </View>

        {/* Équipements */}
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>Équipements inclus</Text>
        <View style={styles.equipRow}>
          {Object.keys(equipements).map(eq => (
            <TouchableOpacity
              key={eq}
              onPress={() => toggleEquipement(eq)}
              style={[styles.equipChip, equipements[eq] && styles.equipChipActive]}
            >
              {equipements[eq] && <Text style={{ fontSize: 14 }}>✓</Text>}
              <Text style={[styles.equipChipText, equipements[eq] && { color: theme.colors.onPrimaryContainer, fontWeight: '700' }]}>
                {eq}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Localisation */}
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>Localisation</Text>
        <View style={styles.locationInput}>
          <Text style={{ fontSize: 20 }}>📍</Text>
          <TextInput
            placeholder="Adresse complète"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={{ flex: 1, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface }}
          />
        </View>

        {/* Photos */}
        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>Photos</Text>
        <TouchableOpacity style={styles.photoZone} onPress={() => Alert.alert('Photos', "Simulation d'ouverture de l'explorateur de fichiers")} activeOpacity={0.7}>
          <Text style={{ fontSize: 40, marginBottom: theme.spacing.s }}>📷</Text>
          <Text style={styles.photoText}>Cliquez pour ajouter des photos</Text>
          <Text style={styles.photoHint}>PNG, JPG, au moins 1024x768px</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.publishBtn}
          onPress={() => { Alert.alert('Succès', 'Annonce créée avec succès !'); navigation.navigate('Dashboard Hôte'); }}
          activeOpacity={0.8}
        >
          <Text style={styles.publishBtnText}>Publier l'annonce</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2026 algbnb. Tous droits réservés.</Text>
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

  formCard: {
    backgroundColor: theme.colors.surfaceLowest, padding: theme.spacing.l, borderRadius: theme.radius.lg,
    marginHorizontal: theme.spacing.m, ...theme.shadow.ambient,
  },
  sectionTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.onSurface },
  input: {
    borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: theme.fontSize.bodyMd,
    color: theme.colors.onSurface, marginBottom: theme.spacing.s,
  },
  typeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: theme.spacing.xs },
  typeChip: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 8, paddingHorizontal: 16 },
  typeChipText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurface },

  countersContainer: { borderWidth: 1, borderColor: theme.colors.surfaceHigh, borderRadius: theme.radius.md, paddingHorizontal: theme.spacing.m },
  counterRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: theme.spacing.m, borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh,
  },
  counterLabel: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface },
  counterControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: theme.colors.surfaceLow,
    alignItems: 'center', justifyContent: 'center',
  },
  counterBtnText: { fontSize: 18, fontWeight: '500', color: theme.colors.onSurface },
  counterValue: { fontSize: 18, fontWeight: '700', minWidth: 20, textAlign: 'center', color: theme.colors.onSurface },

  equipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  equipChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: theme.radius.full,
    borderWidth: 1, borderColor: theme.colors.outlineVariant,
  },
  equipChipActive: { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary, borderWidth: 2 },
  equipChipText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, textTransform: 'capitalize' },

  locationInput: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md,
    paddingHorizontal: 16, paddingVertical: 12,
  },

  photoZone: {
    borderWidth: 2, borderStyle: 'dashed', borderColor: theme.colors.surfaceHigh, borderRadius: theme.radius.lg,
    padding: theme.spacing.xl, alignItems: 'center', backgroundColor: theme.colors.surfaceLow,
  },
  photoText: { fontWeight: '700', color: theme.colors.onSurfaceVariant },
  photoHint: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, marginTop: 4 },

  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: theme.spacing.m, marginTop: theme.spacing.l },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: theme.colors.onSurface, fontSize: theme.fontSize.bodyMd },
  publishBtn: { flex: 2, backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center' },
  publishBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodyMd },

  footer: { padding: theme.spacing.l, alignItems: 'center', gap: 4 },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
});
