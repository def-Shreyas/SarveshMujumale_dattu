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