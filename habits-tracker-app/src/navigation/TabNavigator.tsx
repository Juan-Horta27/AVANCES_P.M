import {
  BottomTabBar,
  type BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import AvisoSinConexion from '../components/AvisoSinConexion';
import { avisar } from '../components/dialogos';
import { colors, fontSize } from '../constants/theme';
import { useApp } from '../context/AppContext';
import DashboardScreen from '../screens/DashboardScreen';
import HabitosScreen from '../screens/HabitosScreen';
import HistorialScreen from '../screens/HistorialScreen';
import MetasScreen from '../screens/MetasScreen';
import RegistrosScreen from '../screens/RegistrosScreen';
import type { TabParamList } from '../types';
import { horaDe } from '../utils/date';

const Tab = createBottomTabNavigator<TabParamList>();

/** Icono de pestana: emoji atenuado cuando no esta seleccionada. */
function icono(simbolo: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={[styles.icono, focused ? styles.iconoActivo : null]}>{simbolo}</Text>
  );
}

/**
 * Barra de pestañas con el aviso de "sin conexión" justo encima (HU-02 S-05), que también cuenta
 * los registros que esperan subir (S-06). Forma parte del
 * diseño, no se superpone: no tapa ningún botón y no aparece dentro del modal de registro.
 */
function BarraConAviso(props: BottomTabBarProps) {
  const {
    sinConexion,
    sincronizado,
    reintentarConexion,
    pendientes,
    avisoPendientes,
    descartarAvisoPendientes,
  } = useApp();
  const [reintentando, setReintentando] = useState(false);

  // Si un registro pendiente no se pudo subir (p. ej. ya existía ese día), se avisa una vez (S-06).
  useEffect(() => {
    if (!avisoPendientes) return;
    avisar('Registros pendientes', avisoPendientes);
    descartarAvisoPendientes();
  }, [avisoPendientes, descartarAvisoPendientes]);

  const datos = sincronizado ? `datos de las ${horaDe(sincronizado)}` : 'datos guardados';
  const enCola =
    pendientes.length === 0
      ? ''
      : ` · ⏳ ${pendientes.length} ${pendientes.length === 1 ? 'registro pendiente' : 'registros pendientes'}`;

  const reintentar = async () => {
    setReintentando(true);
    await reintentarConexion();
    setReintentando(false);
  };

  return (
    <>
      {sinConexion ? (
        <AvisoSinConexion
          detalle={`${datos}${enCola}`}
          reintentando={reintentando}
          onReintentar={() => void reintentar()}
        />
      ) : null}
      <BottomTabBar {...props} />
    </>
  );
}

/** Pestanas principales, disponibles despues de iniciar sesion. */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BarraConAviso {...props} />}
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
        options={{ tabBarIcon: icono('🏠'), title: 'Inicio', tabBarAccessibilityLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="Habitos"
        component={HabitosScreen}
        options={{ tabBarIcon: icono('📌'), title: 'Habitos', tabBarAccessibilityLabel: 'Habitos' }}
      />
      <Tab.Screen
        name="Metas"
        component={MetasScreen}
        options={{ tabBarIcon: icono('🎯'), title: 'Metas', tabBarAccessibilityLabel: 'Metas' }}
      />
      <Tab.Screen
        name="Registros"
        component={RegistrosScreen}
        options={{ tabBarIcon: icono('📋'), title: 'Registros', tabBarAccessibilityLabel: 'Registros' }}
      />
      <Tab.Screen
        name="Historial"
        component={HistorialScreen}
        options={{ tabBarIcon: icono('📊'), title: 'Historial', tabBarAccessibilityLabel: 'Historial' }}
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
