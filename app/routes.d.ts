import 'expo-router';

declare module 'expo-router' {
  interface Route {
    '/photo/crop': {
      id: string;
      uri?: string;
    };
  }
}
