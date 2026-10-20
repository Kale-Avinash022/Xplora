import os
import textwrap
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Set academic fonts
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']

OUTPUT_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'thesis_results'))
]

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

def generate_workflow_image():
    # Create high-res workflow diagram
    fig = plt.figure(figsize=(14, 18), dpi=300)
    fig.patch.set_facecolor('white')
    ax = fig.add_subplot(111)
    ax.set_facecolor('white')
    ax.axis('off')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)

    # Title & Subtitle
    ax.text(50, 98.2, "Xplora: AI-Powered Travel Platform — End-to-End Operational Workflow",
            ha='center', va='center', fontsize=16, fontweight='bold', color='#0F172A')
    ax.text(50, 96.5, "Detailed 10-Phase Pipeline from Natural Language Intent to Execution & Multi-Format Handoff",
            ha='center', va='center', fontsize=11, fontstyle='italic', color='#475569')

    # Define the 10 distinct phases with details
    phases = [
        {
            "num": "Phase 1",
            "title": "User Intent Ingestion & Input Capture",
            "color": "#1E3A8A", # Deep Blue
            "accent": "#DBEAFE",
            "tech": "Next.js 14 Frontend / NLP Input Bar",
            "desc": "Captures raw natural language queries, popular destination quick-select cards, or direct parameter overrides (Destination, Duration, Budget, Travel Style, Start Date)."
        },
        {
            "num": "Phase 2",
            "title": "NLP Entity Extraction & Query Normalization",
            "color": "#0F766E", # Teal
            "accent": "#CCFBF1",
            "tech": "POST /api/parse-query (NLP Extraction Service)",
            "desc": "Extracts structured metadata (entities: destination, durationDays, budget, travelStyle). Applies boundary clamping, budget validation, and defaults fallback."
        },
        {
            "num": "Phase 3",
            "title": "Real-Time Environmental & Meteorological Ingestion",
            "color": "#0369A1", # Sky Blue
            "accent": "#E0F2FE",
            "tech": "GET /api/weather (Open-Meteo API / Live Weather Service)",
            "desc": "Fetches multi-day meteorological forecasts (temperature, precipitation probability, WMO weather codes, and seasonal packing advisories) for target dates."
        },
        {
            "num": "Phase 4",
            "title": "Candidate Attraction & Venue Pool Retrieval",
            "color": "#4338CA", # Indigo
            "accent": "#E0E7FF",
            "tech": "Knowledge Base (destinationsKnowledge.ts) + Place Catalog",
            "desc": "Retrieves filtered candidate POIs matching the destination boundary. Classifies candidate attractions by tag: cultural, nature, culinary, adventure, indoor/outdoor."
        },
        {
            "num": "Phase 5",
            "title": "Multi-Criteria Suitability Scoring & Ranking",
            "color": "#7C2D12", # Deep Amber/Brown
            "accent": "#FFEDD5",
            "tech": "Deterministic 100-Point Scoring Engine",
            "desc": "Calculates composite ranking score: Style Fit (45 pts max) + Popularity / Quality (30 pts max) + Weather Resilience Fit (25 pts max). Prunes low-scoring POIs."
        },
        {
            "num": "Phase 6",
            "title": "Dynamic Weather-Adaptive Heuristic Filtering",
            "color": "#B45309", # Amber/Ochre
            "accent": "#FEF3C7",
            "tech": "Heuristic Weather Substitution Pipeline",
            "desc": "Scans daily forecast. If rain/storm is detected, flags outdoor attractions and executes automatic substitution with sheltered indoor alternatives (weatherSwapNotice)."
        },
        {
            "num": "Phase 7",
            "title": "Spatial Route Optimization & Cost Allocation",
            "color": "#15803D", # Forest Green
            "accent": "#DCFCE7",
            "tech": "Geographic Clustering + Cost Estimator Module",
            "desc": "Sequences stops into cohesive geographic daily clusters (5–8 km urban limit vs. regional excursion days). Splits total budget across stays, activities, transit, food."
        },
        {
            "num": "Phase 8",
            "title": "Parallel Live Travel Inventory Prefetching",
            "color": "#6D28D9", # Purple
            "accent": "#EDE9FE",
            "tech": "GET /api/flights, /api/hotels, /api/trains (SerpAPI / QRail)",
            "desc": "Asynchronously queries live transport and accommodation inventories in parallel. Implements truth-first validation (no fake prices; authentic provider deeplinks)."
        },
        {
            "num": "Phase 9",
            "title": "Interactive Client Hydration & Route Visualization",
            "color": "#0E7490", # Cyan/Ocean
            "accent": "#CFFAFE",
            "tech": "React SSR / Leaflet.js GPS Mapping Component",
            "desc": "Renders day-by-day interactive timeline cards, live budget tracking gauges, interactive Leaflet GPS map with plotted waypoints, and weather forecast cards."
        },
        {
            "num": "Phase 10",
            "title": "Post-Generation Persistence, Export & AI Chat Refinement",
            "color": "#334155", # Slate
            "accent": "#F1F5F9",
            "tech": "Prisma ORM / PostgreSQL + PDF/iCal/Calendar Exporters + AI Chat Drawer",
            "desc": "Persists customized itineraries to database (CRUD). Generates downloadable PDF and ICS calendar sync. Supports multi-turn conversational modifications via AIChatDrawer."
        }
    ]

    box_height = 7.2
    box_width = 88
    start_y = 93.5
    gap_y = 9.2

    for i, p in enumerate(phases):
        curr_y = start_y - (i * gap_y)

        # Outer Shadow Box
        shadow = patches.FancyBboxPatch((5.8, curr_y - box_height - 0.25), box_width + 0.4, box_height,
                                        boxstyle="round,pad=0.5,rounding_size=1.2",
                                        facecolor='#E2E8F0', edgecolor='none', zorder=1)
        ax.add_patch(shadow)

        # Main Box
        box = patches.FancyBboxPatch((5.6, curr_y - box_height), box_width, box_height,
                                     boxstyle="round,pad=0.5,rounding_size=1.2",
                                     facecolor='white', edgecolor=p['color'], linewidth=1.6, zorder=2)
        ax.add_patch(box)

        # Left Phase Badge (colored pill)
        badge = patches.FancyBboxPatch((7.2, curr_y - box_height + 1.2), 12.0, 4.8,
                                       boxstyle="round,pad=0.3,rounding_size=0.8",
                                       facecolor=p['color'], edgecolor='none', zorder=3)
        ax.add_patch(badge)

        ax.text(13.2, curr_y - box_height + 3.6, p['num'],
                ha='center', va='center', fontsize=11, fontweight='bold', color='white', zorder=4)

        # Title & Tech
        ax.text(21.2, curr_y - box_height + 5.1, p['title'],
                ha='left', va='center', fontsize=12, fontweight='bold', color='#0F172A', zorder=4)
        ax.text(21.2, curr_y - box_height + 3.5, f"Module / Contract: {p['tech']}",
                ha='left', va='center', fontsize=9.5, fontweight='bold', color=p['color'], zorder=4)

        # Description wrapped cleanly
        wrapped_desc = textwrap.fill(p['desc'], width=88)
        ax.text(21.2, curr_y - box_height + 1.6, wrapped_desc,
                ha='left', va='center', fontsize=8.6, color='#334155', linespacing=1.25, zorder=4)

        # Downward connector arrow between phases
        if i < len(phases) - 1:
            arrow_y = curr_y - box_height - 0.1
            ax.annotate('', xy=(50, arrow_y - 1.7), xytext=(50, arrow_y),
                        arrowprops=dict(arrowstyle="->,head_width=0.45,head_length=0.6",
                                        color='#64748B', lw=1.8), zorder=5)

    plt.tight_layout()
    for d in OUTPUT_DIRS:
        dest = os.path.join(d, 'figure_5_4_xplora_end_to_end_workflow.png')
        fig.savefig(dest, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
        print(f"Workflow diagram saved: {dest}")
    plt.close(fig)

if __name__ == '__main__':
    print("Generating comprehensive 10-phase workflow image...")
    generate_workflow_image()
