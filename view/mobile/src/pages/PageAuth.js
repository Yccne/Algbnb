import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { authController } from '@algbnb/controller-client';
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
  const [resetSent, setResetSent] = useState(null);
  const [role, setRole] = useState('voyageur');
  const [error, setError] = useState('');

  const { login, register, loading } = useAuth();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    setError('');

    try {
      if (resetMode) {
        const response = await authController.forgotPassword(email);
        setResetSent(response);
        return;
      }

      if (isLogin) {
        await login(email, password);
      } else {
        const parts = nom.trim().split(/\s+/).filter(Boolean);
        await register({
          prenom: parts[0] || '',
          nom: parts.slice(1).join(' ') || parts[0] || '',
          email,
          telephone,
          mot_de_passe: password,
          role_type: role,
        });
      }

      navigation.navigate('Root');
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (resetMode) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.centerContent}>
        <View style={styles.formContainer}>
          <Text style={styles.displayTitle}>Réinitialiser le{'\n'}mot de passe</Text>
          <Text style={styles.subtitle}>Le backend génère un token de reset utilisable pour la démo locale.</Text>

          {resetSent ? (
            <View style={styles.successBox}>
              <Text style={styles.successTitle}>Lien généré</Text>
              <Text style={styles.successText}>{resetSent.message}</Text>
              {resetSent.reset_token && <Text style={styles.successText}>{resetSent.reset_token}</Text>}
            </View>
          ) : (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput placeholder="Adresse e-mail" placeholderTextColor={theme.colors.onSurfaceVariant} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
              </View>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>Générer le lien</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity onPress={() => { setResetMode(false); setResetSent(null); setError(''); }} style={{ marginTop: theme.spacing.m }}>
            <Text style={styles.linkText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.centerContent} keyboardShouldPersistTaps="handled">
      <View style={styles.formContainer}>
        <Text style={styles.displayTitle}>{isLogin ? 'Bon retour\nparmi nous' : 'Créez votre\ncompte'}</Text>
        <Text style={styles.subtitle}>Formulaire branché sur la vraie API d’authentification.</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity onPress={() => setIsLogin(true)} style={[styles.toggleBtn, isLogin && styles.toggleBtnActive]} activeOpacity={0.8}>
            <Text style={[styles.toggleText, isLogin && styles.toggleTextActive]}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setIsLogin(false)} style={[styles.toggleBtn, !isLogin && styles.toggleBtnActive]} activeOpacity={0.8}>
            <Text style={[styles.toggleText, !isLogin && styles.toggleTextActive]}>Inscription</Text>
          </TouchableOpacity>
        </View>

        {!isLogin && (
          <>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>👤</Text>
              <TextInput placeholder="Nom complet" placeholderTextColor={theme.colors.onSurfaceVariant} value={nom} onChangeText={setNom} style={styles.input} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📱</Text>
              <TextInput placeholder="Numéro de téléphone" placeholderTextColor={theme.colors.onSurfaceVariant} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" style={styles.input} />
            </View>
            <View style={{ flexDirection: 'row', gap: theme.spacing.s, marginBottom: theme.spacing.s }}>
              <TouchableOpacity style={[styles.roleBtn, role === 'voyageur' && styles.roleBtnActive]} onPress={() => setRole('voyageur')}>
                <Text style={[styles.roleText, role === 'voyageur' && styles.roleTextActive]}>Voyageur</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleBtn, role === 'hote' && styles.roleBtnActive]} onPress={() => setRole('hote')}>
                <Text style={[styles.roleText, role === 'hote' && styles.roleTextActive]}>Hôte</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>✉️</Text>
          <TextInput placeholder="Adresse e-mail" placeholderTextColor={theme.colors.onSurfaceVariant} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.inputIcon}>🔒</Text>
          <TextInput placeholder="Mot de passe" placeholderTextColor={theme.colors.onSurfaceVariant} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} style={[styles.input, { flex: 1 }]} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={{ backgroundColor: 'rgba(180, 35, 24, 0.08)', padding: theme.spacing.m, borderRadius: theme.radius.md, marginBottom: theme.spacing.s }}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity style={[styles.btnPrimary, { marginTop: theme.spacing.m }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          <Text style={styles.btnPrimaryText}>{loading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer mon compte'}</Text>
        </TouchableOpacity>

        {isLogin && (
          <TouchableOpacity onPress={() => setResetMode(true)} style={{ marginTop: theme.spacing.m, alignSelf: 'center' }}>
            <Text style={styles.linkText}>Mot de passe oublié ?</Text>
          </TouchableOpacity>
        )}
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
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
  },
  roleBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  roleText: {
    color: theme.colors.onSurface,
    fontWeight: '600',
  },
  roleTextActive: {
    color: theme.colors.onPrimary,
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
});
