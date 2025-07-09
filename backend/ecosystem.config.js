module.exports = {
  apps: [
    {
      // Application Configuration
      name: 'faceapp-backend',
      script: 'server.js',
      cwd: __dirname,
      
      // Clustering Configuration
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster', // Enable clustering for better performance
      
      // Performance Optimizations
      node_args: [
        '--max-old-space-size=2048', // Increase memory limit to 2GB
        '--optimize-for-size', // Optimize for memory usage
      ],
      
      // Auto-restart Configuration
      watch: false, // Disable in production (enable for development)
      ignore_watch: ['node_modules', 'logs', 'temp', 'uploads'],
      watch_options: {
        followSymlinks: false,
        usePolling: false
      },
      
      // Restart Policies
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      restart_delay: 4000,
      
      // Logging Configuration
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',
      
      // Environment Variables
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        PM2_SERVE_PATH: '.',
        PM2_SERVE_PORT: 8080,
        PM2_SERVE_SPA: 'true',
        PM2_SERVE_HOMEPAGE: '/index.html'
      },
      
      // Production Environment
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
        // Enable compression
        ENABLE_COMPRESSION: 'true',
        // Optimize cache
        CACHE_TTL: 3600,
        // Enable Redis if available
        ENABLE_REDIS: 'true'
      },
      
      // Development Environment
      env_development: {
        NODE_ENV: 'development',
        PORT: 3001,
        watch: true,
        ignore_watch: ['node_modules', 'logs']
      },
      
      // Health Monitoring
      health_check_url: 'http://localhost:3001/api/health',
      health_check_grace_period: 3000,
      
      // Process Management
      kill_timeout: 5000,
      listen_timeout: 3000,
      
      // Advanced Options
      source_map_support: true,
      disable_source_map_support: false,
      
      // Monitoring
      pmx: true,
      automation: false,
      
      // Error Handling
      exp_backoff_restart_delay: 100,
      
      // Custom Environment Variables for Face App
      env_vars: {
        // MongoDB optimizations
        MONGODB_MAX_POOL_SIZE: 10,
        MONGODB_MIN_POOL_SIZE: 5,
        MONGODB_MAX_IDLE_TIME: 30000,
        MONGODB_SERVER_SELECTION_TIMEOUT: 5000,
        
        // Performance settings
        UV_THREADPOOL_SIZE: 16, // Increase thread pool for better I/O
        NODE_OPTIONS: '--max-old-space-size=2048',
        
        // Cloudinary optimizations
        CLOUDINARY_TIMEOUT: 30000,
        CLOUDINARY_CHUNK_SIZE: 6000000,
        
        // Rate limiting
        RATE_LIMIT_WINDOW: 900000, // 15 minutes
        RATE_LIMIT_MAX: 100,
        
        // Compression
        COMPRESSION_LEVEL: 6,
        COMPRESSION_THRESHOLD: 1024
      }
    }
  ],
  
  // Deployment Configuration
  deploy: {
    production: {
      user: 'node',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/faceapp-backend.git',
      path: '/var/www/faceapp-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    
    staging: {
      user: 'node',
      host: 'staging-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:your-repo/faceapp-backend.git',
      path: '/var/www/faceapp-backend-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging'
    }
  },
  
  // Module Configuration
  module_conf: {
    // PM2 Plus monitoring
    'pm2-server-monit': {
      port: 43554
    }
  }
};
