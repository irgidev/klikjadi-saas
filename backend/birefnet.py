import os
import sys
import argparse
import numpy as np
import onnxruntime as ort
from PIL import Image

class BiRefNetRemover:
    def __init__(self, model_path: str):
        """
        Initialize the BiRefNet ONNX model with robust provider fallback.
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at: {model_path}")
            
        print(f"Loading BiRefNet model from: {model_path}")
        
        # 1. Robust Provider Selection (CUDA -> CPU Fallback)
        try:
            providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            print(f"Attempting to load with providers: {providers}")
            self.session = ort.InferenceSession(model_path, providers=providers)
        except Exception as e:
            print(f"WARNING: Failed to load with CUDA priority: {e}")
            print("Fallback: Forcing CPUExecutionProvider...")
            self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
            
        print(f"Model loaded. Active providers: {self.session.get_providers()}")
        
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        
        # Model specific parameters
        self.input_size = (1024, 1024)
        
        # Standard ImageNet Normalization
        self.mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(1, 1, 3)
        self.std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(1, 1, 3)

    def preprocess(self, image: Image.Image) -> np.ndarray:
        """
        Resize -> Normalize -> Transpose -> Batch
        """
        # 1. Resize algorithm: Bilinear or Bicubic suitable for input
        image_resized = image.resize(self.input_size, Image.BILINEAR)
        
        # 2. Convert to float32 [0, 1]
        img_array = np.array(image_resized, dtype=np.float32) / 255.0
        
        # 3. Standardize (ImageNet Mean/Std)
        img_array = (img_array - self.mean) / self.std
        
        # 4. Transpose (H, W, C) -> (C, H, W)
        img_array = img_array.transpose(2, 0, 1)
        
        # 5. Add Batch Dimension -> (1, C, H, W)
        img_tensor = np.expand_dims(img_array, axis=0)
        
        return img_tensor

    def postprocess(self, mask_tensor: np.ndarray, original_size: tuple) -> Image.Image:
        """
        Process output tensor: Sigmoid -> Resize -> To PIL -> Apply to Alpha
        """
        # mask_tensor shape usually (1, 1, 1024, 1024) or (1, 1024, 1024)
        mask_array = np.squeeze(mask_tensor) # -> (1024, 1024)
        
        # 1. Sigmoid Function (Logits -> Probability 0-1)
        # 1 / (1 + exp(-x))
        mask_array = 1 / (1 + np.exp(-mask_array))
        
        # 2. Convert to Grid for resizing
        # We want to resize *probabilities* to original size first for smoother edges
        # PIL requires uint8 mode L usually, but we can do float resize if needed or just uint8
        
        # Map 0-1 to 0-255 uint8
        mask_uint8 = (mask_array * 255).astype(np.uint8)
        mask_img = Image.fromarray(mask_uint8, mode='L')
        
        # 3. Resize back to original dimensions using BICUBIC (Smooth edges)
        mask_final = mask_img.resize(original_size, Image.BICUBIC)
        
        return mask_final

    def remove_background(self, image_path: str, output_path: str) -> None:
        # Load and convert to RGB (handle RGBA inputs by dropping alpha for inference)
        original_image = Image.open(image_path).convert("RGB")
        original_size = original_image.size
        
        # Preprocess
        input_tensor = self.preprocess(original_image)
        
        # Inference
        outputs = self.session.run([self.output_name], {self.input_name: input_tensor})
        raw_output = outputs[0]
        
        # Postprocess Mask
        final_mask = self.postprocess(raw_output, original_size)
        
        # Create new RGBA image
        # Base: Original Image
        result = original_image.convert("RGBA")
        
        # Apply Mask to Alpha Channel
        # This replaces the existing alpha with our predicted mask
        result.putalpha(final_mask)
        
        # Save
        result.save(output_path, "PNG")
        print(f"Result saved to: {output_path}")

if __name__ == "__main__":
    
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Path to input image")
    parser.add_argument("--output", required=True, help="Path to output image")
    parser.add_argument("--model", default="models/model.onnx", help="Path to model")
    
    args = parser.parse_args()
    
    # 1. Validation
    if not os.path.exists(args.model):
        print(f"CRITICAL ERROR: Model file not found at {args.model}")
        sys.exit(1)
        
    if not os.path.exists(args.input):
        print(f"CRITICAL ERROR: Input file not found at {args.input}")
        sys.exit(1)

    # 2. Execution
    try:
        remover = BiRefNetRemover(model_path=args.model)
        remover.remove_background(args.input, args.output)
        print("SUCCESS")
    except Exception as e:
        print(f"CRITICAL ERROR during process: {e}")
        # Print full traceback for debugging if needed
        import traceback
        traceback.print_exc()
        sys.exit(1)
