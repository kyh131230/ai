const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const statusText = document.getElementById("status");

const modelInputSize = 640;
const modelPath = "./model/yolov8n.onnx";

let session = null;

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

function preprocess() {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = modelInputSize;
  tempCanvas.height = modelInputSize;
  const tempCtx = tempCanvas.getContext("2d");

  // 📸 video → 640x640 추출
  tempCtx.drawImage(video, 0, 0, modelInputSize, modelInputSize);
  const { data: resizedData } = tempCtx.getImageData(0, 0, modelInputSize, modelInputSize);

  const floatData = new Float32Array(3 * modelInputSize * modelInputSize);
  for (let i = 0; i < modelInputSize * modelInputSize; i++) {
    floatData[i] = resizedData[i * 4] / 255;
    floatData[i + modelInputSize * modelInputSize] = resizedData[i * 4 + 1] / 255;
    floatData[i + 2 * modelInputSize * modelInputSize] = resizedData[i * 4 + 2] / 255;
  }

  return new ort.Tensor("float32", floatData, [1, 3, modelInputSize, modelInputSize]);
}

async function detectFrame() {
  if (!session) return;

  const inputTensor = preprocess();
  const feeds = { images: inputTensor };
  const results = await session.run(feeds);
  const output = results[session.outputNames[0]].data;

  // 📺 원본 영상 출력
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // 📦 박스 출력
  drawBoxes(output, ctx, canvas.width, canvas.height);

  requestAnimationFrame(detectFrame);
}

async function main() {
  statusText.textContent = "📸 카메라 연결 중...";
  await setupCamera();

  statusText.textContent = "📦 모델 불러오는 중...";
  session = await ort.InferenceSession.create(modelPath);

  statusText.textContent = "✅ 작동 중";
  detectFrame();
}

main();
