import { NextRequest, NextResponse } from 'next/server';
import { DocumentAnswer } from '@/types';

// OpenAI is optional - if not configured, we'll use fallback responses
let openai: any = null;


if (process.env.OPENAI_API_KEY) {
  try {
    const { OpenAI } = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI initialized successfully');
  } catch (error) {
    console.warn('OpenAI could not be initialized:', error);
  }
} else {
  console.log('OpenAI API key not found - using fallback responses');
}

export async function POST(request: NextRequest) {
  try {
    const { question, documentContent, documentName } = await request.json();

    if (!question || !documentContent) {
      return NextResponse.json(
        { error: 'Question and document content are required' },
        { status: 400 }
      );
    }

    //Prompt
    const prompt = `
Based on the following document content, please answer the user's question. If the answer cannot be found in the document, say so clearly.

Document: "${documentName}"
Content: ${documentContent.substring(0, 4000)} // Limit content to avoid token limits

Question: ${question}

Please provide a clear, concise answer based on the document content:`;

    let answer = '';

  
    if (openai) {
      try {
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
        answer = completion.choices[0].message.content || 'No answer generated';
      } catch (error) {
        console.error('OpenAI API error:', error);
        answer = `I found information related to "${question}" in the document, but I'm having trouble processing it with AI right now. Please try asking your AI companion about this document during a voice conversation for the best results.`;
      }
    } else {
      // Fallback response when OpenAI is not available
      answer = `I found your question about "${question}" in the document "${documentName}". Since OpenAI is not configured, I recommend asking your AI companion about this document during a voice conversation for detailed answers and analysis.`;
    }

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
    console.error('Error processing document query:', error);
    
    // Enhanced fallback response
    return NextResponse.json({
      success: true,
      answer: `I encountered an issue while processing your question about the document. For the best experience with document analysis, please use the voice conversation feature with your AI companion, which provides advanced document understanding capabilities.`,
      relevantText: 'Please try asking your AI companion about this document during a voice session.',
      confidence: 0.3,
    });
  }
}