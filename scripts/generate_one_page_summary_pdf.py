from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from textwrap import wrap

OUTPUT_PATH = 'docs/deep-equity-research-one-page-summary.pdf'

SECTIONS = [
    (
        'What it is',
        [
            'TJ Deep Research is a Next.js app that orchestrates AI reasoning/task models with web search to produce equity research reports quickly.',
            'The app is designed to run research workflows in the browser, with user-provided API keys configured in Settings.',
        ],
    ),
    (
        "Who it's for",
        [
            'Primary persona: equity researchers, investors, and analysts who need fast, structured company and market intelligence.',
        ],
    ),
    (
        'What it does',
        [
            'Offers 8 research modes: Company Deep Dive, Bulk Company Research, Market Research, Free Form, Company Discovery, Case Studies, Doc Storage, and Prompt Library.',
            'Supports multiple AI providers (OpenAI, Anthropic, Google, OpenRouter, DeepSeek, Ollama, and others).',
            'Supports multiple search providers including Tavily, Exa, Firecrawl, model-native search, and SearXNG.',
            'Streams long-running deep-research progress/results via Server-Sent Events (SSE).',
            'Persists app settings/history state in browser storage using Zustand; sensitive settings fields are encrypted before localStorage persistence.',
            'Includes history/knowledge side panels and prompt libraries for repeatable workflows.',
        ],
    ),
    (
        'How it works (repo-evidenced architecture)',
        [
            'UI layer: Next.js App Router page dynamically loads research mode components and side panels (Settings, History, Knowledge).',
            'State layer: Zustand stores manage global UI state, settings, tasks, history, and knowledge.',
            'Orchestration layer: useDeepResearch coordinates model calls, question/plan generation, web search, and report assembly with streaming AI SDK responses.',
            'API layer: /api/sse validates keys, configures provider/search endpoints, creates a DeepResearch engine instance, and streams events back to the client.',
            'Integration layer: dedicated API proxy routes exist for AI and search providers under /api/ai/* and /api/search/*.',
        ],
    ),
    (
        'How to run (minimal getting started)',
        [
            '1) Install deps: pnpm install',
            '2) Start dev server: pnpm dev',
            '3) Open http://localhost:3000',
            '4) In Settings, enter AI provider key and search provider key.',
            '5) Choose a research mode and run a query.',
        ],
    ),
    (
        'Not found in repo',
        [
            'Formal SLA/performance targets and canonical production architecture diagram: Not found in repo.',
        ],
    ),
]


def build_pdf() -> None:
    c = canvas.Canvas(OUTPUT_PATH, pagesize=letter)
    width, height = letter

    x = 0.7 * inch
    y = height - 0.7 * inch
    line_height = 13

    c.setTitle('Deep Equity Research - One Page Summary')
    c.setFont('Helvetica-Bold', 16)
    c.drawString(x, y, 'Deep Equity Research — One-Page App Summary')
    y -= 20

    c.setStrokeColor(colors.HexColor('#cccccc'))
    c.line(x, y, width - 0.7 * inch, y)
    y -= 18

    for section_title, bullets in SECTIONS:
        c.setFont('Helvetica-Bold', 11.5)
        c.drawString(x, y, section_title)
        y -= line_height

        c.setFont('Helvetica', 10)
        for bullet in bullets:
            for idx, segment in enumerate(wrap(bullet, 108)):
                prefix = '• ' if idx == 0 else '  '
                c.drawString(x + 8, y, f'{prefix}{segment}')
                y -= line_height
            y -= 1

        y -= 4

    c.showPage()
    c.save()


if __name__ == '__main__':
    build_pdf()
