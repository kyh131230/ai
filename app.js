const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const analyzeBtn = document.getElementById("analyzeBtn");

const modelInputSize = 640;
const modelPath = "./model/yolov8n.onnx";

let session = null;

// 카메라 연결
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });
}

// 전처리 (video → 640x640 텐서)
function preprocess() {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = modelInputSize;
  tempCanvas.height = modelInputSize;
  const tempCtx = tempCanvas.getContext("2d");

  tempCtx.drawImage(video, 0, 0, modelInputSize, modelInputSize);
  const { data } = tempCtx.getImageData(0, 0, modelInputSize, modelInputSize);

  const floatData = new Float32Array(3 * modelInputSize * modelInputSize);
  for (let i = 0; i < modelInputSize * modelInputSize; i++) {
    floatData[i] = data[i * 4] / 255;
    floatData[i + modelInputSize * modelInputSize] = data[i * 4 + 1] / 255;
    floatData[i + 2 * modelInputSize * modelInputSize] = data[i * 4 + 2] / 255;
  }

  return new ort.Tensor("float32", floatData, [1, 3, modelInputSize, modelInputSize]);
}

// 분석 버튼 클릭 시 추론
async function runInferenceOnce() {
  const inputTensor = preprocess();
  const feeds = { images: inputTensor };
  const results = await session.run(feeds);
  const output = results[session.outputNames[0]].data;

  // 화면 그리기
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  drawBoxes(output, ctx, canvas.width, canvas.height);
}

async function main() {
  await setupCamera();

  // 모델 로드
  session = await ort.InferenceSession.create(modelPath);

  // 모델 준비 완료 후 UI 활성화
  overlay.style.display = "none";
  analyzeBtn.disabled = false;
  analyzeBtn.addEventListener("click", runInferenceOnce);
}

main();