import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { logementController } from '@algbnb/core';
import { LogementCard } from '../components/LogementCard';
import { theme } from '../styles/theme';

export const PageResultats = () => {
  const navigation = useNavigation();
  const [logements, setLogements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredLogements, setFilteredLogements] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const [filters, setFilters] = useState({
    prixMin: '',
    prixMax: '',
    type: '',
    chambres: '',
    lits: '',
    bienNote: false,
    annulationGratuite: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await logementController.getLogements();
      setLogements(data);
      setFilteredLogements(data);
      setLoading(false);
    };
    fetchData();
  }, []);

  const applyFilters = () => {
    let filtered = [...logements];
    if (filters.prixMin) filtered = filtered.filter(l => l.prix >= parseInt(filters.prixMin));
    if (filters.prixMax) filtered = filtered.filter(l => l.prix <= parseInt(filters.prixMax));
    if (filters.type) filtered = filtered.filter(l => l.type.toLowerCase().includes(filters.type.toLowerCase()));
    if (filters.chambres) filtered = filtered.filter(l => l.chambres >= parseInt(filters.chambres));
    if (filters.lits) filtered = filtered.filter(l => l.lits >= parseInt(filters.lits));
    if (filters.bienNote) filtered = filtered.filter(l => l.note >= 4.5);
    if (filters.annulationGratuite) filtered = filtered.filter(l => l.equipements?.includes('Annulation gratuite'));
    setFilteredLogements(filtered);
    setIsFilterModalOpen(false);
  };

  const clearFilters = () => {
    setFilters({ prixMin: '', prixMax: '', type: '', chambres: '', lits: '', bienNote: false, annulationGratuite: false });
    setFilteredLogements(logements);
    setIsFilterModalOpen(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.displayTitle}>
            {filteredLogements.length} logements trouvés{'\n'}en Algérie
          </Text>
          <Text style={styles.subtitle}>
            Plus de {logements.length} logements pour votre séjour idéal en Algérie.
          </Text>
        </View>

        {/* Filter Button */}
        <TouchableOpacity style={styles.filterBtn} onPress={() => setIsFilterModalOpen(true)} activeOpacity={0.8}>
          <Text style={styles.filterBtnText}>⚙️ Filtres</Text>
        </TouchableOpacity>

        {/* Listings */}
        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: theme.spacing.xl }} />
        ) : (
          <View style={styles.listings}>
            {filteredLogements.map(logement => (
              <LogementCard
                key={logement.id}
                logement={logement}
                onPress={() => navigation.navigate('Logement', { logementId: logement.id })}
              />
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Confidentialité  ·  Conditions  ·  Plan du site  ·  Assistance</Text>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <Modal visible={isFilterModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtres</Text>
                <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                  <Text style={{ fontSize: 24, color: theme.colors.onSurface }}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Prix */}
              <Text style={styles.filterSectionTitle}>Prix par nuit</Text>
              <View style={styles.priceRow}>
                <TextInput
                  placeholder="Min"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={filters.prixMin}
                  onChangeText={v => setFilters(prev => ({ ...prev, prixMin: v }))}
                  keyboardType="numeric"
                  style={styles.filterInput}
                />
                <Text style={{ color: theme.colors.onSurfaceVariant }}>—</Text>
                <TextInput
                  placeholder="Max"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={filters.prixMax}
                  onChangeText={v => setFilters(prev => ({ ...prev, prixMax: v }))}
                  keyboardType="numeric"
                  style={styles.filterInput}
                />
                <Text style={{ color: theme.colors.onSurfaceVariant }}>DZD</Text>
              </View>

              {/* Type */}
              <Text style={styles.filterSectionTitle}>Type de logement</Text>
              {['Appartement', 'Maison / Villa', 'Chambre', 'Chalet', "Maison d'hôtes"].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, filters.type === type && styles.typeOptionActive]}
                  onPress={() => setFilters(prev => ({ ...prev, type: prev.type === type ? '' : type }))}
                >
                  <Text style={[styles.typeOptionText, filters.type === type && { color: theme.colors.onPrimary }]}>{type}</Text>
                </TouchableOpacity>
              ))}

              {/* Capacité */}
              <Text style={styles.filterSectionTitle}>Capacité</Text>
              <View style={styles.priceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterLabel}>Chambres min</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={filters.chambres}
                    onChangeText={v => setFilters(prev => ({ ...prev, chambres: v }))}
                    keyboardType="numeric"
                    style={styles.filterInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.filterLabel}>Lits min</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    value={filters.lits}
                    onChangeText={v => setFilters(prev => ({ ...prev, lits: v }))}
                    keyboardType="numeric"
                    style={styles.filterInput}
                  />
                </View>
              </View>

              {/* Options */}
              <Text style={styles.filterSectionTitle}>Options spéciales</Text>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Bien noté (4.5+ étoiles)</Text>
                <Switch
                  value={filters.bienNote}
                  onValueChange={v => setFilters(prev => ({ ...prev, bienNote: v }))}
                  trackColor={{ true: theme.colors.primaryContainer }}
                  thumbColor={filters.bienNote ? theme.colors.primary : '#ccc'}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Annulation gratuite</Text>
                <Switch
                  value={filters.annulationGratuite}
                  onValueChange={v => setFilters(prev => ({ ...prev, annulationGratuite: v }))}
                  trackColor={{ true: theme.colors.primaryContainer }}
                  thumbColor={filters.annulationGratuite ? theme.colors.primary : '#ccc'}
                />
              </View>

              {/* Actions */}
              <View style={styles.filterActions}>
                <TouchableOpacity style={styles.btnOutline} onPress={clearFilters}>
                  <Text style={styles.btnOutlineText}>Tout effacer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={applyFilters}>
                  <Text style={styles.btnPrimaryText}>Afficher ({filteredLogements.length})</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgMain },
  content: { paddingBottom: 100 },
  header: { paddingHorizontal: theme.spacing.m, paddingTop: theme.spacing.l, paddingBottom: theme.spacing.l },
  displayTitle: { fontSize: theme.fontSize.displayMd, fontWeight: '700', color: theme.colors.onSurface, lineHeight: 38, letterSpacing: -0.5, marginBottom: theme.spacing.s },
  subtitle: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, lineHeight: 22 },
  filterBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: 'flex-start',
    marginLeft: theme.spacing.m,
    marginBottom: theme.spacing.l,
  },
  filterBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: theme.fontSize.bodySm },
  listings: { paddingHorizontal: theme.spacing.m },
  footer: { padding: theme.spacing.l, alignItems: 'center' },
  footerText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, textAlign: 'center' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: theme.colors.surfaceLowest, borderRadius: theme.radius.lg, padding: theme.spacing.l, width: '90%', maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.surfaceHigh, paddingBottom: theme.spacing.m, marginBottom: theme.spacing.m },
  modalTitle: { fontSize: theme.fontSize.headlineMd, fontWeight: '700', color: theme.colors.onSurface },
  filterSectionTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.s, marginTop: theme.spacing.m, color: theme.colors.onSurface },
  filterLabel: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurfaceVariant, marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filterInput: { flex: 1, borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface },
  typeOption: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.radius.full, borderWidth: 1, borderColor: theme.colors.outlineVariant, marginBottom: 8, alignSelf: 'flex-start' },
  typeOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  typeOptionText: { fontSize: theme.fontSize.bodySm, color: theme.colors.onSurface },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  switchLabel: { fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface },
  filterActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.l, paddingTop: theme.spacing.m, borderTopWidth: 1, borderTopColor: theme.colors.surfaceHigh, gap: 12 },
  btnOutline: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.full, paddingVertical: 12, paddingHorizontal: 20 },
  btnOutlineText: { fontWeight: '600', color: theme.colors.onSurface },
  btnPrimary: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 12, paddingHorizontal: 20, flex: 1, alignItems: 'center' },
  btnPrimaryText: { color: theme.colors.onPrimary, fontWeight: '600' },
});
