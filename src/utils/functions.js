import { openai } from '../config/apiOpenAI.js';

async function getCurrentWeather(location) {
  const response = await fetch(
    `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${location}&aqi=no`,
  );
  const weatherInfo = await response.json();

  return JSON.stringify(weatherInfo);
}

async function runConversation(question) {
  let response = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo-0613',
    messages: [{ role: 'user', content: question }],
    functions: [
      {
        name: 'getCurrentWeather',
        description: 'Get the current weather in a given location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The city, eg: Madrid, Barcelona',
            },
          },
          required: ['location'],
        },
      },
    ],
    function_call: 'auto',
  });

  let message = response.data.choices[0].message;

  console.log(message.function_call);
  if (message.function_call) {
    let functionName = message.function_call.name;
    const parameters = JSON.parse(message.function_call.arguments);
    let functionResponse = await getCurrentWeather(parameters.location);

    let secondResponse = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo-0613',
      messages: [
        {
          role: 'user',
          content: `
          Responde en castellano en este formato: 
          El pronóstico del tiempo en {location} es {tiempo general}
          Temperatura: {temperatura en celsius}
          Sensación de mucho calor: Sí | No
          Viento: Ninguno | Poco | Mucho | Pelgroso
          Paraguas: Sí | No
          `,
        },
        message,
        { role: 'function', name: functionName, content: functionResponse },
      ],
    });

    return secondResponse.data.choices[0].message;
  }
}

runConversation('¿Cuál es el tiempo en Sevilla?')
  .then(response => console.log({ response }))
  .catch(err => console.log(err));
