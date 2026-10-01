# AgroAI Machine Learning Models Directory

This directory stores trained model checkpoints, metadata, and export artifacts:

- `best_model.pth`: PyTorch model weights and training state checkpoint.
- `model_metadata.json`: Model architecture, training parameters, and validation performance summary.
- `model.onnx`: Exported Open Neural Network Exchange (ONNX) format for cross-platform, low-latency production inference.
- `training_history.json`: Epoch-by-epoch loss and accuracy metrics.
- `evaluation_report.json`: Classification metrics (Precision, Recall, F1) on the test split.
