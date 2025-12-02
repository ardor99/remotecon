import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.remotecon.app',
    appName: 'RemoteCon',
    webDir: 'www',
    server: {
        androidScheme: 'https'
    },
    plugins: {
        LocalNotifications: {
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#488AFF',
        },
        Geolocation: {
            permissions: 'whenInUse',
        },
    },
};

export default config;
