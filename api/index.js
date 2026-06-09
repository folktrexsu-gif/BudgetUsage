require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getBudgetUsage } = require('../index');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '..')));

// API endpoint for budget data
app.get('/api/budget', async (req, res) => {
  try {
    const boardId = req.query.boardId;
    if (!boardId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Board ID required. Add ?boardId=YOUR_BOARD_ID to the URL' 
      });
    }
    
    console.log(`Fetching budget data for board: ${boardId}`);
    const result = await getBudgetUsage(boardId);
    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Serve widget HTML
app.get('/widget', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'widget.html'));
});

// Health check / root endpoint
app.get('/', (req, res) => {
  const baseUrl = req.get('host');
  res.json({ 
    message: 'BudgetUsage Widget API',
    version: '1.0.0',
    widget_url: `https://${baseUrl}/widget?boardId=YOUR_BOARD_ID`,
    api_endpoint: `https://${baseUrl}/api/budget?boardId=YOUR_BOARD_ID`,
    status: 'running'
  });
});

module.exports = app;
