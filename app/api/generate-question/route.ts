// import { openai } from '@ai-sdk/openai';
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';

import { generateText } from 'ai';

const bedrock = createAmazonBedrock({
  region: 'ap-northeast-1',
  credentialProvider: fromNodeProviderChain(),
});


export async function POST(req: Request) {
  const { previousQuestions = [] } = await req.json();

  const previousQuestionsText = previousQuestions.length > 0 
    ? `\n\nPrevious questions already asked (DO NOT repeat these topics):\n${previousQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
    : '';

  const result = await generateText({
    model: bedrock('openai.gpt-oss-20b-1:0'),
    prompt: `Generate a single SHORT immigration officer question for English conversation practice. 
    Return ONLY a JSON object with this exact format:
    {
      "question": "English question",
      "questionJa": "Japanese translation", 
      "sampleAnswer": "Sample English answer",
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
    
    Use these examples as reference for question length and style:
    - "What is the purpose of your visit?"
    - "How long will you stay in the U.S.?"
    - "Where will you stay?"
    - "Do you have a return ticket?"
    - "Who are you traveling with?"
    - "What do you do for work?"
    - "Have you been to the U.S. before?"
    - "How much money are you carrying?"
    - "Are you bringing any food or agricultural products?"
    
    Keep questions SHORT and direct like these examples. You can use these exact questions or create similar ones.${previousQuestionsText}
    
    Generate a DIFFERENT topic/approach from any previous questions listed above.`,
  });

  try {
    const questionData = JSON.parse(result.text);
    return Response.json(questionData);
  } catch {
    return Response.json({ error: 'Failed to generate question' }, { status: 500 });
  }
}
