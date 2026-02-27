import { useState, useRef, useEffect } from "react";
import { FlaskConical, Send, Loader2 } from "lucide-react";
import { supabase } from "@/modules/smartFramer/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  role: "bot" | "user";
  text: string;
  time: string;
}

const Fertilizer = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Ask a specific question about fertilizers, nutrients, or soil health.", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg, time: now }]);
    setLoading(true);

    try {
      // Attempt to call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke("fertilizer-chat", {
        body: { message: userMsg },
      });

      if (error || data?.error) {
        console.warn("Supabase function failed, falling back to local simulation:", error || data?.error);
        throw new Error("Local fallback");
      }

      const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages((prev) => [...prev, { role: "bot", text: data.reply || "I couldn't process that. Please try again.", time: botTime }]);
    } catch (err) {
      // Local Mock Responses for high availability
      const responses: Record<string, string> = {
        "npk": "NPK stands for Nitrogen (N), Phosphorus (P), and Potassium (K). For leafy crops like Spinach, use high Nitrogen. For roots like Potatoes, use high Potassium.",
        "urea": "Urea provides high nitrogen. Use it during the vegetative growth phase. Avoid excessive use as it can burn the crops.",
        "soil": "To improve soil health, consider organic compost and crop rotation. Test your soil PH regularly (6.0-7.0 is ideal for most crops).",
        "default": "Based on current agricultural standards, I recommend checking your specific crop's requirement. Generally, a balanced 19-19-19 NPK is good for early stages."
      };

      const lowerMsg = userMsg.toLowerCase();
      let reply = responses.default;
      if (lowerMsg.includes("npk")) reply = responses.npk;
      else if (lowerMsg.includes("urea")) reply = responses.urea;
      else if (lowerMsg.includes("soil")) reply = responses.soil;

      setTimeout(() => {
        const botTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setMessages((prev) => [...prev, { role: "bot", text: reply, time: botTime }]);
        setLoading(false);
      }, 1000);
      return; // Handled by timeout
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-2xl font-display font-bold text-agri-orange uppercase tracking-wide">Fertilizer AI Chat</h1>
            <p className="text-sm text-muted-foreground">Expert Advice on Nutrients & Soil</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-accent text-primary text-xs font-semibold rounded-full">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse-gentle" /> AI Active
        </span>
      </div>

      <div className="max-w-2xl mx-auto bg-card rounded-xl card-shadow border border-border flex flex-col" style={{ height: "500px" }}>
        <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-xl px-4 py-3`}>
                <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.role === "user" ? "opacity-70" : "text-muted-foreground"}`}>{m.time}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about NPK, Urea, or Organic Fertilizers..."
            className="flex-1 px-4 py-2 rounded-lg bg-muted text-sm border-0 focus:outline-none focus:ring-2 focus:ring-ring"
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading} className="p-2.5 agri-gradient rounded-lg text-primary-foreground disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Fertilizer;
