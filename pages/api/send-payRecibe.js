const nodemailer = require('nodemailer');
const formidable = require('formidable');
const fs = require('fs'); // Importa o módulo File System para ler o arquivo


// Desabilita a análise do body do Next.js para este endpoint
// Isso é necessário para que o formidable possa processar a requisição completa.
export const config = {
   api: {
      bodyParser: false,
   },
};

const transporter = nodemailer.createTransport({
   service: 'gmail', // Exemplo: 'gmail', 'outlook', etc. Ou use host/port para SMTP customizado
   auth: {
      user: process.env.EMAIL_USER, // Seu e-mail (definido em .env.local)
      pass: process.env.EMAIL_PASS, // Sua senha de aplicativo ou senha do e-mail (definido em .env.local)
   },
});

async function init(req, res) {
   res.setHeader('Access-Control-Allow-Origin', 'https://eco-recitec.com.br');
   res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

   // Se a requisição for do tipo OPTIONS (preflight), respondemos e terminamos aqui.
   // Isso é um passo obrigatório para que os navegadores permitam a requisição POST.
   if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
   }

   try {
      const form = new formidable.IncomingForm();
      const [fields, files] = await form.parse(req);
      const comprovantePagamento = files.payRecibe[0];
      const sheetsName = fields.sheetsName[0];
      const nome = fields.nome[0];
      const email = fields.email[0];
      const telefone = fields.telefone[0];
      const data = fields.data[0];

      const mailOptions = {
         from: process.env.EMAIL_USER,
         to: "celene.recitec@donaverde.com.br",
         subject: 'Nova inscrição no site da EcoRecitec!',
         html: `
                    <p>Olá Celene,</p>
                    <p>Sou o bot feito para enviar as inscrições e comprovantes!</p>
                    <h2>Nova Inscrição Registrada no Evento</h2>
                    <ul>
                        <li><strong>Planilha:</strong> ${sheetsName}</li>
                        <li><strong>Nome:</strong> ${nome}</li>
                        <li><strong>Email:</strong> ${email}</li>
                        <li><strong>Telefone:</strong> ${telefone}</li>
                        <li><strong>Data:</strong> ${data}</li>                        
                    </ul>                    
                    <p>Comprovante de pagamento anexado.</p>
                    <br>
                    <br>                    
                    <img src="https://eco-recitec.com.br/images/logo/logo-recitec-02-02.png" />
                `,
         // Anexa o arquivo ao e-mail
         attachments: [
            {
               filename: comprovantePagamento.originalFilename,
               path: comprovantePagamento.filepath,
               contentType: comprovantePagamento.mimetype,
            },
         ],
      };
      await transporter.sendMail(mailOptions);

      // Remove o arquivo temporário após o envio do e-mail para evitar acúmulo de lixo
      fs.unlinkSync(comprovantePagamento.filepath);

      res.status(200).json({ message: "Menssagem enviada." });

   } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao enviar email." });
   }
};

export default init;