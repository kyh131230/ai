const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

let modelSession = null;
const modelInputSize = 640;
const modelPath = './model/yolov8n.onnx';

function log(msg, color = 'green') {
  status.innerText = msg;
  status.style.color = color;
}

async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.play();
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        log("✅ 카메라 시작됨");
        resolve();
      };
    });
  } catch (err) {
    log("❌ 카메라 접근 오류: " + err.message, 'red');
  }
}

async function loadModel() {
  try {
    log("🔄 모델 로딩 중...");
    modelSession = await ort.InferenceSession.create(modelPath);
    log("✅ 모델 로딩 완료");
  } catch (err) {
    log("❌ 모델 로딩 실패: " + err.message, 'red');
  }
}

function preprocess() {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = modelInputSize;
  tempCanvas.height = modelInputSize;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.drawImage(video, 0, 0, modelInputSize, modelInputSize);
  const imageData = tempCtx.getImageData(0, 0, modelInputSize, modelInputSize);
  const { data } = imageData;

  const floatData = new Float32Array(modelInputSize * modelInputSize * 3);
  for (let i = 0; i < modelInputSize * modelInputSize; i++) {
    floatData[i] = data[i * 4] / 255;
    floatData[i + modelInputSize * modelInputSize] = data[i * 4 + 1] / 255;
    floatData[i + 2 * modelInputSize * modelInputSize] = data[i * 4 + 2] / 255;
  }

  return new ort.Tensor('float32', floatData, [1, 3, modelInputSize, modelInputSize]);
}

document.getElementById('captureBtn').addEventListener('click', async () => {
  if (!modelSession) {
    log("❌ 모델이 아직 로드되지 않았습니다", 'red');
    return;
  }

  // 1️⃣ 실제 영상 프레임 캡처 확인용 로그
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const avgR = imgData.data[0]; // 첫 픽셀의 R값
  if (avgR < 5 && imgData.data[1] < 5 && imgData.data[2] < 5) {
    log("⚠️ 영상 프레임이 비어있을 수 있습니다", 'orange');
    return;
  }

  try {
    const input = preprocess();
    const outputMap = await modelSession.run({ images: input });
    const results = postprocess(outputMap, canvas.width, canvas.height);
    drawBoxes(results);
    log(`✅ ${results.length}개 객체 감지`);
  } catch (err) {
    log("❌ 추론 오류: " + err.message, 'red');
  }
});

window.onload = async () => {
  await initCamera();
  await loadModel();
};
