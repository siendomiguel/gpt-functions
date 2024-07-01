import { Router } from 'express';
import { openai } from '../config/apiOpenAI.js';
import {
  createThread,
  getAssistant,
  deleteThread,
  runAssistant,
} from '../utils/assistant.js';

export const routes = Router();

routes.get('/assistant/:id', async (req, res) => {
  const assistantId = req.params.id;
  const assistant = await getAssistant(assistantId);
  res.send(assistant);
});

routes.post('/assistant', async (req, res) => {
  const { message, threadId, userID } = req.body;
  const resAssitant = await runAssistant(threadId, message, userID);
  console.log('respuesta del asistente: ---', resAssitant);
  res.send(resAssitant);
});

routes.post('/delete-thread/:id', async (req, res) => {
  const threadId = req.params.id;
  await deleteThread(threadId);
  res.send('ok hilo eliminado');
});
