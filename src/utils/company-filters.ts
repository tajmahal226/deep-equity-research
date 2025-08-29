import { CompanyResult } from "@/store/companyDiscovery";

export interface CompanyFilterOptions {
  industries?: string[];
  locations?: string[];
  fundingStages?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
}

export function filterCompanies(
  companies: CompanyResult[],
  {
    industries = [],
    locations = [],
    fundingStages = [],
    keywords = [],
    excludeKeywords = [],
  }: CompanyFilterOptions
): CompanyResult[] {
  return companies.filter((company) => {
    const matchIndustry =
      industries.length === 0 || (company.industry && industries.includes(company.industry));
    const matchLocation =
      locations.length === 0 || (company.location && locations.includes(company.location));
    const matchFunding =
      fundingStages.length === 0 || (company.fundingStage && fundingStages.includes(company.fundingStage));

    const text = `${company.name} ${company.description} ${(company.tags || []).join(" ")}`.toLowerCase();
    const matchKeywords =
      keywords.length === 0 || keywords.every((k) => text.includes(k.toLowerCase()));
    const matchExcludeKeywords =
      excludeKeywords.length === 0 || excludeKeywords.every((k) => !text.includes(k.toLowerCase()));

    return matchIndustry && matchLocation && matchFunding && matchKeywords && matchExcludeKeywords;
  });
}

export default filterCompanies;
