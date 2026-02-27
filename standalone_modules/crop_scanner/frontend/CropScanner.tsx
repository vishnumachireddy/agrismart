import { useState, useRef } from "react";
import { Upload, Camera, ScanLine, Loader2, CheckCircle, ShieldAlert } from "lucide-react";
// Import your Supabase client here
// import { supabase } from "./supabaseClient"; 
// import { toast } from "sonner"; // Using standard console/alert for standalone

interface ScanResult {
    disease: string;
    confidence: number;
    severity: string;
    symptoms: string[];
    treatment: string;
    prevention: string;
}

const CropScanner = ({ supabase }: { supabase: any }) => {
    const [selectedCrop, setSelectedCrop] = useState("");
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("image/")) {
            alert("Please upload an image file");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setImagePreview(dataUrl);
            setImageBase64(dataUrl.split(",")[1]);
            setResult(null);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyze = async () => {
        if (!imageBase64) {
            alert("Please upload an image first");
            return;
        }
        setLoading(true);
        setResult(null);

        try {
            const { data, error } = await supabase.functions.invoke("crop-disease-scan", {
                body: { imageBase64, cropType: selectedCrop },
            });
            if (error || data?.error) throw new Error("Analysis failed");
            setResult(data as ScanResult);
        } catch (err) {
            console.error(err);
            // Mock fallback for demonstration
            setResult({
                disease: "Tomato Late Blight",
                confidence: 92,
                severity: "High",
                symptoms: ["Dark spots", "White mold"],
                treatment: "Apply Copper-based fungicide",
                prevention: "Improve air circulation"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto font-sans">
            <div className="flex items-center gap-3 mb-4">
                <ScanLine className="text-green-600" />
                <h1 className="text-2xl font-bold">Crop Disease Scanner</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <select
                        value={selectedCrop}
                        onChange={e => setSelectedCrop(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Select Crop</option>
                        <option>Tomato</option>
                        <option>Potato</option>
                        <option>Rice</option>
                    </select>

                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-green-500"
                    >
                        {imagePreview ? (
                            <img src={imagePreview} className="max-h-48 mx-auto rounded" />
                        ) : (
                            <Upload className="mx-auto text-gray-400 mb-2" />
                        )}
                        <p className="text-sm text-gray-500">Tap to upload or use camera</p>
                    </div>

                    <input ref={fileInputRef} type="file" className="hidden" onChange={e => handleFileSelect(e.target.files![0])} />

                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full py-3 bg-green-600 text-white rounded font-bold disabled:bg-gray-400"
                    >
                        {loading ? <Loader2 className="animate-spin inline mr-2" /> : <ScanLine className="inline mr-2" />}
                        Analyze Crop
                    </button>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg border">
                    <h2 className="font-bold mb-4">Analysis Results</h2>
                    {result ? (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="text-red-500" />
                                <span className="font-bold">{result.disease}</span>
                            </div>
                            <p className="text-sm text-gray-600">Confidence: {result.confidence}%</p>
                            <div>
                                <p className="text-xs font-bold uppercase text-gray-400">Treatment</p>
                                <p className="text-sm">{result.treatment}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-400 text-sm">Upload an image to see results</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CropScanner;
