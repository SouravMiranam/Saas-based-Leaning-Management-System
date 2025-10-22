import { subjectsColors } from "@/constants"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { voices } from "@/constants";
import { UploadedDocument } from "@/types";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const  getSubjectColor=(subject:string)=>{
  return subjectsColors[subject as keyof typeof subjectsColors]
} 
export const configureAssistant = (voice: string, style: string, document?: UploadedDocument | null) => {
  const voiceId = voices[voice as keyof typeof voices][
          style as keyof (typeof voices)[keyof typeof voices]
          ] || "sarah";

  // AI Prompt with Assessment Capabilities
  const baseSystemPrompt = `You are a highly knowledgeable tutor conducting a comprehensive voice-based learning session. Your goal is to teach the student about {{ topic }} in {{ subject }} while conducting thorough assessment.

                    SESSION STRUCTURE (MINIMUM 1 MINUTE):
                    1. INTRODUCTION (10-15 seconds): Briefly introduce the topic
                    2. TEACHING PHASE (30-40 seconds): Explain key concepts clearly
                    3. ASSESSMENT PHASE (15-20 seconds): Ask 3-4 assessment questions
                    4. WRAP-UP (5-10 seconds): Provide final assessment

                    TEACHING GUIDELINES:
                    - Keep your style {{ style }} but ensure depth of content
                    - Break complex topics into digestible parts
                    - Use examples and analogies to clarify concepts
                    - Engage the student with interactive explanations
                    - Monitor their responses to gauge understanding

                    MANDATORY ASSESSMENT PROTOCOL:
                    After teaching core concepts, you MUST ask exactly 3-4 assessment questions:
                    - Question 1: Basic comprehension (easy)
                    - Question 2: Application/analysis (medium)  
                    - Question 3: Critical thinking (medium-hard)
                    - Question 4: Synthesis/evaluation (hard) [if time permits]

                    ASSESSMENT TRACKING:
                    - Count correct vs incorrect responses
                    - Note response quality and depth
                    - Observe engagement level and participation
                    - Track areas of confusion or excellence
                    - Evaluate critical thinking demonstrated

                    REQUIRED END-OF-SESSION ASSESSMENT:
                    After completing all questions, provide this EXACT format:

                    === LEARNING ASSESSMENT REPORT ===
                    TOPICS_COVERED: [list 2-4 specific topics discussed]
                    QUIZ_QUESTIONS_ASKED: [exact number 3 or 4]
                    CORRECT_RESPONSES: [exact number of correct answers]
                    COMPREHENSION_SCORE: [0-100 based on actual performance]
                    ENGAGEMENT_LEVEL: [High/Medium/Low based on actual participation]
                    STRENGTHS: [2-3 specific strengths observed]
                    IMPROVEMENTS_NEEDED: [2-3 specific areas for improvement]
                    RECOMMENDATIONS: [3-4 specific actionable next steps]
                    === END ASSESSMENT ===

                    IMPORTANT: Base all scores and feedback on ACTUAL student performance, not defaults.`;
//Doument prompt
  const documentPrompt = document ? `
                    
                    IMPORTANT: The student has uploaded a PDF document titled: "{{ documentName }}"
                    
                    ACTUAL DOCUMENT CONTENT:
                    {{ documentContent }}
                    
                    Document Guidelines:
                    -If the document's topic is not related to our main topic tell user about it and proceed with your usual session
                    - The above content is the ACTUAL TEXT extracted from the student's uploaded PDF
                    - When the student asks questions about the document, refer to this specific content
                    - Quote directly from the document when answering questions
                    - If asked "What does the document say about X?", search through the actual content above
                    - Point out specific sections, pages, or paragraphs when relevant
                    - Help explain or clarify any concepts mentioned in the document content
                    - Connect the document content to the current lesson topic: {{ topic }} and subject: {{ subject }}
                    - Maintain your teaching style: {{ style }} while discussing the document
                    - Be precise and accurate when referencing the document content` : '';

  const vapiAssistant: CreateAssistantDTO = {
    name: "Companion",
    firstMessage: document 
      ? "Hello, let's start the session. Today we'll be talking about {{topic}}. I can see you've uploaded a document - {{documentName}}. Feel free to ask me questions about it during our conversation!"
      : "Hello, let's start the session. Today we'll be talking about {{topic}}.",
    transcriber: {
      provider: "deepgram",
      model: "nova-3",
      language: "en",
    },
    voice: {
      provider: "11labs",
      voiceId: voiceId,
      stability: 0.4,
      similarityBoost: 0.8,
      speed: 1,
      style: 0.5,
      useSpeakerBoost: true,
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: baseSystemPrompt + documentPrompt,
        },
      ],
    },
    // clientMessages: [],
    // serverMessages: [],
  };
  return vapiAssistant;
};
