import React, { useRef, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, RadialLinearScale, ArcElement, BarElement } from 'chart.js';
import { Radar, Doughnut, Bar } from 'react-chartjs-2';
import type { ChartOptions } from 'chart.js';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AssessmentData } from '@/types';
import { AssessmentService } from '@/lib/assessmentService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  RadialLinearScale,
  ArcElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AssessmentReportProps {
  assessmentData: AssessmentData;
  onClose: () => void;
  onDownload: () => void;
}

export const AssessmentReport: React.FC<AssessmentReportProps> = ({
  assessmentData,
  onClose,
  onDownload
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const chartData = AssessmentService.generateChartData(assessmentData);

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`assessment-report-${assessmentData.sessionDate}.pdf`);
      onDownload();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-600';
    if (grade.startsWith('B')) return 'text-blue-600';
    if (grade.startsWith('C')) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Learning Assessment Report</h2>
            <div className="flex gap-2">
              <button
                onClick={downloadPDF}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>

          <div ref={reportRef} className="bg-white p-6">
            {/* Header Section */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Learning Assessment Report</h1>
              <div className="flex justify-center items-center gap-4 text-gray-600">
                <span>Student: {assessmentData.studentName}</span>
                <span>•</span>
                <span>Subject: {assessmentData.subject}</span>
                <span>•</span>
                <span>Date: {assessmentData.sessionDate}</span>
              </div>
            </div>

            {/* Overall Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                <div className={`text-3xl font-bold ${getGradeColor(assessmentData.overallGrade)}`}>
                  {assessmentData.overallGrade}
                </div>
                <div className="text-sm text-gray-600">Overall Grade</div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg text-center">
                <div className={`text-3xl font-bold ${getScoreColor(assessmentData.comprehensionScore)}`}>
                  {assessmentData.comprehensionScore}%
                </div>
                <div className="text-sm text-gray-600">Comprehension</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg text-center">
                <div className={`text-3xl font-bold ${getScoreColor(assessmentData.accuracyRate)}`}>
                  {assessmentData.accuracyRate}%
                </div>
                <div className="text-sm text-gray-600">Accuracy Rate</div>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {assessmentData.sessionDuration} min
                </div>
                <div className="text-sm text-gray-600">Session Duration</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Performance Radar Chart */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Performance Overview</h3>
                <div className="h-64">
                  <Radar data={chartData.performanceChart.data} options={chartData.performanceChart.options as ChartOptions<'radar'>} />
                </div>
              </div>

              {/* Accuracy Breakdown */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Quiz Performance</h3>
                <div className="h-64">
                  <Doughnut data={chartData.scoreBreakdown.data} options={chartData.scoreBreakdown.options as ChartOptions<'doughnut'>} />
                </div>
              </div>
            </div>

            {/* Learning Progress Bar Chart */}
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Learning Metrics</h3>
              <div className="h-64">
                <Bar data={chartData.learningProgress.data} options={chartData.learningProgress.options as ChartOptions<'bar'>} />
              </div>
            </div>

            {/* Topics Covered */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Topics Covered</h3>
              <div className="flex flex-wrap gap-2">
                {assessmentData.topicsCovered.map((topic, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* Strengths and Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-3">✓ Strengths</h3>
                <ul className="space-y-2">
                  {assessmentData.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-orange-700 mb-3">⚠ Areas for Improvement</h3>
                <ul className="space-y-2">
                  {assessmentData.improvementsNeeded.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">•</span>
                      <span className="text-gray-700">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-blue-700 mb-3">💡 Recommendations</h3>
              <ul className="space-y-2">
                {assessmentData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-gray-700">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Engagement Level */}
            <div className="text-center bg-gray-100 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Engagement Level</h3>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-lg font-semibold ${
                assessmentData.engagementLevel === 'High' ? 'bg-green-100 text-green-800' :
                assessmentData.engagementLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {assessmentData.engagementLevel}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm mt-8 pt-4 border-t">
              Generated on {new Date().toLocaleDateString()} • AI-Powered Learning Assessment
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};