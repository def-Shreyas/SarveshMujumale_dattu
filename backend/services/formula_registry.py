import sympy
from sympy import symbols

# =============================================================================
# SYMBOLIC VARIABLES DEFINITION
# =============================================================================

# Environmental & Resource Use
recycled, total_waste = symbols('recycled total_waste')
energy_consumed, units_produced = symbols('energy_consumed units_produced')
co2_emissions = symbols('co2_emissions')
water_consumed = symbols('water_consumed')
renewable_energy, total_energy = symbols('renewable_energy total_energy')
waste_diverted = symbols('waste_diverted')

# Incidents & Safety
total_incidents, total_hours = symbols('total_incidents total_hours')
lost_time_incidents = symbols('lost_time_incidents')
days_lost = symbols('days_lost')
near_misses = symbols('near_misses')
first_aid_cases, medical_cases, fatalities = symbols('first_aid_cases medical_cases fatalities')
unsafe_acts, total_observations = symbols('unsafe_acts total_observations')

# Training
valid_certs, total_employees = symbols('valid_certs total_employees')
training_hours = symbols('training_hours')
completed_trainings, required_trainings = symbols('completed_trainings required_trainings')
expired_certs = symbols('expired_certs')
employees_trained = symbols('employees_trained')

# PPE
issued, purchased = symbols('issued purchased')
ppe_compliant_workers, total_workers = symbols('ppe_compliant_workers total_workers')
ppe_stock_used, avg_stock = symbols('ppe_stock_used avg_stock')
defective_ppe, total_ppe_checked = symbols('defective_ppe total_ppe_checked')

# RCA / Corrective Actions
closed, total = symbols('closed total')
overdue_actions = symbols('overdue_actions')
total_resolution_days, total_closed = symbols('total_resolution_days total_closed')
repeat_incidents, total_incidents_period = symbols('repeat_incidents total_incidents_period')
rca_completed, incidents_requiring_rca = symbols('rca_completed incidents_requiring_rca')

# Inspections & Audits
compliant, total_inspected = symbols('compliant total_inspected')
completed_inspections, scheduled_inspections = symbols('completed_inspections scheduled_inspections')
critical_findings, total_findings = symbols('critical_findings total_findings')
audit_actions_closed, total_audit_actions = symbols('audit_actions_closed total_audit_actions')
non_conformances = symbols('non_conformances')

# Permit-to-Work (PTW)
ptw_closed, ptw_total = symbols('ptw_closed ptw_total')
ptw_overdue = symbols('ptw_overdue')
ptw_on_time = symbols('ptw_on_time')
hot_work_permits, total_permits = symbols('hot_work_permits total_permits')
ptw_violations = symbols('ptw_violations')
high_risk_permits = symbols('high_risk_permits')

# Medical & First-Aid
first_aid_provided, total_medical_cases = symbols('first_aid_provided total_medical_cases')
occupational_illnesses = symbols('occupational_illnesses')
medical_visits, workforce_size = symbols('medical_visits workforce_size')
fit_for_duty, total_examined = symbols('fit_for_duty total_examined')
restricted_duty_cases = symbols('restricted_duty_cases')
return_to_work_days, medical_leave_cases = symbols('return_to_work_days medical_leave_cases')

# Social & Governance
diversity_hires, total_hires = symbols('diversity_hires total_hires')
grievances_resolved, total_grievances = symbols('grievances_resolved total_grievances')
ethics_violations = symbols('ethics_violations')
community_investment, revenue = symbols('community_investment revenue')
supplier_audits_passed, total_supplier_audits = symbols('supplier_audits_passed total_supplier_audits')
board_independence, total_board_members = symbols('board_independence total_board_members')
employee_satisfaction_score = symbols('employee_satisfaction_score')
turnover_count = symbols('turnover_count')

# =============================================================================
# ADDITIONAL SYMBOLS FOR COMPREHENSIVE CALCULATIONS
# =============================================================================

# Environmental - Extended
total_renewable_kwh, total_grid_kwh = symbols('total_renewable_kwh total_grid_kwh')
monthly_energy_sum, num_months = symbols('monthly_energy_sum num_months')
total_water_liters, total_co2_kg = symbols('total_water_liters total_co2_kg')
waste_to_landfill = symbols('waste_to_landfill')

# Incidents - Extended
recordable_incidents, safe_days = symbols('recordable_incidents safe_days')
total_shifts, high_risk_activities = symbols('total_shifts high_risk_activities')
incidents_current_period, incidents_previous_period = symbols('incidents_current_period incidents_previous_period')

# Training - Extended
total_training_cost, budget_allocated = symbols('total_training_cost budget_allocated')
pre_test_score, post_test_score = symbols('pre_test_score post_test_score')
refresher_trainings_due, refresher_trainings_completed = symbols('refresher_trainings_due refresher_trainings_completed')

# PPE - Extended
total_stock_value, ppe_incidents = symbols('total_stock_value ppe_incidents')
items_expiring_30days, total_stock_items = symbols('items_expiring_30days total_stock_items')

# Medical - Extended
total_response_time_minutes, total_response_cases = symbols('total_response_time_minutes total_response_cases')
drill_completed, drill_scheduled = symbols('drill_completed drill_scheduled')
lti_days_lost, lti_cases = symbols('lti_days_lost lti_cases')

# General calculation symbols
sum_values, count_values = symbols('sum_values count_values')
current_value, previous_value = symbols('current_value previous_value')


# =============================================================================
# KPI REGISTRY - Comprehensive formulas for all modules
# =============================================================================

KPI_REGISTRY = {
    # =========================================================================
    # ENVIRONMENTAL & RESOURCE USE MODULE
    # =========================================================================
    "recycling_rate": {
        "label": "Recycling Rate %",
        "description": "Percentage of total waste that is recycled.",
        "formula": (recycled / total_waste) * 100,
        "variables": ["recycled", "total_waste"],
        "unit": "%",
        "module": "environmental",
        "thresholds": {"good": 50, "critical": 30, "direction": "higher"}
    },
    "energy_intensity": {
        "label": "Energy Intensity",
        "description": "Energy consumed per unit produced (kWh/unit).",
        "formula": energy_consumed / units_produced,
        "variables": ["energy_consumed", "units_produced"],
        "unit": " kWh/unit",
        "module": "environmental",
        "thresholds": {"good": 10, "critical": 25, "direction": "lower"}
    },
    "co2_intensity": {
        "label": "CO₂ Intensity",
        "description": "CO₂ emissions per unit produced (tCO₂/unit).",
        "formula": co2_emissions / units_produced,
        "variables": ["co2_emissions", "units_produced"],
        "unit": " tCO₂/unit",
        "module": "environmental",
        "thresholds": {"good": 0.5, "critical": 1.5, "direction": "lower"}
    },
    "water_intensity": {
        "label": "Water Intensity",
        "description": "Water consumed per unit produced (m³/unit).",
        "formula": water_consumed / units_produced,
        "variables": ["water_consumed", "units_produced"],
        "unit": " m³/unit",
        "module": "environmental",
        "thresholds": {"good": 2, "critical": 5, "direction": "lower"}
    },
    "renewable_energy_percentage": {
        "label": "Renewable Energy %",
        "description": "Percentage of total energy from renewable sources.",
        "formula": (renewable_energy / total_energy) * 100,
        "variables": ["renewable_energy", "total_energy"],
        "unit": "%",
        "module": "environmental",
        "thresholds": {"good": 30, "critical": 10, "direction": "higher"}
    },
    "waste_diversion_rate": {
        "label": "Waste Diversion Rate %",
        "description": "Percentage of waste diverted from landfill.",
        "formula": (waste_diverted / total_waste) * 100,
        "variables": ["waste_diverted", "total_waste"],
        "unit": "%",
        "module": "environmental",
        "thresholds": {"good": 70, "critical": 40, "direction": "higher"}
    },

    # =========================================================================
    # INCIDENTS & SAFETY MODULE
    # =========================================================================
    "incident_rate_trir": {
        "label": "Total Recordable Incident Rate (TRIR)",
        "description": "Number of recordable incidents per 200,000 work hours.",
        "formula": (total_incidents * 200000) / total_hours,
        "variables": ["total_incidents", "total_hours"],
        "unit": "",
        "module": "incidents",
        "thresholds": {"good": 1.0, "critical": 3.0, "direction": "lower"}
    },
    "lost_time_injury_rate": {
        "label": "Lost Time Injury Frequency Rate (LTIFR)",
        "description": "Lost time injuries per 1,000,000 work hours.",
        "formula": (lost_time_incidents * 1000000) / total_hours,
        "variables": ["lost_time_incidents", "total_hours"],
        "unit": "",
        "module": "incidents",
        "thresholds": {"good": 1.0, "critical": 4.0, "direction": "lower"}
    },
    "severity_rate": {
        "label": "Severity Rate",
        "description": "Days lost per 200,000 work hours.",
        "formula": (days_lost * 200000) / total_hours,
        "variables": ["days_lost", "total_hours"],
        "unit": " days",
        "module": "incidents",
        "thresholds": {"good": 20, "critical": 50, "direction": "lower"}
    },
    "near_miss_frequency": {
        "label": "Near Miss Frequency Rate",
        "description": "Near misses reported per 200,000 work hours.",
        "formula": (near_misses * 200000) / total_hours,
        "variables": ["near_misses", "total_hours"],
        "unit": "",
        "module": "incidents",
        "thresholds": {"good": 50, "critical": 20, "direction": "higher"}
    },
    "unsafe_act_rate": {
        "label": "Unsafe Act Rate %",
        "description": "Percentage of unsafe acts observed.",
        "formula": (unsafe_acts / total_observations) * 100,
        "variables": ["unsafe_acts", "total_observations"],
        "unit": "%",
        "module": "incidents",
        "thresholds": {"good": 5, "critical": 15, "direction": "lower"}
    },
    "fatality_rate": {
        "label": "Fatality Rate",
        "description": "Fatalities per 100,000 workers.",
        "formula": (fatalities * 100000) / total_employees,
        "variables": ["fatalities", "total_employees"],
        "unit": "",
        "module": "incidents",
        "thresholds": {"good": 0, "critical": 1, "direction": "lower"}
    },

    # =========================================================================
    # TRAINING MODULE
    # =========================================================================
    "training_compliance": {
        "label": "Training Compliance %",
        "description": "Percentage of employees with valid certifications.",
        "formula": (valid_certs / total_employees) * 100,
        "variables": ["valid_certs", "total_employees"],
        "unit": "%",
        "module": "training",
        "thresholds": {"good": 95, "critical": 85, "direction": "higher"}
    },
    "training_hours_per_employee": {
        "label": "Training Hours per Employee",
        "description": "Average training hours per employee.",
        "formula": training_hours / total_employees,
        "variables": ["training_hours", "total_employees"],
        "unit": " hrs",
        "module": "training",
        "thresholds": {"good": 40, "critical": 20, "direction": "higher"}
    },
    "training_completion_rate": {
        "label": "Training Completion Rate %",
        "description": "Percentage of required trainings completed.",
        "formula": (completed_trainings / required_trainings) * 100,
        "variables": ["completed_trainings", "required_trainings"],
        "unit": "%",
        "module": "training",
        "thresholds": {"good": 95, "critical": 80, "direction": "higher"}
    },
    "certification_expiry_rate": {
        "label": "Certification Expiry Rate %",
        "description": "Percentage of certifications that have expired.",
        "formula": (expired_certs / valid_certs) * 100,
        "variables": ["expired_certs", "valid_certs"],
        "unit": "%",
        "module": "training",
        "thresholds": {"good": 2, "critical": 10, "direction": "lower"}
    },
    "workforce_trained_percentage": {
        "label": "Workforce Trained %",
        "description": "Percentage of workforce that received training.",
        "formula": (employees_trained / total_employees) * 100,
        "variables": ["employees_trained", "total_employees"],
        "unit": "%",
        "module": "training",
        "thresholds": {"good": 90, "critical": 70, "direction": "higher"}
    },

    # =========================================================================
    # PPE MODULE
    # =========================================================================
    "ppe_utilization": {
        "label": "PPE Utilization %",
        "description": "Percentage of purchased PPE that has been issued.",
        "formula": (issued / purchased) * 100,
        "variables": ["issued", "purchased"],
        "unit": "%",
        "module": "ppe",
        "thresholds": {"good": 95, "critical": 80, "direction": "higher"}
    },
    "ppe_compliance_rate": {
        "label": "PPE Compliance Rate %",
        "description": "Percentage of workers using required PPE correctly.",
        "formula": (ppe_compliant_workers / total_workers) * 100,
        "variables": ["ppe_compliant_workers", "total_workers"],
        "unit": "%",
        "module": "ppe",
        "thresholds": {"good": 98, "critical": 90, "direction": "higher"}
    },
    "ppe_stock_turnover": {
        "label": "PPE Stock Turnover",
        "description": "Rate at which PPE stock is used and replaced.",
        "formula": ppe_stock_used / avg_stock,
        "variables": ["ppe_stock_used", "avg_stock"],
        "unit": "x",
        "module": "ppe",
        "thresholds": {"good": 4, "critical": 2, "direction": "higher"}
    },
    "ppe_defect_rate": {
        "label": "PPE Defect Rate %",
        "description": "Percentage of PPE found defective during inspection.",
        "formula": (defective_ppe / total_ppe_checked) * 100,
        "variables": ["defective_ppe", "total_ppe_checked"],
        "unit": "%",
        "module": "ppe",
        "thresholds": {"good": 1, "critical": 5, "direction": "lower"}
    },

    # =========================================================================
    # CORRECTIVE ACTIONS & RCA MODULE
    # =========================================================================
    "action_closure_rate": {
        "label": "Action Closure Rate %",
        "description": "Percentage of corrective actions that have been closed.",
        "formula": (closed / total) * 100,
        "variables": ["closed", "total"],
        "unit": "%",
        "module": "rca",
        "thresholds": {"good": 90, "critical": 75, "direction": "higher"}
    },
    "overdue_action_rate": {
        "label": "Overdue Action Rate %",
        "description": "Percentage of corrective actions that are overdue.",
        "formula": (overdue_actions / total) * 100,
        "variables": ["overdue_actions", "total"],
        "unit": "%",
        "module": "rca",
        "thresholds": {"good": 5, "critical": 15, "direction": "lower"}
    },
    "average_resolution_time": {
        "label": "Average Resolution Time",
        "description": "Average days to close corrective actions.",
        "formula": total_resolution_days / total_closed,
        "variables": ["total_resolution_days", "total_closed"],
        "unit": " days",
        "module": "rca",
        "thresholds": {"good": 14, "critical": 30, "direction": "lower"}
    },
    "repeat_incident_rate": {
        "label": "Repeat Incident Rate %",
        "description": "Percentage of incidents that are repeats.",
        "formula": (repeat_incidents / total_incidents_period) * 100,
        "variables": ["repeat_incidents", "total_incidents_period"],
        "unit": "%",
        "module": "rca",
        "thresholds": {"good": 5, "critical": 15, "direction": "lower"}
    },
    "rca_completion_rate": {
        "label": "RCA Completion Rate %",
        "description": "Percentage of incidents with completed root cause analysis.",
        "formula": (rca_completed / incidents_requiring_rca) * 100,
        "variables": ["rca_completed", "incidents_requiring_rca"],
        "unit": "%",
        "module": "rca",
        "thresholds": {"good": 100, "critical": 80, "direction": "higher"}
    },

    # =========================================================================
    # INSPECTIONS & AUDITS MODULE
    # =========================================================================
    "audit_compliance": {
        "label": "Audit Compliance %",
        "description": "Percentage of audit items that passed.",
        "formula": (compliant / total_inspected) * 100,
        "variables": ["compliant", "total_inspected"],
        "unit": "%",
        "module": "inspections",
        "thresholds": {"good": 98, "critical": 90, "direction": "higher"}
    },
    "inspection_completion_rate": {
        "label": "Inspection Completion Rate %",
        "description": "Percentage of scheduled inspections completed.",
        "formula": (completed_inspections / scheduled_inspections) * 100,
        "variables": ["completed_inspections", "scheduled_inspections"],
        "unit": "%",
        "module": "inspections",
        "thresholds": {"good": 100, "critical": 85, "direction": "higher"}
    },
    "critical_finding_rate": {
        "label": "Critical Finding Rate %",
        "description": "Percentage of findings classified as critical.",
        "formula": (critical_findings / total_findings) * 100,
        "variables": ["critical_findings", "total_findings"],
        "unit": "%",
        "module": "inspections",
        "thresholds": {"good": 5, "critical": 20, "direction": "lower"}
    },
    "audit_action_closure_rate": {
        "label": "Audit Action Closure Rate %",
        "description": "Percentage of audit-related actions closed.",
        "formula": (audit_actions_closed / total_audit_actions) * 100,
        "variables": ["audit_actions_closed", "total_audit_actions"],
        "unit": "%",
        "module": "inspections",
        "thresholds": {"good": 95, "critical": 80, "direction": "higher"}
    },
    "non_conformance_rate": {
        "label": "Non-Conformance Rate %",
        "description": "Non-conformances per 100 inspections.",
        "formula": (non_conformances / total_inspected) * 100,
        "variables": ["non_conformances", "total_inspected"],
        "unit": "%",
        "module": "inspections",
        "thresholds": {"good": 2, "critical": 10, "direction": "lower"}
    },

    # =========================================================================
    # PERMIT-TO-WORK (PTW) MODULE
    # =========================================================================
    "ptw_closure_efficiency": {
        "label": "PTW Closure Efficiency %",
        "description": "Percentage of permits closed on time.",
        "formula": (ptw_closed / ptw_total) * 100,
        "variables": ["ptw_closed", "ptw_total"],
        "unit": "%",
        "module": "ptw",
        "thresholds": {"good": 95, "critical": 80, "direction": "higher"}
    },
    "ptw_overdue_rate": {
        "label": "PTW Overdue Rate %",
        "description": "Percentage of permits that are overdue.",
        "formula": (ptw_overdue / ptw_total) * 100,
        "variables": ["ptw_overdue", "ptw_total"],
        "unit": "%",
        "module": "ptw",
        "thresholds": {"good": 5, "critical": 15, "direction": "lower"}
    },
    "ptw_on_time_closure": {
        "label": "On-Time Closure Rate %",
        "description": "Percentage of permits closed within deadline.",
        "formula": (ptw_on_time / ptw_total) * 100,
        "variables": ["ptw_on_time", "ptw_total"],
        "unit": "%",
        "module": "ptw",
        "thresholds": {"good": 90, "critical": 75, "direction": "higher"}
    },
    "hot_work_permit_ratio": {
        "label": "Hot Work Permit Ratio %",
        "description": "Percentage of permits that are hot work permits.",
        "formula": (hot_work_permits / total_permits) * 100,
        "variables": ["hot_work_permits", "total_permits"],
        "unit": "%",
        "module": "ptw",
        "thresholds": {"good": 20, "critical": 40, "direction": "lower"}
    },
    "ptw_violation_rate": {
        "label": "PTW Violation Rate %",
        "description": "Permits with violations per 100 permits issued.",
        "formula": (ptw_violations / total_permits) * 100,
        "variables": ["ptw_violations", "total_permits"],
        "unit": "%",
        "module": "ptw",
        "thresholds": {"good": 1, "critical": 5, "direction": "lower"}
    },
    "high_risk_permit_percentage": {
        "label": "High Risk Permit %",
        "description": "Percentage of high-risk permits issued.",
        "formula": (high_risk_permits / total_permits) * 100,
        "variables": ["high_risk_permits", "total_permits"],
        "unit": "%",
        "module": "ptw",
        "thresholds": {"good": 15, "critical": 30, "direction": "lower"}
    },

    # =========================================================================
    # MEDICAL & FIRST-AID MODULE
    # =========================================================================
    "first_aid_response_rate": {
        "label": "First Aid Response Rate %",
        "description": "Percentage of medical cases that received first aid.",
        "formula": (first_aid_provided / total_medical_cases) * 100,
        "variables": ["first_aid_provided", "total_medical_cases"],
        "unit": "%",
        "module": "medical",
        "thresholds": {"good": 100, "critical": 90, "direction": "higher"}
    },
    "occupational_illness_rate": {
        "label": "Occupational Illness Rate",
        "description": "Occupational illnesses per 10,000 workers.",
        "formula": (occupational_illnesses * 10000) / workforce_size,
        "variables": ["occupational_illnesses", "workforce_size"],
        "unit": "",
        "module": "medical",
        "thresholds": {"good": 5, "critical": 20, "direction": "lower"}
    },
    "medical_visit_rate": {
        "label": "Medical Visit Rate",
        "description": "Medical visits per 100 workers.",
        "formula": (medical_visits * 100) / workforce_size,
        "variables": ["medical_visits", "workforce_size"],
        "unit": "",
        "module": "medical",
        "thresholds": {"good": 10, "critical": 30, "direction": "lower"}
    },
    "fit_for_duty_rate": {
        "label": "Fit for Duty Rate %",
        "description": "Percentage of examined workers deemed fit for duty.",
        "formula": (fit_for_duty / total_examined) * 100,
        "variables": ["fit_for_duty", "total_examined"],
        "unit": "%",
        "module": "medical",
        "thresholds": {"good": 98, "critical": 90, "direction": "higher"}
    },
    "restricted_duty_rate": {
        "label": "Restricted Duty Rate %",
        "description": "Percentage of workers on restricted duty.",
        "formula": (restricted_duty_cases / workforce_size) * 100,
        "variables": ["restricted_duty_cases", "workforce_size"],
        "unit": "%",
        "module": "medical",
        "thresholds": {"good": 1, "critical": 5, "direction": "lower"}
    },
    "avg_return_to_work_time": {
        "label": "Avg Return to Work Time",
        "description": "Average days to return to work after medical leave.",
        "formula": return_to_work_days / medical_leave_cases,
        "variables": ["return_to_work_days", "medical_leave_cases"],
        "unit": " days",
        "module": "medical",
        "thresholds": {"good": 5, "critical": 14, "direction": "lower"}
    },

    # =========================================================================
    # SOCIAL & GOVERNANCE MODULE
    # =========================================================================
    "diversity_hiring_rate": {
        "label": "Diversity Hiring Rate %",
        "description": "Percentage of new hires from diverse backgrounds.",
        "formula": (diversity_hires / total_hires) * 100,
        "variables": ["diversity_hires", "total_hires"],
        "unit": "%",
        "module": "social",
        "thresholds": {"good": 40, "critical": 20, "direction": "higher"}
    },
    "grievance_resolution_rate": {
        "label": "Grievance Resolution Rate %",
        "description": "Percentage of employee grievances resolved.",
        "formula": (grievances_resolved / total_grievances) * 100,
        "variables": ["grievances_resolved", "total_grievances"],
        "unit": "%",
        "module": "social",
        "thresholds": {"good": 95, "critical": 80, "direction": "higher"}
    },
    "ethics_violation_rate": {
        "label": "Ethics Violation Rate",
        "description": "Ethics violations per 1,000 employees.",
        "formula": (ethics_violations * 1000) / total_employees,
        "variables": ["ethics_violations", "total_employees"],
        "unit": "",
        "module": "social",
        "thresholds": {"good": 1, "critical": 5, "direction": "lower"}
    },
    "community_investment_ratio": {
        "label": "Community Investment Ratio %",
        "description": "Percentage of revenue invested in community.",
        "formula": (community_investment / revenue) * 100,
        "variables": ["community_investment", "revenue"],
        "unit": "%",
        "module": "social",
        "thresholds": {"good": 2, "critical": 0.5, "direction": "higher"}
    },
    "supplier_compliance_rate": {
        "label": "Supplier Compliance Rate %",
        "description": "Percentage of suppliers passing audits.",
        "formula": (supplier_audits_passed / total_supplier_audits) * 100,
        "variables": ["supplier_audits_passed", "total_supplier_audits"],
        "unit": "%",
        "module": "social",
        "thresholds": {"good": 95, "critical": 80, "direction": "higher"}
    },
    "board_independence_ratio": {
        "label": "Board Independence Ratio %",
        "description": "Percentage of independent board members.",
        "formula": (board_independence / total_board_members) * 100,
        "variables": ["board_independence", "total_board_members"],
        "unit": "%",
        "module": "social",
        "thresholds": {"good": 60, "critical": 40, "direction": "higher"}
    },
    "employee_turnover_rate": {
        "label": "Employee Turnover Rate %",
        "description": "Annual employee turnover percentage.",
        "formula": (turnover_count / total_employees) * 100,
        "variables": ["turnover_count", "total_employees"],
        "unit": "%",
        "module": "social",
        "thresholds": {"good": 10, "critical": 25, "direction": "lower"}
    },

    # =========================================================================
    # EXTENDED CALCULATIONS - AVERAGES, TOTALS, TRENDS
    # =========================================================================
    
    # Environmental Extended
    "avg_monthly_energy": {
        "label": "Average Monthly Energy (kWh)",
        "description": "Average energy consumption per month.",
        "formula": monthly_energy_sum / num_months,
        "variables": ["monthly_energy_sum", "num_months"],
        "unit": " kWh",
        "module": "environmental",
        "thresholds": {"good": 1000, "critical": 5000, "direction": "lower"}
    },
    "total_renewable_percentage": {
        "label": "Total Renewable Energy %",
        "description": "Percentage of total energy from renewable sources.",
        "formula": (total_renewable_kwh / (total_renewable_kwh + total_grid_kwh)) * 100,
        "variables": ["total_renewable_kwh", "total_grid_kwh"],
        "unit": "%",
        "module": "environmental",
        "thresholds": {"good": 30, "critical": 10, "direction": "higher"}
    },
    "landfill_diversion_rate": {
        "label": "Landfill Diversion Rate %",
        "description": "Percentage of waste diverted from landfill.",
        "formula": ((total_waste - waste_to_landfill) / total_waste) * 100,
        "variables": ["total_waste", "waste_to_landfill"],
        "unit": "%",
        "module": "environmental",
        "thresholds": {"good": 75, "critical": 50, "direction": "higher"}
    },
    
    # Incidents Extended
    "incident_rate_change": {
        "label": "Incident Rate Change %",
        "description": "Percentage change in incidents from previous period.",
        "formula": ((incidents_current_period - incidents_previous_period) / incidents_previous_period) * 100,
        "variables": ["incidents_current_period", "incidents_previous_period"],
        "unit": "%",
        "module": "incidents",
        "thresholds": {"good": -10, "critical": 10, "direction": "lower"}
    },
    "safe_days_streak": {
        "label": "Safe Days Without Incident",
        "description": "Number of days without a recordable incident.",
        "formula": safe_days,
        "variables": ["safe_days"],
        "unit": " days",
        "module": "incidents",
        "thresholds": {"good": 30, "critical": 7, "direction": "higher"}
    },
    "recordable_incident_rate": {
        "label": "Recordable Incident Rate",
        "description": "Recordable incidents per 200,000 hours worked.",
        "formula": (recordable_incidents * 200000) / total_hours,
        "variables": ["recordable_incidents", "total_hours"],
        "unit": "",
        "module": "incidents",
        "thresholds": {"good": 2, "critical": 5, "direction": "lower"}
    },
    
    # Training Extended
    "training_budget_utilization": {
        "label": "Training Budget Utilization %",
        "description": "Percentage of training budget utilized.",
        "formula": (total_training_cost / budget_allocated) * 100,
        "variables": ["total_training_cost", "budget_allocated"],
        "unit": "%",
        "module": "training",
        "thresholds": {"good": 90, "critical": 60, "direction": "higher"}
    },
    "training_effectiveness_score": {
        "label": "Training Effectiveness Score",
        "description": "Average improvement from pre-test to post-test.",
        "formula": post_test_score - pre_test_score,
        "variables": ["pre_test_score", "post_test_score"],
        "unit": " points",
        "module": "training",
        "thresholds": {"good": 20, "critical": 5, "direction": "higher"}
    },
    "refresher_compliance_rate": {
        "label": "Refresher Training Compliance %",
        "description": "Percentage of due refresher trainings completed.",
        "formula": (refresher_trainings_completed / refresher_trainings_due) * 100,
        "variables": ["refresher_trainings_completed", "refresher_trainings_due"],
        "unit": "%",
        "module": "training",
        "thresholds": {"good": 95, "critical": 80, "direction": "higher"}
    },
    
    # PPE Extended
    "ppe_expiry_risk": {
        "label": "PPE Expiry Risk %",
        "description": "Percentage of stock items expiring within 30 days.",
        "formula": (items_expiring_30days / total_stock_items) * 100,
        "variables": ["items_expiring_30days", "total_stock_items"],
        "unit": "%",
        "module": "ppe",
        "thresholds": {"good": 5, "critical": 15, "direction": "lower"}
    },
    "ppe_incident_rate": {
        "label": "PPE-Related Incident Rate",
        "description": "Incidents related to PPE per 10,000 workers.",
        "formula": (ppe_incidents * 10000) / total_workers,
        "variables": ["ppe_incidents", "total_workers"],
        "unit": "",
        "module": "ppe",
        "thresholds": {"good": 1, "critical": 5, "direction": "lower"}
    },
    
    # Medical Extended
    "avg_response_time": {
        "label": "Average Response Time (minutes)",
        "description": "Average time from incident to first aid response.",
        "formula": total_response_time_minutes / total_response_cases,
        "variables": ["total_response_time_minutes", "total_response_cases"],
        "unit": " min",
        "module": "medical",
        "thresholds": {"good": 5, "critical": 15, "direction": "lower"}
    },
    "drill_compliance_rate": {
        "label": "Drill Compliance Rate %",
        "description": "Percentage of scheduled emergency drills completed.",
        "formula": (drill_completed / drill_scheduled) * 100,
        "variables": ["drill_completed", "drill_scheduled"],
        "unit": "%",
        "module": "medical",
        "thresholds": {"good": 100, "critical": 80, "direction": "higher"}
    },
    "avg_lti_severity": {
        "label": "Average LTI Severity (days)",
        "description": "Average days lost per lost time injury.",
        "formula": lti_days_lost / lti_cases,
        "variables": ["lti_days_lost", "lti_cases"],
        "unit": " days",
        "module": "medical",
        "thresholds": {"good": 5, "critical": 20, "direction": "lower"}
    },
    
    # Generic Calculations (usable by any module)
    "simple_average": {
        "label": "Average Value",
        "description": "Simple average calculation (Sum / Count).",
        "formula": sum_values / count_values,
        "variables": ["sum_values", "count_values"],
        "unit": "",
        "module": "general",
        "thresholds": {"good": 0, "critical": 0, "direction": "higher"}
    },
    "percentage_change": {
        "label": "Percentage Change",
        "description": "Percentage change from previous to current value.",
        "formula": ((current_value - previous_value) / previous_value) * 100,
        "variables": ["current_value", "previous_value"],
        "unit": "%",
        "module": "general",
        "thresholds": {"good": 0, "critical": 0, "direction": "lower"}
    },
}


# =============================================================================
# UTILITY FUNCTION - Get formulas by module
# =============================================================================
def get_formulas_by_module(module_name: str) -> dict:
    """Returns all KPI definitions for a specific module."""
    return {k: v for k, v in KPI_REGISTRY.items() if v.get("module") == module_name}


def get_all_modules() -> list:
    """Returns a list of all unique module names."""
    return list(set(v.get("module") for v in KPI_REGISTRY.values()))
