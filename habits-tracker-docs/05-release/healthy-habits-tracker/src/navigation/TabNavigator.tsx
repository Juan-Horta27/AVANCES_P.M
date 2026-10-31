import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, fontSize } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';
import HabitosScreen from '../screens/HabitosScreen';
import HistorialScreen from '../screens/HistorialScreen';
import MetasScreen from '../screens/MetasScreen';
import RegistrosScreen from '../screens/RegistrosScreen';
import type { TabParamList } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();

/** Icono de pestana: emoji atenuado cuando no esta seleccionada. */
function icono(simbolo: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={[styles.icono, focused ? styles.iconoActivo : null]}>{simbolo}</Text>
  );
}

/** Pestanas principales, disponibles despues de iniciar sesion. */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.barra,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.etiqueta,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: icono('🏠'), title: 'Inicio' }}
      />
      <Tab.Screen
        name="Habitos"
        component={HabitosScreen}
        options={{ tabBarIcon: icono('📌'), title: 'Habitos' }}
      />
      <Tab.Screen
        name="Metas"
        component={MetasScreen}
        options={{ tabBarIcon: icono('🎯'), title: 'Metas' }}
      />
      <Tab.Screen
        name="Registros"
        component={RegistrosScreen}
        options={{ tabBarIcon: icono('📋'), title: 'Registros' }}
      />
      <Tab.Screen
        name="Historial"
        component={HistorialScreen}
        options={{ tabBarIcon: icono('📊'), title: 'Historial' }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  barra: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
    paddingTop: 6,
  },
  etiqueta: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  icono: {
    fontSize: 18,
    opacity: 0.45,
  },
  iconoActivo: {
    opacity: 1,
  },
});
