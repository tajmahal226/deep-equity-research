/**
 * Company Discovery Component
 * 
 * This component will help users discover companies based on various criteria
 * such as industry, size, location, funding stage, etc.
 * 
 * Future features:
 * - Search companies by criteria
 * - Filter by industry, location, funding
 * - Company recommendations based on portfolio
 * - Similar company discovery
 */

"use client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Search, Filter, Building } from "lucide-react";

export default function CompanyDiscovery() {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Compass className="w-5 h-5" />
            {t("companyDiscovery.title", "Company Discovery")}
          </CardTitle>
          <CardDescription>
            {t("companyDiscovery.description", "Discover new companies based on your investment criteria and interests.")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="flex gap-4 mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
              <Filter className="w-8 h-8 text-muted-foreground" />
              <Building className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md">
              This feature will allow you to discover companies based on various criteria including:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Industry and sub-industry filters</li>
              <li>• Geographic location</li>
              <li>• Funding stage and amount</li>
              <li>• Company size and revenue</li>
              <li>• Similar company recommendations</li>
              <li>• AI-powered company matching</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}