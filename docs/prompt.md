Upgrade the existing AgroAI web application by replacing the image upload feature with a real-time camera-based crop disease detection system.

FEATURE: LIVE CAMERA DISEASE DETECTION

1. Camera Integration:
* Use the device camera via browser APIs (getUserMedia).
* Allow users to:
  * Open camera
  * Switch between front/back camera (mobile support)
  * Capture image with a button
* Show real-time camera preview before capture.

2. Image Capture & Processing:
* Capture a frame from the video stream and convert it to an image (base64 or blob).
* Optimize the image (resize/compress) before sending to backend.

3. AI Disease Detection:
* Send captured image to backend API.
* Integrate a plant disease detection model:
  * Prefer YOLOv8 or MobileNet (pretrained on PlantVillage dataset)
* Backend should return:
  * Disease name
  * Confidence score (e.g., 92%)
  * Severity level (low/medium/high)

4. Remedy Recommendation Engine:
* Based on detected disease, generate:
  * Simple explanation
  * Treatment steps
  * Recommended pesticides/fertilizers
* Include both:
  * Chemical solution
  * Organic solution

5. UI/UX Requirements:
* Show:
  * Camera preview screen
  * Capture button (centered)
  * Loading animation while processing
* After detection:
  * Display result in a card format:
    * Disease name
    * Confidence %
    * Remedy steps
* Add “Retake Photo” option

6. Offline Handling:
* If offline:
  * Allow photo capture
  * Store image locally
  * Process automatically when internet is restored

7. Performance Optimization:
* Compress images before upload
* Use fast API response (<2 seconds target)
* Show progress indicator

8. Mobile Optimization:
* Ensure smooth performance on low-end Android devices
* Handle camera permissions properly

9. Optional Advanced Features:
* Real-time detection overlay (detect disease directly from live video stream)
* Voice output:
  * Speak disease name and remedy (Tamil support preferred)

10. Code Requirements:
* Clean modular code
* Separate camera component
* API route for prediction
* Ready for deployment on Vercel
