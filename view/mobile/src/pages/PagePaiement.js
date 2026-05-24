import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { paiementController, reservationController } from '@algbnb/controller-client';
import { theme } from '../styles/theme';

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const validateCard = (card) => {
  const errors = {};
  if (!/^\d{4} \d{4} \d{4} \d{4}$/.test(card.numero)) errors.numero = 'Numero invalide.';
  if (card.nom.trim().length < 2) errors.nom = 'Nom requis.';
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(card.expiry)) errors.expiry = 'Date invalide.';
  if (!/^\d{3}$/.test(card.cvv)) errors.cvv = 'CVV invalide.';
  if (!errors.expiry) {
    const [month, year] = card.expiry.split('/').map(Number);
    const now = new Date();
    if (new Date(2000 + year, month - 1) < new Date(now.getFullYear(), now.getMonth())) {
      errors.expiry = 'Carte expiree.';
    }
  }
  return errors;
};

export const PagePaiement = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [pendingReservation, setPendingReservation] = useState(null);
  const [card, setCard] = useState({ numero: '', nom: '', expiry: '', cvv: '' });

  const reservationData = route.params;
  if (!reservationData) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>Aucune reservation en preparation.</Text>
      </View>
    );
  }

  const { logement, dateArrivee, dateDepart, voyageurs, nuits, sousTotal, frais, total, modeReservation } =
    reservationData;
  const requiresApproval = modeReservation !== 'instantanee';

  const updateCard = (field, rawValue) => {
    let value = rawValue;
    if (field === 'numero') value = formatCardNumber(rawValue);
    if (field === 'expiry') value = formatExpiry(rawValue);
    if (field === 'cvv') value = rawValue.replace(/\D/g, '').slice(0, 3);
    if (field === 'nom') value = rawValue.toUpperCase().slice(0, 26);
    setCard((current) => ({ ...current, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handlePayment = async () => {
    const nextErrors = validateCard(card);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    setError('');
    try {
      const reservation =
        pendingReservation ||
        (await reservationController.creerReservation({
          id_logement: logement.id,
          date_arrivee: dateArrivee,
          date_depart: dateDepart,
          nb_voyageurs: voyageurs,
        }));
      setPendingReservation(reservation);

      const paiement = await paiementController.payerParDahabiya(reservation.id, {
        numero_carte: card.numero.replace(/\s/g, ''),
        nom_porteur: card.nom.trim(),
        date_expiration: card.expiry,
        cvv: card.cvv,
      });

      const ccpLine = logement.compte_ccp ? `\nCCP hote: ${logement.compte_ccp}` : '';
      Alert.alert(
        'Paiement accepte',
        `${requiresApproval ? 'Demande envoyee.' : 'Reservation confirmee.'}\nReference: ${paiement.reference}${ccpLine}`,
        [{ text: 'OK', onPress: () => navigation.navigate('Root') }],
      );
    } catch (paymentError) {
      setError(paymentError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.displayTitle}>Paiement Dahabiya</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details du voyage</Text>
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
          <Text style={styles.totalLabel}>Total a payer</Text>
          <Text style={styles.totalLabel}>{total} DZD</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Carte Dahabiya sandbox</Text>
        <Text style={styles.helpText}>Simulation uniquement. Aucun debit reel.</Text>
        <TextInput
          placeholder="0000 0000 0000 0000"
          keyboardType="numeric"
          style={[styles.input, fieldErrors.numero && styles.inputError]}
          value={card.numero}
          onChangeText={(value) => updateCard('numero', value)}
        />
        {fieldErrors.numero ? <Text style={styles.fieldError}>{fieldErrors.numero}</Text> : null}
        <TextInput
          placeholder="Nom du porteur"
          style={[styles.input, fieldErrors.nom && styles.inputError]}
          value={card.nom}
          onChangeText={(value) => updateCard('nom', value)}
        />
        {fieldErrors.nom ? <Text style={styles.fieldError}>{fieldErrors.nom}</Text> : null}
        <View style={styles.twoCols}>
          <View style={styles.col}>
            <TextInput
              placeholder="MM/AA"
              keyboardType="numeric"
              style={[styles.input, fieldErrors.expiry && styles.inputError]}
              value={card.expiry}
              onChangeText={(value) => updateCard('expiry', value)}
            />
            {fieldErrors.expiry ? <Text style={styles.fieldError}>{fieldErrors.expiry}</Text> : null}
          </View>
          <View style={styles.col}>
            <TextInput
              placeholder="CVV"
              keyboardType="numeric"
              secureTextEntry
              style={[styles.input, fieldErrors.cvv && styles.inputError]}
              value={card.cvv}
              onChangeText={(value) => updateCard('cvv', value)}
            />
            {fieldErrors.cvv ? <Text style={styles.fieldError}>{fieldErrors.cvv}</Text> : null}
          </View>
        </View>
        {logement.compte_ccp ? (
          <View style={styles.ccpBox}>
            <Text style={styles.ccpLabel}>CCP hote apres validation</Text>
            <Text style={styles.ccpValue}>{logement.compte_ccp}</Text>
          </View>
        ) : null}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <TouchableOpacity style={[styles.payBtn, loading && { opacity: 0.6 }]} onPress={handlePayment} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.payBtnText}>{loading ? 'Traitement...' : requiresApproval ? 'Envoyer et payer' : 'Payer'}</Text>
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
  card: { backgroundColor: theme.colors.surfaceLowest, padding: theme.spacing.l, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.colors.outlineVariant, marginBottom: theme.spacing.m },
  cardTitle: { fontSize: theme.fontSize.titleLg, fontWeight: '700', marginBottom: theme.spacing.m, color: theme.colors.onSurface },
  helpText: { color: theme.colors.onSurfaceVariant, marginBottom: theme.spacing.m },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing.s, gap: 16 },
  detailLabel: { color: theme.colors.onSurfaceVariant, fontSize: theme.fontSize.bodyMd, flex: 1 },
  detailValue: { fontWeight: '700', fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, maxWidth: '55%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: theme.colors.surfaceHigh, marginVertical: theme.spacing.m },
  totalLabel: { fontSize: 18, fontWeight: '700', color: theme.colors.onSurface },
  input: { borderWidth: 1, borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.md, paddingHorizontal: 16, paddingVertical: 14, fontSize: theme.fontSize.bodyMd, color: theme.colors.onSurface, marginBottom: theme.spacing.s },
  inputError: { borderColor: theme.colors.error },
  fieldError: { color: theme.colors.error, marginBottom: theme.spacing.s },
  twoCols: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  ccpBox: { backgroundColor: 'rgba(234,179,8,0.12)', borderColor: 'rgba(234,179,8,0.35)', borderWidth: 1, borderRadius: theme.radius.md, padding: theme.spacing.m, marginTop: theme.spacing.s },
  ccpLabel: { color: '#92400e', fontWeight: '600', marginBottom: 4 },
  ccpValue: { color: '#78350f', fontWeight: '700', letterSpacing: 2 },
  payBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.full, paddingVertical: 16, alignItems: 'center', marginTop: theme.spacing.l },
  payBtnText: { color: theme.colors.onPrimary, fontWeight: '600', fontSize: 17 },
  errorBox: { backgroundColor: theme.colors.errorContainer, borderRadius: theme.radius.md, padding: theme.spacing.m, marginTop: theme.spacing.m },
  errorText: { color: theme.colors.onErrorContainer },
});
