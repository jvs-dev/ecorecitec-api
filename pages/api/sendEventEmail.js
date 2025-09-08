const nodemailer = require('nodemailer');
const path = require('path'); // 1. Importe o módulo 'path'

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
});

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

      // 2. Construa o caminho absoluto para o vídeo
      const videoPath = path.join(process.cwd(), 'public', 'video_congresso.mp4');

      const emailPromises = req.body.map(async (person) => {
          if (!person.id || !person.email || !person.nome) {
            console.warn('Dados de pessoa incompletos, pulando:', person);
            return { status: 'skipped', person };
          }
          const mailOptions = {
              from: process.env.EMAIL_USER,
              to: person.email,
              subject: 'Agradecemos Sua Participação!',
              html: `
                <p>Olá ${person.nome},</p>
                <p>Nós da EcoRecitec – Economia Circular, Sustentabilidade e Tecnologia, em parceria com a FIEB – Federação das Indústrias do Estado da Bahia, agradecemos profundamente sua presença no I Congresso Internacional Circular Tech Skills, realizado nos dias 4 e 5 de setembro de 2025.<br>
                  Sua participação — como palestrante, apoiador ou congressista — foi essencial para o sucesso deste encontro que marcou um novo capítulo na promoção da economia circular, da inovação e da transformação sustentável.<br>
                  Para aqueles que desejam continuar fazendo parte desta jornada, convidamos você a se inscrever no Ecossistema Circular Tech Skills. Neste espaço colaborativo, você poderá:<br>
                  Realizar a avaliação do grau de circularidade individual,  e acompanhar o grau de circularidade do Ecossistema em evolução.<br>
                  Ter acesso contínuo a palestras, cursos e conteúdos exclusivos sobre Economia Circular e ESG<br>
                  Aproveitar condições especiais de inscrição para a II Edição do Congresso Internacional Circular Tech Skills<br>
                  🌱 Juntos, seguimos construindo pontes entre conhecimento, prática e impacto. Aguardem uma nova correspondência com mais detalhes e novidades!<br>
                  Em um prazo de até 8 dias úteis estaremos  enviando os certificados.</p>
              `,
              attachments: [{
                  filename: `video_congresso.mp4`, // 3. Corrija o nome do arquivo
                  path: videoPath,                      // 4. Use a propriedade 'path' com o caminho absoluto
                  contentType: 'video/mp4',
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