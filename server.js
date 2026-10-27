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

    const payload = {
      account_number: process.env.WIPAY_ACCOUNT_NUMBER || '1600852078', 
      country_code: 'JM',
      currency: 'JMD',
      fee_structure: 'customer_pay',
      method: 'credit_card',
      total: amount,
      order_id: orderId || 'GOSH-' + Date.now(),
      return_url: `${req.headers.origin || 'https://goshexotics.onrender.com'}?status=success`,
      email: customerEmail || 'customer@goshexotics.com',
      phone: customerPhone || '',
      data: JSON.stringify({ fulfillment: fulfillment || 'store_pickup' })
    };

    // Send request to WiPay Jamaica API
    const response = await axios.post('https://jm.wipayfinancial.com/plugins/payments/request', payload);

    if (response.data && response.data.url) {
      res.json({ success: true, url: response.data.url });
    } else {
      res.status(400).json({ success: false, message: 'Could not generate WiPay payment URL' });
    }
  } catch (error) {
    console.error('WiPay Error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));