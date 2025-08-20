// pages/api/sendEventQrCode.js
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
const nodemailer = require('nodemailer');
import QRCode from 'qrcode';

const firebaseConfig = {
   apiKey: `${process.env.FIREBASE_API_KEY}`,
   authDomain: `${process.env.FIREBASE_AUTH_DOMAIN}`,
   projectId: `${process.env.FIREBASE_PROJECT_ID}`,
   storageBucket: `${process.env.FIREBASE_STORAGE_BUCKET}`,
   messagingSenderId: `${process.env.FIREBASE_MESSAGING_SENDER_ID}`,
   appId: `${process.env.FIREBASE_APP_ID}`,
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuração do transporter de e-mail (usando variáveis de ambiente)
const transporter = nodemailer.createTransport({
   service: 'gmail',
   auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
   },
});

// Função para gerar o QR Code como um Buffer (formato binário)
async function generateQRCodeBuffer(text) {
   try {
      // Usa o método toBuffer para obter os dados da imagem em formato binário
      const qrCodeBuffer = await QRCode.toBuffer(text, { type: 'png', scale: 10 });
      return qrCodeBuffer;
   } catch (error) {
      console.error('Erro ao gerar QR Code como buffer:', error);
      return null;
   }
}

async function handler(req, res) {
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

   if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
   }

   if (req.method !== 'POST') {
      res.status(405).json({ message: 'Método não permitido.' });
      return;
   }

   try {
      console.log("Dados recebidos no backend:", req.body);

      if (!req.body.email || !req.body.nome || !req.body.cpf) {
         console.warn('Dados de pessoa incompletos, pulando:', req.body);
         return { status: 'skipped:' + req.body };
      }

      const docRef = await addDoc(collection(db, "inscritos"), {
         "nome": req.body.nome,
         "email": req.body.email,
         "cpf": req.body.cpf,
         "telefone": req.body.telefone,
         "pais": req.body.pais,
         "cidade": req.body.cidade,
         "autorização imagem": req.body.participar_teste,
         "tratamento de dados": req.body.disp_teste,

      });

      const qrCodeBuffer = await generateQRCodeBuffer(docRef.id);
      if (!qrCodeBuffer) {
         console.error(`Falha ao gerar QR Code para ${docRef.id}, pulando envio do e-mail.`);
         return { status: 'error' + req.body, error: 'Falha ao gerar o QR Code' };
      }

      const mailOptions = {
         from: process.env.EMAIL_USER,
         to: req.body.email,
         subject: 'Aqui está seu QR Code para o evento Circular Tech Skills!',
         html: `
            <p>Olá ${req.body.nome},</p>
            <p>Estamos cada vez mais perto do grandioso dia! Para garantir sua entrada no evento, guarde este QR Code que deverá ser mostrado na portaria.</p>
            <img src="cid:qrcode_image" alt="QR Code para ${docRef.id}" />
            <p>Código: <strong>${docRef.id}</strong></p>
            <br>
            <p>Atenciosamente,</p>
            <p>Equipe EcoRecitec</p>
            <img src="https://eco-recitec.com.br/images/logo/logo-recitec-02-02.png" alt="Logo EcoRecitec" style="width: 150px;" />
         `,
         // Adicionando o anexo do QR Code
         attachments: [{
            filename: `qrcode-${docRef.id}.png`,
            content: qrCodeBuffer,
            contentType: 'image/png',
            cid: 'qrcode_image' // Referência no HTML (Content-ID)
         }]
      };

      try {
         await transporter.sendMail(mailOptions);
         console.log("E-mail enviado com sucesso para:", req.body.email);
         return { status: 'success' + req.body };
      } catch (mailError) {
         console.error(`Erro ao enviar e-mail para ${req.body.email}:`, mailError);
         return { status: 'error' + req.body, error: mailError.message };
      }

   } catch (error) {
      console.error("Erro geral no servidor:", error);
      res.status(500).json({ error: error.message || "Erro interno do servidor ao processar o formulário." });
   }
}

export default handler;