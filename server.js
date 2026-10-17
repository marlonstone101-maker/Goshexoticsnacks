const express = require('express');
const cors = require('cors'); // Optional if hosted on the same domain, but good for local testing
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static website files from root directory
app.use(express.static(path.join(__dirname)));

// Stripe Checkout Session Endpoint
app.post('/create-checkout-session', async (req, res) => {
    try {
        // Changed 'cart' to 'items' to match what your index.html frontend sends
        const { items, customerName, customerPhone, fulfillment } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'No items provided in cart' });
        }

        const lineItems = items.map(item => ({
            price_data: {
                currency: 'jmd', // Use 'jmd' if your store prices are in Jamaican Dollars, or 'usd' if configured in Stripe
                product_data: { 
                    name: item.name,
                    description: item.details || fulfillment // Pass item custom options or fulfillment info
                },
                unit_amount: Math.round(item.price * 100), // Stripe expects amounts in cents
            },
            quantity: item.quantity,
        }));

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin || 'https://goshexoticsnacks.onrender.com'}/?status=success`,
            cancel_url: `${req.headers.origin || 'https://goshexoticsnacks.onrender.com'}/?status=cancelled`,
            metadata: {
                customerName: customerName || 'Guest',
                customerPhone: customerPhone || '',
                fulfillment: fulfillment || 'Pickup'
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Stripe Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));