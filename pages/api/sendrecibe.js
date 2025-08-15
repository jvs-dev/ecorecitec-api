// backend com Next.js
// pages/api/submit.js

const nodemailer = require('nodemailer');

// Configuração do transporter de e-mail (usando variáveis de ambiente)
const transporter = nodemailer.createTransport({
   service: 'gmail', // Exemplo: 'gmail', 'outlook', etc. Ou use host/port para SMTP customizado
   auth: {
      user: process.env.EMAIL_USER, // Seu e-mail (definido em .env.local)
      pass: process.env.EMAIL_PASS, // Sua senha de aplicativo ou senha do e-mail (definido em .env.local)
   },
});

async function init(req, res) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).end();
      return;
   }

   try {
      console.log("Dados do formulário de inscrição recebidos no backend:", req.body);

      // Aqui você pode adicionar a lógica para salvar os dados do formulário em um banco de dados, etc.
      // Por exemplo:
      // const formData = req.body;
      // await saveFormDataToDatabase(formData);

      // Verifica se o usuário deseja participar do ecossistema      
      const mailOptions = {
         from: process.env.EMAIL_USER,
         to: "shepherdcom12@gmail.com", // E-mail do pagador/inscrito
         subject: `Nova inscrição na planilha ${req.body.sheetsName}!`,
         html: `
                  <p>Olá, Celene</p>                    
                  <h2>Nova Inscrição em ${req.body.sheetsName}</h2>
                  <ul>
                     <li>Planilha: ${req.body.sheetsName}</li>
                     <li>Nome: ${req.body.nome}</li>
                     <li>Email: ${req.body.email}</li>
                     <li>Telefone: ${req.body.telefone}</li>
                     <li>Data: ${req.body.data}</li>               
                  </ul>        
                  <img src="https://eco-recitec.com.br/images/logo/logo-recitec-02-02.png" />
                `,
      };

      console.log("Tentando enviar e-mail de bônus para:", req.body.email);
      await transporter.sendMail(mailOptions);
      console.log("E-mail de bônus enviado com sucesso para:", req.body.email);
      res.status(200).json({ message: "Formulário de inscrição recebido com sucesso e processado." });

   } catch (error) {
      console.error("Erro ao processar formulário de inscrição ou enviar e-mail:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao processar o formulário." });
   }
};

export default init;
