import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ViewStyle,
} from 'react-native';

import { colors, fontSize, radius, spacing } from '../constants/theme';

interface Props {
  etiqueta: string;
  valor: string;
  onChange: (texto: string) => void;
  placeholder?: string;
  tipoTeclado?: KeyboardTypeOptions;
  esContrasena?: boolean;
  multilinea?: boolean;
  style?: ViewStyle;
}

/** Campo de texto con etiqueta y foco resaltado. */
export default function Input({
  etiqueta,
  valor,
  onChange,
  placeholder,
  tipoTeclado = 'default',
  esContrasena = false,
  multilinea = false,
  style,
}: Props) {
  const [enfocado, setEnfocado] = useState(false);

  return (
    <View style={[styles.contenedor, style]}>
      <Text style={styles.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <TextInput
        value={valor}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.subtle}
        keyboardType={tipoTeclado}
        secureTextEntry={esContrasena}
        multiline={multilinea}
        autoCapitalize={tipoTeclado === 'email-address' ? 'none' : 'sentences'}
        onFocus={() => setEnfocado(true)}
        onBlur={() => setEnfocado(false)}
        style={[
          styles.campo,
          multilinea ? styles.campoMultilinea : null,
          enfocado ? styles.campoEnfocado : null,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: spacing.xs + 2,
  },
  etiqueta: {
    color: colors.muted,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  campo: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.md,
  },
  campoMultilinea: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  campoEnfocado: {
    borderColor: colors.teal,
  },
});
