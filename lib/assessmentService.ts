import { AssessmentData, QuizQuestion } from '@/types';

export class AssessmentService {
  static parseAssessmentReport(transcript: string): AssessmentData | null {
    try {
      // Look for the assessment report section in transcript
      const reportMatch = transcript.match(/=== LEARNING ASSESSMENT REPORT ===([\s\S]*?)=== END ASSESSMENT ===/);
      
      if (!reportMatch) {
        console.log('No structured assessment report found in transcript');
        
        // Try to analyze the conversation for basic metrics
        return this.analyzeConversationForAssessment(transcript);
      }

      const reportContent = reportMatch[1];
      console.log('Found assessment report:', reportContent);
      
      // Parse each field using regex with better extraction
      const topicsCovered = this.extractField(reportContent, 'TOPICS_COVERED');
      const quizQuestionsAsked = parseInt(this.extractField(reportContent, 'QUIZ_QUESTIONS_ASKED') || '0');
      const correctResponses = parseInt(this.extractField(reportContent, 'CORRECT_RESPONSES') || '0');
      const comprehensionScore = parseInt(this.extractField(reportContent, 'COMPREHENSION_SCORE') || '0');
      const engagementLevel = this.extractField(reportContent, 'ENGAGEMENT_LEVEL') as 'High' | 'Medium' | 'Low';
      const strengths = this.extractField(reportContent, 'STRENGTHS');
      const improvementsNeeded = this.extractField(reportContent, 'IMPROVEMENTS_NEEDED');
      const recommendations = this.extractField(reportContent, 'RECOMMENDATIONS');

      // Validate parsed data
      if (quizQuestionsAsked === 0 && correctResponses === 0 && comprehensionScore === 0) {
        console.log('Assessment data seems empty, falling back to conversation analysis');
        return this.analyzeConversationForAssessment(transcript);
      }

      // Calculate metrics
      const accuracyRate = quizQuestionsAsked > 0 ? Math.round((correctResponses / quizQuestionsAsked) * 100) : 0;
      const sessionDuration = this.calculateSessionDuration(transcript);
      
      // Convert engagement level to numeric score
      const engagementScore = engagementLevel === 'High' ? 90 : engagementLevel === 'Medium' ? 70 : 50;

      const assessmentData: AssessmentData = {
        studentName: 'Student', // Could be passed from user context
        subject: this.extractSubjectFromTranscript(transcript),
        sessionDate: new Date().toISOString().split('T')[0],
        sessionDuration,
        topicsCovered: topicsCovered ? topicsCovered.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 0) : [],
        quizQuestions: [], // Could be parsed from transcript if needed
        comprehensionScore,
        accuracyRate,
        engagementLevel,
        engagementScore,
        strengths: strengths ? strengths.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0) : [],
        improvementsNeeded: improvementsNeeded ? improvementsNeeded.split(/[,;]/).map(i => i.trim()).filter(i => i.length > 0) : [],
        recommendations: recommendations ? recommendations.split(/[,;]/).map(r => r.trim()).filter(r => r.length > 0) : [],
        overallGrade: this.calculateOverallGrade(comprehensionScore, accuracyRate, engagementScore)
      };

      console.log('Parsed assessment data:', assessmentData);
      return assessmentData;
    } catch (error) {
      console.error('Error parsing assessment report:', error);
      return this.analyzeConversationForAssessment(transcript);
    }
  }

  // Fallback method to analyze conversation when no structured assessment exists
  private static analyzeConversationForAssessment(transcript: string): AssessmentData {
    console.log('Analyzing conversation for assessment metrics');
    
    const messages = transcript.split('\n').filter(msg => msg.trim().length > 0);
    const studentMessages = messages.filter(msg => msg.toLowerCase().includes('user:') || msg.toLowerCase().includes('student:'));
    const tutorMessages = messages.filter(msg => msg.toLowerCase().includes('assistant:') || msg.toLowerCase().includes('tutor:'));
    
    // Analyze engagement based on student participation
    const studentWordCount = studentMessages.join(' ').split(' ').length;
    const tutorWordCount = tutorMessages.join(' ').split(' ').length;
    
    let engagementLevel: 'High' | 'Medium' | 'Low' = 'Low';
    let engagementScore = 50;
    
    if (studentMessages.length >= 5 && studentWordCount > 50) {
      engagementLevel = 'High';
      engagementScore = 85;
    } else if (studentMessages.length >= 3 && studentWordCount > 25) {
      engagementLevel = 'Medium';
      engagementScore = 70;
    }

    // Estimate comprehension based on conversation quality
    const comprehensionScore = Math.min(90, 60 + (studentMessages.length * 5) + Math.min(20, studentWordCount / 5));
    
    // Estimate quiz performance (since we don't have structured data)
    const estimatedQuestions = Math.max(1, Math.floor(tutorMessages.length / 3));
    const estimatedCorrect = Math.floor(estimatedQuestions * (comprehensionScore / 100));
    const accuracyRate = Math.round((estimatedCorrect / estimatedQuestions) * 100);

    return {
      studentName: 'Student',
      subject: this.extractSubjectFromTranscript(transcript),
      sessionDate: new Date().toISOString().split('T')[0],
      sessionDuration: this.calculateSessionDuration(transcript),
      topicsCovered: this.extractTopicsFromConversation(transcript),
      quizQuestions: [],
      comprehensionScore,
      accuracyRate,
      engagementLevel,
      engagementScore,
      strengths: this.generateDynamicStrengths(engagementLevel, comprehensionScore),
      improvementsNeeded: this.generateDynamicImprovements(comprehensionScore, accuracyRate),
      recommendations: this.generateDynamicRecommendations(comprehensionScore, engagementLevel),
      overallGrade: this.calculateOverallGrade(comprehensionScore, accuracyRate, engagementScore)
    };
  }

  private static extractField(content: string, fieldName: string): string {
    const regex = new RegExp(`${fieldName}:\\s*\\[?(.*?)\\]?(?=\\n|$)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : '';
  }

  private static extractSubjectFromTranscript(transcript: string): string {
    // Try to extract subject from the beginning of the transcript
    const subjectMatch = transcript.match(/teaching.*about\s+(.+?)(?:\.|,|\n)/i);
    return subjectMatch ? subjectMatch[1].trim() : 'General Learning';
  }

  private static calculateSessionDuration(transcript: string): number {
    // Estimate duration based on transcript length (rough approximation)
    const wordCount = transcript.split(/\s+/).length;
    const wordsPerMinute = 150; // Average speaking rate
    return Math.round(wordCount / wordsPerMinute);
  }

  private static calculateOverallGrade(comprehension: number, accuracy: number, engagement: number): string {
    const weightedScore = (comprehension * 0.4) + (accuracy * 0.4) + (engagement * 0.2);
    
    if (weightedScore >= 90) return 'A+';
    if (weightedScore >= 85) return 'A';
    if (weightedScore >= 80) return 'A-';
    if (weightedScore >= 75) return 'B+';
    if (weightedScore >= 70) return 'B';
    if (weightedScore >= 65) return 'B-';
    if (weightedScore >= 60) return 'C+';
    if (weightedScore >= 55) return 'C';
    if (weightedScore >= 50) return 'C-';
    return 'D';
  }

  private static extractTopicsFromConversation(transcript: string): string[] {
    // Extract key topics mentioned in the conversation
    const commonTopics = transcript.toLowerCase().match(/\b(calculus|algebra|geometry|physics|chemistry|biology|history|literature|economics|programming|mathematics|science|english|grammar|writing|reading)\b/g);
    const uniqueTopics = [...new Set(commonTopics || [])];
    
    // If no common topics found, try to extract from context
    if (uniqueTopics.length === 0) {
      const sentences = transcript.split(/[.!?]/).slice(0, 5); // First few sentences
      const potentialTopics = sentences.map(s => {
        const words = s.split(' ').filter(w => w.length > 4 && /^[A-Za-z]+$/.test(w));
        return words.slice(0, 2).join(' ');
      }).filter(t => t.length > 0);
      
      return potentialTopics.slice(0, 3);
    }
    
    return uniqueTopics.slice(0, 4);
  }

  private static generateDynamicStrengths(engagementLevel: string, comprehensionScore: number): string[] {
    const strengths = [];
    
    if (engagementLevel === 'High') {
      strengths.push('Excellent active participation', 'Strong engagement with material');
    } else if (engagementLevel === 'Medium') {
      strengths.push('Good participation', 'Shows interest in learning');
    } else {
      strengths.push('Attentive listening', 'Follows instructions well');
    }
    
    if (comprehensionScore >= 80) {
      strengths.push('Quick grasp of concepts', 'Strong analytical thinking');
    } else if (comprehensionScore >= 60) {
      strengths.push('Solid understanding of basics', 'Good effort in learning');
    } else {
      strengths.push('Willing to learn', 'Shows curiosity');
    }
    
    return strengths.slice(0, 3);
  }

  private static generateDynamicImprovements(comprehensionScore: number, accuracyRate: number): string[] {
    const improvements = [];
    
    if (comprehensionScore < 70) {
      improvements.push('Needs more practice with core concepts', 'Could benefit from additional examples');
    }
    
    if (accuracyRate < 60) {
      improvements.push('Work on accuracy in problem solving', 'Practice more application questions');
    }
    
    if (comprehensionScore < 80 && accuracyRate < 80) {
      improvements.push('Strengthen foundation knowledge', 'More time needed for concept mastery');
    }
    
    if (improvements.length === 0) {
      improvements.push('Continue practicing regularly', 'Challenge yourself with harder problems');
    }
    
    return improvements.slice(0, 3);
  }

  private static generateDynamicRecommendations(comprehensionScore: number, engagementLevel: string): string[] {
    const recommendations = [];
    
    if (comprehensionScore >= 80) {
      recommendations.push('Try more advanced topics', 'Explore real-world applications');
    } else if (comprehensionScore >= 60) {
      recommendations.push('Review today\'s concepts', 'Practice similar problems');
    } else {
      recommendations.push('Review fundamentals', 'Schedule additional practice sessions');
    }
    
    if (engagementLevel === 'Low') {
      recommendations.push('Try interactive learning methods', 'Ask more questions during sessions');
    } else if (engagementLevel === 'High') {
      recommendations.push('Maintain this enthusiasm', 'Share knowledge with peers');
    }
    
    recommendations.push('Set specific learning goals', 'Track progress regularly');
    
    return recommendations.slice(0, 4);
  }

  static generateChartData(assessmentData: AssessmentData) {
    return {
      // Performance Overview (Radar Chart)
      performanceChart: {
        type: 'radar',
        data: {
          labels: ['Comprehension', 'Accuracy', 'Engagement', 'Participation', 'Critical Thinking'],
          datasets: [{
            label: 'Performance Metrics',
            data: [
              assessmentData.comprehensionScore,
              assessmentData.accuracyRate,
              assessmentData.engagementScore,
              assessmentData.engagementScore, // Use engagement as proxy for participation
              Math.max(assessmentData.comprehensionScore - 10, 0) // Derived metric
            ],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20
              }
            }
          }
        }
      },

      // Score Breakdown (Doughnut Chart)
      scoreBreakdown: {
        type: 'doughnut',
        data: {
          labels: ['Correct Answers', 'Incorrect Answers'],
          datasets: [{
            data: [assessmentData.accuracyRate, 100 - assessmentData.accuracyRate],
            backgroundColor: [
              'rgba(34, 197, 94, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom' as const
            }
          }
        }
      },

      // Learning Progress (Bar Chart)
      learningProgress: {
        type: 'bar',
        data: {
          labels: ['Comprehension', 'Quiz Performance', 'Engagement'],
          datasets: [{
            label: 'Scores',
            data: [
              assessmentData.comprehensionScore,
              assessmentData.accuracyRate,
              assessmentData.engagementScore
            ],
            backgroundColor: [
              'rgba(168, 85, 247, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(34, 197, 94, 0.8)'
            ],
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 20
              }
            }
          }
        }
      }
    };
  }
}