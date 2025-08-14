export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS liberado antes de tudo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responde imediatamente OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Bloqueia métodos que não sejam POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Daqui pra frente processa o formidable + nodemailer
  const nodemailer = require('nodemailer');
  const formidable = require('formidable');
  const fs = require('fs');

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
      to: "shepherdcom12@gmail.com", /* celene.recitec@donaverde.com.br */
      subject: 'Nova inscrição no site da EcoRecitec!',
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erro interno.' });
  }
}
