// backend com Next.js
// pages/api/createpay.js

const mercadopago = require('mercadopago');
const { MercadoPagoConfig, Payment } = mercadopago;

const client = new MercadoPagoConfig({ accessToken: `${process.env.RECITEC_MERCADOPAGO_KEY}` });
const payment = new Payment(client);

function expiration() {
   let currentDate = new Date();
   let expiration = new Date(currentDate.getTime() + 10 * 60000);
   return expiration
}

async function init (req, res) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).end();
      return;
   }
   try {
      console.log("Requisição recebida no backend:", req.body); // Log do corpo completo da requisição

      // Limpa o CPF, telefone e CEP, garantindo que sejam apenas dígitos
      const cleanedCpf = req.body.payerCpf ? req.body.payerCpf.replace(/\D/g, '') : '';
      const cleanedPhone = req.body.payerPhone ? req.body.payerPhone.replace(/\D/g, '') : '';
      const cleanedZipCode = req.body.zipCode ? req.body.zipCode.replace(/\D/g, '') : '';

      // Divide o nome do pagador em primeiro nome e sobrenome
      const payerNameParts = req.body.payerName ? req.body.payerName.split(' ') : ['', ''];
      const firstName = payerNameParts[0] || "";
      const lastName = payerNameParts.slice(1).join(' ') || "";

      let paymentBody = {
         transaction_amount: Number(req.body.value),
         description: `Pagamento da inscrição do congresso EcoRecitec`,
         date_of_expiration: expiration(),
         payer: {
            email: `${req.body.payerEmail}`,
            first_name: firstName,
            last_name: lastName,
            identification: {
               type: 'CPF',
               number: cleanedCpf // Usa o CPF limpo aqui
            },
            phone: { // Adiciona o objeto phone
               area_code: cleanedPhone.substring(0, 2), // Pega os 2 primeiros dígitos como DDD
               number: cleanedPhone.substring(2) // O restante como número
            },
            address: { // Adiciona o objeto address
               zip_code: cleanedZipCode, // CEP limpo
               street_name: req.body.streetName || "",
               street_number: Number(req.body.streetNumber) || null, // Converte para número, ou null
               federal_unit: req.body.federalUnit || ""
            }
         },
      };

      if (req.body.paymentType === "card") {
         console.log("Processando pagamento com cartão no backend.");
         console.log("payerName recebido do frontend:", req.body.payerName);
         paymentBody.token = req.body.token; // Token gerado pelo frontend
         paymentBody.installments = Number(req.body.installments); // Número de parcelas

         // Adiciona payment_method_id e issuer_id conforme a documentação do Mercado Pago
         if (req.body.paymentMethodId) {
            paymentBody.payment_method_id = req.body.paymentMethodId;
         }
         if (req.body.issuerId) {
            paymentBody.issuer_id = Number(req.body.issuerId); // Issuer ID geralmente é um número
         }

      } else if (req.body.paymentType === "pix") {
         console.log("Processando pagamento com PIX no backend.");
         paymentBody.payment_method_id = 'pix'; // Para PIX, especifique o método de pagamento
      }

      console.log("Dados do pagamento enviados ao Mercado Pago:", JSON.stringify(paymentBody, null, 2)); // Log detalhado formatado
      let result = await payment.create({
         body: paymentBody
      });
      console.log("Resultado do pagamento do Mercado Pago:", JSON.stringify(result, null, 2)); // Log detalhado formatado
      res.json({ result });
   } catch (error) {
      console.error("Erro ao processar pagamento no backend:", error);
      let errorMessage = "Erro interno do servidor.";
      if (error.cause && error.cause.length > 0 && error.cause[0].description) {
         errorMessage = error.cause[0].description;
      } else if (error.message) {
         errorMessage = error.message;
      }
      res.status(500).json({ error: errorMessage });
   }
};
export default init;
