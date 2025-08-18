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
         to: req.body.email, // E-mail do pagador/inscrito
         subject: 'Parabéns por se tornar um parceiro da EcoRecitec!',
         html: `
            <p>Olá ${req.body.nome},</p>
            <p>Parabéns por finalizar sua inscrição!</p>
            <p>Agora agende uma reunião com Celene Brito ou <strong>entre em contato</strong> para confirmar sua inscrição.</p>
            <a href="https://calendly.com/celene-recitec/30min">https://calendly.com/celene-recitec/30min</a>
            <br>
            <p>Atenciosamente,</p>
            <p>Equipe EcoRecitec</p>
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
