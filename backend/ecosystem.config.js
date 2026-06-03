module.exports = {
  apps: [
    {
      name: "agricareer-backend",
      script: "python", // Gunakan absolute path ke python di dalam .venv jika bermasalah, misal: "./.venv/Scripts/python.exe"
      args: "-m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4",
      cwd: ".",
      instances: 1, // Tetap 1 karena Uvicorn sudah menangani worker-nya sendiri via flag --workers
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
