import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

export const PageAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const { login, loading } = useAuth();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (resetMode) {
      setResetSent(true);
      setTimeout(() => { setResetMode(false); setResetSent(false); }, 3000);
      return;
    }
    await login(email, password);
    navigation.navigate('Root');
  };

  if (resetMode) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <View style={styles.formContainer}>
          <Text style={styles.displayTitle}>Réinitialiser le{'\n'}mot de passe</Text>
          <Text style={styles.subtitle}>
            Entrez votre adresse e-mail et nous vous enverrons un lien de réinitialisation.
          </Text>

          {resetSent ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>E-mail envoyé !</Text>
              <Text style={styles.successText}>Vérifiez votre boîte de réception pour le lien de réinitialisation.</Text>
            </View>
          ) : (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  placeholder="Adresse e-mail"
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>Envoyer le lien</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => { setResetMode(false); setResetSent(false); }} style={{ marginTop: theme.spacing.m }}>
            <Text style={styles.linkText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.centerContent} keyboardShouldPersistTaps="handled">
      <View style={styles.formContainer}>
        <Text style={styles.displayTitle}>
          {isLogin ? 'Bon retour\nparmi nous' : 'Créez votre\ncompte'}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin
            ? 'Connectez-vous pour accéder à vos sélections exclusives.'
            : "Rejoignez notre communauté et découvrez des logements d'exception."}
        </Text>

        {/* Toggle Login / Register */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            onPress={() => setIsLogin(true)}
            style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsLogin(false)}
            style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {/* Registration fields */}
        {!isLogin && (
          <>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput
                placeholder="Nom complet"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={nom}
                onChangeText={setNom}
                style={styles.input}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput
                placeholder="Numéro de téléphone"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={telephone}
                onChangeText={setTelephone}
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </>
        )}

        {/* Email */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput
            placeholder="Adresse e-mail"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
        </View>

        {/* Password */}
        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput
            placeholder="Mot de passe"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={[styles.input, { flex: 1 }]}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 18 }}>
              {showPassword ? '🙈' : '👁️'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.btnPrimary, { marginTop: theme.spacing.m }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnPrimaryText}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'Créer mon compte')}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login */}
        <TouchableOpacity style={styles.socialBtn} activeOpacity={0.7}>
          <Text style={styles.socialBtnText}>Continuer avec Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, { marginTop: theme.spacing.s }]} activeOpacity={0.7}>
          <Text style={styles.socialBtnText}>Continuer avec Facebook</Text>
        </TouchableOpacity>

        {/* Forgot Password */}
        {isLogin && (
          <TouchableOpacity onPress={() => setResetMode(true)} style={{ marginTop: theme.spacing.m, alignSelf: 'center' }}>
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Confidentialité  ·  Conditions  ·  Aide</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgMain,
  },
  centerContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.l,
    paddingVertical: theme.spacing.xl,
  },
  formContainer: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  displayTitle: {
    fontSize: theme.fontSize.displayMd,
    fontWeight: '700',
    color: theme.colors.onSurface,
    lineHeight: 38,
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.bodyMd,
    marginBottom: theme.spacing.l,
    lineHeight: 22,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceLow,
    borderRadius: theme.radius.full,
    padding: 4,
    marginBottom: theme.spacing.l,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: theme.colors.surfaceLowest,
    ...theme.shadow.sm,
  },
  toggleText: {
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  toggleTextActive: {
    color: theme.colors.onSurface,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: theme.spacing.s,
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: theme.fontSize.bodyMd,
    color: theme.colors.onSurface,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: theme.colors.onPrimary,
    fontWeight: '600',
    fontSize: 17,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.l,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.surfaceHigh,
  },
  dividerText: {
    paddingHorizontal: theme.spacing.m,
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.bodySm,
  },
  socialBtn: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  socialBtnText: {
    fontWeight: '600',
    fontSize: theme.fontSize.bodyMd,
    color: theme.colors.onSurface,
  },
  linkText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.bodySm,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  successBox: {
    padding: theme.spacing.m,
    backgroundColor: 'rgba(15, 110, 86, 0.08)',
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  successTitle: {
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  successText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: theme.fontSize.bodySm,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: theme.spacing.m,
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.fontSize.bodySm,
    color: theme.colors.onSurfaceVariant,
  },
});
