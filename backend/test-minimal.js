const express = require('express');
const app = express();

app.use(express.json());

// 测试leaderboards路由
try {
  const leaderboardsRoutes = require('./routes/leaderboards');
  app.use('/api/leaderboards', leaderboardsRoutes);
  console.log('Leaderboards routes loaded successfully');
} catch (error) {
  console.error('Error loading leaderboards routes:', error.message);
  process.exit(1);
}

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Minimal test server running on port ${PORT}`);
});