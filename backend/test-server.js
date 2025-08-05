const express = require('express');
const app = express();

app.use(express.json());

app.get('/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});