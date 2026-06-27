import { AppRegistry } from 'react-native';

AppRegistry.registerHeadlessTask(
  'SmsListenerHeadlessTask',
  () => require('./src/tasks/smsHeadlessTask').default,
);

import 'expo-router/entry';
