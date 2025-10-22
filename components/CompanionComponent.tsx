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

// Define Message type for Vapi
interface Message {
    type: string;
    transcriptType?: string;
    role: 'user' | 'assistant' | 'system';
    transcript: string;
}
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
        if (messages.length === 0) {
            alert('No conversation data available for assessment!');
            return;
        }

        console.log('Processing assessment for', messages.length, 'messages');
        const fullTranscript = messages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
        console.log('Full transcript:', fullTranscript);

        try {
            const assessment = AssessmentService.parseAssessmentReport(fullTranscript);
            if (assessment) {
                // Update with actual user data
                assessment.studentName = userName;
                assessment.subject = subject;

                // Add topic to covered topics if not already there
                if (!assessment.topicsCovered.includes(topic)) {
                    assessment.topicsCovered.unshift(topic);
                }

                console.log('Generated assessment:', assessment);
                setAssessmentData(assessment);
                setShowAssessmentReport(true);
            } else {
                console.error('No assessment could be generated from the conversation');
                alert('Unable to generate assessment report. The conversation may be too short or lack proper assessment structure.');
            }
        } catch (error) {
            console.error('Error processing assessment:', error);
            alert('Unable to generate assessment report. Please try again or check the conversation content.');
        }
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
        <div className='min-h-screen bg-gray-50'>
            {/* Header section with companion and controls */}
            <section className='bg-white border-b border-gray-200 p-4'>
                <div className='flex items-center justify-between max-w-7xl mx-auto'>
                    {/* Left: Companion info */}
                    <div className='flex items-center gap-4'>
                        <div className='relative w-16 h-16' style={{ backgroundColor: getSubjectColor(subject) }}>
                            <div className={
                                cn('absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-1000',
                                    callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0',
                                    callStatus === CallStatus.CONNECTING && 'opacity-100 animation-pulse'
                                )
                            }>
                                <Image src={`/icons/${subject}.svg`} alt={subject} width={40} height={40} />
                            </div>
                            <div className={cn('absolute inset-0 transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
                                <Lottie lottieRef={lottieRef} animationData={soundwaves} autoPlay={false} className='w-16 h-16' />
                            </div>
                        </div>
                        <div>
                            <h1 className='font-bold text-xl'>{name}</h1>
                            <p className='text-sm text-gray-600'>Hello, {userName}!</p>
                        </div>
                    </div>

                    {/* Right: Controls */}
                    <div className='flex items-center gap-3'>
                        <button
                            className='flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm'
                            onClick={toggleMicrophone}
                            disabled={callStatus !== CallStatus.ACTIVE}
                        >
                            <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic" width={16} height={16} />
                            <span className='max-sm:hidden text-xs'>
                                {isMuted ? "Mic Off" : "Mic On"}
                            </span>
                        </button>
                        <button
                            className={cn('rounded-lg px-4 py-2 cursor-pointer transition-colors text-white font-medium text-sm',
                                callStatus === CallStatus.ACTIVE ? 'bg-red-700 hover:bg-red-800' : "bg-primary hover:bg-primary/90",
                                callStatus === CallStatus.CONNECTING && 'animate-pulse')}
                            onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : (sessionEnded ? startNewSession : handleCall)}
                        >
                            {callStatus === CallStatus.ACTIVE ? "End Session" : callStatus === CallStatus.CONNECTING ? 'Connecting...' : sessionEnded ? 'Start New Session' : 'Start Session'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Main content area - left right layout */}
            <div className='flex gap-4 p-4 max-w-7xl mx-auto'>
                {/* Left side: Document Upload */}
                <div className='w-80 flex-shrink-0'>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 h-fit">
                        <h3 className="font-semibold mb-3 text-lg">📄 Document Assistant</h3>
                        <DocumentUpload onUpload={handlePdfUpload} />

                        {isUploading && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-600 justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span>Processing PDF...</span>
                                </div>
                            </div>
                        )}

                        {processedDoc && (
                            <div className="mt-3 border border-green-200 bg-green-50 p-3 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-green-600">✅</span>
                                    <div>
                                        <div className="font-semibold text-sm">PDF Ready: {processedDoc.name}</div>
                                        <div className="text-xs text-gray-600">
                                            {processedDoc.content.length} chars extracted
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 p-2 rounded">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm">🎤</span>
                                        <strong className="text-blue-800 text-xs">Voice Chat Enabled!</strong>
                                    </div>
                                    <p className="text-xs text-blue-700">
                                        Ask questions about this document using voice!
                                    </p>
                                    {callStatus === CallStatus.ACTIVE && (
                                        <div className="mt-2 flex items-center gap-2 p-1.5 bg-green-100 rounded">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                            <span className="text-green-700 text-xs font-medium">Document context active</span>
                                        </div>
                                    )}
                                </div>

                                {/* Compact document viewer */}
                                <details className="mt-2">
                                    <summary className="cursor-pointer text-blue-600 font-medium hover:text-blue-800 p-2 bg-blue-50 rounded text-xs">
                                        📖 View Content
                                    </summary>
                                    <div className="mt-2 bg-gray-50 border border-gray-300 rounded">
                                        <div className="max-h-40 overflow-y-auto p-2">
                                            <pre className="whitespace-pre-wrap text-gray-800 text-xs leading-relaxed">
                                                {processedDoc.content.substring(0, 500)}...
                                            </pre>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: Conversation */}
                <div className='flex-1'>
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg">💬 Conversation</h3>
                            {sessionEnded && messages.length > 0 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={downloadTranscript}
                                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Download
                                    </button>
                                    <button
                                        onClick={processAssessment}
                                        className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors text-xs font-medium"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Assessment
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="h-[calc(100vh-240px)] flex flex-col gap-2 text-black bg-gray-50 border border-gray-300 rounded-lg p-3">
                            {callStatus === CallStatus.ACTIVE && (
                                <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                        <span className="text-blue-800 font-medium text-sm">Live Session Active</span>
                                    </div>
                                    <p className="text-blue-700 text-xs mt-1">
                                        💡 Your AI tutor will ask 3-4 assessment questions after teaching. Stay engaged!
                                    </p>
                                </div>
                            )}

                            {sessionEnded && messages.length > 0 && (
                                <div className="bg-green-50 border border-green-200 p-2 rounded-lg flex-shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-green-600">✅</span>
                                        <strong className="text-green-800 text-sm">Session Completed!</strong>
                                    </div>
                                    <p className="text-green-700 text-xs mt-1">
                                        Transcript and assessment report ready for download.
                                        {messages.length < 8 && (
                                            <span className="block text-orange-600 mt-1">
                                                💡 Longer sessions provide better assessment insights!
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {messages.map((message, index) => (
                                    <div key={index} className="bg-white p-2 rounded shadow-sm">
                                        <strong className="text-blue-700 text-sm">{message.role === 'assistant' ? name.split(' ')[0] : userName}:</strong>
                                        <span className="ml-2 text-sm">{message.content}</span>
                                    </div>
                                ))}
                                {messages.length === 0 && (
                                    <div className="flex items-center justify-center h-full text-center text-gray-500">
                                        <div>
                                            <p className="text-lg mb-2">No conversation yet</p>
                                            <p className="text-sm mb-2">Start a session to begin chatting with your AI companion!</p>
                                            <p className="text-xs text-gray-400">
                                                📝 For best assessment results, aim for sessions lasting at least 1 minute
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Assessment Report Modal */}
            {showAssessmentReport && assessmentData && (
                <AssessmentReport
                    assessmentData={assessmentData}
                    onClose={() => setShowAssessmentReport(false)}
                    onDownload={() => {
                        setShowAssessmentReport(false);
                        alert('Assessment report downloaded successfully!');
                    }}
                />
            )}
        </div>
    )
}

export default CompanionComponent
