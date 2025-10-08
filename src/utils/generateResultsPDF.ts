import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuizData, QuizResult } from '@/types/quiz';

export function generateResultsPDF(
  quizData: QuizData,
  result: QuizResult,
  reviewMode: boolean = false
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);
  const lineHeight = 7;
  const maxY = pageHeight - margin;

  // Helper function to add text with proper word wrapping and page breaks
  const addWrappedText = (
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number = 10,
    fontStyle: string = 'normal'
  ): number => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle as any);
    doc.setTextColor(0, 0, 0);

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // Manual word wrapping
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const textWidth = doc.getTextWidth(testLine);

      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    let currentY = y;

    // Render each line
    for (const line of lines) {
      // Check if we need a new page
      if (currentY + lineHeight > maxY) {
        doc.addPage();
        currentY = margin + 10;
      }

      doc.text(line, x, currentY);
      currentY += lineHeight;
    }

    return currentY;
  };

  // Title and header
  doc.setFontSize(20);
  doc.text(reviewMode ? 'Review Session Results' : 'Quiz Results', margin, 25);

  doc.setFontSize(12);
  doc.text(quizData.title || 'Tableau Consultant Exam', margin, 35);

  // Date
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, 42);

  // Score summary (only for quiz mode)
  if (!reviewMode) {
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.text('Score Summary', margin, 55);
    doc.setFont("helvetica", 'normal');

    doc.setFontSize(12);
    doc.text(`Score: ${result.score}/${result.totalQuestions} (${Math.round((result.score / result.totalQuestions) * 100)}%)`, margin, 65);
    doc.text(`Status: ${result.passed ? 'PASSED' : 'FAILED'}`, margin, 72);
    if (result.weightedScore) {
      doc.text(`Weighted Score: ${result.weightedScore}/1000`, margin, 79);
    }
  } else {
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.text('Review Summary', margin, 55);
    doc.setFont("helvetica", 'normal');
    doc.setFontSize(12);
    doc.text(`Total Questions Reviewed: ${result.totalQuestions}`, margin, 65);
  }

  // Domain breakdown
  if (result.domainScores && result.domainScores.length > 0) {
    let yPos = reviewMode ? 80 : 95;
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.text(reviewMode ? 'Domain Coverage' : 'Performance by Domain', margin, yPos);
    doc.setFont("helvetica", 'normal');

    const domainData = result.domainScores.map(domain => {
      if (reviewMode) {
        return [
          domain.domainName,
          `${domain.totalQuestions} questions`
        ];
      } else {
        return [
          domain.domainName,
          `${domain.score}/${domain.totalQuestions}`,
          `${domain.percentage}%`
        ];
      }
    });

    autoTable(doc, {
      startY: yPos + 5,
      head: reviewMode ? [['Domain', 'Questions']] : [['Domain', 'Score', 'Percentage']],
      body: domainData,
      margin: { left: margin, right: margin },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] }
    });
  }

  // Add new page for detailed results
  doc.addPage();

  // Detailed Questions and Answers
  let currentY = addWrappedText('Detailed Questions and Answers', margin, 25, contentWidth, 16, 'bold');
  currentY += 10; // Extra space after title

  quizData.questions.forEach((question, index) => {
    // Add space before each question
    currentY += 5;

    // Question number and text
    const questionText = `Q${index + 1}. ${question.question}`;
    currentY = addWrappedText(questionText, margin, currentY, contentWidth, 12, 'bold');
    currentY += 3; // Small gap after question

    // Options
    question.options.forEach((option, optIndex) => {
      const isCorrect = question.correctAnswer === optIndex;
      let isUserAnswer = false;

      if (!reviewMode && result.answers) {
        const userAnswer = result.answers.find(a => a.questionId === question.id);
        isUserAnswer = userAnswer?.selectedOption === optIndex;
      }

      const prefix = `${String.fromCharCode(65 + optIndex)}. `;
      const optionText = prefix + option;
      currentY = addWrappedText(optionText, margin + 8, currentY, contentWidth - 16, 10, 'normal');
      currentY += 2; // Small gap between options
    });

    // Explanation
    if (question.explanation) {
      currentY += 3; // Gap before explanation
      const explanationText = `Explanation: ${question.explanation}`;
      currentY = addWrappedText(explanationText, margin + 8, currentY, contentWidth - 16, 9, 'italic');
    }

    // Always show user answer and correct answer lines
    currentY += 3; // Gap before summary

    if (!reviewMode) {
      // Quiz mode - show actual user answer
      let userAnswerText = 'User\'s answer: Not answered';

      if (result.answers && result.answers.length > 0) {
        const userAnswer = result.answers.find(a => a.questionId === question.id);
        if (userAnswer && userAnswer.selectedOption !== undefined) {
          userAnswerText = `User's answer: ${question.options[userAnswer.selectedOption]}`;
        }
      }

      currentY = addWrappedText(userAnswerText, margin + 8, currentY, contentWidth - 16, 9, 'normal');
    } else {
      // Review mode - show placeholder
      currentY = addWrappedText('User\'s answer: (Review mode - no answers tracked)', margin + 8, currentY, contentWidth - 16, 9, 'normal');
    }

    const correctAnswerText = `Correct answer: ${question.options[question.correctAnswer]}`;
    currentY = addWrappedText(correctAnswerText, margin + 8, currentY, contentWidth - 16, 9, 'normal');

    // Add spacing between questions
    currentY += 10;
  });

  // Save the PDF
  const filename = reviewMode
    ? `review-session-${new Date().toISOString().split('T')[0]}.pdf`
    : `quiz-results-${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
}