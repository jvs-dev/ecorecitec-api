// pages/api/process-inscription.js

export default async function handler(req, res) {
   // Configura os cabeçalhos CORS
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

   if (req.method === 'OPTIONS') {
      return res.status(200).end();
   }

   if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido. Apenas POST é suportado.' });
   }

   const formData = req.body; // Os dados do formulário vêm no corpo da requisição

   console.log('Recebido no /api/process-inscription:', formData);

   try {
      // 1. Enviar dados para a API Flask (https://api-form-flask.onrender.com/submit)
      const flaskResponse = await fetch("https://api-form-flask.onrender.com/submit", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(formData),
      });

      if (!flaskResponse.ok) {
         const errorData = await flaskResponse.json().catch(() => ({ message: 'Erro desconhecido na API Flask.' }));
         console.error('Erro ao enviar para API Flask:', errorData);
         // Você pode optar por parar aqui ou tentar enviar o e-mail mesmo com erro no Flask
         // Para este exemplo, vamos continuar para o e-mail, mas logar o erro.
      } else {
         console.log('Dados enviados para API Flask com sucesso.');
      }

      // 2. Enviar dados para a API de e-mail (https://ecorecitec-api.vercel.app/api/submit)
      const emailResponse = await fetch("https://ecorecitec-api.vercel.app/api/submit", {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(formData),
      });

      if (!emailResponse.ok) {
         const errorData = await emailResponse.json().catch(() => ({ message: 'Erro desconhecido na API de e-mail.' }));
         console.error('Erro ao enviar e-mail via API:', errorData);
         return res.status(500).json({ success: false, message: 'Inscrição processada, mas houve um erro ao enviar o e-mail de confirmação.', details: errorData });
      } else {
         console.log('E-mail enviado com sucesso via API.');
      }

      // Se tudo ocorreu bem, retorna sucesso
      return res.status(200).json({ success: true, message: 'Inscrição processada e e-mail enviado com sucesso!' });

   } catch (error) {
      console.error('Erro no processamento da inscrição no backend:', error);
      return res.status(500).json({ success: false, message: 'Erro interno ao processar a inscrição.', details: error.message });
   }
}
