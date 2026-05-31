module.exports = {
  apps: [
    {
      name: 'tezkor-slide',
      script: 'dist/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/tezkor/error.log',
      out_file: '/var/log/tezkor/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
    },
  ],
};
