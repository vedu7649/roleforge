import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { auth } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Brain, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import './Interviewer.css';

export default function Interviewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state;
  
  const [questionData, setQuestionData] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!state?.milestone) return;

    let isMounted = true;
    const fetchQuestion = async () => {
      const q = await aiService.generateInterviewQuestion(state.milestone);
      if (isMounted) {
        setQuestionData(q);
        setLoading(false);
      }
    };
    fetchQuestion();
    return () => { isMounted = false; }
  }, [state]);

  if (!state?.milestone) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setEvaluating(true);
    const evaluation = await aiService.evaluateAnswer(
      questionData.question,
      questionData.expectedAnswer,
      userAnswer
    );
    
    setResult(evaluation);
    setEvaluating(false);

    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'Progress'), {
          userId: user.uid,
          role: state.role,
          milestone: state.milestone,
          status: evaluation.result,
          feedback: evaluation.weakAreas,
          timestamp: serverTimestamp()
        });
      }
    } catch(err) {
      console.warn("Firestore save failed:", err);
    }
  };

  const handleReturn = () => {
    navigate('/dashboard', { state: { ...state, interviewResult: result } });
  };

  if (loading) {
    return (
      <div className="full-center flex-col animate-fade-in">
        <Brain className="spinner mb-4" size={48} />
        <h2>Generating Validation Challenge...</h2>
      </div>
    );
  }

  return (
    <div className="interviewer-container main-content animate-fade-in">
      <div className="glass-panel interview-card">
        <div className="interview-header">
          <Brain size={24} color="var(--primary)" />
          <h3>Reality Check Layer</h3>
        </div>

        {!result ? (
          <form onSubmit={handleSubmit} className="interview-form">
            <div className="question-box">
              <span className="difficulty-tag" data-level={questionData?.difficulty || 'medium'}>
                {questionData?.difficulty}
              </span>
              <p className="question-text">{questionData?.question}</p>
            </div>

            <textarea 
              className="answer-input"
              rows={6}
              placeholder="Type your answer or approach here..."
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              disabled={evaluating}
              required
            />

            <button type="submit" className="btn btn-primary" disabled={evaluating || !userAnswer.trim()}>
              {evaluating ? <><Loader2 size={18} className="spinner" /> Evaluating...</> : 'Submit Answer'}
            </button>
          </form>
        ) : (
          <div className="result-box animate-slide-up">
            <div className={`result-status ${result.result}`}>
               {result.result === 'pass' ? <ShieldCheck size={48} /> : <AlertTriangle size={48} />}
               <h2 className="mt-4">{result.result === 'pass' ? 'Milestone Passed' : 'Knowledge Gap Detected'}</h2>
            </div>

            {result.weakAreas?.length > 0 && (
              <div className="weak-areas mt-6">
                <h4>Improvement Opportunities:</h4>
                <ul>
                  {result.weakAreas.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
                {result.result === 'fail' && (
                   <p className="text-muted mt-4 text-sm">
                     System Auto-Action: Reducing difficulty and triggering revision logic. 
                     Return to dashboard to see updated fundamental tasks.
                   </p>
                )}
              </div>
            )}

            <button onClick={handleReturn} className="btn btn-primary full-width mt-6">
              Return to Roadmap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
