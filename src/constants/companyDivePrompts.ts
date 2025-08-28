export const systemInstruction = `You are a public equity investment analyst with deep knowledge of software and tech enabled services
bussinesses. Today is {now}. Follow these instructions when responding:

- You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
- The user is a highly experienced public equity analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
- Be highly organized.
- The goal is to make the user prepared to have a 1-hour CEO meeting with the company's CEO, ask the right questions and impress them with their knowledge on the space and the company.
- Be proactive and anticipate my needs.
- Treat me as an expert in all subject matter.
- Mistakes erode my trust, so be accurate and thorough.
- Do not make up financial information, the purpose of the research is market, business model, competitive landscape, and other non-financial information.
- Provide detailed explanations, I'm comfortable with lots of detail.
- Value good arguments over authorities, the source is irrelevant.
- Consider new technologies and contrarian ideas, not just the conventional wisdom.
- You may use high levels of speculation or prediction, just flag it for me.`;

export const outputGuidelinesPrompt = `<OutputGuidelines>

## Typographical rules

Follow these rules to organize your output:

- **Title:** Use \`#\` to create article title.
- **Headings:** Use \`##\` through \`######\` to create headings of different levels.
- **Paragraphs:** Use blank lines to separate paragraphs.
- **Bold emphasis (required):** Use asterisks to highlight **important** content from the rest of the text.
- **Links:** Use \`[link text](URL)\` to insert links.
- **Lists:**
    - **Unordered lists:** Use \`*\`, \`-\`, or \`+\` followed by a space.
    - **Ordered lists:** Use \`1.\`, \`2.\`, etc., and a period.
* **Code:**
    - **Inline code:** Enclose it in backticks (\` \`).
    - **Code blocks:** Enclose it in triple backticks (\`\`\` \`\`\`), optionally in a language.
- **Quotes:** Use the \`>\` symbol.
- **Horizontal rule:** Use \`---\`, \`***\` or \`___\`.
- **Table**: Use basic GFM table syntax, do not include any extra spaces or tabs for alignment, and use \`|\` and \`-\` symbols to construct. **For complex tables, GFM table syntax is not suitable. You must use HTML syntax to output complex tables.**
- **Emoji:** You can insert Emoji before the title or subtitle, such as \`🔢### 1. Determine the base area of the prism\`.
- **LaTeX:**
    - **Inline formula:** Use \`$E=mc^2$\`
    - **Block-level formula (preferred):** Use \`$$E=mc^2$$\` to display the formula in the center.

## Generate Mermaid

1. Use Mermaid's graph TD (Top-Down) or graph LR (Left-Right) type.
2. Create a unique node ID for each identified entity (must use English letters or abbreviations as IDs), and display the full name or key description of the entity in the node shape (e.g., PersonA[Alice], OrgB[XYZ Company]).
3. Relationships are represented as edges with labels, and the labels indicate the type of relationship (e.g., A --> |"Relationship Type"| B).
4. Respond with ONLY the Mermaid code (including block), and no additional text before or after.
5. Please focus on the most core entities in the article and the most important relationships between them, and ensure that the generated graph is concise and easy to understand.
6. All text content **MUST** be wrapped in \`"\` syntax. (e.g., "Any Text Content")
7. You need to double-check that all content complies with Mermaid syntax, especially that all text needs to be wrapped in \`"\`.
</OutputGuidelines>`;


export const guidelinesPrompt = `Integration guidelines:
<GUIDELINES>
- Ensure each section has a distinct purpose with no content overlap.
- Combine related concepts rather than separating them.
- CRITICAL: Every section MUST be directly relevant to the main topic.
- Avoid tangential or loosely related sections that don't directly address the core topic.
</GUIDELINES>`;

export const markdownFormattingPrompt = `
MARKDOWN FORMATTING REQUIREMENTS:

1. **Headers**:
   - Use # for the main title only
   - Use ## for major sections (e.g., ## Company Overview)
   - Use ### for subsections (e.g., ### Business Model)
   - Always add a space after the hash symbols

2. **Spacing**:
   - Add 2 blank lines between major sections (##)
   - Add 1 blank line between subsections (###)
   - Add 1 blank line between paragraphs
   - Add 1 blank line before and after lists

3. **Lists**:
   - Use - or * for bullet points
   - Indent sub-items with 2 spaces
   - Add a blank line before and after lists

4. **Emphasis**:
   - Bold company names on first mention: **Silverfort**
   - Bold key metrics: **$116M** funding
   - Bold important terms: **Identity Security Platform**

5. **Citations**:
   - Place inline after statements: "Silverfort serves over 1,000 enterprises [2]"
   - Multiple citations: "The platform offers MFA and ITDR [1][3]"

6. **Images**:
   - Place within relevant sections
   - Format: ![Description](url)
   - Add blank line before and after

Example structure:

# Silverfort - Investment Analysis

## Executive Summary

**Silverfort** is a leading identity security company that has raised **$116M** in funding [1]. The company provides comprehensive identity protection across enterprise environments.

## Company Overview

### Business Model

Silverfort operates on a SaaS model with the following key components:

- **Identity Security Platform**: Core offering
- **Multi-factor Authentication**: Extended MFA capabilities
- **AI Agent Security**: Latest innovation [2]

### Market Position

The company has achieved significant milestones...

![Silverfort Platform Overview](image-url)

Continue with this formatting throughout the report.`;


export const INVESTMENT_RESEARCH_SECTIONS = {
    companyOverview: {
      title: "Company Overview",
      prompts: [
        "Provide a brief overview of the company",
        "Analyze the company's products, core technologies, and offerings",
        "Identify primary use-cases and pain-points solved, differentiated by industry verticals and business sizes (enterprise vs. mid-market vs. SMB)",
        "Explain how the company makes money, including product and pricing strategy and upsell opportunities",
        "Calculate detailed ROI metrics from the customer perspective with quantitative data",
        "Provide technical explanation of how their technology functions, including architecture, integrations, and underlying innovations"
      ]
    },
    companyProductDeepDive: {
      title: "Company and Product Deep Dive",
      prompts: [
        "Provide comprehensive overview of the company's products, core technologies, and offerings",
        "Explain technical architecture, integrations, and underlying innovations in detail",
        "Calculate detailed ROI metrics from customer perspective with quantitative metrics",
        "Analyze primary use-cases and pain-points solved by industry vertical and business size"
      ]
    },
    customersBuyersChannels: {
      title: "Customers, Buyers, and Channels",
      prompts: [
        "Profile primary customer types including industry verticals, business size, and buying personas (CIO, CISO, CTO, etc.)",
        "Analyze go-to-market strategy, channel partnerships, distribution strategy, and geographic focus",
        "Overview typical buying cycles, channels of importance, implementation times and decision-making processes",
        "Create chart of key purchase criteria for budget holders with relative importance",
        "Identify key purchase criteria for user-centric purchasers and their priorities",
        "Rank competitors across each of the key purchase criteria"
      ]
    },
    marketBackground: {
      title: "Market Background and Context",
      prompts: [
        "Define the market, typical issues/risks, and evolution over time",
        "Discuss historical context including past solutions, vendors, and market changes",
        "Analyze recent market evolution, new innovations, and emerging risks",
        "Explain how incumbent tools fall short in the current environment",
        "Assess current market landscape, size, and projected growth rates of relevant sub-markets"
      ]
    },
    competitiveAnalysis: {
      title: "Competitive Analysis",
      prompts: [
        "Conduct detailed analysis of direct competitors, indirect competitors, and adjacent market players",
        "Segment competitors across key dimensions: product features, bundles, pricing models, target customers",
        "Differentiate competitors by buyer persona across capabilities, pricing, scalability, integrations, usability, security, and satisfaction",
        "Analyze differentiation by customer type (enterprise vs. SMB, vertical-specific, geographical)",
        "Discuss adjacent areas, cross-market competitors, and bundling/platformization trends",
        "Identify M&A opportunities and platform consolidation trends"
      ]
    },
    trendsAndStrategy: {
      title: "Broader Trends and Strategic Positioning",
      prompts: [
        "Analyze macro-trends impacting the infrastructure software category (cloud migration, shift-left security, AI adoption, DevSecOps, automation, cost management, regulatory shifts)",
        "Identify emerging opportunities within market segments",
        "Assess strategic risks and threats (technical obsolescence, competitive pressure, market shifts, regulatory risk, execution risks)",
        "Develop growth opportunities perspective including pricing/packaging, new products, adjacencies, M&A, and GTM partnerships"
      ]
    },
    bullBearCase: {
      title: "Bull Case / Bear Case",
      prompts: [
        "Develop sophisticated bull case that a seasoned investor would consider",
        "Develop comprehensive bear case highlighting key risks and challenges",
        "Use only publicly available information without speculation on unknown financials"
      ]
    },
    keyQuestions: {
      title: "Key Questions and Next Steps",
      prompts: [
        "Formulate 10 critical questions for a 1-hour CEO meeting covering business, competition, long-term strategy, and success potential",
        "Identify further market research priorities and information gaps"
      ]
    },
    recentNews: {
      title: "Key Recent News and Updates",
      prompts: [
        "Compile most important recent announcements, product launches, partnerships, and customer wins",
        "Track recent funding events and financial milestones",
        "Monitor strategic moves and announcements by key competitors"
      ]
    }
  };

// Structured report formatting prompts
export const companyReportCitationImagePrompt = `Image Rules:

- Images related to the paragraph content at the appropriate location in the article according to the image description.
- Include images using \`![Image Description](image_url)\` in a separate section.
- **Do not add any images at the end of the article.**`;

export const companyReportReferencesPrompt = `Citation Rules:

- Please cite research references at the end of your paragraphs when appropriate.
- If the citation is from the reference, please **ignore**. Include only references from sources.
- Please use the reference format [number], to reference the learnings link in corresponding parts of your answer.
- If a paragraphs comes from multiple learnings reference link, please list all relevant citation numbers, e.g., [1][2]. Remember not to group citations at the end but list them in the corresponding parts of your answer. Control the number of footnotes.
- Do not have more than 3 reference link in a paragraph, and keep only the most relevant ones.
- **Do not add references at the end of the report.**`;

export const companyFinalReportPrompt = `This is the investment research plan for {companyName}:
<PLAN>
{plan}
</PLAN>

Here are all the learnings from research about {companyName}:
<LEARNINGS>
{learnings}
</LEARNINGS>

Here are all the sources from research, if any:
<SOURCES>
{sources}
</SOURCES>

Here are all the images from research, if any:
<IMAGES>
{images}
</IMAGES>

Additional context provided:
<CONTEXT>
{context}
</CONTEXT>

Write a comprehensive investment research report based on the plan using the learnings from research.

{formattingPrompt}

Structure the report according to the investment sections provided in the plan.
Make it as detailed as possible, aim for 5+ pages, include ALL the learnings from research.
Each section should have substantive analysis with specific data points, dates, and insights.

{citationPrompt}

{imagePrompt}

**Respond only the final report content formatted in markdown, and no additional text before or after.**`;
