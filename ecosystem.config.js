module.exports = {
  apps: [
    {
      name: 'tezkor-slide',
      script: 'dist/main.js',
      // MUST be a single instance: the app runs a Telegram long-polling bot,
      // and Telegram allows only ONE getUpdates poller per token. Running
      // multiple instances causes constant 409 Conflict retries that peg the
      // CPU. Node handles the API + workers concurrently in one process fine.
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
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
