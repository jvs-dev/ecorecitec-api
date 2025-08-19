// pages/api/sendEventQrCode.js

const nodemailer = require('nodemailer');
import QRCode from 'qrcode';

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

        if (!Array.isArray(req.body)) {
            return res.status(400).json({ error: 'O corpo da requisição deve ser um array de pessoas.' });
        }

        const emailPromises = req.body.map(async (person) => {
            if (!person.id || !person.email || !person.nome) {
                console.warn('Dados de pessoa incompletos, pulando:', person);
                return { status: 'skipped', person };
            }

            const qrCodeBuffer = await generateQRCodeBuffer(person.id);
            if (!qrCodeBuffer) {
                console.error(`Falha ao gerar QR Code para ${person.id}, pulando envio do e-mail.`);
                return { status: 'error', person, error: 'Falha ao gerar o QR Code' };
            }

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: person.email,
                subject: 'Aqui está seu QR Code para o evento Circular Tech Skills!',
                html: `
                    <p>Olá ${person.nome},</p>
                    <p>Estamos cada vez mais perto do grandioso dia! Para garantir sua entrada no evento, guarde este QR Code que deverá ser mostrado na portaria.</p>
                    <img src="cid:qrcode_image" alt="QR Code para ${person.id}" />
                    <p>Código: <strong>${person.id}</strong></p>
                    <br>
                    <p>Atenciosamente,</p>
                    <p>Equipe EcoRecitec</p>
                    <img src="https://eco-recitec.com.br/images/logo/logo-recitec-02-02.png" alt="Logo EcoRecitec" style="width: 150px;" />
                `,
                // Adicionando o anexo do QR Code
                attachments: [{
                    filename: `qrcode-${person.id}.png`,
                    content: qrCodeBuffer,
                    contentType: 'image/png',
                    cid: 'qrcode_image' // Referência no HTML (Content-ID)
                }]
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log("E-mail enviado com sucesso para:", person.email);
                return { status: 'success', person };
            } catch (mailError) {
                console.error(`Erro ao enviar e-mail para ${person.email}:`, mailError);
                return { status: 'error', person, error: mailError.message };
            }
        });

        const results = await Promise.all(emailPromises);

        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        const skippedCount = results.filter(r => r.status === 'skipped').length;
        const errors = results.filter(r => r.status === 'error');

        res.status(200).json({
            message: "Processamento de e-mails concluído.",
            totalEmails: req.body.length,
            success: successCount,
            errors: errorCount,
            skipped: skippedCount,
            details: errors,
        });

    } catch (error) {
        console.error("Erro geral no servidor:", error);
        res.status(500).json({ error: error.message || "Erro interno do servidor ao processar o formulário." });
    }
}

export default handler;