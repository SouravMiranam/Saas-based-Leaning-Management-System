import { NextRequest, NextResponse } from 'next/server';
import { UploadedDocument } from '@/types';

// Dynamic import to avoid issues
async function extractPDFText(buffer: ArrayBuffer): Promise<string> {
  try {
    // Dynamic import of pdf-parse-new
    const pdfParse = await import('pdf-parse-new');
    const pdf = pdfParse.default || pdfParse;
    
    // Convert ArrayBuffer to Buffer
    const nodeBuffer = Buffer.from(buffer);
    
    // Parse PDF and extract text
    const data = await pdf(nodeBuffer);
    
    // Clean and format the extracted text
    const cleanText = data.text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters except newlines
      .trim();
    
    return cleanText;
  } catch (error) {
    console.error('PDF parsing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Convert file to array buffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Extract actual text content from PDF
    let extractedText;
    try {
      extractedText = await extractPDFText(arrayBuffer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json(
        { error: `Could not extract text from PDF: ${errorMessage}. The PDF might be password-protected, corrupted, or image-based.` },
        { status: 400 }
      );
    }

    // Validate extracted text
    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        { error: 'No readable text content found in PDF. The file might be image-based (scanned) or empty.' },
        { status: 400 }
      );
    }

    // Truncate text if too long (to avoid token limits)
    const maxLength = 8000; // Reasonable limit for AI processing
    const finalText = extractedText.length > maxLength 
      ? extractedText.substring(0, maxLength) + '\n\n[Note: Content truncated due to length...]'
      : extractedText;

    // Generate unique ID for this document
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create processed document with actual extracted text
    const processedDocument: UploadedDocument = {
      id: documentId,
      name: file.name,
      content: finalText,
      uploadedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      document: processedDocument,
      message: `✅ PDF text extracted successfully! Found ${extractedText.length} characters of content from "${file.name}". Your AI companion can now answer questions about the actual document content.`
    });

  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: `Failed to process PDF file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}