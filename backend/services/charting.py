import copy
import pandas as pd
import numpy as np
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import os
import warnings
from typing import Dict, Any, Optional

warnings.filterwarnings('ignore')

_kpi_registry: Dict[str, Dict[str, Any]] = {}


def reset_kpi_registry() -> None:
    """Clear any KPI snapshots captured during previous chart runs."""
    _kpi_registry.clear()


def register_kpi_snapshot(
    component: str,
    table_name: str,
    df: Optional[pd.DataFrame],
    ui_tiles: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Capture the raw KPI table (as list of dict rows) and optional UI tiles for a component.
    This data will later be persisted to the dashboard collections once charting completes.
    """
    if df is not None:
        rows = df.replace({np.nan: None}).to_dict(orient="records")
    else:
        rows = []

    _kpi_registry[component] = {
        "table_name": table_name,
        "rows": rows,
        "ui_tiles": ui_tiles or {}
    }


def get_kpi_registry(clear: bool = True) -> Dict[str, Dict[str, Any]]:
    """Return a deep copy of the KPI registry so callers can safely persist it."""
    snapshot = copy.deepcopy(_kpi_registry)
    if clear:
        _kpi_registry.clear()
    return snapshot

# Create charts directory if it doesn't exist
charts_dir = 'Generated/charts'
if not os.path.exists(charts_dir):
    os.makedirs(charts_dir, exist_ok=True)
    print(f"Created directory: {charts_dir}")

# Load the data from CSV files
print("Loading data from CSV files...")
employees_df = pd.read_csv('Generated/extracted_tables/Employees/table_1.csv')
observations_df = pd.read_csv('Generated/extracted_tables/Observations/table_1.csv')
incidents_df = pd.read_csv('Generated/extracted_tables/Incidents/table_1.csv')
near_misses_df = pd.read_csv('Generated/extracted_tables/NearMisses/table_1.csv')
print("Data loaded successfully!")

# Convert date columns
observations_df['ObservationDate'] = pd.to_datetime(observations_df['ObservationDate'])
incidents_df['ActionClosedDate'] = pd.to_datetime(incidents_df['ActionClosedDate'])
near_misses_df['ClosedDate'] = pd.to_datetime(near_misses_df['ClosedDate'])

# Create merged datasets for analysis
# Merge observations with incidents and near misses
obs_incidents = observations_df.merge(incidents_df, on='ObservationID', how='inner')
obs_near_misses = observations_df.merge(near_misses_df, on='ObservationID', how='inner')

# Merge with employee data for department analysis
obs_with_emp = observations_df.merge(employees_df, left_on='ObservedEmployeeID', right_on='EmployeeID', how='left')
inc_with_emp = obs_incidents.merge(employees_df, left_on='ActionOwner', right_on='EmployeeID', how='left')
nm_with_emp = obs_near_misses.merge(employees_df, left_on='ActionOwner', right_on='EmployeeID', how='left')

print("Data loaded and merged successfully!")

# 0. SAFETY KPI DASHBOARD
print("\n0. Creating Safety KPI Dashboard...")

def create_safety_kpi_dashboard():
    """Create organization-wide safety KPI dashboard with summary table."""
    total_observations = len(observations_df)
    total_incidents = len(incidents_df)
    total_near_misses = len(near_misses_df)
    
    incident_rate = (total_incidents / total_observations * 100) if total_observations > 0 else 0
    near_miss_rate = (total_near_misses / total_observations * 100) if total_observations > 0 else 0
    
    # High-risk exposure
    high_risk_events = (observations_df['RiskLevel'] == 'High').sum()
    high_risk_percentage = (high_risk_events / total_observations * 100) if total_observations > 0 else 0
    
    # Incident resolution metrics
    resolution_days = None
    on_time_rate = 0
    avg_resolution_days = 0
    if not obs_incidents.empty:
        resolution_df = obs_incidents[['ObservationDate', 'ActionClosedDate']].copy()
        resolution_df['ResolutionDays'] = (
            resolution_df['ActionClosedDate'] - resolution_df['ObservationDate']
        ).dt.days
        resolution_days = resolution_df['ResolutionDays'].dropna()
        if not resolution_days.empty:
            avg_resolution_days = resolution_days.mean()
            target_days = 7
            on_time_rate = (
                (resolution_days <= target_days).sum() / len(resolution_days) * 100
            )
    
    risk_distribution = observations_df['RiskLevel'].value_counts().sort_values(ascending=False)
    
    # Build KPI table
    kpi_data = {
        'Metric': [
            'Total Observations',
            'Total Incidents',
            'Total Near Misses',
            'Incident Rate (%)',
            'Near Miss Rate (%)',
            'High Risk Events (%)',
            'Avg Resolution Days',
            'On-time Closure Rate (%)'
        ],
        'Value': [
            f"{total_observations:,}",
            f"{total_incidents:,}",
            f"{total_near_misses:,}",
            f"{incident_rate:.2f}",
            f"{near_miss_rate:.2f}",
            f"{high_risk_percentage:.2f}",
            f"{avg_resolution_days:.1f}",
            f"{on_time_rate:.2f}"
        ]
    }
    kpi_df = pd.DataFrame(kpi_data)

    register_kpi_snapshot(
        component="Safety",
        table_name="Safety KPI Summary",
        df=kpi_df,
        ui_tiles={
            "total_observations": int(total_observations),
            "total_incidents": int(total_incidents),
            "total_near_misses": int(total_near_misses),
            "incident_rate_pct": round(float(incident_rate), 2),
            "near_miss_rate_pct": round(float(near_miss_rate), 2),
            "high_risk_pct": round(float(high_risk_percentage), 2) if total_observations > 0 else None,
            "avg_resolution_days": round(float(avg_resolution_days), 1) if resolution_days is not None else None,
            "on_time_closure_pct": round(float(on_time_rate), 2) if resolution_days is not None else None,
        }
    )
    
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=(
            'Incident Rate (%)',
            'Near Miss Rate (%)',
            'Risk Level Distribution',
            'KPI Summary'
        ),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "bar"}, {"type": "table"}]]
    )
    
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=incident_rate,
            title={'text': "Incident Rate"},
            gauge={
                'axis': {'range': [0, max(incident_rate * 1.5, 20)]},
                'bar': {'color': "crimson"},
                'steps': [{'range': [0, incident_rate], 'color': "#ffe5e5"}]
            }
        ),
        row=1, col=1
    )
    
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=near_miss_rate,
            title={'text': "Near Miss Rate"},
            gauge={
                'axis': {'range': [0, max(near_miss_rate * 1.5, 20)]},
                'bar': {'color': "#ffa600"},
                'steps': [{'range': [0, near_miss_rate], 'color': "#fff2db"}]
            }
        ),
        row=1, col=2
    )
    
    fig.add_trace(
        go.Bar(
            x=risk_distribution.index,
            y=risk_distribution.values,
            marker_color=['#51cf66', '#ffd43b', '#ff6b6b'],
            name='Risk Mix'
        ),
        row=2, col=1
    )
    
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_df.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_df['Metric'], kpi_df['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    fig.update_xaxes(title_text="Risk Level", row=2, col=1)
    fig.update_yaxes(title_text="Count", row=2, col=1)
    fig.update_layout(height=800, title_text="Safety KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/0_safety_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/0_safety_kpi_dashboard.html")


# 1. TREND ANALYSIS (Time Series)
print("\n1. Creating Trend Analysis...")

def create_trend_analysis():
    # Monthly aggregation
    observations_monthly = observations_df.set_index('ObservationDate').resample('M').size().reset_index()
    observations_monthly.columns = ['Month', 'Observations']
    incidents_monthly = obs_incidents.set_index('ObservationDate').resample('M').size().reset_index()
    incidents_monthly.columns = ['Month', 'Incidents']
    near_misses_monthly = obs_near_misses.set_index('ObservationDate').resample('M').size().reset_index()
    near_misses_monthly.columns = ['Month', 'NearMisses']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Safety Events Trend Over Time (Monthly)', 
                       'Risk Level Distribution Over Time',
                       'Observations by Week of Year',
                       'Cumulative Safety Events'),
        specs=[[{"secondary_y": False}, {"secondary_y": False}],
               [{"secondary_y": False}, {"secondary_y": False}]]
    )
    
    # Plot 1: Overall trends
    fig.add_trace(
        go.Scatter(x=observations_monthly['Month'], y=observations_monthly['Observations'],
                  mode='lines+markers', name='Observations', marker=dict(symbol='circle')),
        row=1, col=1
    )
    fig.add_trace(
        go.Scatter(x=incidents_monthly['Month'], y=incidents_monthly['Incidents'],
                  mode='lines+markers', name='Incidents', marker=dict(symbol='square')),
        row=1, col=1
    )
    fig.add_trace(
        go.Scatter(x=near_misses_monthly['Month'], y=near_misses_monthly['NearMisses'],
                  mode='lines+markers', name='Near Misses', marker=dict(symbol='triangle-up')),
        row=1, col=1
    )
    
    # Plot 2: Risk level distribution over time
    risk_monthly = pd.crosstab(
        observations_df['ObservationDate'].dt.to_period('M').astype(str),
        observations_df['RiskLevel'],
        normalize='index'
    ).reset_index()
    risk_monthly.columns.name = None
    
    for risk_level in risk_monthly.columns[1:]:
        fig.add_trace(
            go.Scatter(x=risk_monthly['ObservationDate'], y=risk_monthly[risk_level],
                      mode='lines', name=f'Risk: {risk_level}', stackgroup='one', fill='tonexty'),
            row=1, col=2
        )
    
    # Plot 3: Weekly pattern
    observations_df['Week'] = observations_df['ObservationDate'].dt.isocalendar().week
    weekly_data = observations_df.groupby('Week').size().reset_index()
    weekly_data.columns = ['Week', 'Count']
    
    fig.add_trace(
        go.Bar(x=weekly_data['Week'], y=weekly_data['Count'], name='Weekly Observations',
               marker_color='skyblue'),
        row=2, col=1
    )
    
    # Plot 4: Cumulative events
    fig.add_trace(
        go.Scatter(x=observations_monthly['Month'], y=observations_monthly['Observations'].cumsum(),
                  mode='lines', name='Cumulative Observations'),
        row=2, col=2
    )
    fig.add_trace(
        go.Scatter(x=incidents_monthly['Month'], y=incidents_monthly['Incidents'].cumsum(),
                  mode='lines', name='Cumulative Incidents'),
        row=2, col=2
    )
    fig.add_trace(
        go.Scatter(x=near_misses_monthly['Month'], y=near_misses_monthly['NearMisses'].cumsum(),
                  mode='lines', name='Cumulative Near Misses'),
        row=2, col=2
    )
    
    # Update layout
    fig.update_xaxes(title_text="Month", row=1, col=1)
    fig.update_yaxes(title_text="Number of Events", row=1, col=1)
    fig.update_xaxes(title_text="Month", row=1, col=2)
    fig.update_yaxes(title_text="Proportion", row=1, col=2)
    fig.update_xaxes(title_text="Week Number", row=2, col=1)
    fig.update_yaxes(title_text="Number of Observations", row=2, col=1)
    fig.update_xaxes(title_text="Month", row=2, col=2)
    fig.update_yaxes(title_text="Cumulative Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Safety Events Trend Analysis", showlegend=True)
    fig.write_html(f'{charts_dir}/1_trend_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/1_trend_analysis.html")

# 2. LOCATION HEATMAP
print("\n2. Creating Location Heatmap...")

def create_location_heatmap():
    # Prepare data for heatmap
    location_risk = pd.crosstab(observations_df['Location'], observations_df['RiskLevel'])
    location_events = observations_df['Location'].value_counts().reset_index()
    location_events.columns = ['Location', 'Count']
    location_incidents = obs_incidents['Location'].value_counts().reset_index()
    if not location_incidents.empty:
        location_incidents.columns = ['Location', 'Count']
    location_near_misses = obs_near_misses['Location'].value_counts().reset_index()
    if not location_near_misses.empty:
        location_near_misses.columns = ['Location', 'Count']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Risk Level Distribution by Location',
                       'Total Observations by Location',
                       'Incidents by Location',
                       'Near Misses by Location'),
        specs=[[{"type": "heatmap"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Heatmap 1: Risk levels by location
    fig.add_trace(
        go.Heatmap(z=location_risk.values, x=location_risk.columns, y=location_risk.index,
                   colorscale='YlOrRd', text=location_risk.values, texttemplate='%{text}',
                   textfont={"size": 10}, colorbar=dict(title="Count")),
        row=1, col=1
    )
    
    # Heatmap 2: Total observations by location
    fig.add_trace(
        go.Bar(x=location_events['Location'], y=location_events['Count'],
               marker_color='lightblue', name='Observations'),
        row=1, col=2
    )
    
    # Heatmap 3: Incidents by location
    if not location_incidents.empty:
        fig.add_trace(
            go.Bar(x=location_incidents['Location'], y=location_incidents['Count'],
                   marker_color='lightcoral', name='Incidents'),
            row=2, col=1
        )
    
    # Heatmap 4: Near misses by location
    if not location_near_misses.empty:
        fig.add_trace(
            go.Bar(x=location_near_misses['Location'], y=location_near_misses['Count'],
                   marker_color='mediumpurple', name='Near Misses'),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Risk Level", row=1, col=1)
    fig.update_yaxes(title_text="Location", row=1, col=1)
    fig.update_xaxes(title_text="Location", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=2)
    fig.update_xaxes(title_text="Location", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=1)
    fig.update_xaxes(title_text="Location", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Location-Based Safety Analysis", showlegend=False)
    fig.write_html(f'{charts_dir}/2_location_heatmap.html')
    print(f"  ✓ Saved: {charts_dir}/2_location_heatmap.html")
    
    # Additional interactive density heatmap
    fig2 = px.density_heatmap(
        observations_df, 
        x='Location', 
        y='RiskLevel',
        title='Risk Level Density Heatmap by Location',
        color_continuous_scale='Viridis'
    )
    fig2.write_html(f'{charts_dir}/2_location_density_heatmap.html')
    print(f"  ✓ Saved: {charts_dir}/2_location_density_heatmap.html")

# 3. RISK ANALYSIS (Stacked Bar/Pie Charts)
print("\n3. Creating Risk Analysis...")

def create_risk_analysis():
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Overall Risk Level Distribution',
                       'Risk Levels of Observations that Became Incidents',
                       'Risk Levels of Observations that Became Near Misses',
                       'Escalation to Incidents/Near Misses by Risk Level'),
        specs=[[{"type": "pie"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Overall risk distribution
    risk_counts = observations_df['RiskLevel'].value_counts()
    fig.add_trace(
        go.Pie(labels=risk_counts.index, values=risk_counts.values,
               name="Risk Distribution", textinfo='label+percent'),
        row=1, col=1
    )
    
    # Plot 2: Risk levels that became incidents
    incident_risk = obs_incidents['RiskLevel'].value_counts()
    if not incident_risk.empty:
        colors = {'Low': 'green', 'Medium': 'orange', 'High': 'red'}
        bar_colors = [colors.get(level, 'gray') for level in incident_risk.index]
        fig.add_trace(
            go.Bar(x=incident_risk.index, y=incident_risk.values,
                   marker_color=bar_colors, name='Incidents'),
            row=1, col=2
        )
    
    # Plot 3: Risk levels that became near misses
    nm_risk = obs_near_misses['RiskLevel'].value_counts()
    if not nm_risk.empty:
        colors = {'Low': 'green', 'Medium': 'orange', 'High': 'red'}
        bar_colors = [colors.get(level, 'gray') for level in nm_risk.index]
        fig.add_trace(
            go.Bar(x=nm_risk.index, y=nm_risk.values,
                   marker_color=bar_colors, name='Near Misses'),
            row=2, col=1
        )
    
    # Plot 4: Escalation rates by risk level
    total_by_risk = observations_df['RiskLevel'].value_counts()
    incidents_by_risk = obs_incidents['RiskLevel'].value_counts()
    nm_by_risk = obs_near_misses['RiskLevel'].value_counts()
    
    escalation_data = pd.DataFrame({
        'Total': total_by_risk,
        'Incidents': incidents_by_risk,
        'Near Misses': nm_by_risk
    }).fillna(0)
    
    if not escalation_data.empty:
        fig.add_trace(
            go.Bar(x=escalation_data.index, y=escalation_data['Incidents'],
                   name='Incidents', marker_color='coral'),
            row=2, col=2
        )
        fig.add_trace(
            go.Bar(x=escalation_data.index, y=escalation_data['Near Misses'],
                   name='Near Misses', marker_color='lightblue'),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Risk Level", row=1, col=2)
    fig.update_yaxes(title_text="Number of Incidents", row=1, col=2)
    fig.update_xaxes(title_text="Risk Level", row=2, col=1)
    fig.update_yaxes(title_text="Number of Near Misses", row=2, col=1)
    fig.update_xaxes(title_text="Risk Level", row=2, col=2)
    fig.update_yaxes(title_text="Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Risk Analysis Dashboard", showlegend=True)
    fig.write_html(f'{charts_dir}/3_risk_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/3_risk_analysis.html")

# 4. DEPARTMENT ANALYSIS (Grouped Bar/Radar Chart)
print("\n4. Creating Department Analysis...")

def create_department_analysis():
    # Prepare department data (drop NaN values from merges)
    dept_observations = obs_with_emp['Department'].dropna().value_counts()
    dept_incidents = inc_with_emp['Department'].dropna().value_counts()
    dept_near_misses = nm_with_emp['Department'].dropna().value_counts()
    
    # Combine all department data
    all_depts = list(set(dept_observations.index) | set(dept_incidents.index) | set(dept_near_misses.index))
    dept_comparison = pd.DataFrame(index=all_depts)
    dept_comparison['Observations'] = dept_observations
    dept_comparison['Incidents'] = dept_incidents
    dept_comparison['Near Misses'] = dept_near_misses
    dept_comparison = dept_comparison.fillna(0)
    
    # Create subplots
    fig = make_subplots(
        rows=1, cols=2,
        subplot_titles=('Safety Events by Department',
                       'Risk Level Distribution by Department'),
        specs=[[{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Grouped bar chart
    fig.add_trace(
        go.Bar(x=dept_comparison.index, y=dept_comparison['Observations'],
               name='Observations', marker_color='lightblue'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=dept_comparison.index, y=dept_comparison['Incidents'],
               name='Incidents', marker_color='lightcoral'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=dept_comparison.index, y=dept_comparison['Near Misses'],
               name='Near Misses', marker_color='mediumpurple'),
        row=1, col=1
    )
    
    # Risk level distribution by department
    dept_risk = pd.crosstab(obs_with_emp['Department'].dropna(), obs_with_emp['RiskLevel'])
    for risk_level in dept_risk.columns:
        fig.add_trace(
            go.Bar(x=dept_risk.index, y=dept_risk[risk_level],
                   name=f'Risk: {risk_level}'),
            row=1, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Department", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Number of Events", row=1, col=1)
    fig.update_xaxes(title_text="Department", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=2)
    
    fig.update_layout(height=600, title_text="Department-Based Safety Analysis")
    fig.update_layout(barmode='group')
    fig.write_html(f'{charts_dir}/4_department_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/4_department_analysis.html")

# 5. SHIFT PATTERN ANALYSIS
print("\n5. Creating Shift Pattern Analysis...")

def create_shift_analysis():
    # Extract hour from observation date
    observations_df['Hour'] = observations_df['ObservationDate'].dt.hour
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Observations by Shift',
                       'Observations by Hour of Day',
                       'Incidents by Shift',
                       'Risk Levels by Hour of Day'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "heatmap"}]]
    )
    
    # Plot 1: Events by shift
    shift_mapping = {'A (06-14)': 'Shift A', 'B (14-22)': 'Shift B', 'C (22-06)': 'Shift C'}
    obs_with_emp['ShiftMapped'] = obs_with_emp['Shift'].map(shift_mapping)
    
    shift_events = obs_with_emp['ShiftMapped'].dropna().value_counts().reset_index()
    shift_events.columns = ['Shift', 'Count']
    fig.add_trace(
        go.Bar(x=shift_events['Shift'], y=shift_events['Count'],
               marker_color=['lightblue', 'lightgreen', 'lightcoral'],
               name='Observations'),
        row=1, col=1
    )
    
    # Plot 2: Hourly distribution
    hourly_dist = observations_df['Hour'].value_counts().sort_index().reset_index()
    hourly_dist.columns = ['Hour', 'Count']
    fig.add_trace(
        go.Bar(x=hourly_dist['Hour'], y=hourly_dist['Count'],
               marker_color='skyblue', name='Hourly Observations'),
        row=1, col=2
    )
    
    # Plot 3: Incidents by shift
    inc_with_emp['ShiftMapped'] = inc_with_emp['Shift'].map(shift_mapping)
    shift_incidents = inc_with_emp['ShiftMapped'].dropna().value_counts()
    if not shift_incidents.empty:
        shift_incidents_df = shift_incidents.reset_index()
        shift_incidents_df.columns = ['Shift', 'Count']
        fig.add_trace(
            go.Bar(x=shift_incidents_df['Shift'], y=shift_incidents_df['Count'],
                   marker_color=['lightblue', 'lightgreen', 'lightcoral'],
                   name='Incidents'),
            row=2, col=1
        )
    
    # Plot 4: Heatmap of events by hour and risk level
    hour_risk = pd.crosstab(observations_df['Hour'], observations_df['RiskLevel'])
    fig.add_trace(
        go.Heatmap(z=hour_risk.values, x=hour_risk.columns, y=hour_risk.index,
                   colorscale='YlOrRd', text=hour_risk.values, texttemplate='%{text}',
                   textfont={"size": 10}, colorbar=dict(title="Count")),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Shift", row=1, col=1)
    fig.update_yaxes(title_text="Number of Observations", row=1, col=1)
    fig.update_xaxes(title_text="Hour of Day", row=1, col=2)
    fig.update_yaxes(title_text="Number of Observations", row=1, col=2)
    fig.update_xaxes(title_text="Shift", row=2, col=1)
    fig.update_yaxes(title_text="Number of Incidents", row=2, col=1)
    fig.update_xaxes(title_text="Risk Level", row=2, col=2)
    fig.update_yaxes(title_text="Hour of Day", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Shift Pattern Analysis", showlegend=False)
    fig.write_html(f'{charts_dir}/5_shift_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/5_shift_analysis.html")

# 6. TIMELINE ANALYSIS (Gantt Chart)
print("\n6. Creating Timeline Analysis...")

def create_timeline_analysis():
    # Prepare data for timeline
    timeline_data = []
    
    # Add observations
    for _, row in observations_df.iterrows():
        timeline_data.append({
            'Event': 'Observation',
            'Start': row['ObservationDate'],
            'End': row['ObservationDate'],
            'ID': row['ObservationID'],
            'Risk': row['RiskLevel']
        })
    
    # Add incidents
    for _, row in obs_incidents.iterrows():
        timeline_data.append({
            'Event': 'Incident',
            'Start': row['ObservationDate'],
            'End': row['ActionClosedDate'],
            'ID': row['IncidentID'],
            'Risk': row['RiskLevel']
        })
    
    # Add near misses
    for _, row in obs_near_misses.iterrows():
        timeline_data.append({
            'Event': 'Near Miss',
            'Start': row['ObservationDate'],
            'End': row['ClosedDate'],
            'ID': row['NearMissID'],
            'Risk': row['RiskLevel']
        })
    
    timeline_df = pd.DataFrame(timeline_data)
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=('Safety Events Timeline', 'Resolution Time Distribution'),
        specs=[[{"type": "scatter"}],
               [{"type": "box"}]],
        vertical_spacing=0.15
    )
    
    # Plot 1: Event distribution over time
    for event_type in ['Observation', 'Incident', 'Near Miss']:
        event_data = timeline_df[timeline_df['Event'] == event_type]
        if not event_data.empty:
            fig.add_trace(
                go.Scatter(x=event_data['Start'], y=[event_type] * len(event_data),
                          mode='markers', name=event_type, marker=dict(size=8, opacity=0.6),
                          customdata=event_data[['ID', 'Risk']],
                          hovertemplate='<b>%{y}</b><br>Date: %{x}<br>ID: %{customdata[0]}<br>Risk: %{customdata[1]}<extra></extra>'),
                row=1, col=1
            )
    
    # Plot 2: Resolution time for incidents and near misses
    resolution_data = []
    for _, row in obs_incidents.iterrows():
        resolution_days = (row['ActionClosedDate'] - row['ObservationDate']).days
        resolution_data.append({'Type': 'Incident', 'Days': resolution_days})
    
    for _, row in obs_near_misses.iterrows():
        resolution_days = (row['ClosedDate'] - row['ObservationDate']).days
        resolution_data.append({'Type': 'Near Miss', 'Days': resolution_days})
    
    if resolution_data:
        resolution_df = pd.DataFrame(resolution_data)
        for event_type in ['Incident', 'Near Miss']:
            event_resolution = resolution_df[resolution_df['Type'] == event_type]['Days']
            if not event_resolution.empty:
                fig.add_trace(
                    go.Box(y=event_resolution, name=event_type, boxmean='sd'),
                    row=2, col=1
                )
    
    # Update axes
    fig.update_xaxes(title_text="Date", row=1, col=1)
    fig.update_yaxes(title_text="Event Type", row=1, col=1)
    fig.update_xaxes(title_text="Event Type", row=2, col=1)
    fig.update_yaxes(title_text="Days to Resolution", row=2, col=1)
    
    fig.update_layout(height=800, title_text="Timeline & Resolution Analysis", showlegend=True)
    fig.write_html(f'{charts_dir}/6_timeline_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/6_timeline_analysis.html")
    
    # Additional interactive timeline scatter plot
    if not timeline_df.empty:
        fig2 = px.scatter(
            timeline_df,
            x='Start',
            y='Event',
            color='Risk',
            title='Interactive Safety Events Timeline',
            hover_data=['ID', 'Risk'],
            labels={'Start': 'Date', 'Event': 'Event Type'}
        )
        fig2.update_traces(marker=dict(size=8))
        fig2.write_html(f'{charts_dir}/6_timeline_scatter.html')
        print(f"  ✓ Saved: {charts_dir}/6_timeline_scatter.html")

def create_all_safety_charts():
    """Convenience wrapper to generate all safety charts via CLI."""
    print("Starting visualization generation...")
    create_safety_kpi_dashboard()
    create_trend_analysis()
    create_location_heatmap()
    create_risk_analysis()
    create_department_analysis()
    create_shift_analysis()
    create_timeline_analysis()

    print("\nAll visualizations completed! 🎉")

    # Additional summary statistics for CLI usage
    print("\n" + "="*50)
    print("SUMMARY STATISTICS")
    print("="*50)

    print(f"Total Observations: {len(observations_df)}")
    print(f"Total Incidents: {len(incidents_df)}")
    print(f"Total Near Misses: {len(near_misses_df)}")
    print(f"Incident Rate: {(len(incidents_df)/len(observations_df)*100):.2f}%")
    print(f"Near Miss Rate: {(len(near_misses_df)/len(observations_df)*100):.2f}%")

    print(f"\nRisk Level Distribution:")
    print(observations_df['RiskLevel'].value_counts())

    print(f"\nTop 5 Locations with Most Observations:")
    print(observations_df['Location'].value_counts().head(5))

    print(f"\nTop 3 Departments with Most Incidents:")
    if not inc_with_emp.empty:
        print(inc_with_emp['Department'].value_counts().head(3))


# ============================================================================
# PTW/KPI CHARTING FUNCTIONS
# ============================================================================

def load_ptw_data():
    """Load PTW data from CSV files."""
    ptw_records_df = pd.read_csv('Generated/extracted_tables/PTW_Records/table_1.csv')
    ptw_kpis_df = pd.read_csv('Generated/extracted_tables/PTW_KPIs_By_Area/table_1.csv')
    
    # Convert date columns
    ptw_records_df['issue_date'] = pd.to_datetime(ptw_records_df['issue_date'], errors='coerce')
    ptw_records_df['expiry_dt'] = pd.to_datetime(ptw_records_df['expiry_dt'], errors='coerce')
    ptw_records_df['close_time'] = pd.to_datetime(ptw_records_df['close_time'], errors='coerce')
    ptw_records_df['issue_time'] = pd.to_datetime(ptw_records_df['issue_time'], errors='coerce')
    
    return ptw_records_df, ptw_kpis_df


def create_ptw_status_summary():
    """Create PTW status summary dashboard."""
    ptw_records_df, ptw_kpis_df = load_ptw_data()
    
    # Calculate status counts
    status_counts = ptw_records_df['permit_status'].value_counts()
    total_permits = len(ptw_records_df)
    open_count = status_counts.get('Open', 0)
    closed_count = status_counts.get('Closed', 0)
    # Handle is_past_expiry (could be boolean or string)
    if 'is_past_expiry' in ptw_records_df.columns:
        overdue_count = (ptw_records_df['is_past_expiry'] == True).sum() + \
                       (ptw_records_df['is_past_expiry'] == 'True').sum() + \
                       (ptw_records_df['is_past_expiry'] == 'true').sum()
    else:
        overdue_count = 0
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('PTW Status Summary', 'PTW Status Distribution',
                       'Overdue Permits by Area', 'Real-time PTW Status Gauge'),
        specs=[[{"type": "bar"}, {"type": "pie"}],
               [{"type": "bar"}, {"type": "indicator"}]]
    )
    
    # Plot 1: Status bar chart
    fig.add_trace(
        go.Bar(x=status_counts.index, y=status_counts.values,
               marker_color=['#ff6b6b', '#51cf66', '#ffd93d'],
               name='PTW Status'),
        row=1, col=1
    )
    
    # Plot 2: Status pie chart
    fig.add_trace(
        go.Pie(labels=status_counts.index, values=status_counts.values,
               name="PTW Status", textinfo='label+percent+value'),
        row=1, col=2
    )
    
    # Plot 3: Overdue by area
    overdue_mask = (ptw_records_df['is_past_expiry'] == True) | \
                   (ptw_records_df['is_past_expiry'] == 'True') | \
                   (ptw_records_df['is_past_expiry'] == 'true')
    overdue_by_area = ptw_records_df[overdue_mask]['area'].value_counts()
    if not overdue_by_area.empty:
        fig.add_trace(
            go.Bar(x=overdue_by_area.index, y=overdue_by_area.values,
                   marker_color='coral', name='Overdue Permits'),
            row=2, col=1
        )
    
    # Plot 4: Real-time status gauge
    closure_rate = (closed_count / total_permits * 100) if total_permits > 0 else 0
    fig.add_trace(
        go.Indicator(
            mode="gauge+number+delta",
            value=closure_rate,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Closure Rate (%)"},
            delta={'reference': 80},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 80], 'color': "gray"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Status", row=1, col=1)
    fig.update_yaxes(title_text="Count", row=1, col=1)
    fig.update_xaxes(title_text="Area", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Overdue Count", row=2, col=1)
    
    fig.update_layout(height=900, title_text="PTW Status Summary Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/ptw_1_status_summary.html')
    print(f"  ✓ Saved: {charts_dir}/ptw_1_status_summary.html")


def create_ptw_type_distribution():
    """Create PTW type distribution charts."""
    ptw_records_df, ptw_kpis_df = load_ptw_data()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('PTW Type Distribution', 'PTW Type by Status',
                       'PTW Types by Area', 'Work Type Distribution'),
        specs=[[{"type": "pie"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Type pie chart
    type_counts = ptw_records_df['permit_type'].value_counts()
    fig.add_trace(
        go.Pie(labels=type_counts.index, values=type_counts.values,
               name="PTW Types", textinfo='label+percent'),
        row=1, col=1
    )
    
    # Plot 2: Type by status
    type_status = pd.crosstab(ptw_records_df['permit_type'], ptw_records_df['permit_status'])
    for status in type_status.columns:
        fig.add_trace(
            go.Bar(x=type_status.index, y=type_status[status],
                   name=status),
            row=1, col=2
        )
    
    # Plot 3: Types by area
    type_area = pd.crosstab(ptw_records_df['area'], ptw_records_df['permit_type'])
    for ptw_type in type_area.columns[:5]:  # Limit to top 5 types
        fig.add_trace(
            go.Bar(x=type_area.index, y=type_area[ptw_type],
                   name=ptw_type),
            row=2, col=1
        )
    
    # Plot 4: Work type distribution
    work_type_counts = ptw_records_df['work_type(start/stop)'].value_counts()
    fig.add_trace(
        go.Bar(x=work_type_counts.index, y=work_type_counts.values,
               marker_color='lightgreen', name='Work Type'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Permit Type", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=2)
    fig.update_xaxes(title_text="Area", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=1)
    fig.update_xaxes(title_text="Work Type", row=2, col=2)
    fig.update_yaxes(title_text="Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="PTW Type Distribution Analysis", barmode='group')
    fig.write_html(f'{charts_dir}/ptw_2_type_distribution.html')
    print(f"  ✓ Saved: {charts_dir}/ptw_2_type_distribution.html")


def create_ptw_compliance_analysis():
    """Create safety checklist compliance rate analysis."""
    ptw_records_df, ptw_kpis_df = load_ptw_data()
    
    # Calculate compliance metrics
    total_permits = len(ptw_records_df)
    missing_controls_count = ptw_records_df['missing_controls_flag'].value_counts().get('Yes', 0)
    compliance_rate = ((total_permits - missing_controls_count) / total_permits * 100) if total_permits > 0 else 0
    
    # Compliance by area
    compliance_by_area = ptw_records_df.groupby('area').apply(
        lambda x: ((len(x) - (x['missing_controls_flag'] == 'Yes').sum()) / len(x) * 100) if len(x) > 0 else 0
    ).reset_index()
    compliance_by_area.columns = ['Area', 'Compliance_Rate']
    
    # Compliance by permit type
    compliance_by_type = ptw_records_df.groupby('permit_type').apply(
        lambda x: ((len(x) - (x['missing_controls_flag'] == 'Yes').sum()) / len(x) * 100) if len(x) > 0 else 0
    ).reset_index()
    compliance_by_type.columns = ['Permit_Type', 'Compliance_Rate']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Overall Compliance Rate', 'Compliance by Area',
                       'Compliance by Permit Type', 'Missing Controls Flag Distribution'),
        specs=[[{"type": "indicator"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "pie"}]]
    )
    
    # Plot 1: Overall compliance gauge
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=compliance_rate,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Safety Checklist Compliance Rate (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Compliance by area
    fig.add_trace(
        go.Bar(x=compliance_by_area['Area'], y=compliance_by_area['Compliance_Rate'],
               marker_color='lightblue', name='Compliance Rate'),
        row=1, col=2
    )
    
    # Plot 3: Compliance by type
    fig.add_trace(
        go.Bar(x=compliance_by_type['Permit_Type'], y=compliance_by_type['Compliance_Rate'],
               marker_color='lightgreen', name='Compliance Rate'),
        row=2, col=1
    )
    
    # Plot 4: Missing controls distribution
    missing_counts = ptw_records_df['missing_controls_flag'].value_counts()
    fig.add_trace(
        go.Pie(labels=missing_counts.index, values=missing_counts.values,
               name="Missing Controls", textinfo='label+percent'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Area", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Compliance Rate (%)", row=1, col=2)
    fig.update_xaxes(title_text="Permit Type", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Compliance Rate (%)", row=2, col=1)
    
    fig.update_layout(height=900, title_text="Safety Checklist Compliance Analysis", showlegend=False)
    fig.write_html(f'{charts_dir}/ptw_3_compliance_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/ptw_3_compliance_analysis.html")


def create_ptw_kpi_dashboard():
    """Create PTW KPI dashboard with key metrics."""
    ptw_records_df, ptw_kpis_df = load_ptw_data()
    
    # Calculate KPIs
    total_permits = len(ptw_records_df)
    closed_count = len(ptw_records_df[ptw_records_df['permit_status'] == 'Closed'])
    # Handle is_past_expiry (could be boolean or string)
    if 'is_past_expiry' in ptw_records_df.columns:
        overdue_count = (ptw_records_df['is_past_expiry'] == True).sum() + \
                       (ptw_records_df['is_past_expiry'] == 'True').sum() + \
                       (ptw_records_df['is_past_expiry'] == 'true').sum()
    else:
        overdue_count = 0
    
    # Closure Efficiency = (Closed / Total) × 100
    closure_efficiency = (closed_count / total_permits * 100) if total_permits > 0 else 0
    
    # Avg. Closure Time = Mean(Close – Issue Date)
    closed_permits = ptw_records_df[ptw_records_df['permit_status'] == 'Closed'].copy()
    closed_permits['closure_time_hours'] = (
        (closed_permits['close_time'] - closed_permits['issue_time']).dt.total_seconds() / 3600
    )
    avg_closure_time = closed_permits['closure_time_hours'].mean() if not closed_permits.empty else 0
    
    # Overdue % = (Overdue / Total) × 100
    overdue_percentage = (overdue_count / total_permits * 100) if total_permits > 0 else 0
    
    # Create subplots
    fig = make_subplots(
        rows=3, cols=2,
        subplot_titles=(
            'PTW Closure Efficiency',
            'Average Closure Time (Hours)',
            'Overdue Percentage',
            'KPIs by Area',
            'KPI Summary',
            ''
        ),
        specs=[
            [{"type": "indicator"}, {"type": "indicator"}],
            [{"type": "indicator"}, {"type": "bar"}],
            [{"type": "table", "colspan": 2}, None]
        ]
    )
    
    # Plot 1: Closure Efficiency
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=closure_efficiency,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Closure Efficiency (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Average Closure Time
    fig.add_trace(
        go.Indicator(
            mode="number+gauge",
            value=avg_closure_time,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Avg. Closure Time (Hours)"},
            gauge={
                'axis': {'range': [0, max(avg_closure_time * 2, 100)]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, avg_closure_time], 'color': "lightgray"}
                ]
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Overdue Percentage
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=overdue_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Overdue Percentage (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkred"},
                'steps': [
                    {'range': [0, 5], 'color': "lightgreen"},
                    {'range': [5, 10], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 10
                }
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: KPIs by Area (from KPI table)
    fig.add_trace(
        go.Bar(x=ptw_kpis_df['area'], y=ptw_kpis_df['open_permits'],
               name='Open Permits', marker_color='orange'),
        row=2, col=2
    )
    fig.add_trace(
        go.Bar(x=ptw_kpis_df['area'], y=ptw_kpis_df['permits_past_expiry'],
               name='Past Expiry', marker_color='red'),
        row=2, col=2
    )
    fig.add_trace(
        go.Bar(x=ptw_kpis_df['area'], y=ptw_kpis_df['missing_controls'],
               name='Missing Controls', marker_color='yellow'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Area", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=2)
    
    # Plot 5: KPI summary table
    open_count = total_permits - closed_count
    kpi_table = pd.DataFrame({
        'Metric': [
            'Total Permits',
            'Closed Permits',
            'Open Permits',
            'Overdue Permits',
            'Closure Efficiency (%)',
            'Avg Closure Time (hrs)',
            'Overdue Percentage (%)',
            'On-time Closure Target (%)'
        ],
        'Value': [
            f"{total_permits:,}",
            f"{closed_count:,}",
            f"{open_count:,}",
            f"{overdue_count:,}",
            f"{closure_efficiency:.2f}",
            f"{avg_closure_time:.1f}",
            f"{overdue_percentage:.2f}",
            "90"
        ]
    })

    register_kpi_snapshot(
        component="PTW",
        table_name="PTW KPI Summary",
        df=kpi_table,
        ui_tiles={
            "total_permits": int(total_permits),
            "closed_permits": int(closed_count),
            "open_permits": int(open_count),
            "overdue_permits": int(overdue_count),
            "closure_efficiency_pct": round(float(closure_efficiency), 2),
            "avg_closure_time_hours": round(float(avg_closure_time), 1) if avg_closure_time is not None else None,
            "overdue_percentage": round(float(overdue_percentage), 2),
        }
    )
    
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_table.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_table['Metric'], kpi_table['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=3, col=1
    )
    
    fig.update_layout(height=1100, title_text="PTW KPI Dashboard", barmode='group')
    fig.write_html(f'{charts_dir}/ptw_4_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/ptw_4_kpi_dashboard.html")


def create_ptw_trend_analysis():
    """Create weekly closure trend and time-based analysis."""
    ptw_records_df, ptw_kpis_df = load_ptw_data()
    
    # Prepare time-based data
    ptw_records_df['week'] = ptw_records_df['issue_date'].dt.to_period('W').astype(str)
    ptw_records_df['month'] = ptw_records_df['issue_date'].dt.to_period('M').astype(str)
    
    # Weekly closure trend
    weekly_closures = ptw_records_df[ptw_records_df['permit_status'] == 'Closed'].groupby('week').size().reset_index()
    weekly_closures.columns = ['Week', 'Closures']
    
    # Monthly trends
    monthly_issued = ptw_records_df.groupby('month').size().reset_index()
    monthly_issued.columns = ['Month', 'Issued']
    monthly_closed = ptw_records_df[ptw_records_df['permit_status'] == 'Closed'].groupby('month').size().reset_index()
    monthly_closed.columns = ['Month', 'Closed']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Weekly Closure Trend', 'Monthly PTW Issued vs Closed',
                       'Closure Time Distribution', 'Permits by Day of Week'),
        specs=[[{"secondary_y": False}, {"secondary_y": False}],
               [{"type": "box"}, {"type": "bar"}]]
    )
    
    # Plot 1: Weekly closure trend
    fig.add_trace(
        go.Scatter(x=weekly_closures['Week'], y=weekly_closures['Closures'],
                  mode='lines+markers', name='Weekly Closures',
                  marker=dict(symbol='circle', size=8)),
        row=1, col=1
    )
    
    # Plot 2: Monthly trends
    fig.add_trace(
        go.Bar(x=monthly_issued['Month'], y=monthly_issued['Issued'],
               name='Issued', marker_color='lightblue'),
        row=1, col=2
    )
    fig.add_trace(
        go.Bar(x=monthly_closed['Month'], y=monthly_closed['Closed'],
               name='Closed', marker_color='lightgreen'),
        row=1, col=2
    )
    
    # Plot 3: Closure time distribution
    closed_permits = ptw_records_df[ptw_records_df['permit_status'] == 'Closed'].copy()
    closed_permits['closure_time_hours'] = (
        (closed_permits['close_time'] - closed_permits['issue_time']).dt.total_seconds() / 3600
    )
    if not closed_permits.empty:
        fig.add_trace(
            go.Box(y=closed_permits['closure_time_hours'], name='Closure Time (Hours)',
                   boxmean='sd'),
            row=2, col=1
        )
    
    # Plot 4: Permits by day of week
    ptw_records_df['day_of_week'] = ptw_records_df['issue_date'].dt.day_name()
    day_counts = ptw_records_df['day_of_week'].value_counts().reindex(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    )
    fig.add_trace(
        go.Bar(x=day_counts.index, y=day_counts.values,
               marker_color='skyblue', name='Permits by Day'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Week", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Closures", row=1, col=1)
    fig.update_xaxes(title_text="Month", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=2)
    fig.update_xaxes(title_text="", row=2, col=1)
    fig.update_yaxes(title_text="Closure Time (Hours)", row=2, col=1)
    fig.update_xaxes(title_text="Day of Week", row=2, col=2)
    fig.update_yaxes(title_text="Number of Permits", row=2, col=2)
    
    fig.update_layout(height=900, title_text="PTW Trend Analysis", barmode='group')
    fig.write_html(f'{charts_dir}/ptw_5_trend_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/ptw_5_trend_analysis.html")


def create_all_ptw_charts():
    """Generate all PTW/KPI charts."""
    print("\n" + "="*50)
    print("GENERATING PTW/KPI CHARTS")
    print("="*50)
    
    try:
        create_ptw_status_summary()
        create_ptw_type_distribution()
        create_ptw_compliance_analysis()
        create_ptw_kpi_dashboard()
        create_ptw_trend_analysis()
        
        print("\nAll PTW/KPI visualizations completed! 🎉")
        
        # Print summary statistics
        ptw_records_df, ptw_kpis_df = load_ptw_data()
        print("\n" + "="*50)
        print("PTW SUMMARY STATISTICS")
        print("="*50)
        
        total_permits = len(ptw_records_df)
        closed_count = len(ptw_records_df[ptw_records_df['permit_status'] == 'Closed'])
        open_count = len(ptw_records_df[ptw_records_df['permit_status'] == 'Open'])
        # Handle is_past_expiry (could be boolean or string)
        if 'is_past_expiry' in ptw_records_df.columns:
            overdue_count = (ptw_records_df['is_past_expiry'] == True).sum() + \
                           (ptw_records_df['is_past_expiry'] == 'True').sum() + \
                           (ptw_records_df['is_past_expiry'] == 'true').sum()
        else:
            overdue_count = 0
        
        print(f"Total Permits: {total_permits}")
        print(f"Closed Permits: {closed_count}")
        print(f"Open Permits: {open_count}")
        print(f"Overdue Permits: {overdue_count}")
        print(f"Closure Efficiency: {(closed_count/total_permits*100):.2f}%")
        print(f"Overdue Percentage: {(overdue_count/total_permits*100):.2f}%")
        
        print(f"\nPermit Type Distribution:")
        print(ptw_records_df['permit_type'].value_counts())
        
    except Exception as e:
        print(f"Error generating PTW charts: {str(e)}")
        raise


# ============================================================================
# INSPECTIONS/AUDIT CHARTING FUNCTIONS
# ============================================================================

def load_inspections_data():
    """Load inspections and audit data from CSV files."""
    inspections_df = pd.read_csv('Generated/extracted_tables/Inspections/table_1.csv')
    recurring_failures_df = pd.read_csv('Generated/extracted_tables/Top_Recurring_Failures/table_1.csv')
    
    # Convert date column
    inspections_df['date'] = pd.to_datetime(inspections_df['date'], errors='coerce')
    
    return inspections_df, recurring_failures_df


def create_ncr_summary():
    """Create NCR (Non-Conformance Report) summary dashboard."""
    inspections_df, recurring_failures_df = load_inspections_data()
    
    # Calculate NCR metrics
    total_inspections = len(inspections_df)
    pass_count = len(inspections_df[inspections_df['status'] == 'Pass'])
    fail_count = len(inspections_df[inspections_df['status'] == 'Fail'])
    na_count = len(inspections_df[inspections_df['status'].isin(['', 'N/A', 'Not relevant', 'Item not applicable today', 'N/A - area closed'])])
    
    # Compliance % = Pass / Total × 100
    compliance_percentage = (pass_count / total_inspections * 100) if total_inspections > 0 else 0
    
    # NCRs by area
    ncr_by_area = inspections_df[inspections_df['status'] == 'Fail'].groupby('area').size().reset_index()
    ncr_by_area.columns = ['Area', 'NCR_Count']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('NCR Summary by Status', 'Compliance Percentage',
                       'NCRs by Area', 'Status Distribution'),
        specs=[[{"type": "bar"}, {"type": "indicator"}],
               [{"type": "bar"}, {"type": "pie"}]]
    )
    
    # Plot 1: NCR summary bar chart
    status_counts = inspections_df['status'].value_counts()
    fig.add_trace(
        go.Bar(x=status_counts.index, y=status_counts.values,
               marker_color=['#51cf66', '#ff6b6b', '#ffd93d'],
               name='Status Count'),
        row=1, col=1
    )
    
    # Plot 2: Compliance percentage gauge
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=compliance_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Audit Compliance (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: NCRs by area
    if not ncr_by_area.empty:
        fig.add_trace(
            go.Bar(x=ncr_by_area['Area'], y=ncr_by_area['NCR_Count'],
                   marker_color='coral', name='NCR Count'),
            row=2, col=1
        )
    
    # Plot 4: Status pie chart
    status_for_pie = inspections_df['status'].value_counts()
    fig.add_trace(
        go.Pie(labels=status_for_pie.index, values=status_for_pie.values,
               name="Status Distribution", textinfo='label+percent'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Status", row=1, col=1)
    fig.update_yaxes(title_text="Count", row=1, col=1)
    fig.update_xaxes(title_text="Area", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="NCR Count", row=2, col=1)
    
    fig.update_layout(height=900, title_text="NCR Summary Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/insp_1_ncr_summary.html')
    print(f"  ✓ Saved: {charts_dir}/insp_1_ncr_summary.html")


def create_recurring_ncr_analysis():
    """Create recurring non-compliance analysis."""
    inspections_df, recurring_failures_df = load_inspections_data()
    
    # Get recurring failures from the data
    fail_inspections = inspections_df[inspections_df['status'] == 'Fail'].copy()
    recurring_items = fail_inspections['checklist_item'].value_counts().reset_index()
    recurring_items.columns = ['Checklist_Item', 'Fail_Count']
    
    # Merge with top recurring failures table if available
    if not recurring_failures_df.empty:
        recurring_items = recurring_failures_df.merge(
            recurring_items, left_on='checklist_item', right_on='Checklist_Item', how='outer'
        )
        recurring_items['Fail_Count'] = recurring_items['fail_count'].fillna(recurring_items['Fail_Count']).fillna(0)
        recurring_items = recurring_items.sort_values('Fail_Count', ascending=False).head(20)
    
    # Calculate recurrence % = Repeat NCR / Total NCR × 100
    total_ncr = len(fail_inspections)
    repeat_ncr = recurring_items['Fail_Count'].sum() if not recurring_items.empty else 0
    recurrence_percentage = (repeat_ncr / total_ncr * 100) if total_ncr > 0 else 0
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Top Recurring Non-Compliances', 'Recurrence Percentage',
                       'Recurring Items by Area', 'Failure Trend Over Time'),
        specs=[[{"type": "bar"}, {"type": "indicator"}],
               [{"type": "bar"}, {"type": "scatter"}]]
    )
    
    # Plot 1: Top recurring items
    top_items = recurring_items.head(15) if not recurring_items.empty else pd.DataFrame()
    if not top_items.empty:
        fig.add_trace(
            go.Bar(x=top_items['Checklist_Item'], y=top_items['Fail_Count'],
                   marker_color='lightcoral', name='Fail Count'),
            row=1, col=1
        )
    
    # Plot 2: Recurrence percentage gauge
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=recurrence_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Recurrence Percentage (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkorange"},
                'steps': [
                    {'range': [0, 30], 'color': "lightgreen"},
                    {'range': [30, 60], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 70
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Recurring items by area
    if not fail_inspections.empty:
        area_item_fails = fail_inspections.groupby(['area', 'checklist_item']).size().reset_index()
        area_item_fails.columns = ['Area', 'Checklist_Item', 'Count']
        top_area_items = area_item_fails.nlargest(15, 'Count')
        if not top_area_items.empty:
            fig.add_trace(
                go.Bar(x=top_area_items['Area'], y=top_area_items['Count'],
                       marker_color='mediumpurple', name='Failures by Area-Item'),
                row=2, col=1
            )
    
    # Plot 4: Failure trend over time
    fail_inspections['month'] = fail_inspections['date'].dt.to_period('M').astype(str)
    monthly_fails = fail_inspections.groupby('month').size().reset_index()
    monthly_fails.columns = ['Month', 'Fail_Count']
    if not monthly_fails.empty:
        fig.add_trace(
            go.Scatter(x=monthly_fails['Month'], y=monthly_fails['Fail_Count'],
                      mode='lines+markers', name='Monthly Failures',
                      marker=dict(symbol='circle', size=8)),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Checklist Item", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Fail Count", row=1, col=1)
    fig.update_xaxes(title_text="Area", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=1)
    fig.update_xaxes(title_text="Month", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Fail Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Recurring NCR Analysis", showlegend=False)
    fig.write_html(f'{charts_dir}/insp_2_recurring_ncr.html')
    print(f"  ✓ Saved: {charts_dir}/insp_2_recurring_ncr.html")


def create_audit_scorecards():
    """Create audit scorecards by area and inspector."""
    inspections_df, recurring_failures_df = load_inspections_data()
    
    # Calculate compliance by area
    area_compliance = inspections_df.groupby('area').apply(
        lambda x: (len(x[x['status'] == 'Pass']) / len(x) * 100) if len(x) > 0 else 0
    ).reset_index()
    area_compliance.columns = ['Area', 'Compliance_Percentage']
    
    # Calculate compliance by inspector
    inspector_compliance = inspections_df.groupby('inspector').apply(
        lambda x: (len(x[x['status'] == 'Pass']) / len(x) * 100) if len(x) > 0 else 0
    ).reset_index()
    inspector_compliance.columns = ['Inspector', 'Compliance_Percentage']
    
    # Total inspections by area
    area_counts = inspections_df['area'].value_counts().reset_index()
    area_counts.columns = ['Area', 'Total_Inspections']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Compliance by Area', 'Compliance by Inspector',
                       'Total Inspections by Area', 'Area Compliance Radar Chart'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "scatterpolar"}]]
    )
    
    # Plot 1: Compliance by area
    fig.add_trace(
        go.Bar(x=area_compliance['Area'], y=area_compliance['Compliance_Percentage'],
               marker_color='lightblue', name='Compliance %'),
        row=1, col=1
    )
    
    # Plot 2: Compliance by inspector (top 15)
    top_inspectors = inspector_compliance.nlargest(15, 'Compliance_Percentage')
    fig.add_trace(
        go.Bar(x=top_inspectors['Inspector'], y=top_inspectors['Compliance_Percentage'],
               marker_color='lightgreen', name='Compliance %'),
        row=1, col=2
    )
    
    # Plot 3: Total inspections by area
    fig.add_trace(
        go.Bar(x=area_counts['Area'], y=area_counts['Total_Inspections'],
               marker_color='skyblue', name='Total Inspections'),
        row=2, col=1
    )
    
    # Plot 4: Radar chart of area compliance (top 10 areas)
    top_areas = area_compliance.nlargest(10, 'Compliance_Percentage')
    if not top_areas.empty:
        fig.add_trace(
            go.Scatterpolar(
                r=top_areas['Compliance_Percentage'].tolist(),
                theta=top_areas['Area'].tolist(),
                fill='toself',
                name='Area Compliance',
                marker=dict(color='rgba(31, 119, 180, 0.6)')
            ),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Area", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Compliance (%)", row=1, col=1)
    fig.update_xaxes(title_text="Inspector", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Compliance (%)", row=1, col=2)
    fig.update_xaxes(title_text="Area", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Total Inspections", row=2, col=1)
    
    fig.update_layout(height=900, title_text="Audit Scorecards", showlegend=False)
    fig.write_html(f'{charts_dir}/insp_3_audit_scorecards.html')
    print(f"  ✓ Saved: {charts_dir}/insp_3_audit_scorecards.html")


def create_inspections_kpi_dashboard():
    """Create inspections KPI dashboard."""
    inspections_df, recurring_failures_df = load_inspections_data()
    
    # Calculate KPIs
    total_inspections = len(inspections_df)
    pass_count = len(inspections_df[inspections_df['status'] == 'Pass'])
    fail_count = len(inspections_df[inspections_df['status'] == 'Fail'])
    
    # Compliance % = Pass / Total × 100
    compliance_percentage = (pass_count / total_inspections * 100) if total_inspections > 0 else 0
    
    # Recurrence % = Repeat NCR / Total NCR × 100
    fail_inspections = inspections_df[inspections_df['status'] == 'Fail'].copy()
    total_ncr = len(fail_inspections)
    recurring_items = fail_inspections['checklist_item'].value_counts()
    repeat_ncr = recurring_items[recurring_items > 1].sum() if not recurring_items.empty else 0
    recurrence_percentage = (repeat_ncr / total_ncr * 100) if total_ncr > 0 else 0
    
    # Avg. Closure Days (assuming we can calculate from date differences)
    # For now, we'll use a placeholder - in real scenario, would need closure dates
    avg_closure_days = 0  # Placeholder - would need closure date data
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Compliance Percentage', 'Recurrence Percentage',
                       'NCR Distribution', 'KPIs Summary'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "bar"}, {"type": "table"}]]
    )
    
    # Plot 1: Compliance percentage
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=compliance_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Compliance (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Recurrence percentage
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=recurrence_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Recurrence (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkorange"},
                'steps': [
                    {'range': [0, 30], 'color': "lightgreen"},
                    {'range': [30, 60], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 70
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: NCR distribution by area
    ncr_by_area = fail_inspections['area'].value_counts().head(15)
    if not ncr_by_area.empty:
        fig.add_trace(
            go.Bar(x=ncr_by_area.index, y=ncr_by_area.values,
                   marker_color='coral', name='NCR Count'),
            row=2, col=1
        )
    
    # Plot 4: KPIs summary table
    kpi_data = {
        'Metric': ['Total Inspections', 'Pass Count', 'Fail Count', 'Compliance %', 'Recurrence %', 'Avg Closure Days'],
        'Value': [total_inspections, pass_count, fail_count, f"{compliance_percentage:.2f}%", f"{recurrence_percentage:.2f}%", f"{avg_closure_days:.1f}"]
    }
    kpi_df = pd.DataFrame(kpi_data)

    register_kpi_snapshot(
        component="Inspections",
        table_name="Inspections KPI Summary",
        df=kpi_df,
        ui_tiles={
            "total_inspections": int(total_inspections),
            "pass_count": int(pass_count),
            "fail_count": int(fail_count),
            "compliance_pct": round(float(compliance_percentage), 2),
            "recurrence_pct": round(float(recurrence_percentage), 2),
            "avg_closure_days": round(float(avg_closure_days), 1) if avg_closure_days is not None else None,
        }
    )
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_df.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_df['Metric'], kpi_df['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Area", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="NCR Count", row=2, col=1)
    
    fig.update_layout(height=900, title_text="Inspections KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/insp_4_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/insp_4_kpi_dashboard.html")


def create_inspections_trend_analysis():
    """Create inspections trend analysis over time."""
    inspections_df, recurring_failures_df = load_inspections_data()
    
    # Prepare time-based data
    inspections_df['month'] = inspections_df['date'].dt.to_period('M').astype(str)
    inspections_df['week'] = inspections_df['date'].dt.to_period('W').astype(str)
    
    # Monthly trends
    monthly_total = inspections_df.groupby('month').size().reset_index()
    monthly_total.columns = ['Month', 'Total']
    monthly_pass = inspections_df[inspections_df['status'] == 'Pass'].groupby('month').size().reset_index()
    monthly_pass.columns = ['Month', 'Pass']
    monthly_fail = inspections_df[inspections_df['status'] == 'Fail'].groupby('month').size().reset_index()
    monthly_fail.columns = ['Month', 'Fail']
    
    # Weekly compliance trend
    weekly_compliance = inspections_df.groupby('week').apply(
        lambda x: (len(x[x['status'] == 'Pass']) / len(x) * 100) if len(x) > 0 else 0
    ).reset_index()
    weekly_compliance.columns = ['Week', 'Compliance_Percentage']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Monthly Inspection Trends', 'Weekly Compliance Trend',
                       'Status Distribution Over Time', 'Inspections by Day of Week'),
        specs=[[{"secondary_y": False}, {"secondary_y": False}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Monthly trends
    fig.add_trace(
        go.Bar(x=monthly_total['Month'], y=monthly_total['Total'],
               name='Total', marker_color='lightblue'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=monthly_pass['Month'], y=monthly_pass['Pass'],
               name='Pass', marker_color='lightgreen'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=monthly_fail['Month'], y=monthly_fail['Fail'],
               name='Fail', marker_color='lightcoral'),
        row=1, col=1
    )
    
    # Plot 2: Weekly compliance trend
    if not weekly_compliance.empty:
        fig.add_trace(
            go.Scatter(x=weekly_compliance['Week'], y=weekly_compliance['Compliance_Percentage'],
                      mode='lines+markers', name='Weekly Compliance',
                      marker=dict(symbol='circle', size=8)),
            row=1, col=2
        )
    
    # Plot 3: Status distribution over time (stacked)
    monthly_status = pd.crosstab(inspections_df['month'], inspections_df['status'])
    for status in monthly_status.columns:
        fig.add_trace(
            go.Bar(x=monthly_status.index, y=monthly_status[status],
                   name=status),
            row=2, col=1
        )
    
    # Plot 4: Inspections by day of week
    inspections_df['day_of_week'] = inspections_df['date'].dt.day_name()
    day_counts = inspections_df['day_of_week'].value_counts().reindex(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    )
    fig.add_trace(
        go.Bar(x=day_counts.index, y=day_counts.values,
               marker_color='skyblue', name='Inspections by Day'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=1)
    fig.update_xaxes(title_text="Week", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Compliance (%)", row=1, col=2)
    fig.update_xaxes(title_text="Month", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=1)
    fig.update_xaxes(title_text="Day of Week", row=2, col=2)
    fig.update_yaxes(title_text="Number of Inspections", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Inspections Trend Analysis", barmode='group')
    fig.write_html(f'{charts_dir}/insp_5_trend_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/insp_5_trend_analysis.html")


def create_all_inspections_charts():
    """Generate all inspections/audit charts."""
    print("\n" + "="*50)
    print("GENERATING INSPECTIONS/AUDIT CHARTS")
    print("="*50)
    
    try:
        create_ncr_summary()
        create_recurring_ncr_analysis()
        create_audit_scorecards()
        create_inspections_kpi_dashboard()
        create_inspections_trend_analysis()
        
        print("\nAll Inspections/Audit visualizations completed! 🎉")
        
        # Print summary statistics
        inspections_df, recurring_failures_df = load_inspections_data()
        print("\n" + "="*50)
        print("INSPECTIONS SUMMARY STATISTICS")
        print("="*50)
        
        total_inspections = len(inspections_df)
        pass_count = len(inspections_df[inspections_df['status'] == 'Pass'])
        fail_count = len(inspections_df[inspections_df['status'] == 'Fail'])
        compliance_percentage = (pass_count / total_inspections * 100) if total_inspections > 0 else 0
        
        print(f"Total Inspections: {total_inspections}")
        print(f"Pass Count: {pass_count}")
        print(f"Fail Count: {fail_count}")
        print(f"Compliance Percentage: {compliance_percentage:.2f}%")
        
        print(f"\nTop 5 Areas with Most Inspections:")
        print(inspections_df['area'].value_counts().head(5))
        
        print(f"\nTop 5 Recurring Failures:")
        if not recurring_failures_df.empty:
            print(recurring_failures_df.head(5))
        
    except Exception as e:
        print(f"Error generating inspections charts: {str(e)}")
        raise


# ============================================================================
# MEDICAL RECORDS CHARTING FUNCTIONS
# ============================================================================

def load_medical_data():
    """Load medical records and KPI data from CSV files."""
    medical_records_df = pd.read_csv('Generated/extracted_tables/Medical_Records/table_1.csv')
    medical_kpis_df = pd.read_csv('Generated/extracted_tables/Medical_KPIs/table_1.csv')
    
    # Convert date and time columns
    medical_records_df['date'] = pd.to_datetime(medical_records_df['date'], errors='coerce')
    medical_records_df['datetime'] = pd.to_datetime(
        medical_records_df['date'].astype(str) + ' ' + medical_records_df['time'].astype(str),
        errors='coerce'
    )
    
    return medical_records_df, medical_kpis_df


def create_firstaid_lti_summary():
    """Create First-aid vs LTI (Lost Time Injury) summary dashboard."""
    medical_records_df, medical_kpis_df = load_medical_data()
    
    # Calculate First-aid vs LTI
    total_cases = len(medical_records_df)
    first_aid_cases = len(medical_records_df[medical_records_df['first_aid_given'].notna()])
    lti_cases = len(medical_records_df[medical_records_df['days_lost'] > 0])
    transported_cases = len(medical_records_df[medical_records_df['transported'] == 'Yes'])
    
    # Severity breakdown
    severity_counts = medical_records_df['severity'].value_counts()
    
    # Cases by department
    dept_cases = medical_records_df['department'].value_counts().head(10)
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('First-aid vs LTI Summary', 'Severity Distribution',
                       'Cases by Department', 'Transported vs Non-Transported'),
        specs=[[{"type": "bar"}, {"type": "pie"}],
               [{"type": "bar"}, {"type": "pie"}]]
    )
    
    # Plot 1: First-aid vs LTI bar chart
    fig.add_trace(
        go.Bar(x=['First-aid Cases', 'LTI Cases', 'Transported Cases'],
               y=[first_aid_cases, lti_cases, transported_cases],
               marker_color=['#51cf66', '#ff6b6b', '#ffd93d'],
               name='Case Types'),
        row=1, col=1
    )
    
    # Plot 2: Severity pie chart
    fig.add_trace(
        go.Pie(labels=severity_counts.index, values=severity_counts.values,
               name="Severity Distribution", textinfo='label+percent'),
        row=1, col=2
    )
    
    # Plot 3: Cases by department
    if not dept_cases.empty:
        fig.add_trace(
            go.Bar(x=dept_cases.index, y=dept_cases.values,
                   marker_color='lightblue', name='Cases by Department'),
            row=2, col=1
        )
    
    # Plot 4: Transported vs Non-Transported
    transported_counts = medical_records_df['transported'].value_counts()
    fig.add_trace(
        go.Pie(labels=transported_counts.index, values=transported_counts.values,
               name="Transported Distribution", textinfo='label+percent'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Case Type", row=1, col=1)
    fig.update_yaxes(title_text="Count", row=1, col=1)
    fig.update_xaxes(title_text="Department", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Case Count", row=2, col=1)
    
    fig.update_layout(height=900, title_text="First-aid vs LTI Summary Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/medical_1_firstaid_lti_summary.html')
    print(f"  ✓ Saved: {charts_dir}/medical_1_firstaid_lti_summary.html")


def create_injury_type_analysis():
    """Create injury type analysis with pie chart and trends."""
    medical_records_df, medical_kpis_df = load_medical_data()
    
    # Injury type distribution
    injury_counts = medical_records_df['injury'].value_counts()
    
    # Injury by severity
    injury_severity = pd.crosstab(medical_records_df['injury'], medical_records_df['severity'])
    
    # Monthly injury trends
    medical_records_df['month'] = medical_records_df['date'].dt.to_period('M').astype(str)
    monthly_injuries = medical_records_df.groupby('month').size().reset_index()
    monthly_injuries.columns = ['Month', 'Count']
    
    # Top injuries by department
    top_injuries = injury_counts.head(10)
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Injury Type Distribution', 'Top 10 Injuries',
                       'Monthly Injury Trends', 'Injury by Severity'),
        specs=[[{"type": "pie"}, {"type": "bar"}],
               [{"type": "scatter"}, {"type": "bar"}]]
    )
    
    # Plot 1: Injury type pie chart
    top_injuries_pie = injury_counts.head(15)
    fig.add_trace(
        go.Pie(labels=top_injuries_pie.index, values=top_injuries_pie.values,
               name="Injury Types", textinfo='label+percent'),
        row=1, col=1
    )
    
    # Plot 2: Top 10 injuries
    if not top_injuries.empty:
        fig.add_trace(
            go.Bar(x=top_injuries.index, y=top_injuries.values,
                   marker_color='lightcoral', name='Injury Count'),
            row=1, col=2
        )
    
    # Plot 3: Monthly trends
    if not monthly_injuries.empty:
        fig.add_trace(
            go.Scatter(x=monthly_injuries['Month'], y=monthly_injuries['Count'],
                      mode='lines+markers', name='Monthly Injuries',
                      marker=dict(symbol='circle', size=8)),
            row=2, col=1
        )
    
    # Plot 4: Injury by severity (stacked)
    top_injury_severity = injury_severity.head(10)
    for severity in top_injury_severity.columns:
        fig.add_trace(
            go.Bar(x=top_injury_severity.index, y=top_injury_severity[severity],
                   name=severity),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Injury Type", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=2)
    fig.update_xaxes(title_text="Month", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Injury Count", row=2, col=1)
    fig.update_xaxes(title_text="Injury Type", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Injury Type Analysis", barmode='stack')
    fig.write_html(f'{charts_dir}/medical_2_injury_type_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/medical_2_injury_type_analysis.html")


def create_response_time_analytics():
    """Create response time analytics dashboard."""
    medical_records_df, medical_kpis_df = load_medical_data()
    
    # Calculate response time (time from case to first aid)
    # Since we don't have incident time, we'll use time of day as proxy
    medical_records_df['hour'] = pd.to_datetime(medical_records_df['time'], format='%H:%M', errors='coerce').dt.hour
    
    # Response time by hour of day
    hourly_cases = medical_records_df.groupby('hour').size().reset_index()
    hourly_cases.columns = ['Hour', 'Case_Count']
    
    # Response time by department
    dept_response = medical_records_df.groupby('department').size().reset_index()
    dept_response.columns = ['Department', 'Case_Count']
    
    # Average response time (placeholder - would need actual response time data)
    # For now, we'll use time to first aid as proxy
    avg_response_time = 0  # Placeholder
    
    # Cases by day of week
    medical_records_df['day_of_week'] = medical_records_df['date'].dt.day_name()
    day_counts = medical_records_df['day_of_week'].value_counts().reindex(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    )
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Cases by Hour of Day', 'Average Response Time',
                       'Cases by Day of Week', 'Cases by Department'),
        specs=[[{"type": "bar"}, {"type": "indicator"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Cases by hour
    if not hourly_cases.empty:
        fig.add_trace(
            go.Bar(x=hourly_cases['Hour'], y=hourly_cases['Case_Count'],
                   marker_color='lightblue', name='Cases by Hour'),
            row=1, col=1
        )
    
    # Plot 2: Average response time gauge
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_response_time,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Avg. Response Time (minutes)"},
            gauge={
                'axis': {'range': [None, 60]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 15], 'color': "lightgreen"},
                    {'range': [15, 30], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 45
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Cases by day of week
    fig.add_trace(
        go.Bar(x=day_counts.index, y=day_counts.values,
               marker_color='skyblue', name='Cases by Day'),
        row=2, col=1
    )
    
    # Plot 4: Cases by department
    top_depts = dept_response.nlargest(10, 'Case_Count')
    if not top_depts.empty:
        fig.add_trace(
            go.Bar(x=top_depts['Department'], y=top_depts['Case_Count'],
                   marker_color='lightgreen', name='Cases by Department'),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Hour of Day", row=1, col=1)
    fig.update_yaxes(title_text="Case Count", row=1, col=1)
    fig.update_xaxes(title_text="Day of Week", row=2, col=1)
    fig.update_yaxes(title_text="Case Count", row=2, col=1)
    fig.update_xaxes(title_text="Department", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Case Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Response Time Analytics", showlegend=False)
    fig.write_html(f'{charts_dir}/medical_3_response_time_analytics.html')
    print(f"  ✓ Saved: {charts_dir}/medical_3_response_time_analytics.html")


def create_medical_kpi_dashboard():
    """Create medical records KPI dashboard."""
    medical_records_df, medical_kpis_df = load_medical_data()
    
    # Calculate KPIs
    total_cases = len(medical_records_df)
    first_aid_cases = len(medical_records_df[medical_records_df['first_aid_given'].notna()])
    
    # FA Cases / Month (from KPI table)
    if not medical_kpis_df.empty:
        avg_fa_per_month = medical_kpis_df['first_aid_cases'].mean()
    else:
        medical_records_df['month'] = medical_records_df['date'].dt.to_period('M').astype(str)
        monthly_fa = medical_records_df[medical_records_df['first_aid_given'].notna()].groupby('month').size()
        avg_fa_per_month = monthly_fa.mean() if not monthly_fa.empty else 0
    
    # Avg. Response Time (placeholder)
    avg_response_time = 0  # Would need actual response time data
    
    # Drill Compliance % (placeholder - would need drill data)
    drill_compliance = 0  # Placeholder
    
    # Total days lost
    total_days_lost = medical_records_df['days_lost'].sum()
    avg_days_lost = medical_records_df['days_lost'].mean()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('FA Cases per Month', 'Average Response Time',
                       'Drill Compliance %', 'KPIs Summary'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "table"}]]
    )
    
    # Plot 1: FA Cases per Month
    fig.add_trace(
        go.Indicator(
            mode="number+gauge",
            value=avg_fa_per_month,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "FA Cases / Month"},
            gauge={
                'axis': {'range': [0, max(avg_fa_per_month * 2, 50)]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, avg_fa_per_month], 'color': "lightgray"}
                ]
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Average Response Time
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_response_time,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Avg. Response Time (minutes)"},
            gauge={
                'axis': {'range': [None, 60]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 15], 'color': "lightgreen"},
                    {'range': [15, 30], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 45
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Drill Compliance
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=drill_compliance,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Drill Compliance (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkorange"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: KPIs summary table
    kpi_data = {
        'Metric': ['Total Cases', 'First-aid Cases', 'LTI Cases', 'FA Cases/Month', 'Avg Response Time (min)', 'Drill Compliance %', 'Total Days Lost', 'Avg Days Lost'],
        'Value': [
            total_cases,
            first_aid_cases,
            len(medical_records_df[medical_records_df['days_lost'] > 0]),
            f"{avg_fa_per_month:.1f}",
            f"{avg_response_time:.1f}",
            f"{drill_compliance:.1f}%",
            f"{total_days_lost:.0f}",
            f"{avg_days_lost:.2f}"
        ]
    }
    kpi_df = pd.DataFrame(kpi_data)

    register_kpi_snapshot(
        component="Medical",
        table_name="Medical KPI Summary",
        df=kpi_df,
        ui_tiles={
            "total_cases": int(total_cases),
            "first_aid_cases": int(first_aid_cases),
            "lti_cases": int(len(medical_records_df[medical_records_df['days_lost'] > 0])),
            "fa_cases_per_month": round(float(avg_fa_per_month), 1),
            "avg_response_time_min": round(float(avg_response_time), 1) if avg_response_time is not None else None,
            "drill_compliance_pct": round(float(drill_compliance), 1) if drill_compliance is not None else None,
            "total_days_lost": float(total_days_lost) if not pd.isna(total_days_lost) else None,
            "avg_days_lost": round(float(avg_days_lost), 2) if not pd.isna(avg_days_lost) else None,
        }
    )
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_df.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_df['Metric'], kpi_df['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    fig.update_layout(height=900, title_text="Medical Records KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/medical_4_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/medical_4_kpi_dashboard.html")


def create_drill_compliance_timeline():
    """Create drill compliance timeline (placeholder for drill data)."""
    medical_records_df, medical_kpis_df = load_medical_data()
    
    # Since we don't have actual drill data, we'll create a placeholder visualization
    # In a real scenario, this would show drill dates and compliance percentages
    
    # Monthly trends from medical data as proxy
    medical_records_df['month'] = medical_records_df['date'].dt.to_period('M').astype(str)
    monthly_data = medical_records_df.groupby('month').agg({
        'case_id': 'count',
        'days_lost': 'sum'
    }).reset_index()
    monthly_data.columns = ['Month', 'Cases', 'Days_Lost']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Monthly Case Trends', 'Days Lost Trend',
                       'Drill Compliance Timeline (Placeholder)', 'Monthly KPIs'),
        specs=[[{"type": "scatter"}, {"type": "scatter"}],
               [{"type": "scatter"}, {"type": "bar"}]]
    )
    
    # Plot 1: Monthly case trends
    fig.add_trace(
        go.Scatter(x=monthly_data['Month'], y=monthly_data['Cases'],
                  mode='lines+markers', name='Monthly Cases',
                  marker=dict(symbol='circle', size=8)),
        row=1, col=1
    )
    
    # Plot 2: Days lost trend
    fig.add_trace(
        go.Scatter(x=monthly_data['Month'], y=monthly_data['Days_Lost'],
                  mode='lines+markers', name='Days Lost',
                  marker=dict(symbol='square', size=8, color='red')),
        row=1, col=2
    )
    
    # Plot 3: Drill compliance timeline (placeholder)
    # In real scenario, would show drill dates and compliance %
    if not medical_kpis_df.empty:
        fig.add_trace(
            go.Scatter(x=medical_kpis_df['month'], y=[85, 90, 88],  # Placeholder values
                      mode='lines+markers', name='Drill Compliance %',
                      marker=dict(symbol='diamond', size=10, color='green')),
            row=2, col=1
        )
    
    # Plot 4: Monthly KPIs from KPI table
    if not medical_kpis_df.empty:
        fig.add_trace(
            go.Bar(x=medical_kpis_df['month'], y=medical_kpis_df['first_aid_cases'],
                   name='First-aid Cases', marker_color='lightblue'),
            row=2, col=2
        )
        fig.add_trace(
            go.Bar(x=medical_kpis_df['month'], y=medical_kpis_df['transported_cases'],
                   name='Transported Cases', marker_color='lightcoral'),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Case Count", row=1, col=1)
    fig.update_xaxes(title_text="Month", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Days Lost", row=1, col=2)
    fig.update_xaxes(title_text="Month", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Compliance %", row=2, col=1)
    fig.update_xaxes(title_text="Month", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Drill Compliance Timeline & Trends", barmode='group')
    fig.write_html(f'{charts_dir}/medical_5_drill_compliance_timeline.html')
    print(f"  ✓ Saved: {charts_dir}/medical_5_drill_compliance_timeline.html")


def create_all_medical_charts():
    """Generate all medical records charts."""
    print("\n" + "="*50)
    print("GENERATING MEDICAL RECORDS CHARTS")
    print("="*50)
    
    try:
        create_firstaid_lti_summary()
        create_injury_type_analysis()
        create_response_time_analytics()
        create_medical_kpi_dashboard()
        create_drill_compliance_timeline()
        
        print("\nAll Medical Records visualizations completed! 🎉")
        
        # Print summary statistics
        medical_records_df, medical_kpis_df = load_medical_data()
        print("\n" + "="*50)
        print("MEDICAL RECORDS SUMMARY STATISTICS")
        print("="*50)
        
        total_cases = len(medical_records_df)
        first_aid_cases = len(medical_records_df[medical_records_df['first_aid_given'].notna()])
        lti_cases = len(medical_records_df[medical_records_df['days_lost'] > 0])
        transported_cases = len(medical_records_df[medical_records_df['transported'] == 'Yes'])
        total_days_lost = medical_records_df['days_lost'].sum()
        
        print(f"Total Cases: {total_cases}")
        print(f"First-aid Cases: {first_aid_cases}")
        print(f"LTI Cases: {lti_cases}")
        print(f"Transported Cases: {transported_cases}")
        print(f"Total Days Lost: {total_days_lost}")
        
        print(f"\nTop 5 Departments with Most Cases:")
        print(medical_records_df['department'].value_counts().head(5))
        
        print(f"\nTop 5 Injury Types:")
        print(medical_records_df['injury'].value_counts().head(5))
        
    except Exception as e:
        print(f"Error generating medical charts: {str(e)}")
        raise


# ============================================================================
# TRAINING DATABASE CHARTING FUNCTIONS
# ============================================================================

def load_training_data():
    """Load training records data from CSV files."""
    training_df = pd.read_csv('Generated/extracted_tables/Training_Records_150plus/table_1.csv')
    
    # Convert date columns
    training_df['course_date'] = pd.to_datetime(training_df['course_date'], errors='coerce')
    training_df['cert_expiry'] = pd.to_datetime(training_df['cert_expiry'], errors='coerce')
    
    # Calculate days until expiry
    today = pd.Timestamp.now()
    training_df['days_until_expiry'] = (training_df['cert_expiry'] - today).dt.days
    
    # Calculate effectiveness (Post - Pre score)
    training_df['effectiveness'] = training_df['post_score'] - training_df['pre_score']
    
    return training_df


def create_training_completion_summary():
    """Create training completion summary dashboard."""
    training_df = load_training_data()
    
    # Calculate completion metrics
    total_trainings = len(training_df)
    unique_employees = training_df['employee_id'].nunique()
    unique_courses = training_df['course'].nunique()
    
    # Training by department
    dept_trainings = training_df['department'].value_counts()
    
    # Training by course
    course_trainings = training_df['course'].value_counts().head(10)
    
    # Internal vs External
    delivery_type_counts = training_df['delivery_type'].value_counts()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Training Completion Summary', 'Training by Department',
                       'Top 10 Courses', 'Internal vs External Training'),
        specs=[[{"type": "indicator"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "pie"}]]
    )
    
    # Plot 1: Completion summary gauge
    # Coverage % = Trained / Total (assuming total employees from unique count)
    coverage_percentage = 100  # Placeholder - would need total employee count
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=coverage_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Training Coverage (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Training by department
    if not dept_trainings.empty:
        fig.add_trace(
            go.Bar(x=dept_trainings.index, y=dept_trainings.values,
                   marker_color='lightblue', name='Trainings by Department'),
            row=1, col=2
        )
    
    # Plot 3: Top 10 courses
    if not course_trainings.empty:
        fig.add_trace(
            go.Bar(x=course_trainings.index, y=course_trainings.values,
                   marker_color='lightgreen', name='Course Count'),
            row=2, col=1
        )
    
    # Plot 4: Internal vs External
    fig.add_trace(
        go.Pie(labels=delivery_type_counts.index, values=delivery_type_counts.values,
               name="Delivery Type", textinfo='label+percent'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Department", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Training Count", row=1, col=2)
    fig.update_xaxes(title_text="Course", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Training Count", row=2, col=1)
    
    fig.update_layout(height=900, title_text="Training Completion Summary Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/training_1_completion_summary.html')
    print(f"  ✓ Saved: {charts_dir}/training_1_completion_summary.html")


def create_skill_gap_analysis():
    """Create skill gap analysis dashboard."""
    training_df = load_training_data()
    
    # Calculate skill gaps (low post scores or high pre-post difference)
    training_df['skill_gap'] = training_df['post_score'] < 70  # Assuming 70 is passing
    training_df['improvement'] = training_df['post_score'] - training_df['pre_score']
    
    # Skill gap by department
    dept_gaps = training_df.groupby('department').agg({
        'skill_gap': 'sum',
        'employee_id': 'count'
    }).reset_index()
    dept_gaps.columns = ['Department', 'Gap_Count', 'Total_Trainings']
    dept_gaps['Gap_Percentage'] = (dept_gaps['Gap_Count'] / dept_gaps['Total_Trainings'] * 100)
    
    # Skill gap by course
    course_gaps = training_df.groupby('course').agg({
        'skill_gap': 'sum',
        'employee_id': 'count'
    }).reset_index()
    course_gaps.columns = ['Course', 'Gap_Count', 'Total_Trainings']
    course_gaps['Gap_Percentage'] = (course_gaps['Gap_Count'] / course_gaps['Total_Trainings'] * 100)
    top_gap_courses = course_gaps.nlargest(10, 'Gap_Percentage')
    
    # Average scores by department
    dept_scores = training_df.groupby('department')['post_score'].mean().reset_index()
    dept_scores.columns = ['Department', 'Avg_Score']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Skill Gap by Department', 'Top Courses with Skill Gaps',
                       'Average Post-Score by Department', 'Score Distribution'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "box"}]]
    )
    
    # Plot 1: Skill gap by department
    if not dept_gaps.empty:
        fig.add_trace(
            go.Bar(x=dept_gaps['Department'], y=dept_gaps['Gap_Percentage'],
                   marker_color='coral', name='Gap Percentage'),
            row=1, col=1
        )
    
    # Plot 2: Top courses with gaps
    if not top_gap_courses.empty:
        fig.add_trace(
            go.Bar(x=top_gap_courses['Course'], y=top_gap_courses['Gap_Percentage'],
                   marker_color='lightcoral', name='Gap Percentage'),
            row=1, col=2
        )
    
    # Plot 3: Average scores by department
    if not dept_scores.empty:
        fig.add_trace(
            go.Bar(x=dept_scores['Department'], y=dept_scores['Avg_Score'],
                   marker_color='lightgreen', name='Avg Post Score'),
            row=2, col=1
        )
    
    # Plot 4: Score distribution
    fig.add_trace(
        go.Box(y=training_df['post_score'], name='Post Score Distribution',
               boxmean='sd'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Department", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Gap Percentage (%)", row=1, col=1)
    fig.update_xaxes(title_text="Course", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Gap Percentage (%)", row=1, col=2)
    fig.update_xaxes(title_text="Department", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Average Score", row=2, col=1)
    fig.update_xaxes(title_text="", row=2, col=2)
    fig.update_yaxes(title_text="Post Score", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Skill Gap Analysis", showlegend=False)
    fig.write_html(f'{charts_dir}/training_2_skill_gap_analysis.html')
    print(f"  ✓ Saved: {charts_dir}/training_2_skill_gap_analysis.html")


def create_expiry_reminders():
    """Create expiry reminders and alerts dashboard."""
    training_df = load_training_data()
    
    # Calculate expiry status
    today = pd.Timestamp.now()
    training_df['is_expired'] = training_df['cert_expiry'] < today
    training_df['expires_soon'] = (training_df['cert_expiry'] >= today) & (training_df['cert_expiry'] <= today + pd.Timedelta(days=90))
    training_df['is_valid'] = training_df['cert_expiry'] > today + pd.Timedelta(days=90)
    
    # Expiry status counts
    expired_count = training_df['is_expired'].sum()
    expires_soon_count = training_df['expires_soon'].sum()
    valid_count = training_df['is_valid'].sum()
    
    # Expiry Compliance % = Valid / Total × 100
    total_certs = len(training_df)
    expiry_compliance = (valid_count / total_certs * 100) if total_certs > 0 else 0
    
    # Expiring soon by department
    expiring_soon = training_df[training_df['expires_soon']].groupby('department').size().reset_index()
    expiring_soon.columns = ['Department', 'Count']
    
    # Expiring soon by course
    expiring_courses = training_df[training_df['expires_soon']].groupby('course').size().reset_index()
    expiring_courses.columns = ['Course', 'Count']
    top_expiring = expiring_courses.nlargest(10, 'Count')
    
    # Monthly expiry timeline
    training_df['expiry_month'] = training_df['cert_expiry'].dt.to_period('M').astype(str)
    monthly_expiry = training_df.groupby('expiry_month').size().reset_index()
    monthly_expiry.columns = ['Month', 'Expiring_Count']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Expiry Status Summary', 'Expiry Compliance %',
                       'Expiring Soon by Department', 'Monthly Expiry Timeline'),
        specs=[[{"type": "bar"}, {"type": "indicator"}],
               [{"type": "bar"}, {"type": "scatter"}]]
    )
    
    # Plot 1: Expiry status bar chart
    fig.add_trace(
        go.Bar(x=['Expired', 'Expires Soon (90 days)', 'Valid'],
               y=[expired_count, expires_soon_count, valid_count],
               marker_color=['#ff6b6b', '#ffd93d', '#51cf66'],
               name='Expiry Status'),
        row=1, col=1
    )
    
    # Plot 2: Expiry compliance gauge
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=expiry_compliance,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Expiry Compliance (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Expiring soon by department
    if not expiring_soon.empty:
        fig.add_trace(
            go.Bar(x=expiring_soon['Department'], y=expiring_soon['Count'],
                   marker_color='orange', name='Expiring Soon'),
            row=2, col=1
        )
    
    # Plot 4: Monthly expiry timeline
    if not monthly_expiry.empty:
        fig.add_trace(
            go.Scatter(x=monthly_expiry['Month'], y=monthly_expiry['Expiring_Count'],
                      mode='lines+markers', name='Monthly Expiry',
                      marker=dict(symbol='circle', size=8)),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Status", row=1, col=1)
    fig.update_yaxes(title_text="Count", row=1, col=1)
    fig.update_xaxes(title_text="Department", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Expiring Count", row=2, col=1)
    fig.update_xaxes(title_text="Month", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Expiring Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Expiry Reminders & Alerts Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/training_3_expiry_reminders.html')
    print(f"  ✓ Saved: {charts_dir}/training_3_expiry_reminders.html")


def create_training_kpi_dashboard():
    """Create training KPI dashboard."""
    training_df = load_training_data()
    
    # Calculate KPIs
    total_trainings = len(training_df)
    unique_employees = training_df['employee_id'].nunique()
    unique_courses = training_df['course'].nunique()
    
    # Coverage % = Trained / Total × 100 (placeholder - would need total employee count)
    coverage_percentage = 100  # Placeholder
    
    # Effectiveness = Avg(Post – Pre Test)
    effectiveness = training_df['effectiveness'].mean() if 'effectiveness' in training_df.columns else 0
    
    # Expiry Compliance % = Valid / Total × 100
    today = pd.Timestamp.now()
    valid_certs = len(training_df[training_df['cert_expiry'] > today + pd.Timedelta(days=90)])
    expiry_compliance = (valid_certs / total_trainings * 100) if total_trainings > 0 else 0
    
    # Average scores
    avg_pre_score = training_df['pre_score'].mean()
    avg_post_score = training_df['post_score'].mean()
    avg_final_score = training_df['score'].mean()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Training Coverage %', 'Training Effectiveness',
                       'Expiry Compliance %', 'KPIs Summary'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "table"}]]
    )
    
    # Plot 1: Coverage percentage
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=coverage_percentage,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Coverage (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Effectiveness
    fig.add_trace(
        go.Indicator(
            mode="number+gauge",
            value=effectiveness,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Effectiveness (Post - Pre)"},
            gauge={
                'axis': {'range': [-50, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [-50, 0], 'color': "lightgray"},
                    {'range': [0, 20], 'color': "yellow"}
                ]
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Expiry compliance
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=expiry_compliance,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Expiry Compliance (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkorange"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: KPIs summary table
    kpi_data = {
        'Metric': ['Total Trainings', 'Unique Employees', 'Unique Courses', 'Coverage %', 'Effectiveness', 'Expiry Compliance %', 'Avg Pre-Score', 'Avg Post-Score', 'Avg Final Score'],
        'Value': [
            total_trainings,
            unique_employees,
            unique_courses,
            f"{coverage_percentage:.1f}%",
            f"{effectiveness:.2f}",
            f"{expiry_compliance:.2f}%",
            f"{avg_pre_score:.2f}",
            f"{avg_post_score:.2f}",
            f"{avg_final_score:.2f}"
        ]
    }
    kpi_df = pd.DataFrame(kpi_data)

    register_kpi_snapshot(
        component="Training",
        table_name="Training KPI Summary",
        df=kpi_df,
        ui_tiles={
            "total_trainings": int(total_trainings),
            "unique_employees": int(unique_employees),
            "unique_courses": int(unique_courses),
            "coverage_pct": round(float(coverage_percentage), 1),
            "effectiveness_delta": round(float(effectiveness), 2) if effectiveness is not None else None,
            "expiry_compliance_pct": round(float(expiry_compliance), 2),
            "avg_pre_score": round(float(avg_pre_score), 2) if not pd.isna(avg_pre_score) else None,
            "avg_post_score": round(float(avg_post_score), 2) if not pd.isna(avg_post_score) else None,
            "avg_final_score": round(float(avg_final_score), 2) if not pd.isna(avg_final_score) else None,
        }
    )
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_df.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_df['Metric'], kpi_df['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    fig.update_layout(height=900, title_text="Training KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/training_4_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/training_4_kpi_dashboard.html")


def create_training_calendar():
    """Create training calendar visualization."""
    training_df = load_training_data()
    
    # Prepare calendar data
    training_df['month'] = training_df['course_date'].dt.to_period('M').astype(str)
    training_df['week'] = training_df['course_date'].dt.to_period('W').astype(str)
    training_df['day_of_week'] = training_df['course_date'].dt.day_name()
    
    # Monthly training schedule
    monthly_schedule = training_df.groupby('month').size().reset_index()
    monthly_schedule.columns = ['Month', 'Training_Count']
    
    # Weekly training schedule
    weekly_schedule = training_df.groupby('week').size().reset_index()
    weekly_schedule.columns = ['Week', 'Training_Count']
    
    # Training by day of week
    day_schedule = training_df['day_of_week'].value_counts().reindex(
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    )
    
    # Training by course type over time
    course_monthly = training_df.groupby(['month', 'course']).size().reset_index()
    course_monthly.columns = ['Month', 'Course', 'Count']
    top_courses = training_df['course'].value_counts().head(5).index
    top_course_monthly = course_monthly[course_monthly['Course'].isin(top_courses)]
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Monthly Training Schedule', 'Weekly Training Schedule',
                       'Training by Day of Week', 'Top 5 Courses Over Time'),
        specs=[[{"type": "bar"}, {"type": "scatter"}],
               [{"type": "bar"}, {"type": "scatter"}]]
    )
    
    # Plot 1: Monthly schedule
    fig.add_trace(
        go.Bar(x=monthly_schedule['Month'], y=monthly_schedule['Training_Count'],
               marker_color='lightblue', name='Monthly Trainings'),
        row=1, col=1
    )
    
    # Plot 2: Weekly schedule
    if not weekly_schedule.empty:
        fig.add_trace(
            go.Scatter(x=weekly_schedule['Week'], y=weekly_schedule['Training_Count'],
                      mode='lines+markers', name='Weekly Trainings',
                      marker=dict(symbol='circle', size=8)),
            row=1, col=2
        )
    
    # Plot 3: Day of week
    fig.add_trace(
        go.Bar(x=day_schedule.index, y=day_schedule.values,
               marker_color='skyblue', name='Trainings by Day'),
        row=2, col=1
    )
    
    # Plot 4: Top courses over time
    for course in top_courses:
        course_data = top_course_monthly[top_course_monthly['Course'] == course]
        if not course_data.empty:
            fig.add_trace(
                go.Scatter(x=course_data['Month'], y=course_data['Count'],
                          mode='lines+markers', name=course,
                          marker=dict(size=6)),
                row=2, col=2
            )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Training Count", row=1, col=1)
    fig.update_xaxes(title_text="Week", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Training Count", row=1, col=2)
    fig.update_xaxes(title_text="Day of Week", row=2, col=1)
    fig.update_yaxes(title_text="Training Count", row=2, col=1)
    fig.update_xaxes(title_text="Month", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Training Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Training Calendar", showlegend=True)
    fig.write_html(f'{charts_dir}/training_5_training_calendar.html')
    print(f"  ✓ Saved: {charts_dir}/training_5_training_calendar.html")


def create_skill_matrix_chart():
    """Create skill matrix chart by department and course."""
    training_df = load_training_data()
    
    # Create skill matrix: Department vs Course with average scores
    skill_matrix = training_df.groupby(['department', 'course'])['post_score'].mean().reset_index()
    skill_matrix_pivot = skill_matrix.pivot(index='department', columns='course', values='post_score')
    
    # Get top courses and departments for visualization
    top_courses = training_df['course'].value_counts().head(10).index
    top_depts = training_df['department'].value_counts().head(10).index
    
    skill_matrix_filtered = skill_matrix_pivot.loc[top_depts, top_courses]
    
    # Training count matrix
    count_matrix = training_df.groupby(['department', 'course']).size().reset_index()
    count_matrix.columns = ['department', 'course', 'count']
    count_matrix_pivot = count_matrix.pivot(index='department', columns='course', values='count')
    count_matrix_filtered = count_matrix_pivot.loc[top_depts, top_courses]
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=('Skill Matrix - Average Post Scores', 'Training Count Matrix'),
        specs=[[{"type": "heatmap"}],
               [{"type": "heatmap"}]],
        vertical_spacing=0.15
    )
    
    # Plot 1: Skill matrix heatmap
    if not skill_matrix_filtered.empty:
        fig.add_trace(
            go.Heatmap(z=skill_matrix_filtered.values,
                      x=skill_matrix_filtered.columns,
                      y=skill_matrix_filtered.index,
                      colorscale='RdYlGn',
                      text=skill_matrix_filtered.values.round(1),
                      texttemplate='%{text}',
                      textfont={"size": 8},
                      colorbar=dict(title="Avg Score", x=1.02)),
            row=1, col=1
        )
    
    # Plot 2: Training count matrix
    if not count_matrix_filtered.empty:
        fig.add_trace(
            go.Heatmap(z=count_matrix_filtered.values,
                      x=count_matrix_filtered.columns,
                      y=count_matrix_filtered.index,
                      colorscale='Blues',
                      text=count_matrix_filtered.values,
                      texttemplate='%{text}',
                      textfont={"size": 8},
                      colorbar=dict(title="Count", x=1.02)),
            row=2, col=1
        )
    
    # Update axes
    fig.update_xaxes(title_text="Course", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Department", row=1, col=1)
    fig.update_xaxes(title_text="Course", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Department", row=2, col=1)
    
    fig.update_layout(height=1000, title_text="Skill Matrix Chart", showlegend=False)
    fig.write_html(f'{charts_dir}/training_6_skill_matrix.html')
    print(f"  ✓ Saved: {charts_dir}/training_6_skill_matrix.html")


def create_all_training_charts():
    """Generate all training database charts."""
    print("\n" + "="*50)
    print("GENERATING TRAINING DATABASE CHARTS")
    print("="*50)
    
    try:
        create_training_completion_summary()
        create_skill_gap_analysis()
        create_expiry_reminders()
        create_training_kpi_dashboard()
        create_training_calendar()
        create_skill_matrix_chart()
        
        print("\nAll Training Database visualizations completed! 🎉")
        
        # Print summary statistics
        training_df = load_training_data()
        print("\n" + "="*50)
        print("TRAINING DATABASE SUMMARY STATISTICS")
        print("="*50)
        
        total_trainings = len(training_df)
        unique_employees = training_df['employee_id'].nunique()
        unique_courses = training_df['course'].nunique()
        effectiveness = training_df['effectiveness'].mean() if 'effectiveness' in training_df.columns else 0
        
        today = pd.Timestamp.now()
        expired_count = len(training_df[training_df['cert_expiry'] < today])
        expires_soon_count = len(training_df[(training_df['cert_expiry'] >= today) & 
                                            (training_df['cert_expiry'] <= today + pd.Timedelta(days=90))])
        
        print(f"Total Trainings: {total_trainings}")
        print(f"Unique Employees Trained: {unique_employees}")
        print(f"Unique Courses: {unique_courses}")
        print(f"Average Effectiveness (Post - Pre): {effectiveness:.2f}")
        print(f"Expired Certifications: {expired_count}")
        print(f"Expiring Soon (90 days): {expires_soon_count}")
        
        print(f"\nTop 5 Departments by Training Count:")
        print(training_df['department'].value_counts().head(5))
        
        print(f"\nTop 5 Courses:")
        print(training_df['course'].value_counts().head(5))
        
    except Exception as e:
        print(f"Error generating training charts: {str(e)}")
        raise


# ============================================================================
# PPE (ASSETS & PPE) CHARTING FUNCTIONS
# ============================================================================

def load_ppe_data():
    """Load PPE data from CSV files."""
    # Try different possible paths for PPE data
    possible_paths = [
        'Generated/extracted_tables/Sheet1/table_1.csv',
        'Generated/extracted_tables/PPE/table_1.csv',
        'Generated/extracted_tables/Assets_PPE/table_1.csv'
    ]
    
    ppe_df = None
    for path in possible_paths:
        try:
            ppe_df = pd.read_csv(path)
            break
        except FileNotFoundError:
            continue
    
    if ppe_df is None:
        raise FileNotFoundError("PPE data file not found in expected locations")
    
    # Convert date columns
    ppe_df['purchase_date'] = pd.to_datetime(ppe_df['purchase_date'], errors='coerce')
    ppe_df['issue_date'] = pd.to_datetime(ppe_df['issue_date'], errors='coerce')
    ppe_df['next_delivery_due'] = pd.to_datetime(ppe_df['next_delivery_due'], errors='coerce')
    
    # Calculate utilization % = Issued / Purchased × 100
    ppe_df['utilization_pct'] = (ppe_df['quantity_issued'] / ppe_df['quantity_purchased'] * 100).fillna(0)
    
    return ppe_df


def create_ppe_stock_summary():
    """Create stock summary by PPE type dashboard."""
    ppe_df = load_ppe_data()
    
    # Stock summary by PPE type
    stock_by_type = ppe_df.groupby('ppe_item').agg({
        'quantity_purchased': 'sum',
        'quantity_issued': 'sum',
        'balance_stock': 'sum'
    }).reset_index()
    stock_by_type.columns = ['PPE_Item', 'Total_Purchased', 'Total_Issued', 'Total_Balance']
    
    # Reorder alerts
    reorder_items = ppe_df[ppe_df['reorder_flag'] == 'Reorder Needed']
    reorder_by_type = reorder_items.groupby('ppe_item').agg({
        'balance_stock': 'sum',
        'ppe_id': 'count'
    }).reset_index()
    reorder_by_type.columns = ['PPE_Item', 'Balance_Stock', 'Reorder_Count']
    
    # Usage level distribution
    usage_level_counts = ppe_df['usage_level'].value_counts()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Stock Summary by PPE Type', 'Reorder Alerts by Type',
                       'Usage Level Distribution', 'Balance Stock by Type'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "pie"}, {"type": "bar"}]]
    )
    
    # Plot 1: Stock summary by type
    fig.add_trace(
        go.Bar(x=stock_by_type['PPE_Item'], y=stock_by_type['Total_Purchased'],
               name='Purchased', marker_color='lightblue'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=stock_by_type['PPE_Item'], y=stock_by_type['Total_Issued'],
               name='Issued', marker_color='lightgreen'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=stock_by_type['PPE_Item'], y=stock_by_type['Total_Balance'],
               name='Balance', marker_color='lightcoral'),
        row=1, col=1
    )
    
    # Plot 2: Reorder alerts
    if not reorder_by_type.empty:
        fig.add_trace(
            go.Bar(x=reorder_by_type['PPE_Item'], y=reorder_by_type['Balance_Stock'],
                   marker_color='orange', name='Reorder Needed'),
            row=1, col=2
        )
    
    # Plot 3: Usage level distribution
    fig.add_trace(
        go.Pie(labels=usage_level_counts.index, values=usage_level_counts.values,
               name="Usage Level", textinfo='label+percent'),
        row=2, col=1
    )
    
    # Plot 4: Balance stock by type
    fig.add_trace(
        go.Bar(x=stock_by_type['PPE_Item'], y=stock_by_type['Total_Balance'],
               marker_color='skyblue', name='Balance Stock'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="PPE Item", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Quantity", row=1, col=1)
    fig.update_xaxes(title_text="PPE Item", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Balance Stock", row=1, col=2)
    fig.update_xaxes(title_text="PPE Item", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Balance Stock", row=2, col=2)
    
    fig.update_layout(height=900, title_text="PPE Stock Summary Dashboard", barmode='group')
    fig.write_html(f'{charts_dir}/ppe_1_stock_summary.html')
    print(f"  ✓ Saved: {charts_dir}/ppe_1_stock_summary.html")


def create_ppe_usage_vs_purchase():
    """Create usage vs purchase chart."""
    ppe_df = load_ppe_data()
    
    # Usage vs Purchase by type
    usage_purchase = ppe_df.groupby('ppe_item').agg({
        'quantity_purchased': 'sum',
        'quantity_issued': 'sum',
        'utilization_pct': 'mean'
    }).reset_index()
    usage_purchase.columns = ['PPE_Item', 'Purchased', 'Issued', 'Avg_Utilization']
    
    # Usage vs Purchase by department
    dept_usage = ppe_df.groupby('department').agg({
        'quantity_purchased': 'sum',
        'quantity_issued': 'sum'
    }).reset_index()
    dept_usage.columns = ['Department', 'Purchased', 'Issued']
    dept_usage['Utilization_Pct'] = (dept_usage['Issued'] / dept_usage['Purchased'] * 100).fillna(0)
    
    # Monthly trends
    ppe_df['purchase_month'] = ppe_df['purchase_date'].dt.to_period('M').astype(str)
    monthly_purchase = ppe_df.groupby('purchase_month')['quantity_purchased'].sum().reset_index()
    monthly_purchase.columns = ['Month', 'Purchased']
    
    ppe_df['issue_month'] = ppe_df['issue_date'].dt.to_period('M').astype(str)
    monthly_issue = ppe_df.groupby('issue_month')['quantity_issued'].sum().reset_index()
    monthly_issue.columns = ['Month', 'Issued']
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Usage vs Purchase by PPE Type', 'Utilization % by Type',
                       'Usage vs Purchase by Department', 'Monthly Purchase vs Issue Trends'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "scatter"}]]
    )
    
    # Plot 1: Usage vs Purchase by type
    fig.add_trace(
        go.Bar(x=usage_purchase['PPE_Item'], y=usage_purchase['Purchased'],
               name='Purchased', marker_color='lightblue'),
        row=1, col=1
    )
    fig.add_trace(
        go.Bar(x=usage_purchase['PPE_Item'], y=usage_purchase['Issued'],
               name='Issued', marker_color='lightgreen'),
        row=1, col=1
    )
    
    # Plot 2: Utilization % by type
    fig.add_trace(
        go.Bar(x=usage_purchase['PPE_Item'], y=usage_purchase['Avg_Utilization'],
               marker_color='coral', name='Utilization %'),
        row=1, col=2
    )
    
    # Plot 3: Usage vs Purchase by department
    fig.add_trace(
        go.Bar(x=dept_usage['Department'], y=dept_usage['Purchased'],
               name='Purchased', marker_color='lightblue'),
        row=2, col=1
    )
    fig.add_trace(
        go.Bar(x=dept_usage['Department'], y=dept_usage['Issued'],
               name='Issued', marker_color='lightgreen'),
        row=2, col=1
    )
    
    # Plot 4: Monthly trends
    if not monthly_purchase.empty and not monthly_issue.empty:
        fig.add_trace(
            go.Scatter(x=monthly_purchase['Month'], y=monthly_purchase['Purchased'],
                      mode='lines+markers', name='Purchased',
                      marker=dict(symbol='circle', size=8)),
            row=2, col=2
        )
        fig.add_trace(
            go.Scatter(x=monthly_issue['Month'], y=monthly_issue['Issued'],
                      mode='lines+markers', name='Issued',
                      marker=dict(symbol='square', size=8)),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="PPE Item", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Quantity", row=1, col=1)
    fig.update_xaxes(title_text="PPE Item", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Utilization %", row=1, col=2)
    fig.update_xaxes(title_text="Department", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Quantity", row=2, col=1)
    fig.update_xaxes(title_text="Month", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Quantity", row=2, col=2)
    
    fig.update_layout(height=900, title_text="PPE Usage vs Purchase Analysis", barmode='group')
    fig.write_html(f'{charts_dir}/ppe_2_usage_vs_purchase.html')
    print(f"  ✓ Saved: {charts_dir}/ppe_2_usage_vs_purchase.html")


def create_ppe_reorder_alerts():
    """Create reorder alerts dashboard."""
    ppe_df = load_ppe_data()
    
    # Reorder alerts
    reorder_items = ppe_df[ppe_df['reorder_flag'] == 'Reorder Needed'].copy()
    
    # Low stock threshold (assuming < 20% of average purchase is low)
    avg_purchase_by_type = ppe_df.groupby('ppe_item')['quantity_purchased'].mean()
    ppe_df['low_stock_threshold'] = ppe_df['ppe_item'].map(avg_purchase_by_type) * 0.2
    ppe_df['is_low_stock'] = ppe_df['balance_stock'] < ppe_df['low_stock_threshold']
    
    low_stock_items = ppe_df[ppe_df['is_low_stock']].copy()
    
    # Reorder by department
    reorder_by_dept = reorder_items.groupby('department').size().reset_index()
    reorder_by_dept.columns = ['Department', 'Reorder_Count']
    
    # Reorder by PPE type
    reorder_by_type = reorder_items.groupby('ppe_item').agg({
        'balance_stock': 'sum',
        'ppe_id': 'count'
    }).reset_index()
    reorder_by_type.columns = ['PPE_Item', 'Balance_Stock', 'Count']
    
    # Upcoming delivery due
    today = pd.Timestamp.now()
    upcoming_delivery = ppe_df[ppe_df['next_delivery_due'] >= today].copy()
    upcoming_delivery = upcoming_delivery.sort_values('next_delivery_due').head(20)
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Reorder Alerts by Department', 'Reorder Alerts by PPE Type',
                       'Low Stock Items', 'Upcoming Delivery Due (Next 20)'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "table"}]]
    )
    
    # Plot 1: Reorder by department
    if not reorder_by_dept.empty:
        fig.add_trace(
            go.Bar(x=reorder_by_dept['Department'], y=reorder_by_dept['Reorder_Count'],
                   marker_color='orange', name='Reorder Count'),
            row=1, col=1
        )
    
    # Plot 2: Reorder by type
    if not reorder_by_type.empty:
        fig.add_trace(
            go.Bar(x=reorder_by_type['PPE_Item'], y=reorder_by_type['Balance_Stock'],
                   marker_color='coral', name='Balance Stock'),
            row=1, col=2
        )
    
    # Plot 3: Low stock items
    if not low_stock_items.empty:
        low_stock_summary = low_stock_items.groupby('ppe_item')['balance_stock'].sum().reset_index()
        low_stock_summary.columns = ['PPE_Item', 'Balance_Stock']
        fig.add_trace(
            go.Bar(x=low_stock_summary['PPE_Item'], y=low_stock_summary['Balance_Stock'],
                   marker_color='red', name='Low Stock'),
            row=2, col=1
        )
    
    # Plot 4: Upcoming delivery table
    if not upcoming_delivery.empty:
        delivery_table = upcoming_delivery[['ppe_item', 'department', 'next_delivery_due', 'balance_stock']].copy()
        delivery_table['next_delivery_due'] = delivery_table['next_delivery_due'].dt.strftime('%Y-%m-%d')
        delivery_table.columns = ['PPE Item', 'Department', 'Delivery Due', 'Balance Stock']
        fig.add_trace(
            go.Table(
                header=dict(values=list(delivery_table.columns),
                            fill_color='paleturquoise',
                            align='left'),
                cells=dict(values=[delivery_table[col] for col in delivery_table.columns],
                          fill_color='lavender',
                          align='left')
            ),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Department", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Reorder Count", row=1, col=1)
    fig.update_xaxes(title_text="PPE Item", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Balance Stock", row=1, col=2)
    fig.update_xaxes(title_text="PPE Item", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Balance Stock", row=2, col=1)
    
    fig.update_layout(height=900, title_text="PPE Reorder Alerts Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/ppe_3_reorder_alerts.html')
    print(f"  ✓ Saved: {charts_dir}/ppe_3_reorder_alerts.html")


def create_ppe_kpi_dashboard():
    """Create PPE KPI dashboard."""
    ppe_df = load_ppe_data()
    
    # Calculate KPIs
    total_purchased = ppe_df['quantity_purchased'].sum()
    total_issued = ppe_df['quantity_issued'].sum()
    total_balance = ppe_df['balance_stock'].sum()
    
    # Utilization % = Issued / Purchased × 100
    utilization_pct = (total_issued / total_purchased * 100) if total_purchased > 0 else 0
    
    # Stock Turnover Rate (Issued / Average Stock)
    avg_stock = (total_purchased + total_balance) / 2 if (total_purchased + total_balance) > 0 else 1
    stock_turnover = total_issued / avg_stock if avg_stock > 0 else 0
    
    # Low Stock Alerts
    avg_purchase_by_type = ppe_df.groupby('ppe_item')['quantity_purchased'].mean()
    ppe_df['low_stock_threshold'] = ppe_df['ppe_item'].map(avg_purchase_by_type) * 0.2
    ppe_df['is_low_stock'] = ppe_df['balance_stock'] < ppe_df['low_stock_threshold']
    low_stock_count = ppe_df['is_low_stock'].sum()
    reorder_needed_count = len(ppe_df[ppe_df['reorder_flag'] == 'Reorder Needed'])
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Utilization %', 'Stock Turnover Rate',
                       'Low Stock Alerts', 'KPIs Summary'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "table"}]]
    )
    
    # Plot 1: Utilization %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=utilization_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Utilization (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 80], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Stock Turnover Rate
    fig.add_trace(
        go.Indicator(
            mode="number+gauge",
            value=stock_turnover,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Stock Turnover Rate"},
            gauge={
                'axis': {'range': [0, max(stock_turnover * 2, 5)]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, stock_turnover], 'color': "lightgray"}
                ]
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Low Stock Alerts
    fig.add_trace(
        go.Indicator(
            mode="number",
            value=low_stock_count,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Low Stock Alerts"},
            number={'font': {'color': 'red' if low_stock_count > 10 else 'orange'}}
        ),
        row=2, col=1
    )
    
    # Plot 4: KPIs summary table
    kpi_data = {
        'Metric': ['Total Purchased', 'Total Issued', 'Total Balance', 'Utilization %', 'Stock Turnover Rate', 'Low Stock Alerts', 'Reorder Needed Count'],
        'Value': [
            total_purchased,
            total_issued,
            total_balance,
            f"{utilization_pct:.2f}%",
            f"{stock_turnover:.2f}",
            low_stock_count,
            reorder_needed_count
        ]
    }
    kpi_df = pd.DataFrame(kpi_data)

    register_kpi_snapshot(
        component="PPE",
        table_name="PPE KPI Summary",
        df=kpi_df,
        ui_tiles={
            "total_purchased": float(total_purchased),
            "total_issued": float(total_issued),
            "total_balance": float(total_balance),
            "utilization_pct": round(float(utilization_pct), 2),
            "stock_turnover_rate": round(float(stock_turnover), 2),
            "low_stock_alerts": int(low_stock_count),
            "reorder_needed_count": int(reorder_needed_count),
        }
    )
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_df.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_df['Metric'], kpi_df['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    fig.update_layout(height=900, title_text="PPE KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/ppe_4_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/ppe_4_kpi_dashboard.html")


def create_ppe_stock_tracker():
    """Create PPE stock tracker dashboard."""
    ppe_df = load_ppe_data()
    
    # Stock tracker by department
    dept_stock = ppe_df.groupby('department').agg({
        'balance_stock': 'sum',
        'quantity_issued': 'sum',
        'quantity_purchased': 'sum'
    }).reset_index()
    dept_stock.columns = ['Department', 'Balance', 'Issued', 'Purchased']
    
    # Consumption trend by department (monthly)
    ppe_df['issue_month'] = ppe_df['issue_date'].dt.to_period('M').astype(str)
    monthly_consumption = ppe_df.groupby(['issue_month', 'department'])['quantity_issued'].sum().reset_index()
    monthly_consumption.columns = ['Month', 'Department', 'Consumption']
    
    # Top consuming departments
    top_depts = dept_stock.nlargest(10, 'Issued')
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Stock Tracker by Department', 'Consumption Trend by Department',
                       'Top 10 Consuming Departments', 'Stock Status by Department'),
        specs=[[{"type": "bar"}, {"type": "scatter"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Stock tracker by department
    fig.add_trace(
        go.Bar(x=dept_stock['Department'], y=dept_stock['Balance'],
               marker_color='lightblue', name='Balance Stock'),
        row=1, col=1
    )
    
    # Plot 2: Consumption trend by department
    top_dept_names = top_depts['Department'].head(5).tolist()
    for dept in top_dept_names:
        dept_data = monthly_consumption[monthly_consumption['Department'] == dept]
        if not dept_data.empty:
            fig.add_trace(
                go.Scatter(x=dept_data['Month'], y=dept_data['Consumption'],
                          mode='lines+markers', name=dept,
                          marker=dict(size=6)),
                row=1, col=2
            )
    
    # Plot 3: Top consuming departments
    fig.add_trace(
        go.Bar(x=top_depts['Department'], y=top_depts['Issued'],
               marker_color='lightgreen', name='Issued'),
        row=2, col=1
    )
    
    # Plot 4: Stock status by department
    fig.add_trace(
        go.Bar(x=dept_stock['Department'], y=dept_stock['Balance'],
               marker_color='skyblue', name='Balance'),
        row=2, col=2
    )
    fig.add_trace(
        go.Bar(x=dept_stock['Department'], y=dept_stock['Issued'],
               marker_color='lightcoral', name='Issued'),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Department", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Balance Stock", row=1, col=1)
    fig.update_xaxes(title_text="Month", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Consumption", row=1, col=2)
    fig.update_xaxes(title_text="Department", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Issued", row=2, col=1)
    fig.update_xaxes(title_text="Department", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Quantity", row=2, col=2)
    
    fig.update_layout(height=900, title_text="PPE Stock Tracker Dashboard", barmode='group')
    fig.write_html(f'{charts_dir}/ppe_5_stock_tracker.html')
    print(f"  ✓ Saved: {charts_dir}/ppe_5_stock_tracker.html")


def create_all_ppe_charts():
    """Generate all PPE charts."""
    print("\n" + "="*50)
    print("GENERATING PPE (ASSETS & PPE) CHARTS")
    print("="*50)
    
    try:
        create_ppe_stock_summary()
        create_ppe_usage_vs_purchase()
        create_ppe_reorder_alerts()
        create_ppe_kpi_dashboard()
        create_ppe_stock_tracker()
        
        print("\nAll PPE visualizations completed! 🎉")
        
        # Print summary statistics
        ppe_df = load_ppe_data()
        print("\n" + "="*50)
        print("PPE SUMMARY STATISTICS")
        print("="*50)
        
        total_purchased = ppe_df['quantity_purchased'].sum()
        total_issued = ppe_df['quantity_issued'].sum()
        total_balance = ppe_df['balance_stock'].sum()
        utilization_pct = (total_issued / total_purchased * 100) if total_purchased > 0 else 0
        reorder_count = len(ppe_df[ppe_df['reorder_flag'] == 'Reorder Needed'])
        
        print(f"Total Purchased: {total_purchased}")
        print(f"Total Issued: {total_issued}")
        print(f"Total Balance: {total_balance}")
        print(f"Utilization %: {utilization_pct:.2f}%")
        print(f"Reorder Needed Count: {reorder_count}")
        
        print(f"\nTop 5 PPE Items by Purchase:")
        print(ppe_df.groupby('ppe_item')['quantity_purchased'].sum().sort_values(ascending=False).head(5))
        
        print(f"\nTop 5 Departments by Consumption:")
        print(ppe_df.groupby('department')['quantity_issued'].sum().sort_values(ascending=False).head(5))
        
    except Exception as e:
        print(f"Error generating PPE charts: {str(e)}")
        raise


# ============================================================================
# CORRECTIVE ACTIONS & RCA CHARTING FUNCTIONS
# ============================================================================

def load_corrective_actions_data():
    """Load corrective actions and RCA data from CSV files."""
    # Try different possible paths for corrective actions data
    possible_paths = [
        'Generated/extracted_tables/Corrective_Actions_RCA/table_1.csv',
        'Generated/extracted_tables/Corrective_Actions/table_1.csv',
        'Generated/extracted_tables/RCA/table_1.csv',
        'Generated/extracted_tables/Actions/table_1.csv'
    ]
    
    actions_df = None
    for path in possible_paths:
        try:
            actions_df = pd.read_csv(path)
            # Check if this looks like corrective actions data
            if any(col in actions_df.columns for col in ['action_id', 'Action ID', 'status', 'Status', 'due_date', 'Due Date', 'owner', 'priority']):
                break
        except FileNotFoundError:
            continue
    
    if actions_df is None:
        raise FileNotFoundError("Corrective Actions data file not found in expected locations")
    
    # Normalize column names (handle case variations)
    actions_df.columns = actions_df.columns.str.lower().str.replace(' ', '_')
    
    # Convert date columns
    date_cols = ['due_date', 'due_dt', 'start_date', 'start_dt', 'closed_date', 'created_date', 'created date']
    for col in date_cols:
        if col in actions_df.columns:
            actions_df[col] = pd.to_datetime(actions_df[col], errors='coerce')
    
    # Calculate closure time if both start and closed dates exist
    if 'start_dt' in actions_df.columns and 'closed_date' in actions_df.columns:
        actions_df['closure_time_days'] = (actions_df['closed_date'] - actions_df['start_dt']).dt.days
    elif 'start_date' in actions_df.columns and 'closed_date' in actions_df.columns:
        actions_df['closure_time_days'] = (actions_df['closed_date'] - actions_df['start_date']).dt.days
    
    # Calculate overdue status
    if 'due_dt' in actions_df.columns:
        today = pd.Timestamp.now()
        actions_df['days_until_due'] = (actions_df['due_dt'] - today).dt.days
        actions_df['is_overdue'] = (actions_df['days_until_due'] < 0) & (actions_df['status'].str.contains('Open|open|In Progress|in progress', case=False, na=False))
    elif 'due_date' in actions_df.columns:
        today = pd.Timestamp.now()
        actions_df['days_until_due'] = (actions_df['due_date'] - today).dt.days
        actions_df['is_overdue'] = (actions_df['days_until_due'] < 0) & (actions_df['status'].str.contains('Open|open|In Progress|in progress', case=False, na=False))
    
    return actions_df


def create_corrective_actions_summary():
    """Create open vs closed actions summary dashboard."""
    actions_df = load_corrective_actions_data()
    
    # Status summary
    if 'status' in actions_df.columns:
        status_counts = actions_df['status'].value_counts()
        open_count = len(actions_df[actions_df['status'].str.contains('Open|open', case=False, na=False)])
        closed_count = len(actions_df[actions_df['status'].str.contains('Closed|closed|Completed|completed', case=False, na=False)])
        in_progress_count = len(actions_df[actions_df['status'].str.contains('In Progress|in progress|InProgress', case=False, na=False)])
    else:
        status_counts = pd.Series()
        open_count = 0
        closed_count = 0
        in_progress_count = 0
    
    total_actions = len(actions_df)
    action_closure_pct = (closed_count / total_actions * 100) if total_actions > 0 else 0
    
    # Actions by owner
    if 'owner' in actions_df.columns:
        actions_by_owner = actions_df['owner'].value_counts().head(10)
    else:
        actions_by_owner = pd.Series()
    
    # Overdue actions
    if 'is_overdue' in actions_df.columns:
        overdue_count = actions_df['is_overdue'].sum()
        overdue_actions = actions_df[actions_df['is_overdue']].copy()
    else:
        overdue_count = 0
        overdue_actions = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Open vs Closed Actions', 'Action Closure %',
                       'Actions by Owner', 'Overdue Actions Summary'),
        specs=[[{"type": "bar"}, {"type": "indicator"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Open vs Closed
    fig.add_trace(
        go.Bar(x=['Open', 'In Progress', 'Closed'],
               y=[open_count, in_progress_count, closed_count],
               marker_color=['#ff6b6b', '#ffa500', '#51cf66'],
               name='Action Status'),
        row=1, col=1
    )
    
    # Plot 2: Action Closure %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=action_closure_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Action Closure (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Actions by owner
    if not actions_by_owner.empty:
        fig.add_trace(
            go.Bar(x=actions_by_owner.index, y=actions_by_owner.values,
                   marker_color='lightblue', name='Actions Count'),
            row=2, col=1
        )
    
    # Plot 4: Overdue summary
    if not overdue_actions.empty and 'priority' in overdue_actions.columns:
        overdue_by_priority = overdue_actions['priority'].value_counts()
        fig.add_trace(
            go.Bar(x=overdue_by_priority.index, y=overdue_by_priority.values,
                   marker_color='coral', name='Overdue Count'),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Status", row=1, col=1)
    fig.update_yaxes(title_text="Count", row=1, col=1)
    fig.update_xaxes(title_text="Owner", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Actions Count", row=2, col=1)
    fig.update_xaxes(title_text="Priority", row=2, col=2)
    fig.update_yaxes(title_text="Overdue Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Corrective Actions Summary Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/rca_1_actions_summary.html')
    print(f"  ✓ Saved: {charts_dir}/rca_1_actions_summary.html")


def create_rca_closure_tracking():
    """Create SLA-based closure tracking and RCA closure gauge."""
    actions_df = load_corrective_actions_data()
    
    # Calculate closure metrics
    total_actions = len(actions_df)
    if 'status' in actions_df.columns:
        closed_count = len(actions_df[actions_df['status'].str.contains('Closed|closed|Completed|completed', case=False, na=False)])
    else:
        closed_count = 0
    
    # Overdue actions
    if 'is_overdue' in actions_df.columns:
        overdue_count = actions_df['is_overdue'].sum()
    else:
        overdue_count = 0
    
    # Average closure time
    if 'closure_time_days' in actions_df.columns:
        avg_closure_time = actions_df['closure_time_days'].mean()
        closed_actions = actions_df[actions_df['closure_time_days'].notna()].copy()
    else:
        avg_closure_time = 0
        closed_actions = pd.DataFrame()
    
    # Overdue trend (if we have due dates)
    if 'due_dt' in actions_df.columns:
        actions_df['due_month'] = actions_df['due_dt'].dt.to_period('M').astype(str)
        monthly_overdue = actions_df[actions_df['is_overdue']].groupby('due_month').size().reset_index()
        monthly_overdue.columns = ['Month', 'Overdue_Count']
    elif 'due_date' in actions_df.columns:
        actions_df['due_month'] = actions_df['due_date'].dt.to_period('M').astype(str)
        monthly_overdue = actions_df[actions_df['is_overdue']].groupby('due_month').size().reset_index()
        monthly_overdue.columns = ['Month', 'Overdue_Count']
    else:
        monthly_overdue = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('RCA Closure Gauge', 'Overdue Actions Count',
                       'Average Closure Time', 'Overdue Trend Chart'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "scatter"}]]
    )
    
    # Plot 1: RCA Closure Gauge
    action_closure_pct = (closed_count / total_actions * 100) if total_actions > 0 else 0
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=action_closure_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "RCA Closure (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Overdue Actions Count
    fig.add_trace(
        go.Indicator(
            mode="number",
            value=overdue_count,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Overdue Actions"},
            number={'font': {'color': 'red' if overdue_count > 0 else 'green'}}
        ),
        row=1, col=2
    )
    
    # Plot 3: Average Closure Time
    fig.add_trace(
        go.Indicator(
            mode="number+gauge",
            value=avg_closure_time,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Avg. Closure Time (Days)"},
            gauge={
                'axis': {'range': [0, max(avg_closure_time * 2, 30)]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, avg_closure_time], 'color': "lightgray"}
                ]
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: Overdue trend
    if not monthly_overdue.empty:
        fig.add_trace(
            go.Scatter(x=monthly_overdue['Month'], y=monthly_overdue['Overdue_Count'],
                      mode='lines+markers', name='Overdue Trend',
                      marker=dict(symbol='circle', size=8, color='red')),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Overdue Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="RCA Closure Tracking Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/rca_2_closure_tracking.html')
    print(f"  ✓ Saved: {charts_dir}/rca_2_closure_tracking.html")


def create_rca_kpi_dashboard():
    """Create Corrective Actions & RCA KPI dashboard."""
    actions_df = load_corrective_actions_data()
    
    # Calculate KPIs
    total_actions = len(actions_df)
    
    if 'status' in actions_df.columns:
        closed_count = len(actions_df[actions_df['status'].str.contains('Closed|closed|Completed|completed', case=False, na=False)])
        open_count = len(actions_df[actions_df['status'].str.contains('Open|open', case=False, na=False)])
    else:
        closed_count = 0
        open_count = 0
    
    # Action Closure % = Closed / Total × 100
    action_closure_pct = (closed_count / total_actions * 100) if total_actions > 0 else 0
    
    # Overdue Actions = Count(>DueDate)
    if 'is_overdue' in actions_df.columns:
        overdue_count = actions_df['is_overdue'].sum()
    else:
        overdue_count = 0
    
    # Avg. Closure Time
    if 'closure_time_days' in actions_df.columns:
        avg_closure_time = actions_df['closure_time_days'].mean()
    else:
        avg_closure_time = 0
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Action Closure %', 'Overdue Actions',
                       'Average Closure Time', 'KPIs Summary'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "table"}]]
    )
    
    # Plot 1: Action Closure %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=action_closure_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Action Closure (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Overdue Actions
    fig.add_trace(
        go.Indicator(
            mode="number",
            value=overdue_count,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Overdue Actions"},
            number={'font': {'color': 'red' if overdue_count > 0 else 'green'}}
        ),
        row=1, col=2
    )
    
    # Plot 3: Average Closure Time
    fig.add_trace(
        go.Indicator(
            mode="number+gauge",
            value=avg_closure_time,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Avg. Closure Time (Days)"},
            gauge={
                'axis': {'range': [0, max(avg_closure_time * 2, 30)]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, avg_closure_time], 'color': "lightgray"}
                ]
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: KPIs summary table
    kpi_data = {
        'Metric': ['Total Actions', 'Open Actions', 'Closed Actions', 'Action Closure %', 'Overdue Actions', 'Avg. Closure Time (Days)'],
        'Value': [
            total_actions,
            open_count,
            closed_count,
            f"{action_closure_pct:.2f}%",
            overdue_count,
            f"{avg_closure_time:.2f}"
        ]
    }
    kpi_df = pd.DataFrame(kpi_data)

    register_kpi_snapshot(
        component="Corrective Actions",
        table_name="Corrective Actions KPI Summary",
        df=kpi_df,
        ui_tiles={
            "total_actions": int(total_actions),
            "open_actions": int(open_count),
            "closed_actions": int(closed_count),
            "action_closure_pct": round(float(action_closure_pct), 2),
            "overdue_actions": int(overdue_count),
            "avg_closure_time_days": round(float(avg_closure_time), 2) if avg_closure_time is not None else None,
        }
    )
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_df.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_df['Metric'], kpi_df['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    fig.update_layout(height=900, title_text="Corrective Actions & RCA KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/rca_3_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/rca_3_kpi_dashboard.html")


def create_all_rca_charts():
    """Generate all Corrective Actions & RCA charts."""
    print("\n" + "="*50)
    print("GENERATING CORRECTIVE ACTIONS & RCA CHARTS")
    print("="*50)
    
    try:
        create_corrective_actions_summary()
        create_rca_closure_tracking()
        create_rca_kpi_dashboard()
        
        print("\nAll Corrective Actions & RCA visualizations completed! 🎉")
        
        # Print summary statistics
        actions_df = load_corrective_actions_data()
        print("\n" + "="*50)
        print("CORRECTIVE ACTIONS & RCA SUMMARY STATISTICS")
        print("="*50)
        
        total_actions = len(actions_df)
        if 'status' in actions_df.columns:
            closed_count = len(actions_df[actions_df['status'].str.contains('Closed|closed|Completed|completed', case=False, na=False)])
            open_count = len(actions_df[actions_df['status'].str.contains('Open|open', case=False, na=False)])
        else:
            closed_count = 0
            open_count = 0
        
        if 'is_overdue' in actions_df.columns:
            overdue_count = actions_df['is_overdue'].sum()
        else:
            overdue_count = 0
        
        print(f"Total Actions: {total_actions}")
        print(f"Open Actions: {open_count}")
        print(f"Closed Actions: {closed_count}")
        print(f"Overdue Actions: {overdue_count}")
        
        if 'status' in actions_df.columns:
            print(f"\nStatus Distribution:")
            print(actions_df['status'].value_counts())
        
    except Exception as e:
        print(f"Error generating Corrective Actions & RCA charts: {str(e)}")
        raise


# ============================================================================
# ENVIRONMENTAL & RESOURCE USE CHARTING FUNCTIONS
# ============================================================================

def load_environmental_data():
    """Load environmental and resource use data from CSV files."""
    # Try different possible paths for environmental data
    possible_paths = [
        'Generated/extracted_tables/Environmental_Data/table_1.csv',
        'Generated/extracted_tables/Monthly_KPIs/table_1.csv',
        'Generated/extracted_tables/Environmental/table_1.csv',
        'Generated/extracted_tables/Resource_Use/table_1.csv'
    ]
    
    env_df = None
    kpi_df = None
    
    # Load Environmental_Data
    for path in possible_paths:
        try:
            test_df = pd.read_csv(path)
            # Check if this looks like Environmental_Data (has date, energy_consumed_kWh, etc.)
            if 'energy_consumed_kWh' in test_df.columns or 'energy_consumed' in test_df.columns:
                env_df = test_df
                break
        except FileNotFoundError:
            continue
    
    # Load Monthly_KPIs
    for path in possible_paths:
        try:
            test_df = pd.read_csv(path)
            # Check if this looks like Monthly_KPIs (has month, energy_kWh_total, etc.)
            if 'energy_kWh_total' in test_df.columns or 'month' in test_df.columns:
                if 'energy_kWh_total' in test_df.columns or 'recycling_rate_pct' in test_df.columns:
                    kpi_df = test_df
                    break
        except FileNotFoundError:
            continue
    
    if env_df is None and kpi_df is None:
        raise FileNotFoundError("Environmental data files not found in expected locations")
    
    # Normalize column names (handle case variations)
    if env_df is not None:
        env_df.columns = env_df.columns.str.lower().str.replace(' ', '_')
        # Convert date columns
        if 'date' in env_df.columns:
            env_df['date'] = pd.to_datetime(env_df['date'], errors='coerce')
        # Calculate total emissions if we have scope1 and scope2
        if 'scope1_emissions_tco2e' in env_df.columns and 'scope2_emissions_tco2e' in env_df.columns:
            env_df['total_emissions'] = env_df['scope1_emissions_tco2e'] + env_df['scope2_emissions_tco2e']
        # Calculate recycling % if we have waste data
        if 'waste_generated_t' in env_df.columns and 'recycled_waste_t' in env_df.columns:
            env_df['recycling_pct'] = (env_df['recycled_waste_t'] / env_df['waste_generated_t'] * 100).fillna(0)
    
    if kpi_df is not None:
        kpi_df.columns = kpi_df.columns.str.lower().str.replace(' ', '_')
        # Convert month column
        if 'month' in kpi_df.columns:
            kpi_df['month'] = pd.to_datetime(kpi_df['month'], errors='coerce')
    
    return env_df, kpi_df


def create_energy_emission_trend():
    """Create energy and emission trend charts."""
    env_df, kpi_df = load_environmental_data()
    
    # Use Monthly_KPIs if available, otherwise aggregate from Environmental_Data
    if kpi_df is not None and 'month' in kpi_df.columns:
        # Energy trend by month
        if 'energy_kwh_total' in kpi_df.columns:
            monthly_energy = kpi_df.groupby('month')['energy_kwh_total'].sum().reset_index()
            monthly_energy.columns = ['Month', 'Energy_kWh']
        else:
            monthly_energy = pd.DataFrame()
        
        # CO2 trend by month
        if 'total_emissions' in kpi_df.columns:
            monthly_co2 = kpi_df.groupby('month')['total_emissions'].sum().reset_index()
            monthly_co2.columns = ['Month', 'CO2_t']
        else:
            monthly_co2 = pd.DataFrame()
    elif env_df is not None and 'date' in env_df.columns:
        # Aggregate from Environmental_Data
        env_df['month'] = env_df['date'].dt.to_period('M').astype(str)
        if 'energy_consumed_kwh' in env_df.columns:
            monthly_energy = env_df.groupby('month')['energy_consumed_kwh'].sum().reset_index()
            monthly_energy.columns = ['Month', 'Energy_kWh']
        else:
            monthly_energy = pd.DataFrame()
        
        if 'total_emissions' in env_df.columns:
            monthly_co2 = env_df.groupby('month')['total_emissions'].sum().reset_index()
            monthly_co2.columns = ['Month', 'CO2_t']
        else:
            monthly_co2 = pd.DataFrame()
    else:
        monthly_energy = pd.DataFrame()
        monthly_co2 = pd.DataFrame()
    
    # Energy by plant
    if kpi_df is not None and 'plant' in kpi_df.columns and 'energy_kwh_total' in kpi_df.columns:
        energy_by_plant = kpi_df.groupby('plant')['energy_kwh_total'].sum().reset_index()
        energy_by_plant.columns = ['Plant', 'Energy_kWh']
    elif env_df is not None and 'plant' in env_df.columns and 'energy_consumed_kwh' in env_df.columns:
        energy_by_plant = env_df.groupby('plant')['energy_consumed_kwh'].sum().reset_index()
        energy_by_plant.columns = ['Plant', 'Energy_kWh']
    else:
        energy_by_plant = pd.DataFrame()
    
    # CO2 by plant
    if kpi_df is not None and 'plant' in kpi_df.columns and 'total_emissions' in kpi_df.columns:
        co2_by_plant = kpi_df.groupby('plant')['total_emissions'].sum().reset_index()
        co2_by_plant.columns = ['Plant', 'CO2_t']
    elif env_df is not None and 'plant' in env_df.columns and 'total_emissions' in env_df.columns:
        co2_by_plant = env_df.groupby('plant')['total_emissions'].sum().reset_index()
        co2_by_plant.columns = ['Plant', 'CO2_t']
    else:
        co2_by_plant = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Energy Trend by Month', 'CO₂ Trend by Month',
                       'Energy by Plant', 'CO₂ by Plant'),
        specs=[[{"type": "scatter"}, {"type": "scatter"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Energy trend
    if not monthly_energy.empty:
        fig.add_trace(
            go.Scatter(x=monthly_energy['Month'], y=monthly_energy['Energy_kWh'],
                      mode='lines+markers', name='Energy (kWh)',
                      marker=dict(symbol='circle', size=8, color='blue')),
            row=1, col=1
        )
    
    # Plot 2: CO2 trend
    if not monthly_co2.empty:
        fig.add_trace(
            go.Scatter(x=monthly_co2['Month'], y=monthly_co2['CO2_t'],
                      mode='lines+markers', name='CO₂ (t)',
                      marker=dict(symbol='square', size=8, color='red')),
            row=1, col=2
        )
    
    # Plot 3: Energy by plant
    if not energy_by_plant.empty:
        fig.add_trace(
            go.Bar(x=energy_by_plant['Plant'], y=energy_by_plant['Energy_kWh'],
                   marker_color='lightblue', name='Energy (kWh)'),
            row=2, col=1
        )
    
    # Plot 4: CO2 by plant
    if not co2_by_plant.empty:
        fig.add_trace(
            go.Bar(x=co2_by_plant['Plant'], y=co2_by_plant['CO2_t'],
                   marker_color='lightcoral', name='CO₂ (t)'),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Energy (kWh)", row=1, col=1)
    fig.update_xaxes(title_text="Month", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="CO₂ (t)", row=1, col=2)
    fig.update_xaxes(title_text="Plant", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Energy (kWh)", row=2, col=1)
    fig.update_xaxes(title_text="Plant", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="CO₂ (t)", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Energy and Emission Trends", showlegend=False)
    fig.write_html(f'{charts_dir}/env_1_energy_emission_trend.html')
    print(f"  ✓ Saved: {charts_dir}/env_1_energy_emission_trend.html")


def create_waste_recycling_summary():
    """Create waste recycling summary dashboard."""
    env_df, kpi_df = load_environmental_data()
    
    # Use Monthly_KPIs if available, otherwise aggregate from Environmental_Data
    if kpi_df is not None and 'month' in kpi_df.columns:
        # Recycling % trend
        if 'recycling_rate_pct' in kpi_df.columns:
            monthly_recycling = kpi_df.groupby('month')['recycling_rate_pct'].mean().reset_index()
            monthly_recycling.columns = ['Month', 'Recycling_Pct']
        else:
            monthly_recycling = pd.DataFrame()
        
        # Waste by plant
        if 'waste_t_total' in kpi_df.columns and 'plant' in kpi_df.columns:
            waste_by_plant = kpi_df.groupby('plant')['waste_t_total'].sum().reset_index()
            waste_by_plant.columns = ['Plant', 'Waste_t']
        else:
            waste_by_plant = pd.DataFrame()
        
        # Recycling % by plant
        if 'recycling_rate_pct' in kpi_df.columns and 'plant' in kpi_df.columns:
            recycling_by_plant = kpi_df.groupby('plant')['recycling_rate_pct'].mean().reset_index()
            recycling_by_plant.columns = ['Plant', 'Recycling_Pct']
        else:
            recycling_by_plant = pd.DataFrame()
    elif env_df is not None and 'date' in env_df.columns:
        # Aggregate from Environmental_Data
        env_df['month'] = env_df['date'].dt.to_period('M').astype(str)
        if 'recycling_pct' in env_df.columns:
            monthly_recycling = env_df.groupby('month')['recycling_pct'].mean().reset_index()
            monthly_recycling.columns = ['Month', 'Recycling_Pct']
        else:
            monthly_recycling = pd.DataFrame()
        
        if 'waste_generated_t' in env_df.columns and 'plant' in env_df.columns:
            waste_by_plant = env_df.groupby('plant')['waste_generated_t'].sum().reset_index()
            waste_by_plant.columns = ['Plant', 'Waste_t']
        else:
            waste_by_plant = pd.DataFrame()
        
        if 'recycling_pct' in env_df.columns and 'plant' in env_df.columns:
            recycling_by_plant = env_df.groupby('plant')['recycling_pct'].mean().reset_index()
            recycling_by_plant.columns = ['Plant', 'Recycling_Pct']
        else:
            recycling_by_plant = pd.DataFrame()
    else:
        monthly_recycling = pd.DataFrame()
        waste_by_plant = pd.DataFrame()
        recycling_by_plant = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Recycling % Trend', 'Waste by Plant',
                       'Recycling % by Plant', 'Waste Summary'),
        specs=[[{"type": "scatter"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "pie"}]]
    )
    
    # Plot 1: Recycling % trend
    if not monthly_recycling.empty:
        fig.add_trace(
            go.Scatter(x=monthly_recycling['Month'], y=monthly_recycling['Recycling_Pct'],
                      mode='lines+markers', name='Recycling %',
                      marker=dict(symbol='circle', size=8, color='green')),
            row=1, col=1
        )
    
    # Plot 2: Waste by plant
    if not waste_by_plant.empty:
        fig.add_trace(
            go.Bar(x=waste_by_plant['Plant'], y=waste_by_plant['Waste_t'],
                   marker_color='orange', name='Waste (t)'),
            row=1, col=2
        )
    
    # Plot 3: Recycling % by plant
    if not recycling_by_plant.empty:
        fig.add_trace(
            go.Bar(x=recycling_by_plant['Plant'], y=recycling_by_plant['Recycling_Pct'],
                   marker_color='lightgreen', name='Recycling %'),
            row=2, col=1
        )
    
    # Plot 4: Waste distribution pie
    if not waste_by_plant.empty:
        fig.add_trace(
            go.Pie(labels=waste_by_plant['Plant'], values=waste_by_plant['Waste_t'],
                   name="Waste Distribution", textinfo='label+percent'),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Recycling %", row=1, col=1)
    fig.update_xaxes(title_text="Plant", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Waste (t)", row=1, col=2)
    fig.update_xaxes(title_text="Plant", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Recycling %", row=2, col=1)
    
    fig.update_layout(height=900, title_text="Waste Recycling Summary Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/env_2_waste_recycling_summary.html')
    print(f"  ✓ Saved: {charts_dir}/env_2_waste_recycling_summary.html")


def create_environmental_kpi_dashboard():
    """Create Environmental & Resource Use KPI dashboard."""
    env_df, kpi_df = load_environmental_data()
    
    # Calculate KPIs
    if kpi_df is not None:
        total_energy = kpi_df['energy_kwh_total'].sum() if 'energy_kwh_total' in kpi_df.columns else 0
        total_co2 = kpi_df['total_emissions'].sum() if 'total_emissions' in kpi_df.columns else 0
        total_waste = kpi_df['waste_t_total'].sum() if 'waste_t_total' in kpi_df.columns else 0
        avg_recycling_pct = kpi_df['recycling_rate_pct'].mean() if 'recycling_rate_pct' in kpi_df.columns else 0
        avg_renewable_pct = kpi_df['avg_renewable_pct'].mean() if 'avg_renewable_pct' in kpi_df.columns else 0
    elif env_df is not None:
        total_energy = env_df['energy_consumed_kwh'].sum() if 'energy_consumed_kwh' in env_df.columns else 0
        total_co2 = env_df['total_emissions'].sum() if 'total_emissions' in env_df.columns else 0
        total_waste = env_df['waste_generated_t'].sum() if 'waste_generated_t' in env_df.columns else 0
        avg_recycling_pct = env_df['recycling_pct'].mean() if 'recycling_pct' in env_df.columns else 0
        avg_renewable_pct = env_df['renewable_energy_%'].mean() if 'renewable_energy_%' in env_df.columns else 0
    else:
        total_energy = 0
        total_co2 = 0
        total_waste = 0
        avg_recycling_pct = 0
        avg_renewable_pct = 0
    
    # Energy Intensity (placeholder - would need production data)
    energy_intensity = 0  # Placeholder
    
    # CO2 Intensity (placeholder - would need production data)
    co2_intensity = 0  # Placeholder
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Recycling %', 'Renewable %',
                       'ESG Score Gauge', 'KPIs Summary'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "table"}]]
    )
    
    # Plot 1: Recycling %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_recycling_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Recycling (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 80], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Renewable %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_renewable_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Renewable (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 30], 'color': "lightgray"},
                    {'range': [30, 70], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 80
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: ESG Score (calculated from multiple factors)
    esg_score = (avg_recycling_pct * 0.3 + avg_renewable_pct * 0.4 + min(100, (100 - (total_co2 / max(total_co2, 1) * 100)) * 0.3)) if total_co2 > 0 else (avg_recycling_pct * 0.5 + avg_renewable_pct * 0.5)
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=esg_score,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "ESG Score"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 50], 'color': "lightgray"},
                    {'range': [50, 80], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 90
                }
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: KPIs summary table
    kpi_data = {
        'Metric': ['Total Energy (kWh)', 'Total CO₂ (t)', 'Total Waste (t)', 'Recycling %', 'Renewable %', 'Energy Intensity', 'CO₂ Intensity', 'ESG Score'],
        'Value': [
            f"{total_energy:,.0f}",
            f"{total_co2:,.2f}",
            f"{total_waste:,.2f}",
            f"{avg_recycling_pct:.2f}%",
            f"{avg_renewable_pct:.2f}%",
            f"{energy_intensity:.2f}" if energy_intensity > 0 else "N/A",
            f"{co2_intensity:.2f}" if co2_intensity > 0 else "N/A",
            f"{esg_score:.2f}"
        ]
    }
    kpi_df_table = pd.DataFrame(kpi_data)

    register_kpi_snapshot(
        component="Environmental",
        table_name="Environmental KPI Summary",
        df=kpi_df_table,
        ui_tiles={
            "total_energy_kwh": float(total_energy),
            "total_co2_tons": float(total_co2),
            "total_waste_tons": float(total_waste),
            "avg_recycling_pct": round(float(avg_recycling_pct), 2),
            "avg_renewable_pct": round(float(avg_renewable_pct), 2),
            "energy_intensity": round(float(energy_intensity), 2) if energy_intensity else None,
            "co2_intensity": round(float(co2_intensity), 2) if co2_intensity else None,
            "esg_score": round(float(esg_score), 2),
        }
    )
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_df_table.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_df_table['Metric'], kpi_df_table['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    fig.update_layout(height=900, title_text="Environmental & Resource Use KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/env_3_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/env_3_kpi_dashboard.html")


def create_co2_reduction_chart():
    """Create CO₂ reduction chart."""
    env_df, kpi_df = load_environmental_data()
    
    # Use Monthly_KPIs if available, otherwise aggregate from Environmental_Data
    if kpi_df is not None and 'month' in kpi_df.columns:
        if 'total_emissions' in kpi_df.columns:
            monthly_co2 = kpi_df.groupby('month')['total_emissions'].sum().reset_index()
            monthly_co2.columns = ['Month', 'CO2_t']
            monthly_co2 = monthly_co2.sort_values('Month')
            
            # Calculate reduction percentage
            if len(monthly_co2) > 1:
                monthly_co2['Reduction_Pct'] = ((monthly_co2['CO2_t'].shift(1) - monthly_co2['CO2_t']) / monthly_co2['CO2_t'].shift(1) * 100).fillna(0)
        else:
            monthly_co2 = pd.DataFrame()
        
        if 'total_emissions' in kpi_df.columns and 'plant' in kpi_df.columns:
            co2_by_plant = kpi_df.groupby('plant')['total_emissions'].sum().reset_index()
            co2_by_plant.columns = ['Plant', 'CO2_t']
        else:
            co2_by_plant = pd.DataFrame()
    elif env_df is not None and 'date' in env_df.columns:
        env_df['month'] = env_df['date'].dt.to_period('M').astype(str)
        if 'total_emissions' in env_df.columns:
            monthly_co2 = env_df.groupby('month')['total_emissions'].sum().reset_index()
            monthly_co2.columns = ['Month', 'CO2_t']
            monthly_co2 = monthly_co2.sort_values('Month')
            
            # Calculate reduction percentage
            if len(monthly_co2) > 1:
                monthly_co2['Reduction_Pct'] = ((monthly_co2['CO2_t'].shift(1) - monthly_co2['CO2_t']) / monthly_co2['CO2_t'].shift(1) * 100).fillna(0)
        else:
            monthly_co2 = pd.DataFrame()
        
        if 'total_emissions' in env_df.columns and 'plant' in env_df.columns:
            co2_by_plant = env_df.groupby('plant')['total_emissions'].sum().reset_index()
            co2_by_plant.columns = ['Plant', 'CO2_t']
        else:
            co2_by_plant = pd.DataFrame()
    else:
        monthly_co2 = pd.DataFrame()
        co2_by_plant = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=('CO₂ Reduction Trend', 'CO₂ by Plant'),
        specs=[[{"type": "scatter"}],
               [{"type": "bar"}]]
    )
    
    # Plot 1: CO2 reduction trend
    if not monthly_co2.empty:
        fig.add_trace(
            go.Scatter(x=monthly_co2['Month'], y=monthly_co2['CO2_t'],
                      mode='lines+markers', name='CO₂ (t)',
                      marker=dict(symbol='circle', size=8, color='red'),
                      line=dict(color='red', width=2)),
            row=1, col=1
        )
        if 'Reduction_Pct' in monthly_co2.columns:
            fig.add_trace(
                go.Scatter(x=monthly_co2['Month'], y=monthly_co2['Reduction_Pct'],
                          mode='lines+markers', name='Reduction %',
                          marker=dict(symbol='square', size=8, color='green'),
                          yaxis='y2'),
                row=1, col=1
            )
    
    # Plot 2: CO2 by plant
    if not co2_by_plant.empty:
        fig.add_trace(
            go.Bar(x=co2_by_plant['Plant'], y=co2_by_plant['CO2_t'],
                   marker_color='lightcoral', name='CO₂ (t)'),
            row=2, col=1
        )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="CO₂ (t)", row=1, col=1)
    fig.update_xaxes(title_text="Plant", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="CO₂ (t)", row=2, col=1)
    
    fig.update_layout(height=700, title_text="CO₂ Reduction Analysis", showlegend=True)
    fig.write_html(f'{charts_dir}/env_4_co2_reduction.html')
    print(f"  ✓ Saved: {charts_dir}/env_4_co2_reduction.html")


def create_all_environmental_charts():
    """Generate all Environmental & Resource Use charts."""
    print("\n" + "="*50)
    print("GENERATING ENVIRONMENTAL & RESOURCE USE CHARTS")
    print("="*50)
    
    try:
        create_energy_emission_trend()
        create_waste_recycling_summary()
        create_environmental_kpi_dashboard()
        create_co2_reduction_chart()
        
        print("\nAll Environmental & Resource Use visualizations completed! 🎉")
        
        # Print summary statistics
        env_df, kpi_df = load_environmental_data()
        print("\n" + "="*50)
        print("ENVIRONMENTAL & RESOURCE USE SUMMARY STATISTICS")
        print("="*50)
        
        if kpi_df is not None:
            total_energy = kpi_df['energy_kwh_total'].sum() if 'energy_kwh_total' in kpi_df.columns else 0
            total_co2 = kpi_df['total_emissions'].sum() if 'total_emissions' in kpi_df.columns else 0
            total_waste = kpi_df['waste_t_total'].sum() if 'waste_t_total' in kpi_df.columns else 0
            avg_recycling_pct = kpi_df['recycling_rate_pct'].mean() if 'recycling_rate_pct' in kpi_df.columns else 0
        elif env_df is not None:
            total_energy = env_df['energy_consumed_kwh'].sum() if 'energy_consumed_kwh' in env_df.columns else 0
            total_co2 = env_df['total_emissions'].sum() if 'total_emissions' in env_df.columns else 0
            total_waste = env_df['waste_generated_t'].sum() if 'waste_generated_t' in env_df.columns else 0
            avg_recycling_pct = env_df['recycling_pct'].mean() if 'recycling_pct' in env_df.columns else 0
        else:
            total_energy = 0
            total_co2 = 0
            total_waste = 0
            avg_recycling_pct = 0
        
        print(f"Total Energy: {total_energy:,.0f} kWh")
        print(f"Total CO₂: {total_co2:,.2f} t")
        print(f"Total Waste: {total_waste:,.2f} t")
        print(f"Average Recycling %: {avg_recycling_pct:.2f}%")
        
        if kpi_df is not None and 'plant' in kpi_df.columns:
            print(f"\nTop 5 Plants by Energy Consumption:")
            print(kpi_df.groupby('plant')['energy_kwh_total'].sum().sort_values(ascending=False).head(5))
        elif env_df is not None and 'plant' in env_df.columns:
            print(f"\nTop 5 Plants by Energy Consumption:")
            print(env_df.groupby('plant')['energy_consumed_kwh'].sum().sort_values(ascending=False).head(5))
        
    except Exception as e:
        print(f"Error generating Environmental & Resource Use charts: {str(e)}")
        raise


# ============================================================================
# SOCIAL & GOVERNANCE CHARTING FUNCTIONS
# ============================================================================

def load_social_governance_data():
    """Load social and governance data from CSV files."""
    # Try different possible paths for social/governance data
    possible_paths = [
        'Generated/extracted_tables/Workforce_Social/table_1.csv',
        'Generated/extracted_tables/Workforce_KPIs_By_Dept/table_1.csv',
        'Generated/extracted_tables/Supplier_Audits/table_1.csv',
        'Generated/extracted_tables/Governance_Metrics/table_1.csv'
    ]
    
    workforce_df = None
    kpi_dept_df = None
    supplier_df = None
    governance_df = None
    
    # Load Workforce_Social
    for path in possible_paths:
        try:
            test_df = pd.read_csv(path)
            if 'employee_id' in test_df.columns or 'employee_survey_score' in test_df.columns:
                workforce_df = test_df
                break
        except FileNotFoundError:
            continue
    
    # Load Workforce_KPIs_By_Dept
    for path in possible_paths:
        try:
            test_df = pd.read_csv(path)
            if 'avg_turnover_pct' in test_df.columns or 'avg_absenteeism_pct' in test_df.columns:
                kpi_dept_df = test_df
                break
        except FileNotFoundError:
            continue
    
    # Load Supplier_Audits
    for path in possible_paths:
        try:
            test_df = pd.read_csv(path)
            if 'supplier_id' in test_df.columns or 'compliance_score_%' in test_df.columns:
                supplier_df = test_df
                break
        except FileNotFoundError:
            continue
    
    # Load Governance_Metrics
    for path in possible_paths:
        try:
            test_df = pd.read_csv(path)
            if 'board_women_%' in test_df.columns or 'whistleblower_reports_count' in test_df.columns:
                governance_df = test_df
                break
        except FileNotFoundError:
            continue
    
    if workforce_df is None and kpi_dept_df is None and supplier_df is None and governance_df is None:
        raise FileNotFoundError("Social & Governance data files not found in expected locations")
    
    # Normalize column names (handle case variations)
    if workforce_df is not None:
        workforce_df.columns = workforce_df.columns.str.lower().str.replace(' ', '_')
    
    if kpi_dept_df is not None:
        kpi_dept_df.columns = kpi_dept_df.columns.str.lower().str.replace(' ', '_')
    
    if supplier_df is not None:
        supplier_df.columns = supplier_df.columns.str.lower().str.replace(' ', '_')
        # Convert date columns
        if 'csr_audit_date' in supplier_df.columns:
            supplier_df['csr_audit_date'] = pd.to_datetime(supplier_df['csr_audit_date'], errors='coerce')
    
    if governance_df is not None:
        governance_df.columns = governance_df.columns.str.lower().str.replace(' ', '_')
        # Convert date columns
        if 'month' in governance_df.columns:
            governance_df['month'] = pd.to_datetime(governance_df['month'], errors='coerce')
        if 'policy_review_date' in governance_df.columns:
            governance_df['policy_review_date'] = pd.to_datetime(governance_df['policy_review_date'], errors='coerce')
    
    return workforce_df, kpi_dept_df, supplier_df, governance_df


def create_workforce_diversity_summary():
    """Create workforce diversity summary dashboard."""
    workforce_df, kpi_dept_df, supplier_df, governance_df = load_social_governance_data()
    
    # Gender distribution
    if workforce_df is not None and 'gender' in workforce_df.columns:
        gender_dist = workforce_df['gender'].value_counts()
    else:
        gender_dist = pd.Series()
    
    # Age group distribution
    if workforce_df is not None and 'age_group' in workforce_df.columns:
        age_dist = workforce_df['age_group'].value_counts()
    else:
        age_dist = pd.Series()
    
    # Department distribution
    if workforce_df is not None and 'dept' in workforce_df.columns:
        dept_dist = workforce_df['dept'].value_counts()
    elif kpi_dept_df is not None and 'dept' in kpi_dept_df.columns:
        dept_dist = kpi_dept_df.set_index('dept')['employees'].to_dict()
        dept_dist = pd.Series(dept_dist)
    else:
        dept_dist = pd.Series()
    
    # Gender by department
    if workforce_df is not None and 'gender' in workforce_df.columns and 'dept' in workforce_df.columns:
        gender_by_dept = pd.crosstab(workforce_df['dept'], workforce_df['gender'])
    else:
        gender_by_dept = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Gender Distribution', 'Age Group Distribution',
                       'Department Distribution', 'Gender by Department'),
        specs=[[{"type": "pie"}, {"type": "pie"}],
               [{"type": "bar"}, {"type": "bar"}]]
    )
    
    # Plot 1: Gender distribution
    if not gender_dist.empty:
        fig.add_trace(
            go.Pie(labels=gender_dist.index, values=gender_dist.values,
                   name="Gender Distribution", textinfo='label+percent'),
            row=1, col=1
        )
    
    # Plot 2: Age group distribution
    if not age_dist.empty:
        fig.add_trace(
            go.Pie(labels=age_dist.index, values=age_dist.values,
                   name="Age Group Distribution", textinfo='label+percent'),
            row=1, col=2
        )
    
    # Plot 3: Department distribution
    if not dept_dist.empty:
        fig.add_trace(
            go.Bar(x=dept_dist.index, y=dept_dist.values,
                   marker_color='lightblue', name='Employees'),
            row=2, col=1
        )
    
    # Plot 4: Gender by department
    if not gender_by_dept.empty:
        for gender in gender_by_dept.columns:
            fig.add_trace(
                go.Bar(x=gender_by_dept.index, y=gender_by_dept[gender],
                       name=gender),
                row=2, col=2
            )
    
    # Update axes
    fig.update_xaxes(title_text="Department", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Employees", row=2, col=1)
    fig.update_xaxes(title_text="Department", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Workforce Diversity Summary Dashboard", showlegend=True)
    fig.write_html(f'{charts_dir}/social_1_workforce_diversity.html')
    print(f"  ✓ Saved: {charts_dir}/social_1_workforce_diversity.html")


def create_policy_compliance_report():
    """Create policy compliance report dashboard."""
    workforce_df, kpi_dept_df, supplier_df, governance_df = load_social_governance_data()
    
    # Policy compliance by month
    if governance_df is not None and 'month' in governance_df.columns:
        if 'policy_review_date' in governance_df.columns:
            governance_df['policy_compliant'] = governance_df['policy_review_date'].notna()
            monthly_compliance = governance_df.groupby('month')['policy_compliant'].sum().reset_index()
            monthly_compliance.columns = ['Month', 'Compliant_Count']
        else:
            monthly_compliance = pd.DataFrame()
        
        # Whistleblower reports
        if 'whistleblower_reports_count' in governance_df.columns:
            monthly_whistleblower = governance_df.groupby('month')['whistleblower_reports_count'].sum().reset_index()
            monthly_whistleblower.columns = ['Month', 'Reports_Count']
        else:
            monthly_whistleblower = pd.DataFrame()
        
        # Closed reports
        if 'closed_reports_count' in governance_df.columns:
            monthly_closed = governance_df.groupby('month')['closed_reports_count'].sum().reset_index()
            monthly_closed.columns = ['Month', 'Closed_Count']
        else:
            monthly_closed = pd.DataFrame()
    else:
        monthly_compliance = pd.DataFrame()
        monthly_whistleblower = pd.DataFrame()
        monthly_closed = pd.DataFrame()
    
    # Board diversity
    if governance_df is not None:
        if 'board_women_%' in governance_df.columns:
            avg_women_pct = governance_df['board_women_%'].mean()
        else:
            avg_women_pct = 0
        
        if 'board_minority_%' in governance_df.columns:
            avg_minority_pct = governance_df['board_minority_%'].mean()
        else:
            avg_minority_pct = 0
    else:
        avg_women_pct = 0
        avg_minority_pct = 0
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Policy Compliance Trend', 'Whistleblower Reports Trend',
                       'Board Diversity', 'Policy Compliance Summary'),
        specs=[[{"type": "scatter"}, {"type": "scatter"}],
               [{"type": "indicator"}, {"type": "table"}]]
    )
    
    # Plot 1: Policy compliance trend
    if not monthly_compliance.empty:
        fig.add_trace(
            go.Scatter(x=monthly_compliance['Month'], y=monthly_compliance['Compliant_Count'],
                      mode='lines+markers', name='Compliant Policies',
                      marker=dict(symbol='circle', size=8, color='green')),
            row=1, col=1
        )
    
    # Plot 2: Whistleblower reports trend
    if not monthly_whistleblower.empty:
        fig.add_trace(
            go.Scatter(x=monthly_whistleblower['Month'], y=monthly_whistleblower['Reports_Count'],
                      mode='lines+markers', name='Reports',
                      marker=dict(symbol='square', size=8, color='blue')),
            row=1, col=1
        )
        if not monthly_closed.empty:
            fig.add_trace(
                go.Scatter(x=monthly_closed['Month'], y=monthly_closed['Closed_Count'],
                          mode='lines+markers', name='Closed Reports',
                          marker=dict(symbol='triangle-up', size=8, color='red')),
                row=1, col=2
            )
    
    # Plot 3: Board diversity
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_women_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Board Women (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 30], 'color': "lightgray"},
                    {'range': [30, 50], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 50
                }
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: Policy compliance summary table
    compliance_data = {
        'Metric': ['Board Women %', 'Board Minority %', 'Avg Whistleblower Reports', 'Avg Closed Reports'],
        'Value': [
            f"{avg_women_pct:.2f}%",
            f"{avg_minority_pct:.2f}%",
            f"{monthly_whistleblower['Reports_Count'].mean():.2f}" if not monthly_whistleblower.empty else "N/A",
            f"{monthly_closed['Closed_Count'].mean():.2f}" if not monthly_closed.empty else "N/A"
        ]
    }
    compliance_df = pd.DataFrame(compliance_data)
    fig.add_trace(
        go.Table(
            header=dict(values=list(compliance_df.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[compliance_df['Metric'], compliance_df['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Month", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=1)
    fig.update_xaxes(title_text="Month", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Count", row=1, col=2)
    
    fig.update_layout(height=900, title_text="Policy Compliance Report Dashboard", showlegend=True)
    fig.write_html(f'{charts_dir}/social_2_policy_compliance.html')
    print(f"  ✓ Saved: {charts_dir}/social_2_policy_compliance.html")


def create_supplier_esg_rating():
    """Create supplier ESG rating dashboard."""
    workforce_df, kpi_dept_df, supplier_df, governance_df = load_social_governance_data()
    
    # Supplier compliance scores
    if supplier_df is not None:
        if 'compliance_score_%' in supplier_df.columns:
            compliance_scores = supplier_df['compliance_score_%'].describe()
            avg_compliance = supplier_df['compliance_score_%'].mean()
        else:
            avg_compliance = 0
            compliance_scores = pd.Series()
        
        # Suppliers by area
        if 'area' in supplier_df.columns:
            suppliers_by_area = supplier_df['area'].value_counts().head(10)
        else:
            suppliers_by_area = pd.Series()
        
        # Compliance by area
        if 'area' in supplier_df.columns and 'compliance_score_%' in supplier_df.columns:
            compliance_by_area = supplier_df.groupby('area')['compliance_score_%'].mean().reset_index()
            compliance_by_area.columns = ['Area', 'Avg_Compliance']
        else:
            compliance_by_area = pd.DataFrame()
        
        # Suppliers with incidents
        if 'incident_count' in supplier_df.columns:
            suppliers_with_incidents = supplier_df[supplier_df['incident_count'] > 0]
            incident_count = len(suppliers_with_incidents)
        else:
            incident_count = 0
            suppliers_with_incidents = pd.DataFrame()
    else:
        avg_compliance = 0
        compliance_scores = pd.Series()
        suppliers_by_area = pd.Series()
        compliance_by_area = pd.DataFrame()
        incident_count = 0
        suppliers_with_incidents = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Average Compliance Score', 'Suppliers by Area',
                       'Compliance by Area', 'Suppliers with Incidents'),
        specs=[[{"type": "indicator"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "indicator"}]]
    )
    
    # Plot 1: Average compliance score
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_compliance,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Avg. Compliance (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Suppliers by area
    if not suppliers_by_area.empty:
        fig.add_trace(
            go.Bar(x=suppliers_by_area.index, y=suppliers_by_area.values,
                   marker_color='lightblue', name='Suppliers'),
            row=1, col=2
        )
    
    # Plot 3: Compliance by area
    if not compliance_by_area.empty:
        fig.add_trace(
            go.Bar(x=compliance_by_area['Area'], y=compliance_by_area['Avg_Compliance'],
                   marker_color='lightgreen', name='Avg Compliance %'),
            row=2, col=1
        )
    
    # Plot 4: Suppliers with incidents
    total_suppliers = len(supplier_df) if supplier_df is not None else 0
    fig.add_trace(
        go.Indicator(
            mode="number",
            value=incident_count,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': f"Suppliers with Incidents (of {total_suppliers})"},
            number={'font': {'color': 'red' if incident_count > 0 else 'green'}}
        ),
        row=2, col=2
    )
    
    # Update axes
    fig.update_xaxes(title_text="Area", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Suppliers Count", row=1, col=2)
    fig.update_xaxes(title_text="Area", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Avg Compliance %", row=2, col=1)
    
    fig.update_layout(height=900, title_text="Supplier ESG Rating Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/social_3_supplier_esg_rating.html')
    print(f"  ✓ Saved: {charts_dir}/social_3_supplier_esg_rating.html")


def create_social_governance_kpi_dashboard():
    """Create Social & Governance KPI dashboard."""
    workforce_df, kpi_dept_df, supplier_df, governance_df = load_social_governance_data()
    
    # Calculate KPIs
    # Turnover Rate
    if kpi_dept_df is not None and 'avg_turnover_pct' in kpi_dept_df.columns:
        avg_turnover_rate = kpi_dept_df['avg_turnover_pct'].mean()
    elif workforce_df is not None and 'turnover_rate_%' in workforce_df.columns:
        avg_turnover_rate = workforce_df['turnover_rate_%'].mean()
    else:
        avg_turnover_rate = 0
    
    # Absenteeism %
    if kpi_dept_df is not None and 'avg_absenteeism_pct' in kpi_dept_df.columns:
        avg_absenteeism_pct = kpi_dept_df['avg_absenteeism_pct'].mean()
    elif workforce_df is not None and 'absenteeism_rate_%' in workforce_df.columns:
        avg_absenteeism_pct = workforce_df['absenteeism_rate_%'].mean()
    else:
        avg_absenteeism_pct = 0
    
    # Policy Compliance %
    if governance_df is not None and 'policy_review_date' in governance_df.columns:
        total_policies = len(governance_df)
        compliant_policies = governance_df['policy_review_date'].notna().sum()
        policy_compliance_pct = (compliant_policies / total_policies * 100) if total_policies > 0 else 0
    else:
        policy_compliance_pct = 0
    
    # Supplier Audit %
    if supplier_df is not None:
        total_suppliers = len(supplier_df)
        audited_suppliers = len(supplier_df[supplier_df['csr_audit_date'].notna()]) if 'csr_audit_date' in supplier_df.columns else total_suppliers
        supplier_audit_pct = (audited_suppliers / total_suppliers * 100) if total_suppliers > 0 else 0
    else:
        supplier_audit_pct = 0
        total_suppliers = 0
    
    # Supporting metrics for KPI table
    if workforce_df is not None:
        total_employees = len(workforce_df)
        if 'employee_survey_score' in workforce_df.columns:
            avg_survey_score = workforce_df['employee_survey_score'].mean()
        elif kpi_dept_df is not None and 'avg_survey_score' in kpi_dept_df.columns:
            avg_survey_score = kpi_dept_df['avg_survey_score'].mean()
        else:
            avg_survey_score = 0
    else:
        total_employees = int(kpi_dept_df['employees'].sum()) if kpi_dept_df is not None and 'employees' in kpi_dept_df.columns else 0
        avg_survey_score = kpi_dept_df['avg_survey_score'].mean() if kpi_dept_df is not None and 'avg_survey_score' in kpi_dept_df.columns else 0
    
    if governance_df is not None:
        board_women_pct = governance_df['board_women_%'].mean() if 'board_women_%' in governance_df.columns else 0
        board_minority_pct = governance_df['board_minority_%'].mean() if 'board_minority_%' in governance_df.columns else 0
    else:
        board_women_pct = 0
        board_minority_pct = 0
    
    # Create subplots
    fig = make_subplots(
        rows=3, cols=2,
        subplot_titles=('Turnover Rate', 'Absenteeism %',
                       'Policy Compliance %', 'Supplier Audit %',
                       'KPI Summary', ''),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "table", "colspan": 2}, None]]
    )
    
    # Plot 1: Turnover Rate
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_turnover_rate,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Turnover Rate (%)"},
            gauge={
                'axis': {'range': [None, 20]},
                'bar': {'color': "darkred"},
                'steps': [
                    {'range': [0, 5], 'color': "lightgreen"},
                    {'range': [5, 10], 'color': "yellow"},
                    {'range': [10, 20], 'color': "lightcoral"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 15
                }
            }
        ),
        row=1, col=1
    )
    
    # Plot 2: Absenteeism %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=avg_absenteeism_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Absenteeism (%)"},
            gauge={
                'axis': {'range': [None, 10]},
                'bar': {'color': "darkorange"},
                'steps': [
                    {'range': [0, 2], 'color': "lightgreen"},
                    {'range': [2, 5], 'color': "yellow"},
                    {'range': [5, 10], 'color': "lightcoral"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 7
                }
            }
        ),
        row=1, col=2
    )
    
    # Plot 3: Policy Compliance %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=policy_compliance_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Policy Compliance (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkgreen"},
                'steps': [
                    {'range': [0, 80], 'color': "lightgray"},
                    {'range': [80, 95], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 100
                }
            }
        ),
        row=2, col=1
    )
    
    # Plot 4: Supplier Audit %
    fig.add_trace(
        go.Indicator(
            mode="gauge+number",
            value=supplier_audit_pct,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Supplier Audit (%)"},
            gauge={
                'axis': {'range': [None, 100]},
                'bar': {'color': "darkblue"},
                'steps': [
                    {'range': [0, 70], 'color': "lightgray"},
                    {'range': [70, 90], 'color': "yellow"}
                ],
                'threshold': {
                    'line': {'color': "red", 'width': 4},
                    'thickness': 0.75,
                    'value': 95
                }
            }
        ),
        row=2, col=2
    )
    
    # Plot 5: KPI summary table
    kpi_table = pd.DataFrame({
        'Metric': [
            'Total Employees',
            'Total Suppliers',
            'Avg Survey Score',
            'Avg Turnover (%)',
            'Avg Absenteeism (%)',
            'Policy Compliance (%)',
            'Supplier Audit (%)',
            'Board Women (%)',
            'Board Minority (%)'
        ],
        'Value': [
            f"{total_employees:,}",
            f"{total_suppliers:,}",
            f"{avg_survey_score:.1f}",
            f"{avg_turnover_rate:.2f}",
            f"{avg_absenteeism_pct:.2f}",
            f"{policy_compliance_pct:.2f}",
            f"{supplier_audit_pct:.2f}",
            f"{board_women_pct:.2f}",
            f"{board_minority_pct:.2f}"
        ]
    })
    
    fig.add_trace(
        go.Table(
            header=dict(values=list(kpi_table.columns),
                        fill_color='paleturquoise',
                        align='left'),
            cells=dict(values=[kpi_table['Metric'], kpi_table['Value']],
                      fill_color='lavender',
                      align='left')
        ),
        row=3, col=1
    )

    register_kpi_snapshot(
        component="Social & Governance",
        table_name="Social & Governance KPI Summary",
        df=kpi_table,
        ui_tiles={
            "total_employees": int(total_employees),
            "total_suppliers": int(total_suppliers),
            "avg_survey_score": round(float(avg_survey_score), 1) if avg_survey_score is not None else None,
            "avg_turnover_pct": round(float(avg_turnover_rate), 2),
            "avg_absenteeism_pct": round(float(avg_absenteeism_pct), 2),
            "policy_compliance_pct": round(float(policy_compliance_pct), 2),
            "supplier_audit_pct": round(float(supplier_audit_pct), 2),
            "board_women_pct": round(float(board_women_pct), 2),
            "board_minority_pct": round(float(board_minority_pct), 2),
        }
    )
    
    fig.update_layout(height=1100, title_text="Social & Governance KPI Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/social_4_kpi_dashboard.html')
    print(f"  ✓ Saved: {charts_dir}/social_4_kpi_dashboard.html")


def create_workforce_stability_trend():
    """Create workforce stability trend chart."""
    workforce_df, kpi_dept_df, supplier_df, governance_df = load_social_governance_data()
    
    # Use Workforce_KPIs_By_Dept if available
    if kpi_dept_df is not None:
        # Turnover by department
        if 'dept' in kpi_dept_df.columns and 'avg_turnover_pct' in kpi_dept_df.columns:
            turnover_by_dept = kpi_dept_df[['dept', 'avg_turnover_pct']].sort_values('avg_turnover_pct', ascending=False)
            turnover_by_dept.columns = ['Department', 'Turnover_Rate']
        else:
            turnover_by_dept = pd.DataFrame()
        
        # Absenteeism by department
        if 'dept' in kpi_dept_df.columns and 'avg_absenteeism_pct' in kpi_dept_df.columns:
            absenteeism_by_dept = kpi_dept_df[['dept', 'avg_absenteeism_pct']].sort_values('avg_absenteeism_pct', ascending=False)
            absenteeism_by_dept.columns = ['Department', 'Absenteeism_Rate']
        else:
            absenteeism_by_dept = pd.DataFrame()
        
        # Survey scores by department
        if 'dept' in kpi_dept_df.columns and 'avg_survey_score' in kpi_dept_df.columns:
            survey_by_dept = kpi_dept_df[['dept', 'avg_survey_score']].sort_values('avg_survey_score', ascending=False)
            survey_by_dept.columns = ['Department', 'Survey_Score']
        else:
            survey_by_dept = pd.DataFrame()
    elif workforce_df is not None:
        # Aggregate from Workforce_Social
        if 'dept' in workforce_df.columns and 'turnover_rate_%' in workforce_df.columns:
            turnover_by_dept = workforce_df.groupby('dept')['turnover_rate_%'].mean().reset_index()
            turnover_by_dept.columns = ['Department', 'Turnover_Rate']
            turnover_by_dept = turnover_by_dept.sort_values('Turnover_Rate', ascending=False)
        else:
            turnover_by_dept = pd.DataFrame()
        
        if 'dept' in workforce_df.columns and 'absenteeism_rate_%' in workforce_df.columns:
            absenteeism_by_dept = workforce_df.groupby('dept')['absenteeism_rate_%'].mean().reset_index()
            absenteeism_by_dept.columns = ['Department', 'Absenteeism_Rate']
            absenteeism_by_dept = absenteeism_by_dept.sort_values('Absenteeism_Rate', ascending=False)
        else:
            absenteeism_by_dept = pd.DataFrame()
        
        if 'dept' in workforce_df.columns and 'employee_survey_score' in workforce_df.columns:
            survey_by_dept = workforce_df.groupby('dept')['employee_survey_score'].mean().reset_index()
            survey_by_dept.columns = ['Department', 'Survey_Score']
            survey_by_dept = survey_by_dept.sort_values('Survey_Score', ascending=False)
        else:
            survey_by_dept = pd.DataFrame()
    else:
        turnover_by_dept = pd.DataFrame()
        absenteeism_by_dept = pd.DataFrame()
        survey_by_dept = pd.DataFrame()
    
    # Create subplots
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=('Turnover Rate by Department', 'Absenteeism Rate by Department',
                       'Survey Score by Department', 'Stability Trend'),
        specs=[[{"type": "bar"}, {"type": "bar"}],
               [{"type": "bar"}, {"type": "scatter"}]]
    )
    
    # Plot 1: Turnover by department
    if not turnover_by_dept.empty:
        fig.add_trace(
            go.Bar(x=turnover_by_dept['Department'], y=turnover_by_dept['Turnover_Rate'],
                   marker_color='coral', name='Turnover Rate %'),
            row=1, col=1
        )
    
    # Plot 2: Absenteeism by department
    if not absenteeism_by_dept.empty:
        fig.add_trace(
            go.Bar(x=absenteeism_by_dept['Department'], y=absenteeism_by_dept['Absenteeism_Rate'],
                   marker_color='orange', name='Absenteeism Rate %'),
            row=1, col=2
        )
    
    # Plot 3: Survey scores by department
    if not survey_by_dept.empty:
        fig.add_trace(
            go.Bar(x=survey_by_dept['Department'], y=survey_by_dept['Survey_Score'],
                   marker_color='lightgreen', name='Survey Score'),
            row=2, col=1
        )
    
    # Plot 4: Combined stability trend (inverse of turnover + absenteeism)
    if not turnover_by_dept.empty and not absenteeism_by_dept.empty:
        # Merge data
        stability_df = turnover_by_dept.merge(absenteeism_by_dept, on='Department', how='outer')
        stability_df['Stability_Score'] = 100 - (stability_df['Turnover_Rate'].fillna(0) + stability_df['Absenteeism_Rate'].fillna(0) * 2)
        stability_df = stability_df.sort_values('Stability_Score', ascending=False)
        
        fig.add_trace(
            go.Scatter(x=stability_df['Department'], y=stability_df['Stability_Score'],
                      mode='lines+markers', name='Stability Score',
                      marker=dict(symbol='circle', size=8, color='blue')),
            row=2, col=2
        )
    
    # Update axes
    fig.update_xaxes(title_text="Department", row=1, col=1, tickangle=45)
    fig.update_yaxes(title_text="Turnover Rate %", row=1, col=1)
    fig.update_xaxes(title_text="Department", row=1, col=2, tickangle=45)
    fig.update_yaxes(title_text="Absenteeism Rate %", row=1, col=2)
    fig.update_xaxes(title_text="Department", row=2, col=1, tickangle=45)
    fig.update_yaxes(title_text="Survey Score", row=2, col=1)
    fig.update_xaxes(title_text="Department", row=2, col=2, tickangle=45)
    fig.update_yaxes(title_text="Stability Score", row=2, col=2)
    
    fig.update_layout(height=900, title_text="Workforce Stability Trend Dashboard", showlegend=False)
    fig.write_html(f'{charts_dir}/social_5_workforce_stability_trend.html')
    print(f"  ✓ Saved: {charts_dir}/social_5_workforce_stability_trend.html")


def create_esg_radar_chart():
    """Create ESG radar chart (Social and Governance pillars)."""
    workforce_df, kpi_dept_df, supplier_df, governance_df = load_social_governance_data()
    
    # Calculate Social & Governance metrics
    # Social Pillars
    if kpi_dept_df is not None:
        avg_turnover = kpi_dept_df['avg_turnover_pct'].mean() if 'avg_turnover_pct' in kpi_dept_df.columns else 0
        avg_absenteeism = kpi_dept_df['avg_absenteeism_pct'].mean() if 'avg_absenteeism_pct' in kpi_dept_df.columns else 0
        avg_survey = kpi_dept_df['avg_survey_score'].mean() if 'avg_survey_score' in kpi_dept_df.columns else 0
    elif workforce_df is not None:
        avg_turnover = workforce_df['turnover_rate_%'].mean() if 'turnover_rate_%' in workforce_df.columns else 0
        avg_absenteeism = workforce_df['absenteeism_rate_%'].mean() if 'absenteeism_rate_%' in workforce_df.columns else 0
        avg_survey = workforce_df['employee_survey_score'].mean() if 'employee_survey_score' in workforce_df.columns else 0
    else:
        avg_turnover = 0
        avg_absenteeism = 0
        avg_survey = 0
    
    # Diversity metrics
    if workforce_df is not None and 'gender' in workforce_df.columns:
        gender_diversity = len(workforce_df['gender'].unique()) / max(len(workforce_df), 1) * 100
    else:
        gender_diversity = 0
    
    # Governance Pillars
    if governance_df is not None:
        avg_board_women = governance_df['board_women_%'].mean() if 'board_women_%' in governance_df.columns else 0
        avg_board_minority = governance_df['board_minority_%'].mean() if 'board_minority_%' in governance_df.columns else 0
        if 'whistleblower_reports_count' in governance_df.columns and 'closed_reports_count' in governance_df.columns:
            total_reports = governance_df['whistleblower_reports_count'].sum()
            closed_reports = governance_df['closed_reports_count'].sum()
            whistleblower_closure_rate = (closed_reports / total_reports * 100) if total_reports > 0 else 0
        else:
            whistleblower_closure_rate = 0
    else:
        avg_board_women = 0
        avg_board_minority = 0
        whistleblower_closure_rate = 0
    
    # Supplier compliance
    if supplier_df is not None and 'compliance_score_%' in supplier_df.columns:
        avg_supplier_compliance = supplier_df['compliance_score_%'].mean()
    else:
        avg_supplier_compliance = 0
    
    # Normalize metrics to 0-100 scale for radar chart
    # Invert turnover and absenteeism (lower is better)
    turnover_score = max(0, 100 - (avg_turnover * 5))  # Scale: 20% turnover = 0 score
    absenteeism_score = max(0, 100 - (avg_absenteeism * 10))  # Scale: 10% absenteeism = 0 score
    survey_score = avg_survey  # Already 0-100
    
    # Create radar chart data
    categories = ['Turnover\n(Stability)', 'Absenteeism\n(Health)', 'Survey Score\n(Satisfaction)', 
                  'Gender Diversity', 'Board Women %', 'Board Minority %', 
                  'Whistleblower\nClosure', 'Supplier\nCompliance']
    values = [turnover_score, absenteeism_score, survey_score, gender_diversity,
              avg_board_women, avg_board_minority, whistleblower_closure_rate, avg_supplier_compliance]
    
    # Create radar chart
    fig = go.Figure()
    
    fig.add_trace(go.Scatterpolar(
        r=values,
        theta=categories,
        fill='toself',
        name='ESG Score',
        line_color='blue'
    ))
    
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                range=[0, 100]
            )),
        showlegend=True,
        title_text="ESG Radar Chart (Social & Governance Pillars)",
        height=700
    )
    
    fig.write_html(f'{charts_dir}/social_6_esg_radar_chart.html')
    print(f"  ✓ Saved: {charts_dir}/social_6_esg_radar_chart.html")


def create_all_social_governance_charts():
    """Generate all Social & Governance charts."""
    print("\n" + "="*50)
    print("GENERATING SOCIAL & GOVERNANCE CHARTS")
    print("="*50)
    
    try:
        create_workforce_diversity_summary()
        create_policy_compliance_report()
        create_supplier_esg_rating()
        create_social_governance_kpi_dashboard()
        create_workforce_stability_trend()
        create_esg_radar_chart()
        
        print("\nAll Social & Governance visualizations completed! 🎉")
        
        # Print summary statistics
        workforce_df, kpi_dept_df, supplier_df, governance_df = load_social_governance_data()
        print("\n" + "="*50)
        print("SOCIAL & GOVERNANCE SUMMARY STATISTICS")
        print("="*50)
        
        if kpi_dept_df is not None:
            avg_turnover = kpi_dept_df['avg_turnover_pct'].mean() if 'avg_turnover_pct' in kpi_dept_df.columns else 0
            avg_absenteeism = kpi_dept_df['avg_absenteeism_pct'].mean() if 'avg_absenteeism_pct' in kpi_dept_df.columns else 0
            avg_survey = kpi_dept_df['avg_survey_score'].mean() if 'avg_survey_score' in kpi_dept_df.columns else 0
        elif workforce_df is not None:
            avg_turnover = workforce_df['turnover_rate_%'].mean() if 'turnover_rate_%' in workforce_df.columns else 0
            avg_absenteeism = workforce_df['absenteeism_rate_%'].mean() if 'absenteeism_rate_%' in workforce_df.columns else 0
            avg_survey = workforce_df['employee_survey_score'].mean() if 'employee_survey_score' in workforce_df.columns else 0
        else:
            avg_turnover = 0
            avg_absenteeism = 0
            avg_survey = 0
        
        print(f"Average Turnover Rate: {avg_turnover:.2f}%")
        print(f"Average Absenteeism Rate: {avg_absenteeism:.2f}%")
        print(f"Average Survey Score: {avg_survey:.2f}")
        
        if supplier_df is not None:
            avg_compliance = supplier_df['compliance_score_%'].mean() if 'compliance_score_%' in supplier_df.columns else 0
            print(f"Average Supplier Compliance: {avg_compliance:.2f}%")
        
        if governance_df is not None:
            avg_women = governance_df['board_women_%'].mean() if 'board_women_%' in governance_df.columns else 0
            print(f"Average Board Women %: {avg_women:.2f}%")
        
        if kpi_dept_df is not None and 'dept' in kpi_dept_df.columns:
            print(f"\nTop 5 Departments by Turnover Rate:")
            print(kpi_dept_df.nlargest(5, 'avg_turnover_pct')[['dept', 'avg_turnover_pct']])
        
    except Exception as e:
        print(f"Error generating Social & Governance charts: {str(e)}")
        raise


if __name__ == "__main__":
    create_all_safety_charts()