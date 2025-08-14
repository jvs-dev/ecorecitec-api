import Cors from 'cors';

// Inicializa o middleware
const cors = Cors({
   methods: ['GET', 'HEAD', 'POST'],
   origin: '*'
});

// Função helper para rodar middlewares no Next.js
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
   await runMiddleware(req, res, cors);

   res.json({ message: 'CORS funcionando!' });
}