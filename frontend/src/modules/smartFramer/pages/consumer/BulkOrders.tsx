import { useEffect, useState } from "react";
import { supabase } from "@/modules/smartFramer/integrations/supabase/client";
import { useAuth } from "@/modules/smartFramer/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/smartFramer/components/ui/card";
import { Badge } from "@/modules/smartFramer/components/ui/badge";
import { Button } from "@/modules/smartFramer/components/ui/button";
import { Input } from "@/modules/smartFramer/components/ui/input";
import { Label } from "@/modules/smartFramer/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/modules/smartFramer/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/modules/smartFramer/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, IndianRupee, Package, CheckCircle2, XCircle } from "lucide-react";

interface BulkOrder {
  id: string;
  crop_name: string;
  quantity_requested: number;
  preferred_region: string | null;
  delivery_date: string | null;
  status: string;
  created_at: string;
  quotes: BulkQuote[];
}

interface BulkQuote {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  quoted_price: number;
  available_quantity: number;
  status: string;
  created_at: string;
}

const BulkOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [cropName, setCropName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [region, setRegion] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  // Available crops from farmer_details
  const [availableCrops, setAvailableCrops] = useState<string[]>([]);
  const [availableRegions, setAvailableRegions] = useState<string[]>([]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data: ordersData } = await supabase
      .from("bulk_orders")
      .select("*")
      .eq("consumer_id", user.id)
      .order("created_at", { ascending: false });

    if (!ordersData) { setLoading(false); return; }

    // Fetch quotes for each order
    const orderIds = ordersData.map((o: any) => o.id);
    const { data: quotesData } = await supabase
      .from("bulk_quotes")
      .select("*")
      .in("bulk_order_id", orderIds.length ? orderIds : ["__none__"]);

    // Fetch farmer names
    const farmerIds = [...new Set((quotesData || []).map((q: any) => q.farmer_id))];
    const { data: profiles } = farmerIds.length
      ? await supabase.rpc("get_public_farmer_profiles")
      : { data: [] };
    const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

    const merged: BulkOrder[] = ordersData.map((o: any) => ({
      ...o,
      quotes: (quotesData || [])
        .filter((q: any) => q.bulk_order_id === o.id)
        .map((q: any) => ({ ...q, farmer_name: nameMap.get(q.farmer_id) || "Unknown" })),
    }));

    setOrders(merged);
    setLoading(false);
  };

  const fetchCropsAndRegions = async () => {
    const { data } = await supabase.from("farmer_details").select("primary_crop");
    const { data: profiles } = await supabase.rpc("get_public_farmer_profiles");
    if (data) setAvailableCrops([...new Set(data.map((d: any) => d.primary_crop))].sort());
    if (profiles) setAvailableRegions([...new Set(profiles.map((p: any) => p.region).filter(Boolean))].sort());
  };

  useEffect(() => {
    fetchOrders();
    fetchCropsAndRegions();

    const channel = supabase
      .channel("bulk_orders_consumer")
      .on("postgres_changes", { event: "*", schema: "public", table: "bulk_quotes" }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !cropName || !quantity) { toast.error("Fill in required fields"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("bulk_orders").insert({
      consumer_id: user.id,
      crop_name: cropName,
      quantity_requested: parseFloat(quantity),
      preferred_region: region || null,
      delivery_date: deliveryDate || null,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { toast.error("Failed: " + error.message); return; }
    toast.success("Bulk order request submitted!");
    setShowForm(false);
    setCropName(""); setQuantity(""); setRegion(""); setDeliveryDate("");
    fetchOrders();
  };

  const handleQuoteAction = async (quoteId: string, action: "accepted" | "rejected") => {
    const { error } = await supabase.from("bulk_quotes").update({ status: action }).eq("id", quoteId);
    if (error) { toast.error("Failed to update quote"); return; }
    toast.success(`Quote ${action}`);
    fetchOrders();
  };

  const statusColor = (s: string) => {
    if (s === "accepted") return "default" as const;
    if (s === "rejected") return "destructive" as const;
    if (s === "quoted") return "secondary" as const;
    return "outline" as const;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading bulk orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-foreground">Bulk Orders</h1>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> New Bulk Order
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No bulk order requests yet. Create one to get quotes from multiple farmers.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{order.crop_name} — {order.quantity_requested} kg</CardTitle>
                  <Badge variant={statusColor(order.status)}>{order.status}</Badge>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  {order.preferred_region && <span>Region: {order.preferred_region}</span>}
                  {order.delivery_date && <span>Delivery by: {new Date(order.delivery_date).toLocaleDateString()}</span>}
                  <span>{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent>
                {order.quotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Waiting for farmer quotes...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Quotes Received ({order.quotes.length})</p>
                    {order.quotes.map((q) => (
                      <div key={q.id} className="flex items-center justify-between bg-muted/50 rounded-md p-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{q.farmer_name}</p>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-0.5"><IndianRupee className="w-3 h-3" /> ₹{q.quoted_price}/kg</span>
                            <span className="flex items-center gap-0.5"><Package className="w-3 h-3" /> {q.available_quantity} kg available</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {q.status === "pending" ? (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleQuoteAction(q.id, "accepted")}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Accept
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => handleQuoteAction(q.id, "rejected")}>
                                <XCircle className="w-3 h-3 mr-1" /> Reject
                              </Button>
                            </>
                          ) : (
                            <Badge variant={statusColor(q.status)}>{q.status}</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Bulk Order Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Bulk Order Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Crop Name *</Label>
              <Select value={cropName} onValueChange={setCropName}>
                <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                <SelectContent>
                  {availableCrops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity Required (kg) *</Label>
              <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g. 500" />
            </div>
            <div className="space-y-2">
              <Label>Preferred Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger><SelectValue placeholder="Any region" /></SelectTrigger>
                <SelectContent>
                  {availableRegions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Delivery Date</Label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkOrders;
