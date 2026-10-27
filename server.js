const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static website files from root directory
app.use(express.static(path.join(__dirname)));

// WiPay Checkout Endpoint
app.post('/create-wipay-payment', async (req, res) => {
  try {
    const { amount, orderId, customerEmail, customerPhone, fulfillment } = req.body;

    // Build URLSearchParams payload for WiPay's x-www-form-urlencoded endpoint
    const payload = new URLSearchParams();
    payload.append('account_number', process.env.WIPAY_ACCOUNT_NUMBER || '1600852078');
    payload.append('country_code', 'JM');
    payload.append('currency', 'JMD');
    payload.append('environment', 'live');
    payload.append('fee_structure', 'customer_pay');
    payload.append('method', 'credit_card');
    payload.append('origin', 'Gosh Exotic');
    payload.append('total', parseFloat(amount).toFixed(2));
    payload.append('order_id', orderId || 'GOSH-' + Date.now());
    
    // Fixed: Added backticks around the template literal
    payload.append('return_url', `${req.headers.origin || 'https://goshexotics.onrender.com'}?status=success`);
    
    if (customerEmail) payload.append('email', customerEmail);
    if (customerPhone) payload.append('phone', customerPhone);
    payload.append('data', JSON.stringify({ fulfillment: fulfillment || 'store_pickup' }));

    // Send POST request with correct headers
    const response = await axios.post('https://jm.wipayfinancial.com/plugins/payments/request', payload, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data && response.data.url) {
      res.json({ success: true, url: response.data.url });
    } else {
      res.status(400).json({ success: false, message: response.data.message || 'WiPay initiation failed' });
    }
  } catch (error) {
    console.error('WiPay Error Details:', error.response ? error.response.data : error.message);
    res.status(400).json({ 
      success: false, 
      message: error.response?.data?.message || error.message 
    });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));