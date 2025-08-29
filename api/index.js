// api/index.js
const express = require('express');
const axios = require('axios');
// const cors = require('cors'); // LINHA REMOVIDA
const app = express();

const API_TOKEN = process.env.API_TOKEN;
const OFFER_HASH = process.env.OFFER_HASH;
const PRODUCT_HASH = process.env.PRODUCT_HASH;

const IRONPAY_API_URL = 'https://api.ironpayapp.com.br/api/public/v1';

app.use(express.json());
// app.use(cors()); // LINHA REMOVIDA

// (O resto do seu código permanece exatamente o mesmo)
// ROTA PARA CRIAR A COBRANÇA PIX
app.post('/criar-cobranca', async (req, res) => {
    try {
        const { name, document, phone } = req.body;
        if (!name || !document) {
            return res.status(400).json({ message: "Nome e documento do cliente são obrigatórios." });
        }
        const transactionData = {
            amount: 10000,
            payment_method: "pix",
            offer_hash: OFFER_HASH,
            installments: 1,
            customer: { name, email: "cliente@email.com", phone_number: phone || "11999999999", document },
            cart: [{ product_hash: PRODUCT_HASH, title: "Taxa de Acesso ao Site", price: 10000, quantity: 1, operation_type: 1 }]
        };
        const response = await axios.post(`${IRONPAY_API_URL}/transactions?api_token=${API_TOKEN}`, transactionData, { headers: { 'Accept': 'application/json' } });
        if (!response.data || !response.data.hash || !response.data.pix || !response.data.pix.pix_url) {
             throw new Error("Resposta da API da IronPay está incompleta ou em formato inesperado.");
        }
        const pixData = {
            transaction_hash: response.data.hash,
            qr_code_data: response.data.pix.pix_qr_code,
            copia_e_cola: response.data.pix.pix_url
        };
        res.json(pixData);
    } catch (error) {
        const errorMessage = error.response ? (error.response.data.message || "Erro na API de pagamento.") : "Erro interno no servidor.";
        res.status(500).json({ message: errorMessage });
    }
});

// ROTA PARA VERIFICAR O STATUS DO PAGAMENTO
app.get('/verificar-pagamento/:hash', async (req, res) => {
    try {
        const { hash } = req.params;
        const response = await axios.get(`${IRONPAY_API_URL}/transactions/${hash}?api_token=${API_TOKEN}`, { headers: { 'Accept': 'application/json' } });
        res.json({ status: response.data.status });
    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar status do pagamento." });
    }
});

module.exports = app;
