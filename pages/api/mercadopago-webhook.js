// pages/api/mercadopago-webhook.js

const mercadopago = require('mercadopago');
const { MercadoPagoConfig, Payment } = mercadopago;

const client = new MercadoPagoConfig({ accessToken: `${process.env.RECITEC_MERCADOPAGO_KEY}` });
const payment = new Payment(client);

export default async function handler(req, res) {
   // É uma boa prática validar a origem do webhook em produção para segurança.
   // Por simplicidade, não faremos isso neste exemplo, mas considere implementar.

   if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Método não permitido.' });
   }

   try {
      const { type, data } = req.body; // type: 'payment', data.id: paymentId

      console.log('Webhook do Mercado Pago recebido:', { type, data });

      // Verificamos se é uma notificação de pagamento e se há um ID de pagamento
      if (type === 'payment' && data && data.id) {
         const paymentId = data.id;
         console.log(`Recebido webhook para paymentId: ${paymentId}`);

         // Consulta o status do pagamento diretamente no Mercado Pago para confirmar
         const paymentInfo = await payment.get({ id: paymentId });

         if (paymentInfo && paymentInfo.status) {
            const status = paymentInfo.status;
            const formData = paymentInfo.metadata.formData; // Recupera os dados do formulário armazenados

            console.log(`Status do pagamento ${paymentId}: ${status}`);

            if (status === 'approved') {
               console.log(`Pagamento ${paymentId} aprovado. Processando inscrição...`);

               if (!formData) {
                  console.error(`Erro: formData não encontrado para o pagamento ${paymentId}.`);
                  return res.status(500).json({ message: 'Erro: Dados do formulário não encontrados.' });
               }

               // 1. Enviar dados para a API Flask
               const flaskResponse = await fetch("https://api-form-flask.onrender.com/submit", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(formData),
               });

               if (!flaskResponse.ok) {
                  const errorData = await flaskResponse.json().catch(() => ({ message: 'Erro desconhecido na API Flask.' }));
                  console.error('Erro ao enviar para API Flask no webhook:', errorData);
                  // O webhook deve sempre retornar 200 OK para o MP, mesmo com erros internos,
                  // para evitar reenvios desnecessários. Logamos o erro e continuamos.
               } else {
                  console.log('Dados enviados para API Flask com sucesso via webhook.');
               }

               // 2. Enviar e-mail via API
               const emailResponse = await fetch("https://ecorecitec-api.vercel.app/api/submit", {
                  method: 'POST',
                  headers: {
                     'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(formData),
               });

               if (!emailResponse.ok) {
                  const errorData = await emailResponse.json().catch(() => ({ message: 'Erro desconhecido na API de e-mail.' }));
                  console.error('Erro ao enviar e-mail via API no webhook:', errorData);
               } else {
                  console.log('E-mail enviado com sucesso via webhook.');
               }

            } else {
               console.log(`Pagamento ${paymentId} não aprovado (status: ${status}). Nenhuma ação de inscrição tomada.`);
            }
         } else {
            console.warn(`Webhook: Nenhum status de pagamento encontrado para o ID: ${paymentId}. Resposta completa:`, paymentInfo);
         }
      } else {
         console.warn('Webhook recebido não é uma notificação de pagamento ou não contém ID.');
      }

      // SEMPRE retorne 200 OK para o Mercado Pago para indicar que a notificação foi recebida com sucesso.
      res.status(200).json({ message: 'Webhook recebido e processado.' });

   } catch (error) {
      console.error('Erro ao processar webhook do Mercado Pago:', error);
      // Em caso de erro, ainda retornamos 200 OK para evitar que o Mercado Pago reenvie a notificação.
      // O erro deve ser tratado e logado internamente.
      res.status(200).json({ message: 'Erro interno ao processar webhook, verifique os logs.' });
   }
}
