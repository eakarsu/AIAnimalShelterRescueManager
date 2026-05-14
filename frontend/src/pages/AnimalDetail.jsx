import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Brain, Stethoscope, Share2, ArrowLeft, Sparkles } from 'lucide-react';
import api from '../api';

function AIResultCard({ title, content, isLoading }) {
  if (!isLoading && !content) return null;
  return (
    <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontWeight: 600, marginBottom: '8px', color: '#374151' }}>{title}</div>
      {isLoading ? (
        <div style={{ color: '#6b7280', fontStyle: 'italic' }}>Generating with AI...</div>
      ) : (
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>
          {typeof content === 'object' ? JSON.stringify(content, null, 2) : content}
        </div>
      )}
    </div>
  );
}

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI states
  const [adoptionListing, setAdoptionListing] = useState(null);
  const [adoptionLoading, setAdoptionLoading] = useState(false);

  const [behaviorAnalysis, setBehaviorAnalysis] = useState(null);
  const [behaviorLoading, setBehaviorLoading] = useState(false);

  const [medicalSummary, setMedicalSummary] = useState(null);
  const [medicalLoading, setMedicalLoading] = useState(false);

  const [socialPost, setSocialPost] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    const fetchAnimal = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/animals/${id}`);
        setAnimal(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load animal');
      } finally {
        setLoading(false);
      }
    };
    fetchAnimal();
  }, [id]);

  const callAI = async (endpoint, body, setResult, setLoadingFn) => {
    setLoadingFn(true);
    setResult(null);
    try {
      const res = await api.post(endpoint, body);
      const d = res.data;
      setResult(d.listing || d.analysis || d.summary || d.post || d.content || d);
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.error || 'AI request failed'));
    } finally {
      setLoadingFn(false);
    }
  };

  if (loading) return <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Loading...</div>;
  if (error) return <div style={{ padding: '32px', color: '#ef4444' }}>{error}</div>;
  if (!animal) return null;

  const latestBehavioral = animal.behavioral_assessments?.[0];

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/animals')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#374151' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{animal.name}</h2>
        <span style={{
          padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
          background: animal.status === 'available' ? '#dcfce7' : '#e0e7ff',
          color: animal.status === 'available' ? '#16a34a' : '#4338ca',
        }}>
          {animal.status}
        </span>
      </div>

      {/* Animal Info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600 }}>Animal Information</h3>
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Species', animal.species],
                ['Breed', animal.breed || 'Unknown'],
                ['Age', `${animal.age_years || 0}y ${animal.age_months || 0}m`],
                ['Sex', animal.sex],
                ['Weight', animal.weight ? `${animal.weight} lbs` : '-'],
                ['Color', animal.color || '-'],
                ['Intake Date', animal.intake_date ? new Date(animal.intake_date).toLocaleDateString() : '-'],
                ['Intake Type', animal.intake_type || '-'],
                ['Microchip', animal.microchip_number || 'None'],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: '4px 0', color: '#6b7280', fontWeight: 500, width: '45%' }}>{label}</td>
                  <td style={{ padding: '4px 0', color: '#111827' }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {animal.description && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#f9fafb', borderRadius: '6px', fontSize: '14px', color: '#374151' }}>
              {animal.description}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Medical Records Summary */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Medical Records</h3>
            <div style={{ fontSize: '13px', color: '#6b7280' }}>{animal.medical_records?.length || 0} records on file</div>
            {animal.medical_records?.slice(0, 2).map((r) => (
              <div key={r.id} style={{ marginTop: '8px', fontSize: '13px', color: '#374151' }}>
                <strong>{r.record_type}</strong> — {r.description} ({r.record_date ? new Date(r.record_date).toLocaleDateString() : ''})
              </div>
            ))}
          </div>

          {/* Kennel Info */}
          {animal.current_kennel && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Current Kennel</h3>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                Kennel #{animal.current_kennel.kennel_number} — {animal.current_kennel.building}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Feature Buttons */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#8b5cf6" /> AI Features
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button
            onClick={() => callAI('/ai/adoption-listing', { animalId: animal.id }, setAdoptionListing, setAdoptionLoading)}
            disabled={adoptionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#fdf2f8', color: '#be185d', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
          >
            <Heart size={14} /> {adoptionLoading ? 'Generating...' : 'Generate Adoption Listing'}
          </button>

          <button
            onClick={() => {
              if (!latestBehavioral) return alert('No behavioral assessments on file for this animal.');
              callAI('/ai/behavior-analysis', { assessmentId: latestBehavioral.id }, setBehaviorAnalysis, setBehaviorLoading);
            }}
            disabled={behaviorLoading || !latestBehavioral}
            title={!latestBehavioral ? 'No behavioral assessments available' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#f0f9ff', color: '#0369a1', cursor: latestBehavioral ? 'pointer' : 'not-allowed', fontWeight: 500, fontSize: '14px', opacity: latestBehavioral ? 1 : 0.5 }}
          >
            <Brain size={14} /> {behaviorLoading ? 'Analyzing...' : 'Analyze Behavior'}
          </button>

          <button
            onClick={() => callAI('/ai/medical-summary', { animalId: animal.id }, setMedicalSummary, setMedicalLoading)}
            disabled={medicalLoading || !animal.medical_records?.length}
            title={!animal.medical_records?.length ? 'No medical records available' : ''}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#f0fdf4', color: '#15803d', cursor: animal.medical_records?.length ? 'pointer' : 'not-allowed', fontWeight: 500, fontSize: '14px', opacity: animal.medical_records?.length ? 1 : 0.5 }}
          >
            <Stethoscope size={14} /> {medicalLoading ? 'Generating...' : 'Medical Summary'}
          </button>

          <button
            onClick={() => callAI('/ai/social-media', { animalId: animal.id }, setSocialPost, setSocialLoading)}
            disabled={socialLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#fefce8', color: '#a16207', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
          >
            <Share2 size={14} /> {socialLoading ? 'Creating...' : 'Social Media Post'}
          </button>
        </div>

        <AIResultCard title="Adoption Listing" content={adoptionListing} isLoading={adoptionLoading} />
        <AIResultCard title="Behavior Analysis" content={behaviorAnalysis} isLoading={behaviorLoading} />
        <AIResultCard title="Medical Summary" content={medicalSummary} isLoading={medicalLoading} />
        <AIResultCard title="Social Media Post" content={socialPost} isLoading={socialLoading} />
      </div>
    </div>
  );
}
