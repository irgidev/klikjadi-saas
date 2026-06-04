import onnxruntime as ort
import numpy as np
import cv2
import os

class FaceRestorer:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.session = None
        # Load Haar Cascade correctly
        self.face_cascade = cv2.CascadeClassifier(os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml'))
        self._load_model()

    def _load_model(self):
        print(f"[FaceRestorer] Loading GFPGAN Model from {self.model_path}...")
        try:
             # Force CPU for stability
            self.session = ort.InferenceSession(self.model_path, providers=['CPUExecutionProvider'])
            print(f"[FaceRestorer] Model loaded successfully.")
        except Exception as e:
            print(f"[FaceRestorer] CRITICAL: Failed to load model. {e}")
            # We don't raise here to avoid crashing the whole backend if just this model fails, 
            # but process_image will fail.
            pass

    def process_image(self, img_bgr: np.ndarray) -> np.ndarray:
        """
        Process High-Res Image: Detect Face -> Crop -> Restore -> Patch Back
        """
        if self.session is None:
             print("[FaceRestorer] Model not loaded. Skipping restoration.")
             return img_bgr

        h_ori, w_ori = img_bgr.shape[:2]
        result_img = img_bgr.copy()
        
        # 1. Detect Faces
        # Convert to gray for detection
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        if len(faces) == 0:
            print("[FaceRestorer] No faces detected. Returning original.")
            return result_img

        print(f"[FaceRestorer] Detected {len(faces)} faces.")

        # Pre-calculate input name once
        input_name = self.session.get_inputs()[0].name

        for (x, y, w, h) in faces:
            try:
                # 2. Padding Logic (Add 50% Margin for better context)
                pad_scale = 0.5
                pad_w = int(w * pad_scale)
                pad_h = int(h * pad_scale)
                
                # Calculate coordinates with boundary checks (SAFE)
                x1 = max(0, x - pad_w)
                y1 = max(0, y - pad_h)
                x2 = min(w_ori, x + w + pad_w)
                y2 = min(h_ori, y + h + pad_h)
                
                # Extract Face Crop
                face_crop = result_img[y1:y2, x1:x2]
                
                if face_crop.size == 0: continue
                
                crop_h, crop_w = face_crop.shape[:2]
                
                # 3. Pre-process (Resize to 512x512 for GFPGAN)
                # Resize to 512x512
                inp_blob = cv2.resize(face_crop, (512, 512), interpolation=cv2.INTER_AREA)
                
                # Normalize: (img - 127.5) / 127.5  ==  (img / 127.5) - 1.0  ==  ((img/255) - 0.5) / 0.5
                # GFPGAN expects -1 to 1 range.
                # Also convert BGR -> RGB (Most ONNX models trained on RGB)
                inp_rgb = cv2.cvtColor(inp_blob, cv2.COLOR_BGR2RGB)
                inp_norm = inp_rgb.astype(np.float32) / 127.5 - 1.0
                
                # HWC -> CHW
                inp_tensor = np.transpose(inp_norm, (2, 0, 1))
                
                # Batch Dimension -> (1, 3, 512, 512)
                input_tensor = np.expand_dims(inp_tensor, axis=0) # DEFINED HERE CORRECTLY
                
                # 4. Inference
                output_tensor = self.session.run(None, {input_name: input_tensor})[0]
                
                # 5. Post-process
                output_data = output_tensor.squeeze(0) # (3, 512, 512)
                
                # Denormalize (-1 to 1) -> (0 to 255)
                # (Output + 1) * 127.5
                output_data = np.clip(output_data, -1, 1)
                output_data = (output_data + 1) * 127.5
                
                # CHW -> HWC
                output_data = np.transpose(output_data, (1, 2, 0))
                output_data = output_data.round().astype(np.uint8)
                
                # RGB -> BGR
                restored_bgr = cv2.cvtColor(output_data, cv2.COLOR_RGB2BGR)
                
                # 6. Resize Back to Original Crop Size
                restored_face = cv2.resize(restored_bgr, (crop_w, crop_h), interpolation=cv2.INTER_CUBIC)
                
                # 7. Blending / Stitching (Seamless Clone)
                # Create mask (full white)
                mask = 255 * np.ones(restored_face.shape, restored_face.dtype)
                
                # Center point in destination image
                center = (x1 + crop_w // 2, y1 + crop_h // 2)
                
                # Clone
                try:
                    result_img = cv2.seamlessClone(restored_face, result_img, mask, center, cv2.NORMAL_CLONE)
                except Exception as e:
                    print(f"[FaceRestorer] SeamlessClone failed, falling back to direct copy: {e}")
                    result_img[y1:y2, x1:x2] = restored_face

            except Exception as e:
                print(f"[FaceRestorer] Error processing face region at {x},{y}: {e}")
                # Continue to next face instead of crashing
                continue
                
        return result_img
