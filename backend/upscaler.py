import onnxruntime as ort
import numpy as np
import cv2
import io
import math
from PIL import Image

class Upscaler:
    def __init__(self, model_path: str):
        self.model_path = model_path
        self.session = None
        # Real-ESRGAN standard model: 128x128 input tiles suggested for CPU
        self.tile_size = 128
        self.padding = 10
        self.scale = 4
        # Effective size (central area without padding overlap)
        self.stride = self.tile_size - (2 * self.padding)
        self._load_model()

    def _load_model(self):
        print(f"[Upscaler] Loading ONNX Model from {self.model_path}...")
        try:
             # Force CPU for stability
            self.session = ort.InferenceSession(self.model_path, providers=['CPUExecutionProvider'])
            print(f"[Upscaler] Model loaded successfully.")
        except Exception as e:
            print(f"[Upscaler] CRITICAL: Failed to load model. {e}")
            raise e

    def process_image(self, image_bytes: bytes) -> bytes:
        # 1. Baca Bytes -> Gambar (RGB)
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(image)
        except Exception as e:
            raise ValueError(f"Failed to read image bytes: {e}")

        h, w, c = img_np.shape
        
        # 2. Siapkan Output Canvas
        output_h = h * self.scale
        output_w = w * self.scale
        output_img = np.zeros((output_h, output_w, c), dtype=np.uint8)

        print(f"[Upscaler] Processing {w}x{h} -> {output_w}x{output_h} with Seamless Tiling...")
        
        # 3. Looping Tile dengan Overlap Strategy
        # Kita loop berdasarkan 'Stride' (ukuran bersih setelah dipotong padding)
        
        for y in range(0, h, self.stride):
            for x in range(0, w, self.stride):
                
                # Koordinat target area yang ingin kita hasilkan (Original Scale)
                y_start = y
                y_end = min(y + self.stride, h)
                x_start = x
                x_end = min(x + self.stride, w)
                
                # Koordinat input tile yang harus diambil (termasuk padding)
                # Secara ideal, tile input mencakup area target + 10px keliling
                in_y1 = y - self.padding
                in_x1 = x - self.padding
                in_y2 = in_y1 + self.tile_size
                in_x2 = in_x1 + self.tile_size
                
                # Intersection dengan gambar asli (agar tidak index out of bounds)
                real_y1 = max(0, in_y1)
                real_x1 = max(0, in_x1)
                real_y2 = min(h, in_y2)
                real_x2 = min(w, in_x2)
                
                # Hitung berapa banyak padding yang perlu ditambahkan (Reflect)
                # Jika di pinggir gambar, in_y1 akan negatif, jadi pad_top positif
                pad_top = real_y1 - in_y1
                pad_left = real_x1 - in_x1
                pad_bottom = in_y2 - real_y2
                pad_right = in_x2 - real_x2
                
                # Ambil crop data asli
                crop = img_np[real_y1:real_y2, real_x1:real_x2, :]
                
                if crop.size == 0: continue

                # Tambahkan border reflect agar ukuran pas 128x128
                # Reflect dipilih agar transisi di pinggir gambar lebih natural
                tile = cv2.copyMakeBorder(crop, pad_top, pad_bottom, pad_left, pad_right, cv2.BORDER_REFLECT_101)
                
                # --- INFERENCE ---
                # Pre-processing (Normalization & Transpose)
                input_tensor = tile.astype(np.float32) / 255.0
                input_tensor = np.transpose(input_tensor, (2, 0, 1)) # HWC -> CHW
                input_tensor = np.expand_dims(input_tensor, axis=0)  # Batch dim (1, C, H, W)
                
                # Run ONNX Session
                input_name = self.session.get_inputs()[0].name
                output_tensor = self.session.run(None, {input_name: input_tensor})[0]
                
                # Post-processing (Squeeze & Denormalize)
                output_tile = output_tensor.squeeze(0)          # (C, H, W)
                output_tile = np.clip(output_tile, 0, 1)        # Clip 0-1
                output_tile = np.transpose(output_tile, (1, 2, 0)) # CHW -> HWC
                output_tile = (output_tile * 255.0).round().astype(np.uint8) # To Uint8
                
                # --- SEAMLESS STITCHING ---
                # Kita perlu memotong output_tile untuk mengambil hanya bagian valid (tengahnya saja)
                # Bagian padding yang overlap dengan tile tetangga DIBUANG agar seamless.
                
                # Hitung offset relatif di dalam tile output (sudah di-scale *4)
                # `y_start` (koordinat target) relatif terhadap `in_y1` (koordinat input tile start)
                tile_offset_y = (y_start - in_y1) * self.scale
                tile_offset_x = (x_start - in_x1) * self.scale
                
                # Hitung lebar/tinggi area valid yang ingin diambil
                valid_h = (y_end - y_start) * self.scale
                valid_w = (x_end - x_start) * self.scale
                
                # Crop bagian valid dari Output Tile
                valid_output = output_tile[
                    tile_offset_y : tile_offset_y + valid_h,
                    tile_offset_x : tile_offset_x + valid_w,
                    :
                ]
                
                # Tempel ke Canvas Output Besar
                out_y = y_start * self.scale
                out_x = x_start * self.scale
                
                output_img[out_y : out_y + valid_h, out_x : out_x + valid_w, :] = valid_output

        # 4. Return Result as Bytes (PNG)
        result_pil = Image.fromarray(output_img)
        buf = io.BytesIO()
        result_pil.save(buf, format="PNG")
        return buf.getvalue()