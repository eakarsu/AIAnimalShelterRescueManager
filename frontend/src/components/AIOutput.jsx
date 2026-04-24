import { Sparkles, Copy, RefreshCw, Check } from 'lucide-react';
import { useState } from 'react';

function parseContent(content) {
  if (!content) return '';
  if (typeof content === 'object') {
    // Handle API responses that come as objects
    if (content.listing || content.content || content.analysis || content.summary || content.post || content.draft || content.appeal || content.matches) {
      content = content.listing || content.content || content.analysis || content.summary || content.post || content.draft || content.appeal || JSON.stringify(content.matches, null, 2);
    } else {
      content = Object.entries(content)
        .filter(([k]) => k !== 'id' && k !== 'created_at')
        .map(([k, v]) => {
          if (typeof v === 'object') return `**${k.replace(/_/g, ' ')}:** ${JSON.stringify(v)}`;
          return `**${k.replace(/_/g, ' ')}:** ${v}`;
        })
        .join('\n\n');
    }
  }
  let html = String(content);
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Bullet points
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  // Numbered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  // Paragraphs (double newlines)
  html = html.replace(/\n\n/g, '</p><p>');
  // Single newlines to <br>
  html = html.replace(/\n/g, '<br>');
  // Wrap in paragraph
  if (!html.startsWith('<')) html = '<p>' + html + '</p>';
  return html;
}

export default function AIOutput({ title, content, isLoading, icon, onRegenerate }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
    navigator.clipboard.writeText(text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoading && !content) return null;

  return (
    <div className="ai-output-card">
      <div className="ai-output-header">
        <div className="ai-output-header-left">
          {icon || <Sparkles size={20} className="ai-sparkle" />}
          <h4>{title || 'AI Generated Content'}</h4>
        </div>
      </div>
      {isLoading ? (
        <div className="ai-loading">
          <div className="ai-spinner" />
          <p>AI is thinking...</p>
        </div>
      ) : (
        <>
          <div
            className="ai-output-body"
            dangerouslySetInnerHTML={{ __html: parseContent(content) }}
          />
          <div className="ai-output-actions">
            <button className="btn btn-outline btn-sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {onRegenerate && (
              <button className="btn btn-outline btn-sm" onClick={onRegenerate}>
                <RefreshCw size={14} /> Regenerate
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
