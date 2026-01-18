import chromadb

# Connect to persistent Chroma DB
chroma_client = chromadb.PersistentClient(path="chroma_db")

# Get existing collection (must already be created)
collection = chroma_client.get_collection("laws_master")


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
