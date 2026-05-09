import { useState } from 'react';
import { Button } from '@/components/ui/button';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function DebugMindbodySession({ sessionId }: { sessionId?: string }) {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const run = async (probe: boolean) => {
    if (!sessionId) return;
    setLoading(true);
    setResult('');
    try {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/verify-mindbody-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({ sessionId, probe }),
      });
      const text = await r.text();
      setResult(text);
    } catch (e: any) {
      setResult(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-black/[0.06] bg-white/40 p-4 space-y-2">
      <p className="text-xs font-medium text-black/60">Debug · Mindbody session</p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={loading} onClick={() => run(false)}>
          Check token site
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => run(true)}>
          Probe API (no charge)
        </Button>
      </div>
      {result && (
        <pre className="text-[10px] leading-snug bg-black/5 rounded p-2 overflow-auto max-h-80 whitespace-pre-wrap break-all">
{result}
        </pre>
      )}
    </div>
  );
}
