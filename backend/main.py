import os
import sys
import uvicorn
import cv2
import numpy as np
import uuid
import tempfile
import requests
import shutil
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware

# Import Local Modules
try:
    from birefnet import BiRefNetRemover
    from upscaler import Upscaler
    from face_restorer import FaceRestorer
except ImportError as e:
    print(f"CRITICAL: Failed to import local backend modules. {e}")
    pass

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
remover = None
upscaler = None
face_restorer = None

# Constants & Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

BIREFNET_MODEL_PATH = os.path.join(MODELS_DIR, "General.onnx") # Check filename
REALESRGAN_MODEL_PATH = os.path.join(MODELS_DIR, "realesrgan-x4plus.onnx")
GFPGAN_MODEL_PATH = os.path.join(MODELS_DIR, "GFPGANv1.4.onnx")

REALESRGAN_DOWNLOAD_URL = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesrgan-x4plus.onnx"
GFPGAN_DOWNLOAD_URL = "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.onnx" 

def download_file(url, path):
    print(f"Downloading {url} to {path}...")
    try:
        if not os.path.exists(os.path.dirname(path)):
            os.makedirs(os.path.dirname(path))
            
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            with open(path, 'wb') as f:
                shutil.copyfileobj(r.raw, f)
        print("Download complete.")
    except Exception as e:
        print(f"Failed download: {e}")
        if os.path.exists(path):
            os.remove(path)
        raise e

@app.on_event("startup")
async def startup_event():
    global remover, upscaler, face_restorer
    
    print("--- Starting Backend Services ---")
    
    # 1. Load BiRefNet (Background Remover)
    try:
        # Check General.onnx or model.onnx
        if not os.path.exists(BIREFNET_MODEL_PATH):
             # Fallback check for model.onnx if General.onnx is missing (legacy)
             fallback_path = os.path.join(MODELS_DIR, "model.onnx")
             if os.path.exists(fallback_path):
                 print(f"[Startup] Using fallback BiRefNet path: {fallback_path}")
                 # Update global path or just use here
                 remover = BiRefNetRemover(model_path=fallback_path)
             else:
                 print(f"[Startup] Warning: BiRefNet model not found at {BIREFNET_MODEL_PATH}.")
        else:
             print(f"[Startup] Loading BiRefNet from {BIREFNET_MODEL_PATH}...")
             remover = BiRefNetRemover(model_path=BIREFNET_MODEL_PATH)
             print("[Startup] BiRefNet Loaded.")
    except Exception as e:
        print(f"[Startup] Failed to load BiRefNet: {e}")

    # 2. Load Real-ESRGAN (Upscaler)
    try:
        if not os.path.exists(REALESRGAN_MODEL_PATH):
            print("[Startup] Real-ESRGAN model missing. Attempting download...")
            download_file(REALESRGAN_DOWNLOAD_URL, REALESRGAN_MODEL_PATH)
            
        print(f"[Startup] Loading Real-ESRGAN from {REALESRGAN_MODEL_PATH}...")
        upscaler = Upscaler(model_path=REALESRGAN_MODEL_PATH)
        print("[Startup] Real-ESRGAN Loaded.")
    except Exception as e:
        print(f"[Startup] Failed to load Upscaler: {e}")

    # 3. Load GFPGAN (Face Restorer)
    try:
        if not os.path.exists(GFPGAN_MODEL_PATH):
             print("[Startup] GFPGAN model missing. Attempting download...")
             download_file(GFPGAN_DOWNLOAD_URL, GFPGAN_MODEL_PATH)
             
        print(f"[Startup] Loading GFPGAN from {GFPGAN_MODEL_PATH}...")
        face_restorer = FaceRestorer(model_path=GFPGAN_MODEL_PATH)
        print("[Startup] GFPGAN Loaded.")
    except Exception as e:
         print(f"[Startup] Failed to load FaceRestorer: {e}")

    print("--- Services Startup Complete ---")

@app.post("/api/remove-bg")
async def remove_bg(image: UploadFile = File(...)):
    global remover
    
    # Init Logic (Simplified)
    if remover is None:
        raise HTTPException(status_code=503, detail="Service Unavailable: BiRefNet model missing.")

    try:
        content = await image.read()
        nparr = np.frombuffer(content, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
             raise HTTPException(status_code=400, detail="Invalid Image File")
        
        temp_dir = tempfile.gettempdir()
        temp_input = os.path.join(temp_dir, f"in_{uuid.uuid4()}.png")
        temp_output = os.path.join(temp_dir, f"out_{uuid.uuid4()}.png")
        
        cv2.imwrite(temp_input, img)
        
        try:
            remover.remove_background(temp_input, temp_output)
            with open(temp_output, "rb") as f:
                output_data = f.read()
            return Response(content=output_data, media_type="image/png")
        finally:
            if os.path.exists(temp_input): os.remove(temp_input)
            if os.path.exists(temp_output): os.remove(temp_output)

    except Exception as e:
        print(f"Remove BG Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upscale")
async def upscale_image(image: UploadFile = File(...)):
    global upscaler, face_restorer
    
    if upscaler is None:
         raise HTTPException(status_code=503, detail="Service Unavailable: Upscaler model not ready.")

    try:
        # STEP 1: General Upscale (Real-ESRGAN)
        content = await image.read() 
        
        # Validate Input
        if not content:
             raise HTTPException(status_code=400, detail="Empty Image")

        # Process: Bytes -> Upscaled Bytes
        upscaled_bytes = upscaler.process_image(content)
        
        # STEP 2: Face Restoration (GFPGAN) - Optional Pipeline
        if face_restorer is not None:
            print("[Pipeline] Running Face Restoration...")
            try:
                # Bytes -> Numpy (BGR)
                nparr = np.frombuffer(upscaled_bytes, np.uint8)
                img_high_res = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Restore Face
                restored_img = face_restorer.process_image(img_high_res)
                
                # Encode Buffer
                res_success, restored_buffer = cv2.imencode(".png", restored_img)
                if res_success:
                    return Response(content=restored_buffer.tobytes(), media_type="image/png")
                else:
                    print("[Pipeline] Encoding/Restore failed, returning Upscaled only.")
            
            except Exception as fr_error:
                print(f"[Pipeline] Face Restore Error (Skipping): {fr_error}")
                # Fallback to upscaled image only if restorer crashes
        
        # Return Upscaled Only (if restorer missing or failed)
        return Response(content=upscaled_bytes, media_type="image/png")
        
    except Exception as e:
        print(f"Upscale Pipeline Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Upscale Failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)