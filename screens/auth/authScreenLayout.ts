import { StyleSheet } from 'react-native';

export const AUTH_CONTENT_INDENT = 40;
export const AUTH_BUTTON_SIDE_INSET = 48;

export const authBackgroundStyles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  safe: {
    flex: 1,
    paddingBottom: 32,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 32,
  },
  logoImage: {
    width: 220,
    height: 170,
  },
});
