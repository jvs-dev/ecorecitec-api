import { google } from 'googleapis';
import Cors from 'cors';


const cors = Cors({
   methods: ['POST', 'GET', 'HEAD'],
   origin: '*', // Permite requisições de qualquer origem. Em produção, você deve restringir isso ao seu domínio.
});

// Helper para executar o middleware CORS
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

export default async function handler(req, res) {
   await runMiddleware(req, res, cors); // Executa o middleware CORS

   if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
   }

   const {
      nome, telefone, email, pais, cidade, cpf, linkedin, empresa, cargo,
      participationType, tituloPalestra, resumoPalestra, miniCurriculo,
      categoriaParceria, nivelPatrocinio,
      participar_ecossistema, participar_teste, disp_teste,
      indicacao, expectativas
   } = req.body;

   try {
      // 1. Autenticação com a API do Google Sheets
      const auth = new google.auth.GoogleAuth({
         credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            // Substitua '\\n' por '\n' real se sua chave privada estiver com esses caracteres escapados
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
         },
         scopes: ['https://www.googleapis.com/auth/spreadsheets'], // Escopo para acesso a planilhas
      });

      const authClient = await auth.getClient();
      const sheets = google.sheets({ version: 'v4', auth: authClient });

      const spreadsheetId = process.env.GOOGLE_SHEET_ID;
      const range = 'PALESTRANTES!A:Z'; // Nome da aba e range. Adapte 'PALESTRANTES' se sua aba tiver outro nome.

      // Garante que a ordem dos dados corresponda aos cabeçalhos da sua planilha
      const rowData = [
         new Date().toLocaleDateString('pt-BR'), // Data de envio
         nome,
         telefone,
         email,
         pais,
         cidade,
         cpf,
         linkedin,
         empresa,
         cargo,
         participationType,
         participationType === 'palestrante' || participationType == 'parceiro e palestrante' ? tituloPalestra : '',
         participationType === 'palestrante' || participationType == 'parceiro e palestrante' ? resumoPalestra : '',
         participationType === 'palestrante' || participationType == 'parceiro e palestrante' ? miniCurriculo : '',
         participationType === 'parceiro' || participationType == 'parceiro e palestrante' ? categoriaParceria : '',
         (participationType === 'parceiro' || participationType == 'parceiro e palestrante' && categoriaParceria === 'Patrocínio') ? nivelPatrocinio : '',
         participar_ecossistema,
         participar_teste,
         disp_teste,
         indicacao,
         expectativas
      ];

      // Inserir dados na planilha
      await sheets.spreadsheets.values.append({
         spreadsheetId,
         range,
         valueInputOption: 'RAW', // Mantém o formato original do valor
         resource: {
            values: [rowData],
         },
      });

      console.log('Dados do formulário adicionados à planilha do Google Sheets.');

      // Enviar e-mail (se o usuário desejar participar do ecossistema)
      // Reutilizando o objeto do corpo da requisição para as APIs externas
      const formObject = req.body; // O corpo da requisição já contém todos os dados do formulário

      let emailSent = false;
      if (formObject.participar_ecossistema === "Sim") {
         console.log("Usuário deseja participar do ecossistema. Enviando e-mail...");
         try {
            const emailResponse = await fetch("https://ecorecitec-api.vercel.app/api/submit", { // Endpoint da sua API de e-mail
               method: 'POST',
               headers: {
                  'Content-Type': 'application/json',
               },
               body: JSON.stringify(formObject),
            });
            if (emailResponse.ok) {
               console.log("E-mail de ecossistema enviado com sucesso.");
               emailSent = true;
            } else {
               console.error("Erro ao enviar e-mail de ecossistema:", await emailResponse.text());
            }
         } catch (emailError) {
            console.error("Erro de conexão ao enviar e-mail de ecossistema:", emailError);
         }
      }

      res.status(200).json({ message: 'Formulário enviado com sucesso para a planilha e e-mail!', emailSent: emailSent });

   } catch (error) {
      console.error('Erro ao processar formulário de palestrante/parceiro:', error);
      res.status(500).json({ error: error.message || 'Erro interno do servidor ao enviar formulário.' });
   }
}
