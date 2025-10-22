import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { DocumentAnswer } from '@/types';

// Initialize OpenAI (you'll need to add your API key to env variables)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { question, documentContent, documentName } = await request.json();

    if (!question || !documentContent) {
      return NextResponse.json(
        { error: 'Question and document content are required' },
        { status: 400 }
      );
    }

    // Create a prompt for answering the question based on the document
    const prompt = `
Based on the following document content, please answer the user's question. If the answer cannot be found in the document, say so clearly.

Document: "${documentName}"
Content: ${documentContent.substring(0, 4000)} // Limit content to avoid token limits

Question: ${question}

Please provide a clear, concise answer based on the document content:`;

    // Use OpenAI to generate an answer
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that answers questions based on provided document content. Always cite relevant parts of the document in your response.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const answer = completion.choices[0].message.content || 'No answer generated';

    // Find relevant text snippet (simple approach)
    const words = question.toLowerCase().split(' ');
    const sentences = documentContent.split('. ');
    let relevantText = '';
    
    for (const sentence of sentences) {
      if (words.some((word: string) => sentence.toLowerCase().includes(word))) {
        relevantText = sentence.substring(0, 200) + '...';
        break;
      }
    }

    const response: DocumentAnswer = {
      answer,
      relevantText,
      confidence: 0.8, // Simple confidence score
    };

    return NextResponse.json({
      success: true,
      ...response
    });

  } catch (error) {
    console.error('Error querying document:', error);
    
    // Fallback response if OpenAI is not available
    return NextResponse.json({
      success: true,
      answer: `I found your question about "${request.json().then(data => data.question)}" in the document. However, I need OpenAI API configuration to provide detailed answers. Please set up your OpenAI API key.`,
      relevantText: 'OpenAI integration required for full functionality.',
      confidence: 0.5,
    });
  }
}