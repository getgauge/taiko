const NETWORK_PRESETS = [
    {
        mode: 'GPRS',
        value: {
            offline: false,
            downloadThroughput: (50 * 1024) / 8,
            uploadThroughput: (20 * 1024) / 8,
            latency: 500
        }
    },
    {
        mode: 'offline',
        value: {
            offline: true,
            downloadThroughput: 0,
            uploadThroughput: 0,
            latency: 0
        }
    },
    {
        mode: 'Regular2G',
        value: {
            offline: false,
            downloadThroughput: (250 * 1024) / 8,
            uploadThroughput: (50 * 1024) / 8,
            latency: 300
        }
    },
    {
        mode: 'Good2G',
        value: {
            offline: false,
            downloadThroughput: (450 * 1024) / 8,
            uploadThroughput: (150 * 1024) / 8,
            latency: 150
        }
    },
    {
        mode: 'Good3G',
        value: {
            offline: false,
            downloadThroughput: (1.5 * 1024 * 1024) / 8,
            uploadThroughput: (750 * 1024) / 8,
            latency: 40
        }
    },
    {
        mode: 'Regular3G',
        value: {
            'offline': false,
            'downloadThroughput': 750 * 1024 / 8,
            'uploadThroughput': 250 * 1024 / 8,
            'latency': 100
        }
    },
    {
        mode: 'Regular4G',
        value: {
            'offline': false,
            'downloadThroughput': 4 * 1024 * 1024 / 8,
            'uploadThroughput': 3 * 1024 * 1024 / 8,
            'latency': 20
        }
    },
    {
        mode: 'DSL',
        value: {
            offline: false,
            downloadThroughput: (2 * 1024 * 1024) / 8,
            uploadThroughput: (1 * 1024 * 1024) / 8,
            latency: 5
        }
    },
    {
        mode: 'WiFi',
        value: {
            offline: false,
            downloadThroughput: (30 * 1024 * 1024) / 8,
            uploadThroughput: (15 * 1024 * 1024) / 8,
            latency: 2
        }
    }
];

module.exports.default = NETWORK_PRESETS;
