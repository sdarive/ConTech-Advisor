import { useState } from "react";
import { Download, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type ReportSection = {
  id: string;
  title: string;
  content: string;
  subsections?: { title: string; content: string }[];
};

type Recommendation = "proceed" | "caution" | "do-not-proceed";

type ReportViewerProps = {
  companyName: string;
  recommendation: Recommendation;
  executiveSummary: string;
  sections: ReportSection[];
  onDownload?: () => void;
};

export function ReportViewer({
  companyName,
  recommendation,
  executiveSummary,
  sections,
  onDownload,
}: ReportViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getRecommendationBadge = () => {
    switch (recommendation) {
      case "proceed":
        return (
          <Badge className="bg-chart-2 hover:bg-chart-2 text-base px-4 py-1.5" data-testid="badge-recommendation">
            ✓ Proceed
          </Badge>
        );
      case "caution":
        return (
          <Badge className="bg-chart-3 hover:bg-chart-3 text-base px-4 py-1.5" data-testid="badge-recommendation">
            ⚠ Proceed with Caution
          </Badge>
        );
      case "do-not-proceed":
        return (
          <Badge variant="destructive" className="text-base px-4 py-1.5" data-testid="badge-recommendation">
            ✕ Do Not Proceed
          </Badge>
        );
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    }
    console.log("Downloading report for:", companyName);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <CardTitle className="text-2xl">Executive Report: {companyName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                AI-Generated M&A Evaluation Report
              </p>
            </div>
            <Button onClick={handleDownload} data-testid="button-download-report">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Recommendation
              </h3>
              {getRecommendationBadge()}
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Executive Summary
              </h3>
              <p className="text-sm leading-relaxed" data-testid="text-executive-summary">
                {executiveSummary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Detailed Analysis
        </h3>
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <Card key={section.id} data-testid={`card-section-${section.id}`}>
              <CardHeader
                className="cursor-pointer hover-elevate"
                onClick={() => toggleSection(section.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed">{section.content}</p>
                  {section.subsections && section.subsections.length > 0 && (
                    <div className="space-y-3 pl-4 border-l-2 border-border">
                      {section.subsections.map((subsection, idx) => (
                        <div key={idx}>
                          <h4 className="text-sm font-medium mb-1">
                            {subsection.title}
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {subsection.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
