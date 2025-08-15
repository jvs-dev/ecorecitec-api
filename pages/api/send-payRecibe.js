const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
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
      const mailOptions = {
         from: process.env.EMAIL_USER,
         to: "shepherdcom12@gmail.com",
         subject: "Nova inscrição no site da EcoRecitec!",
         html: `
            <h2>Nova Inscrição</h2>
            <ul>
                <li>Planilha: ${sheetsName}</li>
                <li>Nome: ${nome}</li>
                <li>Email: ${email}</li>
                <li>Telefone: ${telefone}</li>
                <li>Data: ${data}</li>               
            </ul>
        `,
      };
      console.log("Tentando enviar e-mail para:", req.body.email);
      await transporter.sendMail(mailOptions);
      console.log("E-mail enviado com sucesso para:", req.body.email);
      res.status(200).json({ message: "Formulário de inscrição recebido com sucesso e processado." });
   } catch (error) {
      console.error("Erro ao processar o pagamento ou enviar e-mail:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao processar o pagamento." });
   }
}

export default init;