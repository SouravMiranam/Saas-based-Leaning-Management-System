"use client"
import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { vapi } from '@/lib/vapi.sdk'
import Image from 'next/image'
import React, { useEffect, useRef } from 'react'
import DocumentUpload from './DocumentUpload';
import { AssessmentReport } from './AssessmentReport';
import { useState } from 'react'
import Lottie, { LottieRef, LottieRefCurrentProps, useLottie } from "lottie-react"
import soundwaves from '@/constants/soundwaves.json'
import { addToSessionHistory } from '@/lib/actions/companion.action'
import { AssessmentService } from '@/lib/assessmentService'
import { AssessmentData, CompanionComponentProps, SavedMessage, UploadedDocument } from '@/types';
import jsPDF from 'jspdf';
enum CallStatus {
    INACTIVE = 'INACTIVE',
    CONNECTING = 'CONNECTING',
    ACTIVE = 'ACTIVE',
    FINISHED = 'FINISHED',
}
const CompanionComponent = ({ companionId, subject, topic, name, userName, userImage, style, voice }: CompanionComponentProps) => {
    const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE)
    const [isspeaking, setIsspeaking] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const [messages, setmessages] = useState<SavedMessage[]>([])
    const lottieRef = useRef<LottieRefCurrentProps>(null)

    // Document upload state
    const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);
    const [processedDoc, setProcessedDoc] = useState<UploadedDocument | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [sessionEnded, setSessionEnded] = useState(false);

    // Assessment report state
    const [showAssessmentReport, setShowAssessmentReport] = useState(false);
    const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);

    // Generate PDF transcript download
    const downloadTranscript = () => {
        if (messages.length === 0) {
            alert('No conversation to download!');
            return;
        }

        const pdf = new jsPDF();
        const pageHeight = pdf.internal.pageSize.height;
        const margin = 20;
        let yPosition = margin;

        // Add title
        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Conversation Transcript', margin, yPosition);
        yPosition += 10;

        // Add session info
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Companion: ${name}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Subject: ${subject} - ${topic}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
        yPosition += 7;
        pdf.text(`Participants: ${userName} & ${name.split(' ')[0]}`, margin, yPosition);
        yPosition += 15;

        // Add messages
        pdf.setFontSize(10);
        messages.forEach((message, index) => {
            const speaker = message.role === 'assistant' ? name.split(' ')[0] : userName;
            const speakerText = `${speaker}: `;
            const content = message.content;

            // Check if we need a new page
            if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = margin;
            }

            // Add speaker name in bold
            pdf.setFont('helvetica', 'bold');
            pdf.text(speakerText, margin, yPosition);
            
            // Calculate speaker text width to position content
            const speakerWidth = pdf.getTextWidth(speakerText);
            
            // Add message content
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(content, 170 - speakerWidth);
            
            lines.forEach((line: string, lineIndex: number) => {
                if (lineIndex === 0) {
                    // First line goes after speaker name
                    pdf.text(line, margin + speakerWidth, yPosition);
                } else {
                    // Subsequent lines are indented
                    yPosition += 5;
                    if (yPosition > pageHeight - 30) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    pdf.text(line, margin + 15, yPosition);
                }
            });
            
            yPosition += 8; // Space between messages
        });

        // Download the PDF
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        pdf.save(`${name}-conversation-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Process assessment from transcript
    const processAssessment = () => {
        if (messages.length === 0) return;

        const fullTranscript = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        
        try {
            const assessment = AssessmentService.parseAssessmentReport(fullTranscript);
            if (assessment) {
                setAssessmentData(assessment);
                setShowAssessmentReport(true);
            } else {
                // Generate a basic assessment if AI didn't provide structured report
                const basicAssessment: AssessmentData = {
                    studentName: userName,
                    subject: subject,
                    sessionDate: new Date().toISOString().split('T')[0],
                    sessionDuration: Math.max(1, Math.floor(messages.length / 4)), // Rough estimate
                    topicsCovered: [topic],
                    quizQuestions: [],
                    comprehensionScore: 75, // Default score
                    accuracyRate: 70,
                    engagementLevel: 'Medium',
                    engagementScore: 70,
                    strengths: ['Active participation', 'Good questions'],
                    improvementsNeeded: ['Continue practicing', 'Review concepts'],
                    recommendations: ['Practice regularly', 'Ask more questions'],
                    overallGrade: 'B'
                };
                setAssessmentData(basicAssessment);
                setShowAssessmentReport(true);
            }
        } catch (error) {
            console.error('Error processing assessment:', error);
            alert('Unable to generate assessment report. Please try downloading the transcript instead.');
        }
    };
    };

    // Handle PDF upload
    const handlePdfUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                setUploadedPdf(file);
                setProcessedDoc(data.document);
                
                // If call is active, restart with document context
                if (callStatus === CallStatus.ACTIVE) {
                    handleDisconnect();
                    // Small delay then restart with document context
                    setTimeout(() => {
                        handleCall();
                    }, 1000);
                }
            } else {
                alert('Failed to upload PDF: ' + data.error);
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload PDF');
        } finally {
            setIsUploading(false);
        }
    };


    useEffect(() => {
        if (lottieRef) {
            if (isspeaking) {
                lottieRef.current?.play()
            } else {
                lottieRef.current?.stop()
            }
        }
    }, [isspeaking, lottieRef])

    useEffect(() => {
        const onCallStart = () => setCallStatus(CallStatus.ACTIVE)
        const onCallEnd = () => {
            setCallStatus(CallStatus.FINISHED)
            setSessionEnded(true)
            addToSessionHistory(companionId)
        }
        const onMessage = (message: Message) => {
            console.log("Vapi message received:", message)

            if (message.type === 'transcript' && message.transcriptType === 'final') {
                const role: SavedMessage["role"] =
                    message.role === 'assistant' || message.role === 'user'
                        ? message.role
                        : 'system'

                const newMessage: SavedMessage = {
                    role,
                    content: message.transcript
                }

                setmessages((prev) => [...prev, newMessage])  // appending instead of prepending
            }
        }

        const onSpeechStart = () => setIsspeaking(true)
        const onSpeechEnd = () => setIsspeaking(false)
        const onError = (error: Error) => console.log('Error', error)

        vapi.on('call-start', onCallStart)
        vapi.on('call-end', onCallEnd)
        vapi.on('message', onMessage)
        vapi.on('error', onError)
        vapi.on('speech-start', onSpeechStart)
        vapi.on('speech-end', onSpeechEnd)

        return () => {
            vapi.off('call-start', onCallStart)
            vapi.off('call-end', onCallEnd)
            vapi.off('message', onMessage)
            vapi.off('error', onError)
            vapi.off('speech-start', onSpeechStart)
            vapi.off('speech-end', onSpeechEnd)

        }
    }, [])

    const toggleMicrophone = () => {
        const isMuted = vapi.isMuted()
        vapi.setMuted(!isMuted)
        setIsMuted(!isMuted)

    }
    const handleCall = async () => {
        setCallStatus(CallStatus.CONNECTING)
        const assistantOverrides = {
            variableValues: {
                subject, 
                topic, 
                style,
                // Include document content if available
                ...(processedDoc && {
                    documentName: processedDoc.name,
                    documentContent: processedDoc.content.substring(0, 3000), // Limit to avoid token limits
                    hasDocument: 'true'
                })
            },
            clientMessages: ['transcript'],
            serverMessages: [],
        }
        //@ts-expect-error
        vapi.start(configureAssistant(voice, style, processedDoc), assistantOverrides)
    }
    const handleDisconnect = () => {
        setCallStatus(CallStatus.FINISHED)
        vapi.stop()
    }

    const startNewSession = () => {
        setSessionEnded(false);
        setmessages([]);
        setCallStatus(CallStatus.INACTIVE);
    }
    return (
        <div className='flex flex-col min-h-screen bg-gray-50'>
            {/* Main companion and user section */}
            <section className='flex gap-8 max-sm:flex-col p-6 bg-white'>
                <div className='companion-section'>
                    <div className='companion-avatar' style={{ backgroundColor: getSubjectColor(subject) }}>
                        <div className={
                            cn('absolute transition-opacity duration-1000', callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0', callStatus === CallStatus.CONNECTING && 'opacity-100 animation-pulse'
                            )
                        }>
                            <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className='max-sm:w-fit' />
                        </div>
                        <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                            <Lottie lottieRef={lottieRef} animationData={soundwaves} autoPlay={false} className='companion-lotte'
                            />
                        </div>
                    </div>
                    <p className='font-bold text-2xl'>{name}</p>
                </div>
                <div className='user-section'>
                    <div className='user-avatar'>
                        <Image src={userImage} alt={userName} width={130} height={130} className='rounded-lg' />
                        <p className='font-bold text-2xl '>{userName}</p>
                    </div>
                    <button className='btn-mic' onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
                        <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic" width={36} height={36} />
                        <p className='max-sm:hidden' >
                            {isMuted ? "Turn On Microphone" : "Turn Off Microphone"}
                        </p>
                    </button>
                    <button className={cn('rounded-lg py-2 cursor-pointer transition-colors w-full text-white', callStatus === CallStatus.ACTIVE ? 'bg-red-700' : "bg-primary", callStatus === CallStatus.CONNECTING && 'animate-pulse')} onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : (sessionEnded ? startNewSession : handleCall)}>
                        {callStatus === CallStatus.ACTIVE ? "End Session" : callStatus === CallStatus.CONNECTING ? 'Connecting' : sessionEnded ? 'Start New Session' : 'Start Session'}
                    </button>
                </div>
            </section>

            {/* Content area with proper scrolling */}
            <div className='flex-1 flex flex-col lg:flex-row gap-6 p-6'>
                {/* Transcript section */}
                <section className='flex-1 min-w-0'>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">💬 Conversation</h3>
                        {sessionEnded && messages.length > 0 && (
                            <button
                                onClick={downloadTranscript}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download Transcript
                            </button>
                        )}
                    </div>
                    
                    <div className="h-80 overflow-y-auto pr-2 flex flex-col gap-2 text-black bg-white border border-gray-300 rounded-lg p-4">
                        {sessionEnded && messages.length > 0 && (
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-green-600">✅</span>
                                    <strong className="text-green-800">Session Completed!</strong>
                                </div>
                                <p className="text-green-700 text-sm mt-1">
                                    Your conversation transcript is ready for download.
                                </p>
                            </div>
                        )}
                        
                        {messages.map((message, index) => (
                            <p key={index} className="bg-yellow-100 p-3 rounded-lg shadow-sm">
                                <strong className="text-blue-700">{message.role === 'assistant' ? name.split(' ')[0] : userName}:</strong> 
                                <span className="ml-2">{message.content}</span>
                            </p>
                        ))}
                        {messages.length === 0 && <p className="text-gray-400 italic text-center py-8">No messages yet. Start a conversation!</p>}
                    </div>
                </section>

                {/* Document upload section */}
                <section className='flex-1 min-w-0'>
                    <div className="bg-white rounded-lg border border-gray-200 p-6 h-fit">
                        <h3 className="font-semibold mb-4 text-lg">📄 Document Assistant</h3>
                        <DocumentUpload onUpload={handlePdfUpload} />
                        
                        {isUploading && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Processing PDF...</span>
                                </div>
                            </div>
                        )}
                        
                        {processedDoc && (
                            <div className="mt-4 border border-green-200 bg-green-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-green-600 text-xl">✅</span>
                                    <div>
                                        <div className="font-semibold">PDF Ready: {processedDoc.name}</div>
                                        <div className="text-sm text-gray-600">
                                            Extracted {processedDoc.content.length} characters of content
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Show extracted content with better scrolling */}
                                <details className="mt-4">
                                    <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-800 p-2 bg-blue-50 rounded">
                                        📖 View Extracted Content
                                    </summary>
                                    <div className="mt-3 bg-white border border-gray-300 rounded-lg">
                                        <div className="max-h-80 overflow-y-auto p-4">
                                            <pre className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed">
                                                {processedDoc.content}
                                            </pre>
                                        </div>
                                    </div>
                                </details>
                                
                                <div className="mt-4 bg-blue-50 border border-blue-200 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">🎤</span>
                                        <strong className="text-blue-800">Voice Document Chat Enabled!</strong>
                                    </div>
                                    <p className="text-sm text-blue-700 mb-3">
                                        You can now ask your companion questions about this document using voice!
                                    </p>
                                    <div className="text-xs text-blue-600">
                                        <strong>Try saying:</strong>
                                        <ul className="list-disc list-inside mt-2 space-y-1">
                                            <li>"What is this document about?"</li>
                                            <li>"Explain the main concepts"</li>
                                            <li>"What should I focus on studying?"</li>
                                            <li>"Help me understand this topic"</li>
                                        </ul>
                                    </div>
                                    {callStatus === CallStatus.ACTIVE && (
                                        <div className="mt-3 flex items-center gap-2 p-2 bg-green-100 rounded">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-green-700 text-sm font-medium">
                                                Document context active in voice chat
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}

export default CompanionComponent
