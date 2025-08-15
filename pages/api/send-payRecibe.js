export const config = {
   api: {
      bodyParser: false, // importante para formidable
   },
};

export default async function handler(req, res) {
   // CORS - liberar tudo
   res.setHeader("Access-Control-Allow-Origin", "*");
   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
   res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept"
   );

   // Resposta rápida para preflight OPTIONS
   if (req.method === "OPTIONS") {
      return res.status(200).end();
   }

   // Bloquear métodos não permitidos
   if (req.method !== "POST") {
      return res.status(405).json({ message: "Method Not Allowed" });
   }

   const nodemailer = require("nodemailer");
   const formidable = require("formidable");
   const fs = require("fs");

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
