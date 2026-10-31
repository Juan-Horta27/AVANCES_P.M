// Diálogos nativos de confirmación y aviso.
// Alert.alert con botones no está implementado en react-native-web (en el navegador no hace
// nada), así que en la web se usan los diálogos del navegador. Las pantallas llaman a estas
// funciones y no a Alert directamente, para que funcionen igual en Android, iOS y web.
import { Alert, Platform } from 'react-native';

/** Pide confirmación para una acción destructiva. Resuelve true si la persona acepta. */
export function confirmar(titulo: string, mensaje: string, textoAccion: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${titulo}\n\n${mensaje}`));
  }
  return new Promise((resolver) => {
    Alert.alert(
      titulo,
      mensaje,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolver(false) },
        { text: textoAccion, style: 'destructive', onPress: () => resolver(true) },
      ],
      { cancelable: true, onDismiss: () => resolver(false) },
    );
  });
}

/** Muestra un aviso con un solo botón. */
export function avisar(titulo: string, mensaje: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}\n\n${mensaje}`);
    return;
  }
  Alert.alert(titulo, mensaje);
}
