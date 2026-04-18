import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PageAccueil } from '../pages/PageAccueil';
import { PageResultats } from '../pages/PageResultats';
import { PageLogement } from '../pages/PageLogement';
import { PagePaiement } from '../pages/PagePaiement';
import { PageFavoris } from '../pages/PageFavoris';
import { PageMesReservations } from '../pages/PageMesReservations';
import { PageMessages } from '../pages/PageMessages';
import { PageProfil } from '../pages/PageProfil';
import { PageDashboardHote } from '../pages/PageDashboardHote';
import { PageCreerAnnonce } from '../pages/PageCreerAnnonce';
import { PageAuth } from '../pages/PageAuth';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabIcon = ({ icon, color }) => <Text style={{ fontSize: 22, color }}>{icon}</Text>;

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#005440',
      tabBarInactiveTintColor: '#6f7a74',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopColor: 'rgba(190, 201, 195, 0.15)',
        height: 70,
        paddingBottom: 10,
        paddingTop: 6,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '500',
      },
      tabBarIcon: ({ color }) => {
        const icons = {
          Accueil: '🔍',
          Favoris: '♡',
          Réservations: '📅',
          Messages: '💬',
          Profil: '👤',
        };
        return <TabIcon icon={icons[route.name]} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Accueil" component={PageAccueil} options={{ tabBarLabel: 'Recherche' }} />
    <Tab.Screen name="Favoris" component={PageFavoris} />
    <Tab.Screen name="Réservations" component={PageMesReservations} />
    <Tab.Screen name="Messages" component={PageMessages} />
    <Tab.Screen name="Profil" component={PageProfil} />
  </Tab.Navigator>
);

export const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f9f9f8' },
        headerTitleStyle: { color: '#191c1c', fontWeight: '700' },
        headerTintColor: '#005440',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Root" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Resultats" component={PageResultats} options={{ title: 'Résultats' }} />
      <Stack.Screen name="Logement" component={PageLogement} options={{ title: 'Détail du logement' }} />
      <Stack.Screen name="Paiement" component={PagePaiement} options={{ title: 'Paiement' }} />
      <Stack.Screen name="Connexion" component={PageAuth} options={{ title: 'Connexion' }} />
      <Stack.Screen name="Dashboard Hôte" component={PageDashboardHote} options={{ title: 'Dashboard Hôte' }} />
      <Stack.Screen name="Créer annonce" component={PageCreerAnnonce} options={{ title: 'Créer annonce' }} />
    </Stack.Navigator>
  </NavigationContainer>
);
