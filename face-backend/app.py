import os
import json
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import face_recognition
import numpy as np
import cv2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_FILE = "db.json"

if os.path.exists(DB_FILE):
    try:
        with open(DB_FILE, "r") as f:
            DB = json.load(f)
    except Exception:
        DB = {}
else:
    DB = {}

def save_db():
    try:
        with open(DB_FILE, "w") as f:
            json.dump(DB, f)
        print(f"✅ DB saved with {len(DB)} users")
    except Exception as e:
        print(f"❌ Error saving DB: {e}")

@app.post("/register")
async def register(user_id: str = Form(...), file: UploadFile = File(...)):
    print(f"📸 Registering face for user: {user_id}")
    try:
        contents = await file.read()
        np_img = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if image is None:
            return {"error": "Invalid image format"}

        # OpenCV decodes as BGR, but face_recognition needs RGB
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        encodings = face_recognition.face_encodings(rgb_image)
        if len(encodings) == 0:
            print("❌ No face detected in registration attempt")
            return {"error": "No face detected. Please look directly at the camera."}
        elif len(encodings) > 1:
            print("❌ Multiple faces detected")
            return {"error": "Multiple faces detected. Ensure only one person is in view."}

        DB[user_id] = encodings[0].tolist()
        save_db()
        
        return {"status": "success", "message": "Face registered"}
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return {"error": str(e)}

@app.post("/verify")
async def verify(user_id: str = Form(...), file: UploadFile = File(...)):
    print(f"🔍 Verifying face for user: {user_id}")
    if user_id not in DB:
        return {"error": f"User ID {user_id} not found in database"}

    try:
        contents = await file.read()
        np_img = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

        if image is None:
            return {"error": "Invalid image"}

        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(rgb_image)
        
        if len(encodings) == 0:
            return {"error": "No face detected"}

        known = np.array(DB[user_id])
        current = encodings[0]

        # Standard face distance logic (0.6 is typical threshold)
        distance = face_recognition.face_distance([known], current)[0]
        verified = bool(distance < 0.6)
        
        print(f"✅ Verification result: {verified} (Distance: {distance:.4f})")
        
        return {
            "status": "success" if verified else "error",
            "verified": verified,
            "confidence": float(1 - distance),
            "error": None if verified else "Face match unsuccessful"
        }
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return {"error": str(e)}
