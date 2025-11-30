"""
Utility functions to dynamically find extracted tables based on content/columns
instead of hardcoded folder names.
"""

import pandas as pd
from pathlib import Path
from typing import Optional, List, Tuple, Dict


def find_table_by_columns(
    extracted_dir: Path,
    required_columns: List[str],
    folder_keywords: Optional[List[str]] = None,
    min_match_ratio: float = 0.5
) -> Optional[Path]:
    """
    Find a CSV table file by checking if it contains required columns.
    
    Args:
        extracted_dir: Directory containing extracted tables
        required_columns: List of column names (case-insensitive) that should be present
        folder_keywords: Optional list of keywords to prioritize in folder names
        min_match_ratio: Minimum ratio of required columns that must match (default 0.5 = 50%)
    
    Returns:
        Path to the first matching table file, or None if not found
    """
    if not extracted_dir.exists():
        return None
    
    # First, try folders matching keywords if provided
    candidate_folders = []
    if folder_keywords:
        for folder in extracted_dir.iterdir():
            if folder.is_dir():
                folder_lower = folder.name.lower()
                if any(keyword.lower() in folder_lower for keyword in folder_keywords):
                    candidate_folders.insert(0, folder)
                else:
                    candidate_folders.append(folder)
    else:
        candidate_folders = [f for f in extracted_dir.iterdir() if f.is_dir()]
    
    # Normalize required columns - handle variations
    def normalize_column_name(col: str) -> str:
        """Normalize column name for matching."""
        col = str(col).lower().strip()
        # Replace common variations
        col = col.replace(' ', '_').replace('-', '_').replace('.', '_')
        return col
    
    required_normalized = [normalize_column_name(col) for col in required_columns]
    
    # Check each folder for matching tables
    best_match = None
    best_score = 0
    
    for folder in candidate_folders:
        for csv_file in sorted(folder.glob("table_*.csv")):
            try:
                df = pd.read_csv(csv_file, nrows=0)  # Read only headers
                df_columns_normalized = [normalize_column_name(col) for col in df.columns]
                
                # Count how many required columns match (with fuzzy matching)
                matches = 0
                for req_col in required_normalized:
                    # Exact match
                    if req_col in df_columns_normalized:
                        matches += 1
                    else:
                        # Fuzzy match - check if any column contains the required column or vice versa
                        for df_col in df_columns_normalized:
                            if req_col in df_col or df_col in req_col:
                                matches += 1
                                break
                
                match_ratio = matches / len(required_normalized) if required_normalized else 0
                
                # If we have a good match (at least min_match_ratio), return it
                if match_ratio >= min_match_ratio:
                    # Prefer exact matches or better scores
                    if match_ratio > best_score:
                        best_match = csv_file
                        best_score = match_ratio
                        # If we have a perfect or near-perfect match, return immediately
                        if match_ratio >= 0.8:
                            return csv_file
            except Exception:
                continue
    
    # Return best match if we found one
    return best_match if best_score >= min_match_ratio else None


def find_tables_by_columns(
    extracted_dir: Path,
    column_sets: List[Tuple[str, List[str], Optional[List[str]]]],
) -> Dict[str, Optional[Path]]:
    """
    Find multiple tables by different column requirements.
    
    Args:
        extracted_dir: Directory containing extracted tables
        column_sets: List of tuples (name, required_columns, folder_keywords)
    
    Returns:
        Dictionary mapping names to table paths
    """
    results = {}
    for name, required_cols, keywords in column_sets:
        results[name] = find_table_by_columns(extracted_dir, required_cols, keywords)
    return results


def find_ptw_tables(extracted_dir: Path) -> Tuple[Optional[Path], Optional[Path]]:
    """Find PTW Records and PTW KPIs tables dynamically."""
    ptw_records = find_table_by_columns(
        extracted_dir,
        required_columns=['permit_status', 'issue_date', 'permit_type'],
        folder_keywords=['ptw', 'permit'],
        min_match_ratio=0.6
    )
    
    if not ptw_records:
        ptw_records = find_table_by_columns(
            extracted_dir,
            required_columns=['permit', 'status', 'date', 'type'],
            folder_keywords=['ptw', 'permit'],
            min_match_ratio=0.4
        )
    
    ptw_kpis = find_table_by_columns(
        extracted_dir,
        required_columns=['area', 'total_permits'],
        folder_keywords=['ptw', 'kpi', 'permit'],
        min_match_ratio=0.5
    )
    
    return ptw_records, ptw_kpis


def find_inspections_tables(extracted_dir: Path) -> Tuple[Optional[Path], Optional[Path]]:
    """Find Inspections and Recurring Failures tables dynamically."""
    inspections = find_table_by_columns(
        extracted_dir,
        required_columns=['ncr_status', 'area', 'inspector'],
        folder_keywords=['inspection', 'audit', 'ncr']
    )
    
    recurring = find_table_by_columns(
        extracted_dir,
        required_columns=['failure_item', 'recurrence_count'],
        folder_keywords=['recurring', 'failure', 'top']
    )
    
    return inspections, recurring


def find_medical_tables(extracted_dir: Path) -> Tuple[Optional[Path], Optional[Path]]:
    """Find Medical Records and Medical KPIs tables dynamically."""
    # Try with strict matching first
    medical_records = find_table_by_columns(
        extracted_dir,
        required_columns=['injury_type', 'first_aid', 'lti'],
        folder_keywords=['medical', 'injury', 'first'],
        min_match_ratio=0.6  # At least 2 out of 3 columns
    )
    
    # If not found, try with more lenient matching
    if not medical_records:
        medical_records = find_table_by_columns(
            extracted_dir,
            required_columns=['injury', 'first', 'medical', 'date'],
            folder_keywords=['medical', 'injury', 'first', 'record'],
            min_match_ratio=0.4  # At least 2 out of 4 columns
        )
    
    # If still not found, try folder name matching as last resort
    if not medical_records and extracted_dir.exists():
        for folder in extracted_dir.iterdir():
            if folder.is_dir():
                folder_lower = folder.name.lower()
                if any(keyword in folder_lower for keyword in ['medical', 'injury', 'first']):
                    csv_files = sorted(folder.glob("table_*.csv"))
                    if csv_files:
                        medical_records = csv_files[0]  # Use first table in matching folder
                        break
    
    # Try with strict matching first for KPIs
    medical_kpis = find_table_by_columns(
        extracted_dir,
        required_columns=['month', 'fa_cases', 'lti_cases'],
        folder_keywords=['medical', 'kpi'],
        min_match_ratio=0.5
    )
    
    # If not found, try with more lenient matching
    if not medical_kpis:
        medical_kpis = find_table_by_columns(
            extracted_dir,
            required_columns=['month', 'fa', 'lti', 'case'],
            folder_keywords=['medical', 'kpi', 'summary'],
            min_match_ratio=0.4
        )
    
    return medical_records, medical_kpis


def find_training_tables(extracted_dir: Path) -> Optional[Path]:
    """Find Training Records table dynamically."""
    return find_table_by_columns(
        extracted_dir,
        required_columns=['employee', 'course', 'completion_status'],
        folder_keywords=['training', 'course']
    )


def find_ppe_tables(extracted_dir: Path) -> Optional[Path]:
    """Find PPE/Assets table dynamically."""
    return find_table_by_columns(
        extracted_dir,
        required_columns=['ppe_item', 'quantity_purchased', 'quantity_issued'],
        folder_keywords=['ppe', 'asset', 'sheet1']
    )


def find_rca_tables(extracted_dir: Path) -> Optional[Path]:
    """Find Corrective Actions/RCA table dynamically."""
    return find_table_by_columns(
        extracted_dir,
        required_columns=['action_id', 'status', 'due_date', 'owner'],
        folder_keywords=['corrective', 'rca', 'action']
    )


def find_environmental_tables(extracted_dir: Path) -> Optional[Path]:
    """Find Environmental/Resource Use table dynamically."""
    return find_table_by_columns(
        extracted_dir,
        required_columns=['energy', 'water', 'waste', 'co2'],
        folder_keywords=['environmental', 'resource', 'monthly']
    )


def find_social_governance_tables(extracted_dir: Path) -> List[Path]:
    """Find Social & Governance tables dynamically."""
    tables = []
    
    # Workforce/Social table
    workforce = find_table_by_columns(
        extracted_dir,
        required_columns=['employee', 'department', 'gender'],
        folder_keywords=['workforce', 'social', 'employee']
    )
    if workforce:
        tables.append(workforce)
    
    # Supplier Audits table
    supplier = find_table_by_columns(
        extracted_dir,
        required_columns=['supplier', 'audit_score', 'compliance'],
        folder_keywords=['supplier', 'audit']
    )
    if supplier:
        tables.append(supplier)
    
    # Governance Metrics table
    governance = find_table_by_columns(
        extracted_dir,
        required_columns=['policy', 'compliance', 'review_date'],
        folder_keywords=['governance', 'policy']
    )
    if governance:
        tables.append(governance)
    
    return tables


def find_safety_tables(extracted_dir: Path) -> Dict[str, Optional[Path]]:
    """Find safety-related tables (Observations, Incidents, NearMisses, Employees) dynamically."""
    results = {}
    
    # Observations
    results['observations'] = find_table_by_columns(
        extracted_dir,
        required_columns=['observation_date', 'location', 'category'],
        folder_keywords=['observation']
    )
    
    # Incidents
    results['incidents'] = find_table_by_columns(
        extracted_dir,
        required_columns=['incident_date', 'severity', 'location'],
        folder_keywords=['incident']
    )
    
    # NearMisses
    results['nearmisses'] = find_table_by_columns(
        extracted_dir,
        required_columns=['near_miss_date', 'location', 'category'],
        folder_keywords=['near', 'miss']
    )
    
    # Employees
    results['employees'] = find_table_by_columns(
        extracted_dir,
        required_columns=['employee', 'department'],
        folder_keywords=['employee']
    )
    
    return results

