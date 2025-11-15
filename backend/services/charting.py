import pandas as pd
import numpy as np
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import os
import warnings
warnings.filterwarnings('ignore')

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

# Execute all visualizations
print("Starting visualization generation...")
create_trend_analysis()
create_location_heatmap()
create_risk_analysis()
create_department_analysis()
create_shift_analysis()
create_timeline_analysis()

print("\nAll visualizations completed! 🎉")

# Additional summary statistics
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
        rows=2, cols=2,
        subplot_titles=('PTW Closure Efficiency', 'Average Closure Time (Hours)',
                       'Overdue Percentage', 'KPIs by Area'),
        specs=[[{"type": "indicator"}, {"type": "indicator"}],
               [{"type": "indicator"}, {"type": "bar"}]]
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
    
    fig.update_layout(height=900, title_text="PTW KPI Dashboard", barmode='group')
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