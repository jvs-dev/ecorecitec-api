import Cors from 'cors';

export default function initMiddleware() {
  return Cors({
    methods: ['GET', 'POST', 'OPTIONS'], // Métodos permitidos
  });
}