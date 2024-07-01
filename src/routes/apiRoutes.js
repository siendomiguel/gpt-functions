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
  const { message, threadId, userID, assistantId } = req.body;
  try {
    const resAssitant = await runAssistant(
      threadId,
      message,
      userID,
      assistantId,
    );
    console.log('respuesta del asistente: ---', resAssitant);
    res.json({ response: resAssitant });
  } catch (error) {
    console.error('Error al ejecutar el asistente:', error);
    res
      .status(500)
      .json({ error: 'Ocurrió un error al procesar la solicitud' });
  }
});

routes.post('/delete-thread/:id', async (req, res) => {
  const threadId = req.params.id;
  await deleteThread(threadId);
  res.send('ok hilo eliminado');
});
