# services/safety_intelligence/case_repository.py

def search_cases(query: str) -> list[dict]:
    """
    Later this can be:
    - Vector DB (FAISS / Qdrant)
    - Elastic
    - Mongo indexed search
    """

    return [
        {
            "case_id": "BP-2005-TX",
            "title": "BP Texas City Refinery Explosion",
            "year": 2005,
            "country": "USA",
            "industry": "Oil & Gas",
            "severity": "Fatal",
            "summary": "Explosion during startup killed 15 workers.",
            "lessons_learned": [
                "Startup procedures must be risk assessed",
                "Temporary trailers should not be near process units"
            ],
            "source_url": "https://www.csb.gov/bp-america-refinery-explosion/"
        }
    ]