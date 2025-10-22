// type User = {
//   name: string;
//   email: string;
//   image?: string;
//   accountId: string;
// };

enum Subject {
  maths = "maths",
  language = "language",
  science = "science",
  history = "history",
  coding = "coding",
  geography = "geography",
  economics = "economics",
  finance = "finance",
  business = "business",
}

type Companion = Models.DocumentList<Models.Document> & {
  $id: string;
  name: string;
  subject: Subject;
  topic: string;
  duration: number;
  bookmarked: boolean;
};

interface CreateCompanion {
  name: string;
  subject: string;
  topic: string;
  voice: string;
  style: string;
  duration: number;
}

interface GetAllCompanions {
  limit?: number;
  page?: number;
  subject?: string | string[];
  topic?: string | string[];
}

interface BuildClient {
  key?: string;
  sessionToken?: string;
}

interface CreateUser {
  email: string;
  name: string;
  image?: string;
  accountId: string;
}

interface SearchParams {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface Avatar {
  userName: string;
  width: number;
  height: number;
  className?: string;
}


interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

interface CompanionComponentProps {
  companionId: string;
  subject: string;
  topic: string;
  name: string;
  userName: string;
  userImage: string;
  voice: string;
  style: string;
}

interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  uploadedAt: Date;
}

interface DocumentQuery {
  question: string;
  documentId: string;
}

interface DocumentAnswer {
  answer: string;
  relevantText: string;
  confidence: number;
}

interface QuizQuestion {
  question: string;
  userAnswer: string;
  isCorrect: boolean;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timestamp: Date;
}

interface AssessmentData {
  studentName: string;
  subject: string;
  sessionDate: string;
  sessionDuration: number;
  topicsCovered: string[];
  quizQuestions: QuizQuestion[];
  comprehensionScore: number;
  accuracyRate: number;
  engagementLevel: 'High' | 'Medium' | 'Low';
  engagementScore: number;
  strengths: string[];
  improvementsNeeded: string[];
  recommendations: string[];
  overallGrade: string;
}

export { Subject, Companion, CreateCompanion, GetAllCompanions, BuildClient, CreateUser, SearchParams, Avatar, SavedMessage, CompanionComponentProps, UploadedDocument, DocumentQuery, DocumentAnswer, QuizQuestion, AssessmentData };