// app.js

const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let modelSession;
let modelInputSize = 640; // YOLOv8n의 기본 입력 크기
const classNames = ["person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
  "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
  "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
  "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball", "kite", "baseball bat",
  "baseball glove", "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
  "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli", "carrot", "hot dog",
  "pizza", "donut", "cake", "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv",
  "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
  "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"];

async function initCamera(facingMode = "environment") {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { exact: facingMode } },
    audio: false
  });
  video.srcObject = stream;
  await video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}

async function loadModel() {
  modelSession = await ort.InferenceSession.create('./model/yolov8n.onnx');
  console.log("✅ YOLOv8 모델 로드 완료");
}

function preprocess() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = modelInputSize;
  tempCanvas.height = modelInputSize;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(video, 0, 0, modelInputSize, modelInputSize);
  const imageData = tempCtx.getImageData(0, 0, modelInputSize, modelInputSize);
  const { data } = imageData;

  // Normalize to [0, 1], convert to Float32Array, CHW format
  const floatData = new Float32Array(modelInputSize * modelInputSize * 3);
  for (let i = 0; i < modelInputSize * modelInputSize; i++) {
    floatData[i] = data[i * 4] / 255; // R
    floatData[i + modelInputSize * modelInputSize] = data[i * 4 + 1] / 255; // G
    floatData[i + 2 * modelInputSize * modelInputSize] = data[i * 4 + 2] / 255; // B
  }

  const inputTensor = new ort.Tensor('float32', floatData, [1, 3, modelInputSize, modelInputSize]);
  return inputTensor;
}

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

function iou(boxA, boxB) {
  const xA = Math.max(boxA.x, boxB.x);
  const yA = Math.max(boxA.y, boxB.y);
  const xB = Math.min(boxA.x + boxA.w, boxB.x + boxB.w);
  const yB = Math.min(boxA.y + boxA.h, boxB.y + boxB.h);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = boxA.w * boxA.h;
  const boxBArea = boxB.w * boxB.h;

  return interArea / (boxAArea + boxBArea - interArea);
}

function nonMaxSuppression(boxes, iouThreshold = 0.4) {
  boxes.sort((a, b) => b.score - a.score);
  const results = [];

  while (boxes.length) {
    const best = boxes.shift();
    results.push(best);
    boxes = boxes.filter(b => iou(best, b) < iouThreshold);
  }

  return results;
}

function postprocess(outputMap, imgWidth, imgHeight) {
  const output = outputMap.output0.data;
  const rows = 8400;
  const boxes = [];

  for (let i = 0; i < rows; i++) {
    const objConf = sigmoid(output[i * 84 + 4]);
    if (objConf < 0.4) continue;

    const classScores = output.slice(i * 84 + 5, i * 84 + 84).map(sigmoid);
    const maxScore = Math.max(...classScores);
    const classId = classScores.indexOf(maxScore);
    const confidence = objConf * maxScore;

    if (confidence < 0.5) continue;

    const cx = output[i * 84 + 0] * imgWidth / modelInputSize;
    const cy = output[i * 84 + 1] * imgHeight / modelInputSize;
    const w = output[i * 84 + 2] * imgWidth / modelInputSize;
    const h = output[i * 84 + 3] * imgHeight / modelInputSize;

    boxes.push({
      x: cx - w / 2,
      y: cy - h / 2,
      w: w,
      h: h,
      label: classNames[classId],
      score: confidence
    });
  }

  return nonMaxSuppression(boxes);
}

function drawBoxes(results) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const box of results) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = 'red';
    ctx.font = '16px Arial';
    ctx.fillText(`${box.label} (${box.score.toFixed(2)})`, box.x, box.y > 10 ? box.y - 5 : 10);
  }
}

document.getElementById('captureBtn').addEventListener('click', async () => {
  const inputTensor = preprocess();
  const outputMap = await modelSession.run({ images: inputTensor });
  const results = postprocess(outputMap, canvas.width, canvas.height);
  drawBoxes(results);
});

window.onload = async () => {
  await initCamera();
  await loadModel();
};