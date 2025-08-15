import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // 1. Verifique se o método HTTP é POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // 2. Extraia os dados do corpo da requisição (JSON)
    //    Não precisamos mais do formidable porque o arquivo não está sendo enviado diretamente.
    const { sheetsName, nome, email, telefone, data, fileUrl } = req.body;

    // 3. Configure o Nodemailer
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 4. Crie as opções do e-mail
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
                <li>URL do comprovante: ${fileUrl}</li>
            </ul>
        `,
        // 5. Anexe o arquivo usando o URL
        attachments: [
            {
                // Este é o nome que o arquivo terá quando o destinatário fizer o download
                filename: `comprovante-pagamento-${nome}.png`, 
                // A chave `path` é onde você coloca o URL do arquivo
                path: fileUrl, 
            },
        ],
    };

    // 6. Envie o e-mail
    try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: "Mensagem enviada com sucesso." });
    } catch (err) {
        console.error("Erro ao enviar email:", err);
        return res.status(500).json({ error: err.message || "Erro interno." });
    }
}