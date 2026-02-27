import os
import sys
import glob
import torch
import torch.nn.functional as F
import pandas as pd
from PIL import Image
from tqdm import tqdm
from pathlib import Path

# Add project root to sys path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from backend.app.config import PROJECT_ROOT, CHECKPOINT_DIR, DATA_DIR, NUM_CLASSES, DENSENET_DROPOUT
from backend.app.models.densenet import build_densenet121
from backend.app.utils.image_utils import preprocess_for_inference

CACHE_FILE = CHECKPOINT_DIR / "similarity_cache_full.pt"
METADATA_FILE = DATA_DIR / "Data_Entry_2017.csv"

def build_index():
    print(f"Building full similarity index at {CACHE_FILE}")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Load model
    model_path = CHECKPOINT_DIR / "densenet121_best.pth"
    model = build_densenet121(num_classes=NUM_CLASSES, dropout=DENSENET_DROPOUT, pretrained=False)
    
    if model_path.exists():
        checkpoint = torch.load(model_path, map_location=device, weights_only=False)
        model.load_state_dict(checkpoint["model_state_dict"])
        print("Loaded DenseNet121 weights.")
    else:
        print("WARNING: Model weights not found. Using untrained model for embeddings.")
        
    model = model.to(device)
    model.eval()

    # Load metadata to map filename -> diagnosis
    metadata_cache = {}
    if METADATA_FILE.exists():
        try:
            df = pd.read_csv(METADATA_FILE)
            for _, row in df.iterrows():
                metadata_cache[row['Image Index']] = {
                    'diagnosis': row['Finding Labels'],
                    'age': row.get('Patient Age', 'Unknown'),
                    'gender': row.get('Patient Gender', 'Unknown')
                }
        except Exception as e:
            print(f"Metadata load error: {e}")

    # Find all images
    image_paths = glob.glob(str(DATA_DIR / "images*" / "**" / "*.png"), recursive=True)
    if not image_paths:
        image_paths = glob.glob(str(DATA_DIR / "images" / "*.png"))
        
    print(f"Found {len(image_paths)} images to process.")
    
    vectors_list = []
    metadata_list = []
    
    batch_size = 32
    batch_tensors = []
    batch_meta = []
    
    save_interval = 2500 # Save every 2500 images incrementally
    
    with torch.no_grad():
        for i, path in enumerate(tqdm(image_paths)):
            filename = os.path.basename(path)
            try:
                img = Image.open(path).convert("RGB")
                import numpy as np
                img_np = np.array(img)
                # Expand to 3 channels if grayscale
                if len(img_np.shape) == 2:
                    img_np = np.stack((img_np,)*3, axis=-1)
                
                tensor = preprocess_for_inference(img_np)
                
                # Get meta
                meta = metadata_cache.get(filename, {'diagnosis': 'Unknown', 'age': 'Unknown', 'gender': 'Unknown'})
                meta['filename'] = filename
                # create a web-accessible url path assuming frontend can access /dataset -> data/
                meta['url'] = f"/dataset/{filename}"  # Needs symlink or API route in actual prod
                
                batch_tensors.append(tensor)
                batch_meta.append(meta)
                
                is_last = (i == len(image_paths) - 1)
                if len(batch_tensors) == batch_size or is_last:
                    batch_gpu = torch.stack(batch_tensors).to(device)
                    emb = model.get_embeddings(batch_gpu)
                    emb = F.normalize(emb, p=2, dim=1)
                    
                    vectors_list.append(emb.cpu())
                    metadata_list.extend(batch_meta)
                    
                    batch_tensors = []
                    batch_meta = []
                    
                # Incremental Save
                if (i > 0 and i % save_interval == 0) or is_last:
                    print(f"Saving intermediate index with {len(metadata_list)} items...")
                    vectors_tensor = torch.cat(vectors_list, dim=0)
                    torch.save({
                        "vectors": vectors_tensor,
                        "metadata": metadata_list
                    }, CACHE_FILE)
                    
            except Exception as e:
                # print(f"Failed {filename}: {e}")
                pass

if __name__ == "__main__":
    build_index()
