module.exports = {
  apps: [
    {
      name: "hr-group-api",
      script: "src/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3010,
      },
      env_development: {
        NODE_ENV: "development",
        PORT: 3010,
      },
    },
  ],
};
