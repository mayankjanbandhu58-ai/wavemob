import os
import torch
import torch.nn.functional as F
from app.config import CHECKPOINT_DIR
import logging
import time

logger = logging.getLogger(__name__)

CACHE_FILE = CHECKPOINT_DIR / "similarity_cache_full.pt"

class SimilarityEngine:
    def __init__(self, model, device):
        self.model = model
        self.device = device
        self.vectors = None
        self.metadata = []
        self.loaded = False
        self.last_load_time = 0
        
    def load_cache(self, force=False):
        # Hot-reload if file is updated (incremental builds)
        if not CACHE_FILE.exists():
            if not self.loaded:
                logger.warning("Similarity cache not found. Please run scripts/build_similarity_index.py")
            return
            
        mtime = os.path.getmtime(CACHE_FILE)
        if force or (mtime > self.last_load_time):
            try:
                logger.info("Loading memory-mapped similarity vectors...")
                cache = torch.load(CACHE_FILE, map_location=self.device)
                self.vectors = cache["vectors"].to(self.device) 
                self.metadata = cache["metadata"]
                self.loaded = True
                self.last_load_time = mtime
                logger.info(f"Loaded {len(self.metadata)} visually similar case vectors.")
            except Exception as e:
                logger.error(f"Failed to load cache: {e}")

    def find_similar(self, input_tensor: torch.Tensor, top_k: int = 5):
        self.load_cache() # Check for newer versions
            
        if not self.loaded or self.vectors is None:
            return []
            
        self.model.eval()
        with torch.no_grad():
            emb = self.model.get_embeddings(input_tensor.to(self.device))
            emb = F.normalize(emb, p=2, dim=1)
            
            # Compute cosine similarity (dot product of L2 normalized vectors)
            sims = torch.mm(emb, self.vectors.t()).squeeze(0)
            
            top_vals, top_indices = sims.topk(min(top_k, len(self.metadata)))
            
            results = []
            for i, idx in enumerate(top_indices.cpu().numpy()):
                meta = self.metadata[idx]
                results.append({
                    "filename": meta.get("filename", "Unknown"),
                    "diagnosis": meta.get("diagnosis", "No Finding"),
                    "age": meta.get("age", "N/A"),
                    "gender": meta.get("gender", "N/A"),
                    "similarity": float(top_vals[i].cpu().numpy()),
                    "url": meta.get("url", f"/dataset/{meta.get('filename')}")
                })
            return results

_engine = None

def get_similarity_engine(model, device) -> SimilarityEngine:
    global _engine
    if _engine is None:
        _engine = SimilarityEngine(model, device)
    return _engine
