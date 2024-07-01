import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { routes } from './src/routes/apiRoutes.js';

const server = express();
const PORT = process.env.PORT || 3000;

server.use(cors());
server.use(morgan('dev'));
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

server.use('/api/v1', routes);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
