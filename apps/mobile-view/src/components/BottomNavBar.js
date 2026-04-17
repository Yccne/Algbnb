import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
// Pour l'exemple, nous utilisons des emojis au lieu de Lucide-Icons car react-native-vector-icons n'est pas encore installé.

const navItems = [
  { id: 'home', label: 'Recherche', icon: '🔍' },
  { id: 'favorites', label: 'Favoris', icon: '❤️' },
  { id: 'reservations', label: 'Résa.', icon: '📅' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'profile', label: 'Profil', icon: '👤' },
];

export const BottomNavBar = ({ currentRoute }) => {
  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity key={item.id} style={styles.item}>
          <Text style={[styles.icon, currentRoute === item.id && styles.activeText]}>{item.icon}</Text>
          <Text style={[styles.label, currentRoute === item.id && styles.activeText]}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceLowest,
    paddingVertical: theme.spacing.s,
    paddingBottom: 24, // Pour iPhone Safe Area
    borderTopWidth: 1,
    borderTopColor: theme.colors.surfaceHigh,
  },
  item: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginBottom: 4,
    color: theme.colors.onSurfaceVariant,
  },
  label: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  activeText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  }
});
