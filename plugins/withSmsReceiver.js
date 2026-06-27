const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withSmsReceiver(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];

    if (!application.receiver) application.receiver = [];
    if (!application.service) application.service = [];

    const receiverName = 'com.centaurwarchief.smslistener.SmsReceiver';
    const hasReceiver = application.receiver.some(
      (r) => r.$?.['android:name'] === receiverName,
    );
    if (!hasReceiver) {
      application.receiver.push({
        $: {
          'android:name': receiverName,
          'android:enabled': 'true',
          'android:exported': 'true',
        },
        'intent-filter': [
          {
            $: { 'android:priority': '999' },
            action: [{ $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } }],
          },
        ],
      });
    }

    const serviceName = 'com.facebook.react.HeadlessJsTaskService';
    const hasService = application.service.some(
      (s) => s.$?.['android:name'] === serviceName,
    );
    if (!hasService) {
      application.service.push({
        $: {
          'android:name': serviceName,
          'android:exported': 'false',
        },
      });
    }

    return config;
  });
};
