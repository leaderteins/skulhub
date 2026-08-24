#!/usr/bin/env python3
"""Generate charts for SkulHub Marketing & Revenue document."""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import os

OUT_DIR = "/home/z/my-project/docs/charts"
os.makedirs(OUT_DIR, exist_ok=True)

# SkulHub brand colors
PRIMARY = "#059669"  # emerald
ACCENT = "#0d9488"   # teal
SECONDARY = "#f59e0b"  # amber
ROSE = "#e11d48"
COLORS = ["#059669", "#0d9488", "#14b8a6", "#06b6d4", "#f59e0b", "#e11d48"]

plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["font.family"] = "DejaVu Sans"

def save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.savefig(path, dpi=200, bbox_inches="tight", pad_inches=0.15, facecolor="white", edgecolor="none")
    plt.close(fig)
    print(f"  Generated: {name}")
    return path

# 1. Revenue Growth Projection (Line Chart)
def chart_revenue_growth():
    months = ["Month 1", "Month 3", "Month 6", "Month 9", "Month 12"]
    schools = [2, 5, 10, 20, 35]
    revenue = [5000, 25000, 50000, 100000, 175000]

    fig, ax1 = plt.subplots(figsize=(10, 5.5))
    
    ax2 = ax1.twinx()
    bars = ax1.bar(months, revenue, color=PRIMARY, width=0.5, alpha=0.8, label="Monthly Revenue (KES)")
    line = ax2.plot(months, schools, color=SECONDARY, marker="o", linewidth=2.5, markersize=8, label="Schools")

    ax1.set_ylabel("Monthly Revenue (KES)", fontsize=12, color=PRIMARY)
    ax2.set_ylabel("Number of Schools", fontsize=12, color=SECONDARY)
    ax1.set_title("SkulHub Revenue Growth Projection (12 Months)", fontsize=14, fontweight="bold", pad=15)
    
    for bar, val in zip(bars, revenue):
        ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 3000, f"KES {val:,}", ha="center", fontsize=10, color=PRIMARY, fontweight="bold")
    for i, val in enumerate(schools):
        ax2.text(i, val + 1.5, str(val), ha="center", fontsize=10, color=SECONDARY, fontweight="bold")

    ax1.spines[["top"]].set_visible(False)
    ax2.spines[["top"]].set_visible(False)
    ax1.grid(axis="y", alpha=0.2)
    
    lines1, labels1 = ax1.get_legend_handles_labels()
    lines2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(lines1 + lines2, labels1 + labels2, loc="upper left", frameon=False)

    return save(fig, "revenue_growth.png")

# 2. Plan Distribution (Pie Chart)
def chart_plan_distribution():
    labels = ["Starter\nKES 2,500/mo", "Standard\nKES 5,000/mo", "Premium\nKES 10,000/mo", "Enterprise\nCustom"]
    sizes = [30, 45, 20, 5]
    colors = [COLORS[0], COLORS[1], COLORS[4], COLORS[5]]
    explode = (0.05, 0.05, 0.05, 0.05)

    fig, ax = plt.subplots(figsize=(8, 8))
    wedges, texts, autotexts = ax.pie(
        sizes, labels=labels, colors=colors, autopct="%1.0f%%",
        startangle=140, pctdistance=0.75, explode=explode,
        textprops={"fontsize": 11}, wedgeprops={"edgecolor": "white", "linewidth": 2}
    )
    for t in autotexts:
        t.set_fontsize(12)
        t.set_fontweight("bold")
        t.set_color("white")
    ax.set_title("Expected Plan Distribution (by customer count)", fontsize=14, fontweight="bold", pad=20)

    return save(fig, "plan_distribution.png")

# 3. Annual Revenue by Plan (Stacked Bar)
def chart_annual_revenue():
    plans = ["Starter", "Standard", "Premium", "Enterprise"]
    monthly = [2500, 5000, 10000, 20000]
    customers = [10, 15, 7, 3]
    annual = [m * c * 12 for m, c in zip(monthly, customers)]

    fig, ax = plt.subplots(figsize=(10, 6))
    bars = ax.bar(plans, annual, color=COLORS[:4], width=0.5, edgecolor="white", linewidth=1.5)
    
    for bar, val, cust in zip(bars, annual, customers):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 30000,
                f"KES {val:,}\n({cust} schools)", ha="center", fontsize=10, fontweight="bold")

    ax.set_ylabel("Annual Revenue (KES)", fontsize=12)
    ax.set_title("Projected Annual Revenue by Plan (Year 1, 35 Schools)", fontsize=14, fontweight="bold", pad=15)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="y", alpha=0.2)
    
    return save(fig, "annual_revenue.png")

# 4. Marketing Channel ROI (Horizontal Bar)
def chart_marketing_channels():
    channels = ["School Visits", "WhatsApp Groups", "Facebook Ads", "Referrals", "Google Ads", "Education Events"]
    cost = [500, 0, 3500, 1500, 1000, 5000]
    customers = [8, 3, 4, 6, 2, 5]
    roi = [c / cost if cost > 0 else c * 100 for c, cost in zip(customers, cost)]

    fig, ax = plt.subplots(figsize=(10, 6))
    y_pos = np.arange(len(channels))
    bars = ax.barh(y_pos, customers, color=COLORS[:6], height=0.6, edgecolor="white")
    
    ax.set_yticks(y_pos)
    ax.set_yticklabels(channels, fontsize=11)
    ax.set_xlabel("Customers Acquired", fontsize=12)
    ax.set_title("Marketing Channel Effectiveness (Projected Customers per Channel)", fontsize=13, fontweight="bold", pad=15)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="x", alpha=0.2)
    ax.invert_yaxis()

    for bar, val in zip(bars, customers):
        ax.text(val + 0.2, bar.get_y() + bar.get_height()/2, str(val), va="center", fontsize=11, fontweight="bold")

    return save(fig, "marketing_channels.png")

# 5. Module Usage Heatmap
def chart_module_usage():
    modules = ["Dashboard", "Students", "Finance", "Attendance", "Exams", "Report Cards", "Parent Portal", "Timetable", "Library", "Health"]
    usage_pct = [95, 90, 88, 85, 82, 78, 72, 68, 55, 40]

    fig, ax = plt.subplots(figsize=(10, 5))
    bars = ax.barh(modules, usage_pct, color=COLORS[:10] if len(COLORS) >= 10 else COLORS * 2, height=0.6, edgecolor="white")
    
    for bar, val in zip(bars, usage_pct):
        ax.text(val + 1, bar.get_y() + bar.get_height()/2, f"{val}%", va="center", fontsize=10, fontweight="bold")

    ax.set_xlabel("Usage Rate (%)", fontsize=12)
    ax.set_title("Module Usage Rate Across Schools (Projected)", fontsize=14, fontweight="bold", pad=15)
    ax.set_xlim(0, 110)
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="x", alpha=0.2)
    ax.invert_yaxis()

    return save(fig, "module_usage.png")

if __name__ == "__main__":
    print("Generating SkulHub charts...")
    chart_revenue_growth()
    chart_plan_distribution()
    chart_annual_revenue()
    chart_marketing_channels()
    chart_module_usage()
    print("Done! All charts saved to docs/charts/")
