import React, { useState } from 'react';

interface AssistantFeedbackProps {
  messageId: string;
  apiBaseUrl: string;
  apiKey: string;
  userId: string;
}

const AssistantFeedback: React.FC<AssistantFeedbackProps> = ({ messageId, apiBaseUrl, apiKey, userId }) => {
  const [feedbackState, setFeedbackState] = useState<'idle' | 'like' | 'dislike' | 'submitting' | 'submitted' | 'error'>('idle');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleLike = async () => {
    setFeedbackState('submitting');
    setErrorMsg('');
    try {
      await fetch(`${apiBaseUrl}/messages/${messageId}/feedbacks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 'like',
          user: userId,
        }),
      });
      setFeedbackState('like');
    } catch (e) {
      setFeedbackState('error');
      setErrorMsg('送出失敗，請稍後再試');
    }
  };

  const handleDislike = () => {
    setFeedbackState('dislike');
    setErrorMsg('');
  };

  const handleSubmitDislike = async () => {
    if (!feedbackContent.trim()) {
      setErrorMsg('請填寫意見內容');
      return;
    }
    setFeedbackState('submitting');
    setErrorMsg('');
    try {
      await fetch(`${apiBaseUrl}/messages/${messageId}/feedbacks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 'dislike',
          user: userId,
          content: feedbackContent,
        }),
      });
      setFeedbackState('submitted');
    } catch (e) {
      setFeedbackState('error');
      setErrorMsg('送出失敗，請稍後再試');
    }
  };

  if (feedbackState === 'like') {
    return <div className="text-green-600 text-xs mt-1">感謝您的正面回饋！</div>;
  }
  if (feedbackState === 'submitted') {
    return <div className="text-blue-600 text-xs mt-1">感謝您的意見，我們會持續改進！</div>;
  }

  return (
    <div className="flex flex-col gap-1 mt-2">
      {feedbackState === 'idle' && (
        <div className="flex gap-2">
          <button className="text-lg" title="讚" onClick={handleLike}>👍</button>
          <button className="text-lg" title="需要改進" onClick={handleDislike}>👎</button>
        </div>
      )}
      {feedbackState === 'dislike' && (
        <div className="flex flex-col gap-1">
          <textarea
            className="border rounded p-1 text-sm"
            rows={2}
            placeholder="請填寫需要改進的地方..."
            value={feedbackContent}
            onChange={e => setFeedbackContent(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-1">
            <button className="px-2 py-1 bg-blue-600 text-white rounded text-xs" onClick={handleSubmitDislike}>送出</button>
            <button className="px-2 py-1 bg-gray-200 rounded text-xs" onClick={() => setFeedbackState('idle')}>取消</button>
          </div>
          {errorMsg && <div className="text-red-500 text-xs mt-1">{errorMsg}</div>}
        </div>
      )}
      {feedbackState === 'error' && (
        <div className="text-red-500 text-xs mt-1">{errorMsg}</div>
      )}
    </div>
  );
};

export default AssistantFeedback;
