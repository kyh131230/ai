const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const status = document.getElementById("status");

const modelInputSize = 640;
const modelPath = "./model/yolov8n.onnx";
const imagePath = "./model/person.jpg";

let session = null;
let imageElement = null;

// 이미지 불러오기
function loadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.src = url;
  });
}

// 전처리 함수
function preprocess(img) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = modelInputSize;
  tempCanvas.height = modelInputSize;
  const tempCtx = tempCanvas.getContext("2d");

  tempCtx.drawImage(img, 0, 0, modelInputSize, modelInputSize);
  const { data: resizedData } = tempCtx.getImageData(0, 0, modelInputSize, modelInputSize);

  const floatData = new Float32Array(3 * modelInputSize * modelInputSize);
  for (let i = 0; i < modelInputSize * modelInputSize; i++) {
    floatData[i] = resizedData[i * 4] / 255;                             // R
    floatData[i + modelInputSize * modelInputSize] = resizedData[i * 4 + 1] / 255; // G
    floatData[i + 2 * modelInputSize * modelInputSize] = resizedData[i * 4 + 2] / 255; // B
  }

  return new ort.Tensor("float32", floatData, [1, 3, modelInputSize, modelInputSize]);
}

// 추론 및 시각화
async function runInference() {
  status.textContent = "📸 이미지 불러오는 중...";
  imageElement = await loadImage(imagePath);

  ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height); // 원본 표시

  status.textContent = "🔍 추론 중...";
  const inputTensor = preprocess(imageElement);
  const feeds = { images: inputTensor };

  const results = await session.run(feeds);
  const output = results[session.outputNames[0]].data;

  drawBoxes(output, ctx, canvas.width, canvas.height);
  status.textContent = "✅ 완료";
}

// 초기화
async function main() {
  session = await ort.InferenceSession.create(modelPath);
  status.textContent = "모델 준비 완료. [🧠 분석 시작]을 누르세요.";
}

main();
