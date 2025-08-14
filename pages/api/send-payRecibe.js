const nodemailer = require('nodemailer');
const formidable = require('formidable');
const fs = require('fs'); // Importa o módulo File System para ler o arquivo

export const config = {
  api: {
    bodyParser: false,
  },
};

async function init(req, res) {
  // Libera CORS para qualquer origem
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Se for preflight, responde e encerra
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Agora sim processa o formidable
  const formidable = require('formidable');
  const fs = require('fs');
  const nodemailer = require('nodemailer');

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

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
        <h2>Nova Inscrição Registrada</h2>
        <ul>
          <li><strong>Planilha:</strong> ${sheetsName}</li>
          <li><strong>Nome:</strong> ${nome}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Telefone:</strong> ${telefone}</li>
          <li><strong>Data:</strong> ${data}</li>
        </ul>
        <p>Comprovante de pagamento anexado.</p>
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

    fs.unlinkSync(comprovantePagamento.filepath);

    res.status(200).json({ message: 'Mensagem enviada com sucesso.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Erro interno.' });
  }
}

export default init;