// pages/api/checkpaystatus.js

const mercadopago = require('mercadopago');
const { MercadoPagoConfig, Payment } = mercadopago;

const client = new MercadoPagoConfig({ accessToken: `${process.env.RECITEC_MERCADOPAGO_KEY}` });
const payment = new Payment(client);

export default async function handler(req, res) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

   if (req.method === 'OPTIONS') {
      return res.status(200).end();
   }

   if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Método não permitido. Apenas GET é suportado.' });
   }

   const { paymentId } = req.query;

   if (!paymentId) {
      return res.status(400).json({ error: 'ID do pagamento é obrigatório.' });
   }

   try {
      console.log(`Verificando status do pagamento para ID: ${paymentId}`);
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo && paymentInfo.status) {
         // CORREÇÃO: Usando console.log() em vez de console()
         console.log(`Status retornado para ${paymentId}: ${paymentInfo.status}`);
         return res.status(200).json({ status: paymentInfo.status });
      } else {
         console.warn(`Nenhum status encontrado para o pagamento ID: ${paymentId}`);
         return res.status(404).json({ message: 'Status do pagamento não encontrado.' });
      }
   } catch (error) {
      console.error(`Erro ao buscar status do pagamento ${paymentId}:`, error);
      let errorMessage = "Erro interno do servidor ao verificar o status do pagamento.";
      if (error.cause && error.cause.length > 0 && error.cause[0].description) {
         errorMessage = error.cause[0].description;
      } else if (error.message) {
         errorMessage = error.message;
      }
      return res.status(500).json({ error: errorMessage });
   }
}
