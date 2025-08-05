from ultralytics import YOLO

# 모델 로딩
model = YOLO("yolov8n.pt")

# export with NMS
model.export(format="onnx", simplify=True, dynamic=False, opset=12, imgsz=640, nms=True)