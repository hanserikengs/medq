export type Question = {
    id: number;
    question_text: string;
    options: string[];
    correct_answer: string;
    explanation: string;
    category: string;
    question_type: 'multiple_choice' | 'short_answer';
}

export type QuestionStat = {
    questionId: number;
    attempts: number;
    correctCount: number;
}