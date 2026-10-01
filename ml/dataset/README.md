# PlantVillage Dataset Information

This directory serves as the dataset configuration and index registry for the AgroAI plant disease detection ML subsystem.

## Dataset Strategy
- **External Dataset Source:** The actual image dataset is kept outside this repository to keep the repository lightweight.
- **Default External Paths Supported:**
  - `C:\Users\HP\Downloads\archive (4)\plantvillage dataset\segmented`
  - `C:\Users\Padmanaban\Downloads\archive (4)\plantvillage dataset\segmented`
  - `C:\Users\Padmanaban\Downloads\archive (4).zip` (auto-extracted or read from archive)
  - Any custom directory passed via `--data_dir` to the scripts.

## Dataset Statistics
- **Total Images:** 54,306 segmented leaf images
- **Number of Classes:** 38 crop-disease categories
- **Crops Covered (14 crops):**
  1. Apple
  2. Blueberry
  3. Cherry
  4. Corn (Maize)
  5. Grape
  6. Orange (Citrus Greening)
  7. Peach
  8. Pepper (Bell)
  9. Potato
  10. Raspberry
  11. Soybean
  12. Squash
  13. Strawberry
  14. Tomato

## Class List (38 Categories)
1. `Apple___Apple_scab`
2. `Apple___Black_rot`
3. `Apple___Cedar_apple_rust`
4. `Apple___healthy`
5. `Blueberry___healthy`
6. `Cherry_(including_sour)___Powdery_mildew`
7. `Cherry_(including_sour)___healthy`
8. `Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot`
9. `Corn_(maize)___Common_rust_`
10. `Corn_(maize)___Northern_Leaf_Blight`
11. `Corn_(maize)___healthy`
12. `Grape___Black_rot`
13. `Grape___Esca_(Black_Measles)`
14. `Grape___Leaf_blight_(Isariopsis_Leaf_Spot)`
15. `Grape___healthy`
16. `Orange___Haunglongbing_(Citrus_greening)`
17. `Peach___Bacterial_spot`
18. `Peach___healthy`
19. `Pepper,_bell___Bacterial_spot`
20. `Pepper,_bell___healthy`
21. `Potato___Early_blight`
22. `Potato___Late_blight`
23. `Potato___healthy`
24. `Raspberry___healthy`
25. `Soybean___healthy`
26. `Squash___Powdery_mildew`
27. `Strawberry___Leaf_scorch`
28. `Strawberry___healthy`
29. `Tomato___Bacterial_spot`
30. `Tomato___Early_blight`
31. `Tomato___Late_blight`
32. `Tomato___Leaf_Mold`
33. `Tomato___Septoria_leaf_spot`
34. `Tomato___Spider_mites Two-spotted_spider_mite`
35. `Tomato___Target_Spot`
36. `Tomato___Tomato_Yellow_Leaf_Curl_Virus`
37. `Tomato___Tomato_mosaic_virus`
38. `Tomato___healthy`

## Index File Generation
Run the preparation script to index the dataset and generate reproducible 70/15/15 train/val/test splits without copying image files:
```bash
python ml/scripts/prepare_dataset.py --data_dir "C:\Users\HP\Downloads\archive (4)\plantvillage dataset\segmented"
```
