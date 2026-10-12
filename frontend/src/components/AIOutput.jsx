import AIReport from './AIReport';

export default function AIOutput({ title, content, isLoading, onRegenerate }) {
  if (!isLoading && content === null) return null;
  return <div className="ai-output-card">
    <AIReport title={title || 'AI generated content'} response={content} loading={isLoading} />
    {!isLoading && onRegenerate && <div className="ai-output-actions">
      <button type="button" className="btn btn-outline btn-sm" onClick={onRegenerate}>Regenerate</button>
    </div>}
  </div>;
}
