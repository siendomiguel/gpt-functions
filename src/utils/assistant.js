import { openai } from '../config/apiOpenAI.js';

async function get_weather(location) {
  console.log('usando API clima');
  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${location}&aqi=no`,
    );
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const weatherInfo = await response.json();
    return JSON.stringify(weatherInfo);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

async function getConsulta(userID) {
  try {
    const response = await fetch(
      `https://firebase-db-development.up.railway.app/v1/consulta/${userID}`,
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch consultation details for ID: ${userID}`);
    }
    const consultaDetails = await response.json();
    return consultaDetails;
  } catch (error) {
    console.error(`Error fetching consultation details: ${error}`);
    throw error;
  }
}

// Crear hilo en caso de necesitarse ✅
export async function createThread() {
  try {
    const thread = await openai.beta.threads.create();
    return thread.id;
  } catch (error) {
    console.error('Error creating thread:', error);
    throw error;
  }
}

// Eliminar un hilo
export async function deleteThread(threadId) {
  try {
    await openai.beta.threads.del(threadId);
    console.log('Hilo eliminado');
    return true;
  } catch (error) {
    // Manejar específicamente el error de "thread no encontrado"
    if (
      error.status === 404 ||
      error.message.includes('No thread found with id')
    ) {
      console.warn(
        `El hilo con ID ${threadId} no existe o ya ha sido eliminado.`,
      );
      return false; // O cualquier otra lógica que necesites
    }
    // Otros errores
    console.error('Error deleting thread:', error);
    throw error; // O maneja otros tipos de errores según tus necesidades
  }
}

//Obtener al asistente ✅
export async function getAssistant(assistantId) {
  console.log(assistantId);
  try {
    const assistant = await openai.beta.assistants.retrieve(assistantId);
    return assistant;
  } catch (error) {
    console.error('Error getting assistant:', error);
    throw error;
  }
}

// Agregar mensaje al hilo ✅
async function addMessageToThread(threadId, message) {
  try {
    const messageResponse = await openai.beta.threads.messages.create(
      threadId,
      {
        role: 'user',
        content: message,
      },
    );
    return messageResponse;
  } catch (error) {
    console.error('Error adding message to thread:', error);
    throw error;
  }
}

// Obtener respuesta del asistente
async function getAssistantResponse(assistantId, threadId) {
  console.log('thinking...');
  try {
    const run = await openai.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });
    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        run.id,
      );
      console.log('status:', runStatus.status);
      if (runStatus.status === 'completed') {
        break;
      }
      console.log('waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    const messages = await openai.beta.threads.messages.list(threadId);
    const messageAssistant = messages.data[0].content[0].text.value;
    return messageAssistant;
  } catch (error) {
    console.error('Error getting assistant response:', error);
    throw error;
  }
}

// Función para correr el asistente
/* export async function runAssistant(threadId, messageUser) {
  const assistantId = process.env.ASSISTANT_ID;
  try {
    if (!threadId) {
      console.log('threadId es nulo o indefinido, creando nuevo hilo...');
      threadId = await createThread();
    }
    await addMessageToThread(threadId, messageUser);
    const lastMessage = await getAssistantResponse(assistantId, threadId);

    console.log(lastMessage);
    console.log('🟢🟢 Asistente');
    return lastMessage;
  } catch (error) {
    console.error('Error running assistant:', error);
    throw error;
  }
} */

/* export async function runAssistant(threadId, messageUser) {
  const assistantId = process.env.ASSISTANT_ID;
  try {
    console.log('Valor inicial de threadId:', threadId);

    if (!threadId) {
      console.log('threadId es nulo o indefinido, creando nuevo hilo...');
      threadId = await createThread();
      console.log('Adentro del if', 'threadId', threadId);
    }

    console.log('Fuera del if', 'threadId', threadId);
    await addMessageToThread(threadId, messageUser);
    const initialResponse = await getAssistantResponse(assistantId, threadId);

    // Verifica si la respuesta incluye una llamada a función
    let response;
    try {
      response = JSON.parse(initialResponse);
    } catch (parseError) {
      console.log('Respuesta inicial no es JSON:', initialResponse);
      return initialResponse;
    }

    if (response.function_call) {
      const functionName = response.function_call.name;
      const parameters = JSON.parse(response.function_call.arguments);
      let functionResponse;

      if (functionName === 'getCurrentWeather') {
        functionResponse = await getCurrentWeather(parameters.location);
      }

      const finalMessage = await openai.beta.threads.messages.create(threadId, {
        role: 'function',
        name: functionName,
        content: functionResponse,
      });

      const lastMessage = await getAssistantResponse(assistantId, threadId);
      console.log(lastMessage);
      console.log('🟢🟢 Asistente');
      return lastMessage;
    }

    console.log(initialResponse);
    console.log('🟢🟢 Asistente');
    return initialResponse;
  } catch (error) {
    console.error('Error running assistant:', error);
    throw error;
  }
}
 */

export async function runId(threadId, assistantId) {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
  return run.id;
}

/* export async function runAssistant(threadId, messageUser) {
  const assistantId = process.env.ASSISTANT_ID;
  return new Promise(async (resolve, reject) => {
    try {
      if (!threadId) {
        console.log('threadId es nulo o indefinido, creando nuevo hilo...');
        threadId = await createThread();
      }

      await addMessageToThread(threadId, messageUser);

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
      });

      const intervalId = setInterval(async () => {
        try {
          const runStatus = await openai.beta.threads.runs.retrieve(
            threadId,
            run.id,
          );

          if (runStatus.status === 'completed') {
            clearInterval(intervalId);
            const messages = await openai.beta.threads.messages.list(threadId);

            const messageAssistant = messages.data[0].content[0].text.value;
            resolve(messageAssistant);
          } else if (runStatus.status === 'requires_action') {
            const requiredActions =
              runStatus.required_action.submit_tool_outputs.tool_calls;

            let toolsOutput = [];

            for (const action of requiredActions) {
              const funcName = action.function.name;
              const functionArguments = JSON.parse(action.function.arguments);

              if (funcName === 'get_weather') {
                const output = await get_weather(functionArguments.location);
                toolsOutput.push({
                  tool_call_id: action.id,
                  output: JSON.stringify(output),
                });
              } else {
                console.log('Function not found');
              }
            }

            // Submit the tool outputs to Assistant API
            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
              tool_outputs: toolsOutput,
            });
          } else {
            console.log('Run is not completed yet.');
          }
        } catch (error) {
          console.error('Error during run status check:', error);
          clearInterval(intervalId);
          reject(error);
        }
      }, 10000);
    } catch (error) {
      console.error('Error running assistant:', error);
      reject(error);
    }
  });
}
 */

export async function runAssistant(threadId, messageUser, userID, assistantId) {
  const assistant_Id = assistantId || process.env.ASSISTANT_ID;
  const combinedMessage = `${messageUser} [UserID: ${userID}]`; // Concatenar el userID al mensaje del usuario

  return new Promise(async (resolve, reject) => {
    try {
      if (!threadId) {
        console.log('threadId es nulo o indefinido, creando nuevo hilo...');
        threadId = await createThread();
      }

      await addMessageToThread(threadId, combinedMessage);

      const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistant_Id,
      });

      try {
        while (true) {
          const runStatus = await openai.beta.threads.runs.retrieve(
            threadId,
            run.id,
          );

          if (runStatus.status === 'completed') {
            const messages = await openai.beta.threads.messages.list(threadId);

            const messageAssistant = messages.data[0].content[0].text.value;
            resolve(messageAssistant);
            break;
          } else if (runStatus.status === 'requires_action') {
            const requiredActions =
              runStatus.required_action.submit_tool_outputs.tool_calls;

            let toolsOutput = [];

            for (const action of requiredActions) {
              const funcName = action.function.name;
              const functionArguments = JSON.parse(action.function.arguments);

              if (funcName === 'get_consulta') {
                const output = await getConsulta(userID);
                toolsOutput.push({
                  tool_call_id: action.id,
                  output: JSON.stringify(output),
                });
              } else {
                console.log('Function not found');
              }
            }

            // Submit the tool outputs to Assistant API
            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
              tool_outputs: toolsOutput,
            });
          } else {
            console.log('Run is not completed yet.');
          }

          console.log('waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error during run status check:', error);
        reject(error);
      }
    } catch (error) {
      console.error('Error running assistant:', error);
      reject(error);
    }
  });
}
