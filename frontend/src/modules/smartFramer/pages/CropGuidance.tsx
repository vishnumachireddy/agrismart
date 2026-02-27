import { useState } from "react";
import { BookOpen, AlertTriangle, Lightbulb, CheckCircle, ChevronDown, ChevronUp, Sprout, Droplets, Sun } from "lucide-react";

const tabs = ["Best Practices", "Disease Prevention", "Climate Precautions"];

const practices = [
  { icon: Sprout, title: "Soil Preparation", desc: "Proper soil preparation is the foundation of a healthy crop.", content: "Test soil pH (ideal 6.0-7.0). Add organic matter for better water retention. Plow 20-25cm deep. Apply lime if pH is below 5.5. Let soil rest 2-3 weeks after preparation." },
  { icon: Droplets, title: "Water Management", desc: "Efficient irrigation ensures optimal crop growth.", content: "Use drip irrigation to save 40-60% water. Irrigate early morning or late evening. Monitor soil moisture at 15cm depth. Reduce irrigation during rainy season." },
  { icon: Sun, title: "Sunlight & Spacing", desc: "Proper spacing ensures adequate sunlight for all plants.", content: "Follow recommended spacing for each crop. Prune lower leaves for air circulation. Use mulching to retain moisture. Orient rows north-south for max sunlight." },
];

const CropGuidance = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-accent text-primary text-xs font-semibold rounded-full mb-3">
          <BookOpen className="w-3 h-3" /> AI Expert Advice
        </span>
        <h1 className="text-2xl font-display font-bold text-agri-orange">Precision Farming Guidance</h1>
        <p className="text-sm text-muted-foreground mt-1">Science-backed strategies to maximize yield and minimize effort</p>
      </div>

      {/* Info banner */}
      <div className="bg-card rounded-xl p-6 card-shadow border border-border grid grid-cols-3 gap-6 text-center">
        {[
          { icon: AlertTriangle, label: "Traditional Risks", desc: "Unexpected soil fatigue and pest outbreaks can ruin harvests.", color: "text-agri-amber" },
          { icon: Lightbulb, label: "Smart Monitoring", desc: "Real-time alerts and precision crop rotation schedules.", color: "text-foreground" },
          { icon: CheckCircle, label: "Sustainability", desc: "Reduced chemical usage and naturally enriched soil nutrients.", color: "text-primary" },
        ].map((i) => (
          <div key={i.label}>
            <i.icon className={`w-6 h-6 mx-auto mb-2 ${i.color}`} />
            <p className="font-semibold text-sm">{i.label}</p>
            <p className="text-xs text-muted-foreground mt-1">{i.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border justify-center">
        {tabs.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Accordion */}
      <div className="space-y-3 max-w-3xl mx-auto">
        {practices.map((p, i) => (
          <div key={p.title} className="bg-card rounded-xl card-shadow border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center gap-4 p-5 text-left"
            >
              <p.icon className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
              {expanded === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {expanded === i && (
              <div className="px-5 pb-5 pt-0 text-sm text-muted-foreground border-t border-border ml-9">
                <p className="mt-3">{p.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CropGuidance;
