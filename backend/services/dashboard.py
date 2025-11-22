"""
dashboard.py
Backend logic for dashboard:
- save_dashboard_data(user_id): reads Generated/extracted_tables, inserts raw records, computes KPI summaries
- FastAPI router with GET /dashboard which returns:
    {
      "kpi_tables": { component: <kpi dict> ... },
      "tiles": { tile_key: value, ... }
    }
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi import status
from pathlib import Path
import pandas as pd
import numpy as np
import os
import traceback
from typing import Dict, Any, List, Optional

from auth.dependencies import get_current_active_user, track_api_usage
from auth.database import get_database
from .dashboard_database import insert_raw_records, save_kpi_summary, get_latest_kpis_by_user, get_raw_collection_count

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

BASE_DIR = Path(__file__).parent.parent
EXTRACTED_DIR = BASE_DIR / "Generated" / "extracted_tables"
CHARTS_DIR = BASE_DIR / "Generated" / "charts"

# COMPONENT LIST - 9 components (map folder names used by extraction/charting)
COMPONENTS = [
    "Employees",
    "Observations",
    "Incidents",
    "NearMisses",
    "PTW_Records",
    "PTW_KPIs_By_Area",
    "Training",
    "Medical",
    "Assets & PPE",
    "Corrective Actions",       # if folder exists
    "Environmental & Resource Use",
    "Social & Governance"
]

# Normalize expected folder names - charting.py uses names like PTW_Records and PTW_KPIs_By_Area.
# We'll attempt to ingest any folder present in EXTRACTED_DIR and treat it as a component.
# But for KPI computations below we specifically compute for Observations/Incidents/NearMisses/PTW_Records/PTW_KPIs_By_Area.


def _read_csv_file(path: Path) -> pd.DataFrame:
    # safe csv read with dtype=object
    return pd.read_csv(path, dtype=object, keep_default_na=True, na_values=["", "nan", "NaN"])


async def save_dashboard_data(user_id: str) -> Dict[str, Any]:
    """
    Main entry point used after charts are generated.
    - verifies charts exist
    - reads all table_*.csv under Generated/extracted_tables/<component>/
    - inserts raw records into per-component collections
    - computes KPI summaries (component-wise) and stores them
    Returns a dict summary of saved counts and KPI ids.
    """
    summary = {"saved": {}, "errors": {}}

    # requirement: only save if charts exist and there are generated chart files
    if not CHARTS_DIR.exists() or not any(CHARTS_DIR.iterdir()):
        raise RuntimeError("Charts not found. Generate charts first before saving dashboard data.")

    if not EXTRACTED_DIR.exists():
        raise RuntimeError("No extracted tables found. Upload & extract before saving dashboard data.")

    # iterate over subfolders
    for comp_dir in EXTRACTED_DIR.iterdir():
        if not comp_dir.is_dir():
            continue
        component_name = comp_dir.name  # use folder name as component
        saved_count_total = 0
        kpi_obj = {}
        try:
            # read all table_*.csv files
            csv_files = sorted(comp_dir.glob("table_*.csv"))
            all_records = []
            dfs = []
            for csv in csv_files:
                try:
                    df = _read_csv_file(csv)
                except Exception:
                    # try with latin-1 fallback
                    df = pd.read_csv(csv, dtype=object, encoding="latin-1", errors="ignore")
                # drop columns that are all NaN
                df = df.dropna(axis=1, how='all')
                dfs.append(df)
                # convert rows to dicts; convert NaN -> None for Mongo
                records = df.replace({np.nan: None}).to_dict(orient="records")
                all_records.extend(records)

            # insert raw records (append-only)
            if all_records:
                count_inserted = await insert_raw_records(component_name, all_records, user_id)
                saved_count_total += count_inserted
            else:
                count_inserted = 0

            # compute KPI summary for this component (best-effort)
            # use specialized functions for known components else generic summary
            if component_name.lower() in ("observations", "incidents", "nearmisses"):
                # compute safety KPIs if Observations/Incidents/NearMisses exist as a set
                kpi_obj = _compute_safety_kpis(EXTRACTED_DIR)
            elif component_name.lower().startswith("ptw"):
                kpi_obj = _compute_ptw_kpis(EXTRACTED_DIR)
            else:
                # generic KPIs: total rows, unique counts for first two columns if present, sample stats
                kpi_obj = _compute_generic_kpis(dfs)

            # save kpi
            kpi_id = await save_kpi_summary(component_name, kpi_obj, user_id)

            summary["saved"][component_name] = {
                "rows_inserted": count_inserted,
                "kpi_id": kpi_id,
                "kpi": kpi_obj
            }
        except Exception as e:
            tb = traceback.format_exc()
            summary["errors"][component_name] = {"error": str(e), "trace": tb}
            # continue with other components
            continue

    return summary


async def persist_charting_kpis(user_id: str, kpi_payloads: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Persist KPI tables captured directly from charting.py for a given user.
    Each payload should contain the raw table rows and optional UI tiles.
    """
    if not kpi_payloads:
        return {}

    summary: Dict[str, Any] = {}
    for component, payload in kpi_payloads.items():
        if not payload:
            continue
        kpi_id = await save_kpi_summary(component, payload, user_id)
        summary[component] = {
            "kpi_id": kpi_id,
            "rows": len(payload.get("rows", [])) if isinstance(payload, dict) else None
        }
    return summary


def _compute_generic_kpis(dfs: List[pd.DataFrame]) -> Dict[str, Any]:
    """Generic KPI computation for unknown components"""
    kpi = {}
    total_rows = sum(len(df) for df in dfs)
    kpi["total_rows"] = int(total_rows)
    if dfs:
        # first df
        df = dfs[0]
        kpi["columns"] = list(df.columns)
        # simple unique counts for first two columns
        if df.shape[1] >= 1:
            col0 = df.columns[0]
            kpi["unique_counts"] = {col0: int(df[col0].nunique(dropna=True))}
        if df.shape[1] >= 2:
            col1 = df.columns[1]
            kpi.setdefault("unique_counts", {})[col1] = int(df[col1].nunique(dropna=True))
    return kpi


def _compute_safety_kpis(extracted_dir: Path) -> Dict[str, Any]:
    """
    Compute the safety KPI summary similar to charting.create_safety_kpi_dashboard().
    It uses Observations, Incidents, NearMisses CSVs if available.
    """
    kpi = {}
    try:
        obs_path = extracted_dir / "Observations" / "table_1.csv"
        inc_path = extracted_dir / "Incidents" / "table_1.csv"
        nm_path = extracted_dir / "NearMisses" / "table_1.csv"

        observations_df = _read_csv_file(obs_path) if obs_path.exists() else pd.DataFrame()
        incidents_df = _read_csv_file(inc_path) if inc_path.exists() else pd.DataFrame()
        near_misses_df = _read_csv_file(nm_path) if nm_path.exists() else pd.DataFrame()

        # Convert date columns if present
        if "ObservationDate" in observations_df.columns:
            observations_df["ObservationDate"] = pd.to_datetime(observations_df["ObservationDate"], errors="coerce")

        # compute totals
        total_observations = int(len(observations_df))
        total_incidents = int(len(incidents_df))
        total_near_misses = int(len(near_misses_df))
        kpi["Total Observations"] = total_observations
        kpi["Total Incidents"] = total_incidents
        kpi["Total Near Misses"] = total_near_misses

        # rates
        incident_rate = (total_incidents / total_observations * 100) if total_observations > 0 else 0.0
        near_miss_rate = (total_near_misses / total_observations * 100) if total_observations > 0 else 0.0
        kpi["Incident Rate (%)"] = round(float(incident_rate), 2)
        kpi["Near Miss Rate (%)"] = round(float(near_miss_rate), 2)

        # high risk %
        if "RiskLevel" in observations_df.columns:
            high_risk_events = int((observations_df["RiskLevel"] == "High").sum())
            high_risk_percentage = (high_risk_events / total_observations * 100) if total_observations > 0 else 0.0
            kpi["High Risk Events (%)"] = round(float(high_risk_percentage), 2)
        else:
            kpi["High Risk Events (%)"] = None

        # avg resolution days & on-time closure rate (if incidents have ActionClosedDate and ObservationDate)
        if not incidents_df.empty and "ActionClosedDate" in incidents_df.columns and "ObservationDate" in incidents_df.columns:
            try:
                incidents_df["ActionClosedDate"] = pd.to_datetime(incidents_df["ActionClosedDate"], errors="coerce")
                incidents_df["ObservationDate"] = pd.to_datetime(incidents_df["ObservationDate"], errors="coerce")
                incidents_df["ResolutionDays"] = (incidents_df["ActionClosedDate"] - incidents_df["ObservationDate"]).dt.days
                res = incidents_df["ResolutionDays"].dropna()
                avg_resolution_days = float(res.mean()) if not res.empty else 0.0
                target_days = 7
                on_time_rate = (res <= target_days).sum() / len(res) * 100 if len(res) > 0 else 0.0
                kpi["Avg Resolution Days"] = round(avg_resolution_days, 1)
                kpi["On-time Closure Rate (%)"] = round(on_time_rate, 2)
            except Exception:
                kpi["Avg Resolution Days"] = None
                kpi["On-time Closure Rate (%)"] = None
        else:
            kpi["Avg Resolution Days"] = None
            kpi["On-time Closure Rate (%)"] = None

        # risk_distribution top counts
        if "RiskLevel" in observations_df.columns:
            rd = observations_df["RiskLevel"].value_counts().to_dict()
            kpi["Risk Distribution"] = {k: int(v) for k, v in rd.items()}
        else:
            kpi["Risk Distribution"] = {}

    except Exception:
        # return whatever partial kpi we have
        kpi.setdefault("error", "Failed to compute safety KPIs (see server logs)")
    return kpi


def _compute_ptw_kpis(extracted_dir: Path) -> Dict[str, Any]:
    """
    Compute PTW KPIs using PTW_Records and PTW_KPIs_By_Area if available.
    """
    kpi = {}
    try:
        ptw_records_path = extracted_dir / "PTW_Records" / "table_1.csv"
        ptw_kpis_path = extracted_dir / "PTW_KPIs_By_Area" / "table_1.csv"

        ptw_records_df = _read_csv_file(ptw_records_path) if ptw_records_path.exists() else pd.DataFrame()
        ptw_kpis_df = _read_csv_file(ptw_kpis_path) if ptw_kpis_path.exists() else pd.DataFrame()

        total_permits = int(len(ptw_records_df))
        closed_count = int(len(ptw_records_df[(ptw_records_df.get("permit_status") == "Closed")])) if not ptw_records_df.empty else 0

        # overdue count detection
        overdue_count = 0
        if "is_past_expiry" in ptw_records_df.columns:
            overdue_count = int(((ptw_records_df["is_past_expiry"] == True) |
                                 (ptw_records_df["is_past_expiry"] == "True") |
                                 (ptw_records_df["is_past_expiry"] == "true")).sum())

        closure_efficiency = (closed_count / total_permits * 100) if total_permits > 0 else 0.0

        # avg closure time if close_time and issue_time present
        avg_closure = None
        if "close_time" in ptw_records_df.columns and "issue_time" in ptw_records_df.columns:
            try:
                ptw_records_df["close_time"] = pd.to_datetime(ptw_records_df["close_time"], errors="coerce")
                ptw_records_df["issue_time"] = pd.to_datetime(ptw_records_df["issue_time"], errors="coerce")
                closed_permits = ptw_records_df[ptw_records_df["permit_status"] == "Closed"].copy()
                closed_permits["closure_hours"] = (closed_permits["close_time"] - closed_permits["issue_time"]).dt.total_seconds() / 3600
                avg_closure = float(closed_permits["closure_hours"].mean()) if not closed_permits.empty else None
            except Exception:
                avg_closure = None

        kpi.update({
            "Total Permits": total_permits,
            "Closed Permits": closed_count,
            "Open Permits": total_permits - closed_count,
            "Overdue Permits": overdue_count,
            "Closure Efficiency (%)": round(float(closure_efficiency), 2),
            "Avg Closure Time (hrs)": round(avg_closure, 2) if avg_closure is not None else None,
        })

        # include KPI area table if available
        if not ptw_kpis_df.empty:
            # store top-level KPIs by area
            try:
                area_kpis = ptw_kpis_df.fillna(0).to_dict(orient="records")
                kpi["KPIs By Area (sample)"] = area_kpis[:20]
            except Exception:
                kpi["KPIs By Area (sample)"] = []
        else:
            kpi["KPIs By Area (sample)"] = []

    except Exception:
        kpi.setdefault("error", "Failed to compute PTW KPIs (see server logs)")
    return kpi


@router.get("/", summary="Get dashboard KPIs and UI tiles for current user")
async def get_dashboard(current_user: dict = Depends(get_current_active_user)):
    """
    Returns both:
      - latest KPI summaries per component (raw KPI tables)
      - a simple set of UI tiles derived from KPIs (incidents_open, ptws_active etc.)

    Uses get_latest_kpis_by_user to return latest per-component KPI doc.
    """
    user_id = str(current_user["_id"])
    try:
        # track usage (best-effort) - not deducting calls, just tracking
        await track_api_usage(user_id=user_id, endpoint="/dashboard", method="GET", status_code=200, response_time=0.0)

        kpi_docs = await get_latest_kpis_by_user(user_id)

        # Build kpi_tables (component -> raw KPI table info) and capture UI tiles if available
        kpi_tables: Dict[str, Any] = {}
        ui_tiles_by_component: Dict[str, Dict[str, Any]] = {}
        legacy_sources: Dict[str, Dict[str, Any]] = {}

        for d in kpi_docs:
            comp = d.get("component")
            if not comp:
                continue
            payload = d.get("kpi", {}) or {}

            if isinstance(payload, dict) and "rows" in payload:
                kpi_tables[comp] = {
                    "table_name": payload.get("table_name", "KPI Summary"),
                    "rows": payload.get("rows", [])
                }
                ui_tiles = payload.get("ui_tiles") or {}
                ui_tiles_by_component[comp] = ui_tiles
                legacy_sources[comp] = ui_tiles
            else:
                kpi_tables[comp] = payload
                ui_tiles_by_component.setdefault(comp, {})
                legacy_sources[comp] = payload if isinstance(payload, dict) else {}

        def _to_number(value: Any) -> Optional[float]:
            if value is None:
                return None
            if isinstance(value, str):
                cleaned = value.replace(",", "").strip()
                if not cleaned:
                    return None
                try:
                    return float(cleaned)
                except ValueError:
                    return None
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        # Build tiles (UI-friendly). Best-effort mapping from extracted tiles.
        tiles: Dict[str, Any] = {}

        # incidents_open: prefer safety snapshot then incidents
        try:
            incidents_source = legacy_sources.get("Safety", {})
            if not incidents_source:
                incidents_source = legacy_sources.get("Incidents", {})
            incidents_open = int(_to_number(incidents_source.get("total_incidents") or incidents_source.get("Total Incidents") or 0) or 0)
        except Exception:
            incidents_open = 0
        tiles["incidents_open"] = incidents_open

        # ptws_active
        ptw_kpi = legacy_sources.get("PTW") or legacy_sources.get("PTW_Records") or {}
        try:
            ptws_active = int(_to_number(ptw_kpi.get("open_permits") or ptw_kpi.get("Open Permits") or ptw_kpi.get("Total Permits") or 0) or 0)
        except Exception:
            ptws_active = 0
        tiles["ptws_active"] = ptws_active

        # training_due - best-effort: look for Training component
        training_kpi = legacy_sources.get("Training", {}) or {}
        try:
            due = training_kpi.get("due_this_month") or training_kpi.get("Training Due") or training_kpi.get("training_due")
            if due is None:
                due = await get_raw_collection_count("Training", user_id)
            training_due = int(due or 0)
        except Exception:
            training_due = 0
        tiles["training_due"] = training_due

        # inspections avg score
        insp_kpi = legacy_sources.get("Inspections", {}) or {}
        try:
            avg_score = insp_kpi.get("Avg score") or insp_kpi.get("Audit Compliance (%)") or insp_kpi.get("compliance_pct")
            if avg_score is None:
                avg_score = await get_raw_collection_count("Inspections", user_id)
            tiles["inspections_avg_score"] = _to_number(avg_score)
        except Exception:
            tiles["inspections_avg_score"] = None

        # medical cases
        medical_source = legacy_sources.get("Medical", {})
        tiles["medical_cases_reported"] = int(_to_number(medical_source.get("total_cases") or medical_source.get("Total Cases") or 0) or 0)

        # ppe expiring (best-effort)
        ppe_kpi = legacy_sources.get("PPE") or legacy_sources.get("Assets & PPE") or {}
        tiles["ppe_expiring"] = int(_to_number(ppe_kpi.get("expiring_ppe") or 0) or 0)

        # corrective actions open
        rca_kpi = legacy_sources.get("Corrective Actions", {}) or legacy_sources.get("Corrective Actions & RCA", {}) or {}
        tiles["corrective_open"] = int(_to_number(rca_kpi.get("open_actions") or rca_kpi.get("open") or 0) or 0)

        # environmental metric e.g., CO2/unit
        env_kpi = legacy_sources.get("Environmental", {}) or legacy_sources.get("Environmental & Resource Use", {}) or {}
        tiles["environmental_metric"] = env_kpi.get("CO2/unit") or env_kpi.get("co2_per_unit") or env_kpi.get("esg_score")

        # social governance - turnover
        sg_kpi = legacy_sources.get("Social & Governance", {}) or {}
        tiles["turnover"] = sg_kpi.get("Turnover") or sg_kpi.get("avg_turnover_pct")

        # final response
        return {"kpi_tables": kpi_tables, "ui_tiles": ui_tiles_by_component, "tiles": tiles}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
