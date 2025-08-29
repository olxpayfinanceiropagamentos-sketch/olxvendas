// server.js
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000; // Render.com usa uma porta flexível

// --- SUAS CREDENCIAIS CORRETAS ---
const API_TOKEN = 'wGKHIXH5n0BMx0y3QJcI6asl6yOXE66zak2o2i71Ubsxx1QhxxJ36ooySu3D';
const OFFER_HASH = 'vdzfm'; // Hash correto que descobrimos no log
const PRODUCT_HASH = 'cagc6epccx';

const IRONPAY_API_URL = 'https://api.ironpayapp.com.br/api/public/v1';

app.use(express.json());
// Adiciona CORS para permitir que seu site na InfinityFree se comunique com este servidor
const cors = require('cors');
app.use(cors());

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
            customer: {
                name: name,
                email: "cliente@email.com",
                phone_number: phone || "11999999999",
                document: document
            },
            cart: [{
                product_hash: PRODUCT_HASH,
                title: "Taxa de Acesso ao Site",
                price: 10000,
                quantity: 1,
                operation_type: 1
            }]
        };

        const response = await axios.post(
            `${IRONPAY_API_URL}/transactions?api_token=${API_TOKEN}`,
            transactionData,
            { headers: { 'Accept': 'application/json' } }
        );

        const responseData = response.data;

        if (!responseData || !responseData.hash || !responseData.pix || !responseData.pix.pix_url) {
             throw new Error("Resposta da API da IronPay está incompleta ou em formato inesperado.");
        }

        const pixData = {
            transaction_hash: responseData.hash,
            qr_code_data: responseData.pix.pix_qr_code,
            copia_e_cola: responseData.pix.pix_url
        };
        
        res.json(pixData);

    } catch (error) {
        console.error("Erro ao criar cobrança:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        const errorMessage = error.response ? (error.response.data.message || "Erro na comunicação com a API de pagamento.") : "Erro interno no servidor.";
        res.status(500).json({ message: errorMessage });
    }
});

// ROTA PARA VERIFICAR O STATUS DO PAGAMENTO
app.get('/verificar-pagamento/:hash', async (req, res) => {
    const { hash } = req.params;
    if (!hash) {
        return res.status(400).json({ message: "Hash da transação é obrigatório." });
    }

    try {
        const response = await axios.get(
            `${IRONPAY_API_URL}/transactions/${hash}?api_token=${API_TOKEN}`,
            { headers: { 'Accept': 'application/json' } }
        );
        
        const status = response.data.status; 
        
        res.json({ status: status });

    } catch (error) {
        res.status(500).json({ message: "Erro ao verificar status do pagamento." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
