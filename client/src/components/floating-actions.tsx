import { Button } from "@/components/ui/button";
import { Download, Share, Plus } from "lucide-react";

export function FloatingActions() {
  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download summary");
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share analysis");
  };

  const handleNew = () => {
    // TODO: Implement new analysis functionality
    window.location.reload();
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col space-y-3" data-testid="floating-actions">
      <Button
        variant="outline"
        size="icon"
        onClick={handleDownload}
        className="w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all"
        data-testid="button-download"
      >
        <Download className="w-4 h-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={handleShare}
        className="w-12 h-12 bg-white border border-slate-200 rounded-full shadow-lg text-slate-600 hover:text-green-600 hover:border-green-200 transition-all"
        data-testid="button-share"
      >
        <Share className="w-4 h-4" />
      </Button>
      <Button
        size="icon"
        onClick={handleNew}
        className="w-12 h-12 bg-blue-600 rounded-full shadow-lg text-white hover:bg-blue-700 transition-all"
        data-testid="button-new"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
