import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent se encarga de AppRegistry.registerComponent
// y de que la app funcione tanto en Expo Go como en una build nativa.
registerRootComponent(App);
