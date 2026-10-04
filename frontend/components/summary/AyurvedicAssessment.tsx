import { useState, useEffect } from 'react';
import { api } from "@/lib/api";

export function AyurvedicAssessment({ sessionId }: { sessionId: number }) {
  const [prakriti, setPrakriti] = useState<any>({});
  const [vikriti, setVikriti] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load existing
    const load = async () => {
      try {
        const pRes = await api.get(`/api/v1/sessions/${sessionId}/prakriti`).then(r => r.data);
        if (pRes) setPrakriti(pRes);
      } catch (e) {}
      try {
        const vRes = await api.get(`/api/v1/sessions/${sessionId}/vikriti`).then(r => r.data);
        if (vRes) setVikriti(vRes);
      } catch (e) {}
    };
    load();
  }, [sessionId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/api/v1/sessions/${sessionId}/prakriti`, { ...prakriti, physician_confirmed: true });
      await api.post(`/api/v1/sessions/${sessionId}/vikriti`, { ...vikriti, physician_confirmed: true });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="glass-card rounded-[1.75rem] p-7 flex flex-col gap-5 mt-5">
      <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--line)' }}>
        <div>
          <h3 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>🌿 Ayurvedic Assessment</h3>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>Prakriti & Vikriti clinical evaluation</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-bold px-4 py-2 rounded-xl transition-all"
          style={{ backgroundColor: 'var(--pulse-teal)', color: 'white' }}
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Ayurvedic Data'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold">Prakriti (Constitution)</h4>
          <select
            value={prakriti.dominant_dosha || ''}
            onChange={e => setPrakriti({...prakriti, dominant_dosha: e.target.value})}
            className="clinical-input p-3 rounded-xl border border-[var(--glass-border)] bg-transparent"
          >
            <option value="">Select Dominant Dosha</option>
            <option value="vata">Vata</option>
            <option value="pitta">Pitta</option>
            <option value="kapha">Kapha</option>
            <option value="vata_pitta">Vata-Pitta</option>
            <option value="pitta_kapha">Pitta-Kapha</option>
            <option value="vata_kapha">Vata-Kapha</option>
            <option value="tridosha">Tridosha (Sama)</option>
          </select>
          <textarea
            placeholder="Prakriti notes..."
            value={prakriti.physician_notes || ''}
            onChange={e => setPrakriti({...prakriti, physician_notes: e.target.value})}
            className="clinical-input p-3 rounded-xl min-h-[80px]"
          />
        </div>

        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold">Vikriti (Imbalance)</h4>
          <select
            value={vikriti.primary_imbalance || ''}
            onChange={e => setVikriti({...vikriti, primary_imbalance: e.target.value})}
            className="clinical-input p-3 rounded-xl border border-[var(--glass-border)] bg-transparent"
          >
            <option value="">Select Primary Imbalance</option>
            <option value="vata">Vata Vitiation</option>
            <option value="pitta">Pitta Vitiation</option>
            <option value="kapha">Kapha Vitiation</option>
          </select>
          <select
            value={vikriti.agni_status || ''}
            onChange={e => setVikriti({...vikriti, agni_status: e.target.value})}
            className="clinical-input p-3 rounded-xl border border-[var(--glass-border)] bg-transparent"
          >
            <option value="">Select Agni Status</option>
            <option value="sama">Sama (Balanced)</option>
            <option value="vishama">Vishama (Irregular)</option>
            <option value="tikshna">Tikshna (Intense)</option>
            <option value="manda">Manda (Weak)</option>
          </select>
          <textarea
            placeholder="Vikriti/Clinical notes..."
            value={vikriti.clinical_notes || ''}
            onChange={e => setVikriti({...vikriti, clinical_notes: e.target.value})}
            className="clinical-input p-3 rounded-xl min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
}
