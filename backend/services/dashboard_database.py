"""
dashboard_database.py
Mongo async helpers for storing extracted tables and KPI summaries.

Collections:
- raw_<component>                : raw records inserted from CSVs (append-only)
- kpi_summaries                  : per-component KPI summary objects (one per save run)
"""

from datetime import datetime
from typing import List, Dict, Any
from auth.database import get_database
from bson import ObjectId


async def insert_raw_records(component: str, records: List[Dict[str, Any]], user_id: str) -> int:
    """
    Insert raw records for a given component.
    Append-only. Each document stores metadata: user_id, component, inserted_at.
    Returns number of inserted documents.
    """
    db = get_database()
    if not records:
        return 0

    coll_name = f"raw_{component.lower().replace(' ', '_')}"
    coll = db[coll_name]

    # add metadata to each record
    now = datetime.utcnow()
    for r in records:
        # avoid storing ObjectId or pandas NaN - convert to native types
        r["_saved_by_user"] = user_id
        r["_saved_at"] = now

    result = await coll.insert_many(records)
    return len(result.inserted_ids)


async def save_kpi_summary(component: str, kpi: Dict[str, Any], user_id: str) -> str:
    """
    Save a KPI summary document for a component.
    Returns inserted id string.
    """
    db = get_database()
    doc = {
        "component": component,
        "kpi": kpi,
        "user_id": user_id,
        "created_at": datetime.utcnow()
    }
    result = await db.kpi_summaries.insert_one(doc)
    return str(result.inserted_id)


async def get_latest_kpis_by_user(user_id: str) -> List[Dict[str, Any]]:
    """
    Return the latest KPI summary per component for the user.
    Implementation: find latest `created_at` per component for this user.
    """
    db = get_database()
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$sort": {"component": 1, "created_at": -1}},
        {
            "$group": {
                "_id": "$component",
                "latest": {"$first": "$$ROOT"}
            }
        },
        {"$replaceRoot": {"newRoot": "$latest"}},
        {"$project": {"_id": 0}}
    ]
    docs = await db.kpi_summaries.aggregate(pipeline).to_list(length=100)
    return docs


async def get_raw_collection_count(component: str, user_id: str) -> int:
    """Return count of raw records stored for a component and user."""
    db = get_database()
    coll_name = f"raw_{component.lower().replace(' ', '_')}"
    coll = db[coll_name]
    count = await coll.count_documents({"_saved_by_user": user_id})
    return count
