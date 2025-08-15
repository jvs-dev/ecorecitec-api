import Cors from 'cors';
import formidable from 'formidable';
import nodemailer from 'nodemailer';
import fs from 'fs';

// Configuração do CORS
const cors = Cors({
   methods: ['POST', 'OPTIONS'],
   origin: '*', // Permitir todas as origens
});

// Helper para rodar o middleware
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
   },
};

export default async function handler(req, res) {
   // 1. Rodar o middleware CORS primeiro
   await runMiddleware(req, res, cors);

   // O middleware CORS já tratou o método OPTIONS.
   // Agora, verificamos apenas o POST.
   if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
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

      // Seus campos do formulário
      const comprovantePagamento = files.payRecibe;
      const sheetsName = fields.sheetsName;
      // ... (resto dos seus campos)

      const mailOptions = {
         // ... (suas opções de email)
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