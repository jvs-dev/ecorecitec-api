const nodemailer = require("nodemailer");
const formidable = require("formidable");
const fs = require("fs");
import Cors from 'cors';

// Inicialize o middleware CORS
const cors = Cors({
   methods: ['POST', 'OPTIONS'],
   origin: '*', // Permitir de qualquer origem, ou especifique a sua
});

// Função para executar o middleware
function runMiddleware(req, res, fn) {
   return new Promise((resolve, reject) => {
      fn(req, res, (result) => {
         if (result instanceof Error) {
            return reject(result);
         }
         return resolve(result);
      });
   });
}

export const config = {
   api: {
      bodyParser: false,
      externalResolver: true, // Permite que o Next.js resolva a resposta de forma assíncrona
      sizeLimit: "10mb", // Limite de tamanho do arquivo
      responseLimit: "10mb", // Limite de tamanho da resposta
   },
};

export default async function handler(req, res) {
   await runMiddleware(req, res, cors);

   // Seu código para o método OPTIONS já não é mais necessário aqui, o middleware cuida disso
   // ... restante do seu código
   if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
   }

   const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
         user: process.env.EMAIL_USER,
         pass: process.env.EMAIL_PASS,
      },
   });

   try {
      const form = new formidable.IncomingForm();

      const parseForm = () =>
         new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
               if (err) reject(err);
               else resolve({ fields, files });
            });
         });

      const { fields, files } = await parseForm();

      const comprovantePagamento = files.payRecibe;
      const sheetsName = fields.sheetsName;
      const nome = fields.nome;
      const email = fields.email;
      const telefone = fields.telefone;
      const data = fields.data;

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

      return res.status(200).json({ message: "Mensagem enviada com sucesso." });
   } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message || "Erro interno." });
   }
}
