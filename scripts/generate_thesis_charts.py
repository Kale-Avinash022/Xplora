import os
import shutil
import matplotlib
import matplotlib.pyplot as plt
import numpy as np

# Set matplotlib configuration for publication-grade academic figures
matplotlib.rcParams['font.family'] = 'sans-serif'
matplotlib.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
matplotlib.rcParams['axes.edgecolor'] = '#333333'
matplotlib.rcParams['axes.linewidth'] = 0.8
matplotlib.rcParams['xtick.color'] = '#333333'
matplotlib.rcParams['ytick.color'] = '#333333'
matplotlib.rcParams['text.color'] = '#111111'
matplotlib.rcParams['axes.labelcolor'] = '#111111'

OUTPUT_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'docs', 'thesis_results'))
]

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

def save_fig(fig, filename):
    for d in OUTPUT_DIRS:
        dest = os.path.join(d, filename)
        fig.savefig(dest, dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')
        print(f"Saved: {dest}")

# -------------------------------------------------------------------------
# Figure 5.1: Daily Itinerary Travel Distances & Stop Counts
# -------------------------------------------------------------------------
def generate_figure_5_1():
    days = ['Day 1', 'Day 2', 'Day 3', 'Day 4\n(Rain Adapted)', 'Day 5\n(Excursion)']
    distances = [6, 8, 5, 7, 41]
    stops = [3, 3, 3, 2, 3]

    fig, ax = plt.subplots(figsize=(8.0, 4.8), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    bar_color = '#2563EB'  # Professional academic royal blue
    highlight_color = '#1D4ED8' # Deeper accent for excursion

    colors = [bar_color, bar_color, bar_color, '#0284C7', highlight_color]
    bars = ax.bar(days, distances, color=colors, width=0.52, edgecolor='#1E3A8A', linewidth=1.1, zorder=3)

    # Gridlines behind bars
    ax.grid(axis='y', linestyle='--', alpha=0.35, color='#94A3B8', zorder=0)

    # Data labels on bars
    for bar, dist, stop in zip(bars, distances, stops):
        height = bar.get_height()
        ax.annotate(f'{dist} km\n({stop} stops)',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 6),
                    textcoords="offset points",
                    ha='center', va='bottom',
                    fontsize=10.5, fontweight='bold', color='#1E293B')

    ax.set_title('Figure 5.1: Daily Travel Distances across Sample 5-Day Itinerary',
                 fontsize=13, fontweight='bold', pad=18, color='#0F172A')
    ax.set_xlabel('Itinerary Schedule', fontsize=11, fontweight='semibold', labelpad=10)
    ax.set_ylabel('Total Travel Distance (km)', fontsize=11, fontweight='semibold', labelpad=10)

    ax.set_ylim(0, 50)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.tick_params(axis='both', which='major', labelsize=10)

    plt.tight_layout()
    save_fig(fig, 'figure_5_1_daily_itinerary_distances.png')
    plt.close(fig)

# -------------------------------------------------------------------------
# Figure 5.2: Candidate Place Suitability Scoring Weights
# -------------------------------------------------------------------------
def generate_figure_5_2():
    criteria = ['Style Fit\n(Personalization)', 'Popularity\n(Global Rating / Reviews)', 'Weather Fit\n(Forecast Resilience)']
    weights = [45, 30, 25]
    colors = ['#0F766E', '#0284C7', '#6366F1']  # Academic teal, sky, indigo palette

    fig, ax = plt.subplots(figsize=(8.0, 4.4), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    y_pos = np.arange(len(criteria))
    bars = ax.barh(y_pos, weights, height=0.48, color=colors, edgecolor='#1E293B', linewidth=1.1, zorder=3)

    ax.grid(axis='x', linestyle='--', alpha=0.35, color='#94A3B8', zorder=0)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(criteria, fontsize=10.5, fontweight='medium')
    ax.invert_yaxis()  # top-down order

    for bar, weight in zip(bars, weights):
        width = bar.get_width()
        pct = (weight / 100.0) * 100
        ax.annotate(f'{weight} pts ({pct:.0f}%)',
                    xy=(width, bar.get_y() + bar.get_height() / 2),
                    xytext=(8, 0),
                    textcoords="offset points",
                    ha='left', va='center',
                    fontsize=11, fontweight='bold', color='#0F172A')

    ax.set_title('Figure 5.2: Candidate Place Suitability Scoring Weights (Total: 100 Points)',
                 fontsize=13, fontweight='bold', pad=18, color='#0F172A')
    ax.set_xlabel('Allocated Weight Score (Points / % Contribution)', fontsize=11, fontweight='semibold', labelpad=10)
    ax.set_xlim(0, 55)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.tick_params(axis='x', which='major', labelsize=10)

    plt.tight_layout()
    save_fig(fig, 'figure_5_2_suitability_scoring_weights.png')
    plt.close(fig)

# -------------------------------------------------------------------------
# Figure 5.3: Automated Test Suite Execution Results
# -------------------------------------------------------------------------
def generate_figure_5_3():
    categories = ['Passed Test Suites', 'Failed Test Suites']
    counts = [20, 0]
    colors = ['#15803D', '#DC2626'] # Academic green & red

    fig, ax = plt.subplots(figsize=(6.5, 4.6), dpi=300)
    fig.patch.set_facecolor('white')
    ax.set_facecolor('white')

    bars = ax.bar(categories, counts, width=0.42, color=colors, edgecolor='#1E293B', linewidth=1.1, zorder=3)
    ax.grid(axis='y', linestyle='--', alpha=0.35, color='#94A3B8', zorder=0)

    # Annotate Passed
    ax.annotate(f'20 Suites\n(100.0% Pass Rate)',
                xy=(bars[0].get_x() + bars[0].get_width() / 2, 20),
                xytext=(0, 7),
                textcoords="offset points",
                ha='center', va='bottom',
                fontsize=11, fontweight='bold', color='#14532D')

    # Annotate Failed
    ax.annotate(f'0 Suites\n(0.0% Failure)',
                xy=(bars[1].get_x() + bars[1].get_width() / 2, 0),
                xytext=(0, 7),
                textcoords="offset points",
                ha='center', va='bottom',
                fontsize=11, fontweight='bold', color='#7F1D1D')

    ax.set_title('Figure 5.3: Automated Test Suite Execution Results (Jest / Vitest Harness)',
                 fontsize=12.5, fontweight='bold', pad=18, color='#0F172A')
    ax.set_ylabel('Number of Test Suites', fontsize=11, fontweight='semibold', labelpad=10)
    ax.set_ylim(0, 24)

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.tick_params(axis='both', which='major', labelsize=10)

    plt.tight_layout()
    save_fig(fig, 'figure_5_3_automated_test_results.png')
    plt.close(fig)

if __name__ == '__main__':
    print("Generating Chapter 5 publication figures...")
    generate_figure_5_1()
    generate_figure_5_2()
    generate_figure_5_3()
    print("All figures successfully generated and saved.")
