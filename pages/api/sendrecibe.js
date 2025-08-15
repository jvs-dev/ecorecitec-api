const nodemailer = require('nodemailer');
const formidable = require('formidable'); // Importa a biblioteca formidable
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
   res.setHeader('Access-Control-Allow-Origin', '*');
   if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.status(200).end();
      return;
   }

   try {
      // Cria uma nova instância da classe IncomingForm, a forma correta de usar o formidable em versões recentes.
      const form = new formidable.IncomingForm();

      // Processa a requisição e retorna os campos e arquivos usando await, o que simplifica o código.
      const [fields, files] = await form.parse(req);

      // Acessa o comprovante de pagamento a partir dos arquivos
      const comprovantePagamento = files.payRecibe[0];

      // Acessa os outros campos do formulário
      const nome = fields.nome[0];
      const email = fields.email[0];
      const telefone = fields.telefone[0];
      const data = fields.data[0];
      const sheetsName = fields.sheetsName[0];

      const mailOptions = {
         from: process.env.EMAIL_USER,
         to: "shepherdcom12@gmail.com", // E-mail do pagador/inscrito
         subject: `Nova inscrição na planilha ${sheetsName}!`,
         html: `
                  <p>Olá, Celene</p>                    
                  <h2>Nova Inscrição em ${sheetsName}</h2>
                  <ul>
                     <li>Planilha: ${sheetsName}</li>
                     <li>Nome: ${nome}</li>
                     <li>Email: ${email}</li>
                     <li>Telefone: ${telefone}</li>
                     <li>Data: ${data}</li>               
                  </ul>        
                  <img src="https://eco-recitec.com.br/images/logo/logo-recitec-02-02.png" />
                `,
         
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
