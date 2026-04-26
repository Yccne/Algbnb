import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logementController } from '@algbnb/controller-client';
import { theme } from '../styles/theme';

const availableEquipements = ['Wi-Fi', 'Cuisine equipee', 'Climatisation', 'Piscine', 'Parking', 'Television'];

export const PageCreerAnnonce = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    titre: '',
    description: '',
    type_logement: 'appartement',
    adresse: '',
    ville: '',
    pays: 'Algerie',
    latitude: '',
    longitude: '',
    nb_chambres: '1',
    nb_lits: '1',
    nb_salles_de_bain: '1',
    capacite_accueil: '1',
    prix_par_nuit: '5000',
    mode_reservation: 'sur_approbation',
    politique_annulation: 'moderee',
    regles_maison: '',
    photo_urls_text: '',
    equipements: [],
  });

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const toggleEquipement = (value) =>
    setForm((current) => ({
      ...current,
      equipements: current.equipements.includes(value)
        ? current.equipements.filter((item) => item !== value)
        : [...current.equipements, value],
    }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      await logementController.creerLogement({
        ...form,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        nb_chambres: Number(form.nb_chambres),
        nb_lits: Number(form.nb_lits),
        nb_salles_de_bain: Number(form.nb_salles_de_bain),
        capacite_accueil: Number(form.capacite_accueil),
        prix_par_nuit: Number(form.prix_par_nuit),
        photo_urls: form.photo_urls_text
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      });

      Alert.alert('Annonce creee', "L'annonce a bien ete enregistree.", [{ text: 'OK', onPress: () => navigation.navigate('Dashboard Hôte') }]);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.displayTitle}>Publier votre logement</Text>
        <Text style={styles.subtitle}>
          Version mobile branchee a la vraie API. Vous pouvez renseigner les coordonnees geographiques et des URLs d'images pour la demo.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Informations generales</Text>
        <TextInput placeholder="Titre" style={styles.input} value={form.titre} onChangeText={(value) => updateField('titre', value)} />
        <TextInput placeholder="Description" multiline numberOfLines={4} style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={form.description} onChangeText={(value) => updateField('description', value)} />
        <TextInput placeholder="Type de logement" style={styles.input} value={form.type_logement} onChangeText={(value) => updateField('type_logement', value)} />

        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>Adresse geolocalisee</Text>
        <TextInput placeholder="Adresse" style={styles.input} value={form.adresse} onChangeText={(value) => updateField('adresse', value)} />
        <TextInput placeholder="Ville" style={styles.input} value={form.ville} onChangeText={(value) => updateField('ville', value)} />
        <TextInput placeholder="Latitude" keyboardType="numeric" style={styles.input} value={String(form.latitude)} onChangeText={(value) => updateField('latitude', value)} />
        <TextInput placeholder="Longitude" keyboardType="numeric" style={styles.input} value={String(form.longitude)} onChangeText={(value) => updateField('longitude', value)} />
        <TextInput
          placeholder="URLs de photos separees par des virgules"
          style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
          multiline
          value={form.photo_urls_text}
          onChangeText={(value) => updateField('photo_urls_text', value)}
        />

        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>Capacite et prix</Text>
        <TextInput placeholder="Capacite d'accueil" keyboardType="numeric" style={styles.input} value={form.capacite_accueil} onChangeText={(value) => updateField('capacite_accueil', value)} />
        <TextInput placeholder="Chambres" keyboardType="numeric" style={styles.input} value={form.nb_chambres} onChangeText={(value) => updateField('nb_chambres', value)} />
        <TextInput placeholder="Lits" keyboardType="numeric" style={styles.input} value={form.nb_lits} onChangeText={(value) => updateField('nb_lits', value)} />
        <TextInput placeholder="Salles de bain" keyboardType="numeric" style={styles.input} value={form.nb_salles_de_bain} onChangeText={(value) => updateField('nb_salles_de_bain', value)} />
        <TextInput placeholder="Prix / nuit" keyboardType="numeric" style={styles.input} value={form.prix_par_nuit} onChangeText={(value) => updateField('prix_par_nuit', value)} />

        <Text style={[styles.sectionTitle, { marginTop: theme.spacing.l }]}>Equipements</Text>
        <View style={styles.equipRow}>
          {availableEquipements.map((eq) => (
            <TouchableOpacity key={eq} onPress={() => toggleEquipement(eq)} style={[styles.equipChip, form.equipements.includes(eq) && styles.equipChipActive]}>
              <Text style={[styles.equipChipText, form.equipements.includes(eq) && { color: theme.colors.onPrimaryContainer, fontWeight: '700' }]}>{eq}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.publishBtn, loading && { opacity: 0.6 }]} onPress={handleSubmit} activeOpacity={0.8} disabled={loading}>
          <Text style={styles.publishBtnText}>{loading ? 'Publication...' : "Publier l'annonce"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, marginBottom: theme.spacing.s },
  subtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, lineHeight: 22 },
  formCard: { backgroundColor: theme.colors.surfaceLowest, padding: theme.spacing.l, borderRadius: theme.radius.lg, marginHorizontal: theme.spacing.m, ...theme.shadow.ambient },
  sectionTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.s, color: theme.colors.onSurface },
  input: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, marginBottom: theme.spacing.s },
  equipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  equipChip: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.outlineVariant },
  equipChipActive: { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary, borderWidth: 2 },
  equipChipText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant },
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: theme.spacing.m, marginTop: theme.spacing.l },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: theme.colors.onSurface, fontSize: theme.fontSize.bodyMd },
  publishBtn: { flex: 2, backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center' },
  publishBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodyMd },
  errorBox: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m, marginTop: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
});
