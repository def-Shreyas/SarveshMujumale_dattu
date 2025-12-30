import { useState } from "react";
import { querySafetyAI, downloadSafetyPDF } from "../api";
import type { Incident } from "../types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function SafetyChat() {
  const { token, user } = useAuth();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState<Incident[]>([]);

  const handleAsk = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await querySafetyAI(query, token);
      setCases(res.cases);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePDF = async () => {
    try {
      await downloadSafetyPDF(query, token);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <Textarea
          placeholder="Ask DATTU about a safety scenario…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mb-3"
        />

        <div className="flex gap-3">
          <Button onClick={handleAsk} disabled={loading}>
            {loading ? "Analyzing…" : "Ask DATTU"}
          </Button>

          {(user.subscription_tier === "premium" ||
            user.subscription_tier === "enterprise") && (
            <Button variant="outline" onClick={handlePDF}>
              Download PDF
            </Button>
          )}
        </div>
      </Card>

      {cases.map((c) => (
        <Card key={c.case_id} className="p-4">
          <h3 className="font-semibold text-lg">{c.title}</h3>
          <p className="text-sm text-muted-foreground">
            {c.year} • {c.country} • {c.industry} • {c.severity}
          </p>
          <p className="mt-2">{c.summary}</p>

          <ul className="mt-2 list-disc list-inside text-sm">
            {c.lessons_learned.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>

          <a
            href={c.source_url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 text-sm mt-2 inline-block"
          >
            View source
          </a>
        </Card>
      ))}
    </div>
  );
}