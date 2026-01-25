#import chromadb
def get_chroma_collection():
    import chromadb
    from chromadb.config import Settings

    client = chromadb.Client(
        Settings(
            persist_directory="./chroma",
            anonymized_telemetry=False
        )
    )

    try:
        return client.get_collection("laws_master")
    except Exception:
        return client.create_collection("laws_master")



def search_laws(query: str, top_k: int = 3):
    try:
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )
        laws = []

        if not results["documents"]:
            return []

        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        ):
            confidence = round((1 - dist) * 100, 2)  # convert distance → %

            laws.append({
                "text": doc.strip(),
                "pdf_name": meta["pdf_name"],
                "page_number": meta["page_number"],
                "confidence": confidence
            })
        laws.sort(key=lambda x: x["confidence"], reverse=True)
        return laws

    except Exception as e:
        print("❌ RAG Search Error:", e)
        return []
