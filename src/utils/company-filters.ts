export interface CompanyFilterOptions {
  industries?: string[];
  locations?: string[];
  fundingStages?: string[];
  keywords?: string[];
  excludeKeywords?: string[];
}

// Define minimal company shape required for filtering so that the utility can
// operate on objects that haven't been fully enriched with an `id` or
// `discoveredAt` yet. This allows us to filter both complete `CompanyResult`
// objects as well as partial results generated during company enrichment.
interface FilterableCompany {
  name: string;
  description: string;
  industry?: string;
  location?: string;
  fundingStage?: string;
  tags?: string[];
}

/**
 * Filter a list of companies based on various criteria.
 *
 * @param companies - The list of companies to filter.
 * @param options - Filtering options (industries, locations, etc.).
 * @returns The filtered list of companies.
 */
export function filterCompanies<T extends FilterableCompany>(
  companies: T[],
  {
    industries = [],
    locations = [],
    fundingStages = [],
    keywords = [],
    excludeKeywords = [],
  }: CompanyFilterOptions
): T[] {
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
