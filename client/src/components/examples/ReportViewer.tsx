import { ReportViewer as ReportViewerComponent } from "../ReportViewer";

export default function ReportViewerExample() {
  const reportData = {
    companyName: "BuildTech Solutions Inc.",
    recommendation: "proceed" as const,
    executiveSummary:
      "BuildTech Solutions presents a compelling acquisition opportunity with strong fundamentals across all evaluation dimensions. The company demonstrates robust financial health with 45% YoY revenue growth and healthy margins.",
    sections: [
      {
        id: "financial",
        title: "Financial Health & Risk Assessment",
        content:
          "BuildTech demonstrates strong financial performance with revenue growth of 45% YoY, reaching $28M in ARR.",
        subsections: [
          {
            title: "Key Metrics",
            content: "ARR: $28M (+45% YoY), Gross Margin: 78%, EBITDA Margin: 18%",
          },
        ],
      },
      {
        id: "market",
        title: "Market Position & Growth Trajectory",
        content:
          "BuildTech operates in the construction analytics software market, estimated at $2.1B and growing at 23% CAGR.",
      },
    ],
  };

  return (
    <div className="p-6 max-w-5xl">
      <ReportViewerComponent {...reportData} />
    </div>
  );
}
